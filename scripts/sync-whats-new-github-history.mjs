import { execFileSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  classifyType,
  displayDescription,
  normalizeDisplayTitle,
  panelsForFiles,
} from "./whats-new-github-history-utils.mjs";

const eventPath = process.env.GITHUB_EVENT_PATH;
const repository = process.env.GITHUB_REPOSITORY;
const eventName = process.env.GITHUB_EVENT_NAME;
const releaseSecret = process.env.WHATS_NEW_RELEASE_SECRET;
const deployKey = process.env.CONVEX_DEPLOY_KEY;
if (!eventPath || !repository || !eventName || !releaseSecret) {
  throw new Error(
    "GitHub history sync needs the workflow event, repository, and publisher secret."
  );
}
if (process.env.GITHUB_ACTIONS === "true" && !deployKey) {
  throw new Error("GitHub history sync needs the Convex deploy key.");
}

const event = JSON.parse(readFileSync(eventPath, "utf8"));
const [owner, repo] = repository.split("/");
const apiRoot = `repos/${owner}/${repo}`;

function github(path, attempt = 0) {
  return new Promise((resolve, reject) => {
    const child = spawn("gh", ["api", path], { stdio: ["ignore", "pipe", "ignore"] });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (output += chunk));
    child.on("error", () => reject(new Error("GitHub CLI could not start for history sync.")));
    child.on("close", (code) => {
      if (code !== 0) {
        if (attempt < 4) {
          setTimeout(
            () => {
              github(path, attempt + 1).then(resolve, reject);
            },
            2 ** attempt * 1000
          );
          return;
        }
        reject(
          new Error(
            `GitHub history request failed for ${path}. Check repository access and API limits.`
          )
        );
        return;
      }
      try {
        resolve(JSON.parse(output));
      } catch {
        reject(new Error("GitHub returned an invalid history response."));
      }
    });
  });
}

async function getAllPages(path) {
  const records = [];
  for (let page = 1; ; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const result = await github(`${path}${separator}per_page=100&page=${page}`);
    if (!Array.isArray(result) || result.length === 0) break;
    records.push(...result);
  }
  return records;
}

function clipped(value, limit = 4000) {
  return (value ?? "").toString().slice(0, limit).trim();
}

function makePullRequestRecord(pullRequest, isHistorical, files = []) {
  const type = classifyType(pullRequest);
  return {
    externalId: `pr:${pullRequest.number}`,
    kind: "pull_request",
    title: `#${pullRequest.number} ${clipped(pullRequest.title, 300)}`,
    description: clipped(pullRequest.body),
    url: pullRequest.html_url,
    author: pullRequest.user?.login,
    pullRequestNumber: pullRequest.number,
    displayTitle: normalizeDisplayTitle(pullRequest.title, type),
    displayDescription: displayDescription(type),
    type,
    panels: panelsForFiles(files.map((file) => file.filename ?? file)),
    tags: [],
    mergedAt: Date.parse(pullRequest.merged_at),
    isHistorical,
  };
}

function makeCommitRecord(commit, mergedAt, pullRequestNumber, isHistorical) {
  const message = commit.commit?.message ?? commit.message ?? "";
  const sha = commit.sha ?? commit.id;
  const author = commit.author;
  return {
    externalId: `commit:${sha}`,
    kind: "commit",
    title: clipped(message.split("\n", 1)[0], 300) || "Untitled commit",
    description: clipped(message),
    url: commit.html_url ?? `https://github.com/${repository}/commit/${sha}`,
    author:
      (typeof author === "string" ? author : (author?.login ?? author?.username ?? author?.name)) ??
      commit.commit?.author?.name,
    pullRequestNumber,
    commitSha: sha,
    mergedAt,
    isHistorical,
  };
}

async function loadCompleteHistory() {
  const allPullRequests = await getAllPages(`${apiRoot}/pulls?state=closed`);
  const mergedPullRequests = allPullRequests.filter((pullRequest) => pullRequest.merged_at);
  const pullRequestCommits = new Map();
  const mergedCommitRecords = new Map();
  const mergedPullRequestRecords = [];
  let nextPullRequest = 0;
  const workers = Array.from({ length: 4 }, async () => {
    while (nextPullRequest < mergedPullRequests.length) {
      const pullRequest = mergedPullRequests[nextPullRequest++];
      const [commits, files] = await Promise.all([
        getAllPages(`${apiRoot}/pulls/${pullRequest.number}/commits`),
        getAllPages(`${apiRoot}/pulls/${pullRequest.number}/files`),
      ]);
      mergedPullRequestRecords.push(makePullRequestRecord(pullRequest, true, files));
      for (const commit of commits) {
        pullRequestCommits.set(commit.sha, pullRequest.number);
        mergedCommitRecords.set(
          commit.sha,
          makeCommitRecord(commit, Date.parse(pullRequest.merged_at), pullRequest.number, true)
        );
      }
    }
  });
  await Promise.all(workers);

  const historyRecords = mergedPullRequestRecords;
  historyRecords.push(...mergedCommitRecords.values());
  const repositoryInfo = await github(apiRoot);
  const branchCommits = await getAllPages(
    `${apiRoot}/commits?sha=${encodeURIComponent(repositoryInfo.default_branch)}`
  );
  for (const commit of branchCommits) {
    if (mergedCommitRecords.has(commit.sha)) continue;
    const pullRequestNumber = pullRequestCommits.get(commit.sha);
    historyRecords.push(
      makeCommitRecord(
        commit,
        Date.parse(commit.commit?.committer?.date ?? commit.commit?.author?.date ?? ""),
        pullRequestNumber,
        true
      )
    );
  }
  console.log(
    `Prepared ${mergedPullRequests.length} merged pull requests and ${branchCommits.length} default-branch commits.`
  );
  return historyRecords;
}

let records = [];
if (eventName === "workflow_dispatch") {
  records = await loadCompleteHistory();
} else if (eventName === "pull_request_target") {
  const pullRequest = event.pull_request;
  if (!pullRequest?.merged_at) {
    console.log("Pull request was closed without merging; no history was added.");
    process.exit(0);
  }
  const [commits, files] = await Promise.all([
    getAllPages(`${apiRoot}/pulls/${pullRequest.number}/commits`),
    getAllPages(`${apiRoot}/pulls/${pullRequest.number}/files`),
  ]);
  records = [makePullRequestRecord(pullRequest, false, files)];
  records.push(
    ...commits.map((commit) =>
      makeCommitRecord(commit, Date.parse(pullRequest.merged_at), pullRequest.number, false)
    )
  );
} else if (eventName === "push") {
  const branch = event.ref?.replace("refs/heads/", "");
  if (branch !== (event.repository?.default_branch ?? "main")) {
    console.log("Push was not to the default branch; no history was added.");
    process.exit(0);
  }
  records = (event.commits ?? []).map((commit) =>
    makeCommitRecord(commit, Date.parse(commit.timestamp), undefined, false)
  );
} else if (!new Set(["workflow_dispatch", "pull_request_target"]).has(eventName)) {
  throw new Error(`Unsupported GitHub history event: ${eventName}`);
}

async function syncBatches(inputRecords, completeBackfill = false) {
  const uniqueRecords = [
    ...new Map(inputRecords.map((record) => [record.externalId, record])).values(),
  ];
  const batchCount = Math.max(1, Math.ceil(uniqueRecords.length / 15));
  let inserted = 0;
  let updated = 0;
  let needsBackfill = false;
  let needsPanelBackfill = false;
  for (let batchIndex = 0; batchIndex < batchCount; batchIndex += 1) {
    const args = JSON.stringify({
      releaseSecret,
      records: uniqueRecords.slice(batchIndex * 15, (batchIndex + 1) * 15),
      ...(completeBackfill && batchIndex === batchCount - 1 ? { backfillComplete: true } : {}),
    });
    try {
      const result = execFileSync(
        "npx",
        ["convex", "run", "platform/changelog/release:syncGitHubHistory", args],
        {
          encoding: "utf8",
          env: { ...process.env, CONVEX_DEPLOY_KEY: deployKey ?? "" },
          stdio: ["ignore", "pipe", "pipe"],
        }
      );
      const counts = JSON.parse(result);
      inserted += counts.inserted ?? 0;
      updated += counts.updated ?? 0;
      needsBackfill ||= counts.needsBackfill === true;
      needsPanelBackfill ||= counts.needsPanelBackfill === true;
    } catch (error) {
      const stderr = error?.stderr?.toString?.().replaceAll(releaseSecret, "[REDACTED]");
      throw new Error(stderr || "Convex rejected the GitHub history batch.");
    }
  }
  return { inserted, updated, needsBackfill, needsPanelBackfill };
}

let totals = await syncBatches(records, eventName === "workflow_dispatch");
if (totals.needsPanelBackfill && eventName !== "workflow_dispatch") {
  console.log("Backfilling panel-specific history rows for existing updates.");
  totals = await syncBatches(await loadCompleteHistory(), true);
}
console.log(
  `GitHub history sync complete: ${totals.inserted} inserted, ${totals.updated} updated.`
);
