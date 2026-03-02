import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import HomePage from "./page";
import { useAuth } from "@/providers/auth-context";

vi.mock("@/providers/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/home/parent-home-feature", () => ({
  ParentHomeFeature: () => <div data-testid="parent-home" />,
}));

vi.mock("@/features/home/superuser-home-feature", () => ({
  SuperuserHomeFeature: () => <div data-testid="superuser-home" />,
}));

describe("HomePage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders loading state", () => {
    (useAuth as any).mockReturnValue({ user: null, isLoading: true });
    const { container } = render(<HomePage />);
    expect(container.querySelector(".animate-pulse")).toBeDefined();
    expect(screen.queryByTestId("parent-home")).toBeNull();
    expect(screen.queryByTestId("superuser-home")).toBeNull();
  });

  it("renders SuperuserHomeFeature for superusers", () => {
    (useAuth as any).mockReturnValue({
      user: { is_superuser: true },
      isLoading: false,
    });
    render(<HomePage />);
    expect(screen.getByTestId("superuser-home")).toBeDefined();
  });

  it("renders ParentHomeFeature for regular users", () => {
    (useAuth as any).mockReturnValue({
      user: { is_superuser: false },
      isLoading: false,
    });
    render(<HomePage />);
    expect(screen.getByTestId("parent-home")).toBeDefined();
  });
});
