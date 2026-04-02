export type PlatformUserRecord = {
  tenantId: string;
  role: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt?: number;
};

export type ListAllUsersFilters = {
  search?: string;
  role?: string;
  tenantId?: string;
  status?: string;
};

export function getUserStatus(user: Pick<PlatformUserRecord, "isActive">): "active" | "inactive" {
  return user.isActive ? "active" : "inactive";
}

export function filterAndSortUsers<T extends PlatformUserRecord>(
  users: T[],
  filters: ListAllUsersFilters
): T[] {
  const normalizedSearch = filters.search?.trim().toLowerCase();

  return [...users]
    .filter((user) => {
      if (filters.tenantId && user.tenantId !== filters.tenantId) {
        return false;
      }

      if (filters.role && user.role !== filters.role) {
        return false;
      }

      if (filters.status && getUserStatus(user) !== filters.status) {
        return false;
      }

      if (normalizedSearch) {
        const haystack = [
          user.firstName ?? "",
          user.lastName ?? "",
          user.email,
          user.tenantId,
          user.role,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const createdDiff = (b.createdAt ?? 0) - (a.createdAt ?? 0);
      if (createdDiff !== 0) {
        return createdDiff;
      }

      return a.email.localeCompare(b.email);
    });
}
