export type UpdateType = "feature" | "fix" | "improvement" | "breaking";
export function normalizeDisplayTitle(title: string, type: UpdateType): string;
export function classifyType(pullRequest: {
  title?: string;
  labels?: Array<{ name: string }>;
}): UpdateType;
export function displayDescription(type: UpdateType): string;
export function panelsForFiles(files: string[]): string[];
