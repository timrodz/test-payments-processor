import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SchoolsPage from "./page";
import { useAuth } from "@/providers/auth-context";
import { useQuery } from "@tanstack/react-query";
import { redirect } from "next/navigation";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  readSchoolsApiV1SchoolsGetOptions: vi.fn(() => ({ queryKey: ["schools"] })),
}));

describe("SchoolsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { is_superuser: true } });
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects regular users to home", () => {
    (useAuth as any).mockReturnValue({ user: { is_superuser: false } });
    (useQuery as any).mockReturnValue({ isLoading: true });

    render(<SchoolsPage />);
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders loading state", () => {
    (useQuery as any).mockReturnValue({ isLoading: true });
    render(<SchoolsPage />);
    expect(screen.getByText("Schools")).toBeDefined();
    // Card with animate-pulse should exist
  });

  it("renders error state", () => {
    (useQuery as any).mockReturnValue({
      isLoading: false,
      error: new Error("Fail"),
    });
    render(<SchoolsPage />);
    expect(screen.getByText(/Error loading schools/i)).toBeDefined();
  });

  it("renders empty state", () => {
    (useQuery as any).mockReturnValue({ isLoading: false, data: { data: [] } });
    render(<SchoolsPage />);
    expect(screen.getByText(/No schools found/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /Add School/i })).toBeDefined();
  });

  it("renders list of schools", () => {
    const mockSchools = [
      { id: "1", name: "School A", address: "Address A" },
      { id: "2", name: "School B", address: "Address B" },
    ];
    (useQuery as any).mockReturnValue({
      isLoading: false,
      data: { data: mockSchools },
    });
    render(<SchoolsPage />);

    expect(screen.getByText("School A")).toBeDefined();
    expect(screen.getByText("School B")).toBeDefined();
    expect(screen.getAllByText(/Edit Details/i)).toHaveLength(2);
  });
});
