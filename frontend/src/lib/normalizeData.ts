export function normalizeArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.page)) return value.page;
  if (Array.isArray(value?.workspaces)) return value.workspaces;
  if (Array.isArray(value?.deals)) return value.deals;
  if (Array.isArray(value?.messages)) return value.messages;
  if (Array.isArray(value?.invoices)) return value.invoices;
  if (Array.isArray(value?.subscriptions)) return value.subscriptions;
  return [];
}
