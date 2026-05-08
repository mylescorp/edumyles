import { beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";

function ThemeProbe() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <button type="button" onClick={toggleTheme}>
      {theme}:{resolvedTheme}
    </button>
  );
}

describe("ThemeProvider", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
    container = document.createElement("div");
    document.body.replaceChildren(container);

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as MediaQueryList),
    });
  });

  it("persists dark mode and applies html.dark", async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>
      );
    });

    await act(async () => {
      container.querySelector("button")?.click();
    });

    expect(window.localStorage.getItem("em-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    root.unmount();
  });

  it("hydrates from the saved theme", () => {
    window.localStorage.setItem("em-theme", "dark");
    const root = createRoot(container);

    act(() => {
      root.render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>
      );
    });

    expect(container.querySelector("button")?.textContent).toBe("dark:dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    root.unmount();
  });
});
