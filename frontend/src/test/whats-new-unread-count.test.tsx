import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/convex/_generated/api";
import { WhatsNewNavLink } from "@/components/whats-new/WhatsNewNavLink";
import { WhatsNewPage } from "@/components/whats-new/WhatsNewPage";

const { mockUseQuery } = vi.hoisted(() => ({ mockUseQuery: vi.fn() }));

vi.mock("@/hooks/useSSRSafeConvex", () => ({
  useQuery: mockUseQuery,
  useMutation: () => vi.fn().mockResolvedValue(undefined),
}));

vi.mock("convex/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("convex/react")>()),
  usePaginatedQuery: () => ({ results: [], status: "Exhausted", loadMore: vi.fn() }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ sessionToken: "session-token" }),
}));

vi.mock("@/hooks/useInstalledModules", () => ({
  useInstalledModules: () => ({ installedModules: [] }),
}));

const feed = { entries: [], workspaceId: "workspace-1" };

function setUnreadResult(result: unknown) {
  mockUseQuery.mockImplementation((query: unknown) =>
    query === api.platform.changelog.queries.getWhatsNewFeed ? feed : result
  );
}

let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

beforeEach(() => {
  mockUseQuery.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

function render(element: ReactNode) {
  act(() => root.render(element));
}

describe("What's new unread count rendering", () => {
  it("shows a wrapped positive count in the sidebar link", () => {
    setUnreadResult({ data: 4, isLoading: false, error: undefined, refetch: vi.fn(), value: 4 });

    render(<WhatsNewNavLink />);

    expect(container.querySelector('a[aria-label="What’s new, 4 unread updates"]')).not.toBeNull();
    expect(container.textContent).toContain("4");
  });

  it("hides a wrapped zero count in the sidebar link", () => {
    setUnreadResult({ data: 0, isLoading: false, error: undefined, refetch: vi.fn(), value: 0 });

    render(<WhatsNewNavLink />);

    expect(container.querySelector('a[aria-label="What’s new"]')).not.toBeNull();
    expect(container.textContent).not.toContain("0");
  });

  it("treats an unresolved sidebar count as zero", () => {
    setUnreadResult({ data: undefined, isLoading: true, error: undefined, refetch: vi.fn(), value: undefined });

    render(<WhatsNewNavLink />);

    expect(container.querySelector('a[aria-label="What’s new"]')).not.toBeNull();
    expect(container.textContent).not.toContain("[object Object]");
  });

  it("shows a wrapped positive count on the What's new page", () => {
    setUnreadResult({ data: 4, isLoading: false, error: undefined, refetch: vi.fn(), value: 4 });

    render(<WhatsNewPage />);

    expect(container.textContent).toContain("4 new");
  });

  it("hides a wrapped zero count on the What's new page", () => {
    setUnreadResult({ data: 0, isLoading: false, error: undefined, refetch: vi.fn(), value: 0 });

    render(<WhatsNewPage />);

    expect(container.textContent).not.toContain("0 new");
  });

  it("treats an unresolved page count as zero", () => {
    setUnreadResult({ data: undefined, isLoading: true, error: undefined, refetch: vi.fn(), value: undefined });

    render(<WhatsNewPage />);

    expect(container.textContent).not.toContain("[object Object]");
    expect(container.textContent).not.toContain("undefined new");
  });
});
