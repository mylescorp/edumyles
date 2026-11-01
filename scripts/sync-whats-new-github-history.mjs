import { execFileSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";

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

const PANELS = [
  "admin",
  "teacher",
  "student",
  "parent",
  "alumni",
  "partner",
  "developer",
  "affiliate",
  "reseller",
  "platform",
];

function normalizeDisplayTitle(title) {
  const safeTitle = clipped(title, 300)
    .replace(
      /^\s*(?:feat(?:ure)?|fix|bug|improvement|refactor|docs|chore|perf)(?:\([^)]*\))?!?:\s*/i,
      ""
    )
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/@[\w-]+/g, "")
    .replace(/\b(?:github|mylescorp|edumyles)\b/gi, "")
    .replace(/#\d+\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:–—-]+|[\s:–—-]+$/g, "")
    .trim();
  return safeTitle || "Product update";
}

function classifyType(pullRequest) {
  const labels = (pullRequest.labels ?? []).map((label) => label.name.toLowerCase());
  const title = pullRequest.title.toLowerCase();
  if (labels.some((label) => /breaking/.test(label)) || /\bbreaking\b/.test(title))
    return "breaking";
  if (labels.some((label) => /^(fix|bug)(\b|:)/.test(label)) || /^(fix|bug)(\(|:|\s)/.test(title))
    return "fix";
  if (
    labels.some((label) => /^(feature|feat|enhancement)(\b|:)/.test(label)) ||
    /^(feat|feature)(\(|:|\s)/.test(title)
  )
    return "feature";
  return "improvement";
}

function panelsForFiles(files) {
  const panels = new Set();
  let hasUnknownScope = files.length === 0;
  for (const file of files) {
    const path = file.toLowerCase().replaceAll("\\", "/");
    if (
      path.startsWith("shared/") ||
      path.startsWith("packages/") ||
      path.startsWith("frontend/src/components/ui/") ||
      path.startsWith("frontend/src/components/whats-new/") ||
      path.startsWith("frontend/src/app/(")
    ) {
      return PANELS;
    }

    const portal = path.match(/(?:^|\/)portal\/([a-z-]+)(?:\/|$)/);
    const route = path.match(
      /(?:^|\/)(platform|admin|teacher|student|parent|alumni|partner|developer|affiliate|reseller)(?:\/|$)/
    );
    const panel = portal?.[1] ?? route?.[1];
    if (panel && PANELS.includes(panel)) panels.add(panel);
    else hasUnknownScope = true;
  }
  if (hasUnknownScope) panels.add("platform");
  return [...panels].length ? [...panels] : ["platform"];
}

function displayDescription(pullRequest, type) {
  const sanitizedBody = clipped(pullRequest.body, 1200)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/@[\w-]+/g, "")
    .replace(/\b(?:github|mylescorp|edumyles)\b/gi, "")
    .replace(/#\d+\b/g, "")
    .replace(/^\s*(?:#{1,6}|[-*+]\s*\[[ xX]\])\s*/gm, "")
    .replace(/\*\*|__|`|~~/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*+]\s*/, "").trim())
    .filter(
      (line) =>
        line &&
        !/^(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#?\d+/i.test(line) &&
        !/^co-authored-by:/i.test(line)
    )
    .slice(0, 2)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (sanitizedBody.length >= 24) return sanitizedBody.slice(0, 500);
  return {
    feature: "Adds a capability to an affected EduMyles workflow.",
    fix: "Fixes an issue in an affected EduMyles workflow.",
    improvement: "Improves an affected EduMyles workflow.",
    breaking: "Updates an affected EduMyles workflow in a way that may require teams to adjust.",
  }[type];
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
    displayTitle: normalizeDisplayTitle(pullRequest.title),
    displayDescription: displayDescription(pullRequest, type),
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

let records = [];
if (eventName === "workflow_dispatch") {
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

  records = mergedPullRequestRecords;
  records.push(...mergedCommitRecords.values());
  const repositoryInfo = await github(apiRoot);
  const branchCommits = await getAllPages(
    `${apiRoot}/commits?sha=${encodeURIComponent(repositoryInfo.default_branch)}`
  );
  for (const commit of branchCommits) {
    if (mergedCommitRecords.has(commit.sha)) continue;
    const pullRequestNumber = pullRequestCommits.get(commit.sha);
    records.push(
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
} else {
  throw new Error(`Unsupported GitHub history event: ${eventName}`);
}

const uniqueRecords = [...new Map(records.map((record) => [record.externalId, record])).values()];
let inserted = 0;
let updated = 0;
for (let offset = 0; offset < uniqueRecords.length; offset += 15) {
  const args = JSON.stringify({
    releaseSecret,
    records: uniqueRecords.slice(offset, offset + 15),
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
  } catch (error) {
    const stderr = error?.stderr?.toString?.().replaceAll(releaseSecret, "[REDACTED]");
    throw new Error(stderr || "Convex rejected the GitHub history batch.");
  }
}
console.log(`GitHub history sync complete: ${inserted} inserted, ${updated} updated.`);
