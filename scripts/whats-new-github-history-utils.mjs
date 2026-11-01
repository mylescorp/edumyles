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

const safeFallbackTitle = {
  feature: "New product capability",
  fix: "Product fix",
  improvement: "Product improvement",
  breaking: "Important product change",
};

export function normalizeDisplayTitle(title, type) {
  const cleaned = (title ?? "")
    .toString()
    .slice(0, 300)
    .replace(/^\s*[a-z]+(?:\([^)]*\))?!?:\s*/i, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/@[\w-]+/g, "")
    .replace(/\b(?:github|mylescorp|edumyles)\b/gi, "")
    .replace(/#\d+\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:–—-]+|[\s:–—-]+$/g, "")
    .trim();
  // PR titles are arbitrary contributor text. Never show titles that appear to
  // include an issue reference, attribution, contact, or personal name.
  if (
    !cleaned ||
    /\b(?:pr|pull request|issue|ticket)\s*#?\d+\b/i.test(cleaned) ||
    /\b[A-Z][\p{L}'-]+\s+[A-Z][\p{L}'-]+\b/u.test(cleaned) ||
    /\b(?:by|from|author(?:ed)?|contributor)\s+[A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+)?/u.test(
      cleaned
    ) ||
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(cleaned)
  ) {
    return safeFallbackTitle[type] ?? "Product update";
  }
  return cleaned;
}

export function classifyType(pullRequest) {
  const labels = (pullRequest.labels ?? []).map((label) => label.name.toLowerCase());
  const title = (pullRequest.title ?? "").toLowerCase();
  if (
    labels.some((label) => /breaking/.test(label)) ||
    /\bbreaking\b/.test(title) ||
    /^[a-z]+(?:\([^)]*\))?!:/i.test(title)
  ) {
    return "breaking";
  }
  if (
    labels.some((label) => /^(fix|bug)(\b|:)/.test(label)) ||
    /^(fix|bug)(\([^)]*\))?!?(?::|\s)/i.test(title)
  )
    return "fix";
  if (
    labels.some((label) => /^(feature|feat|enhancement)(\b|:)/.test(label)) ||
    /^(feat|feature)(\([^)]*\))?!?(?::|\s)/i.test(title)
  )
    return "feature";
  return "improvement";
}

export function displayDescription(type) {
  return {
    feature: "A new capability is available in this part of EduMyles.",
    fix: "An issue has been fixed in this part of EduMyles.",
    improvement: "This part of EduMyles has been improved.",
    breaking: "This change may require teams to adjust their workflow.",
  }[type];
}

export function panelsForFiles(files) {
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
