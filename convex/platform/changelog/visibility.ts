export function isVisibleTo(
  entry: any,
  context: { panel: string; workspaceId: string; canSeeAllPanels: boolean }
) {
  const panels: string[] = entry.panels?.length ? entry.panels : [entry.panel ?? "admin"];
  if (!context.canSeeAllPanels && !panels.includes(context.panel)) return false;
  return (
    !entry.workspaceIds?.length ||
    entry.workspaceIds.includes(context.workspaceId) ||
    context.canSeeAllPanels
  );
}

export function historyPanels(panels?: string[]) {
  return panels?.length ? panels : ["platform"];
}

export function historyAudienceKey(context: { canSeeAllPanels: boolean; panel: string }) {
  return context.canSeeAllPanels ? "all" : `panel:${context.panel}`;
}

export function legacyHistoryAudienceKey(context: { canSeeAllPanels: boolean; panel: string }) {
  return context.canSeeAllPanels ? "all" : context.panel;
}
