import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import EditSchoolPage from "./page";
import { useAuth } from "@/providers/auth-context";
import { useQuery } from "@tanstack/react-query";
import { useParams, redirect } from "next/navigation";

vi.mock("@/providers/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/features/schools/school-form-feature", () => ({
  SchoolFormFeature: ({ school }: any) => (
    <div data-testid="school-form">{school?.name}</div>
  ),
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  readSchoolByIdApiV1SchoolsSchoolIdGetOptions: vi.fn(() => ({
    queryKey: ["school"],
  })),
}));

describe("EditSchoolPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { is_superuser: true } });
    (useParams as any).mockReturnValue({ school_id: "123" });
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects regular users", () => {
    (useAuth as any).mockReturnValue({ user: { is_superuser: false } });
    (useQuery as any).mockReturnValue({ isLoading: true });
    render(<EditSchoolPage />);
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders loading state", () => {
    (useQuery as any).mockReturnValue({ isLoading: true });
    const { container } = render(<EditSchoolPage />);
    expect(container.querySelector(".animate-spin")).toBeDefined();
  });

  it("renders error state", () => {
    (useQuery as any).mockReturnValue({
      isLoading: false,
      error: new Error("Fail"),
    });
    render(<EditSchoolPage />);
    expect(screen.getByText(/Error loading school/i)).toBeDefined();
  });

  it("renders the school form for editing", () => {
    const mockSchool = { id: "123", name: "Green Valley High" };
    (useQuery as any).mockReturnValue({ isLoading: false, data: mockSchool });

    render(<EditSchoolPage />);

    expect(screen.getByText(/Edit School/i)).toBeDefined();
    expect(
      screen.getByText(/Green Valley High/i, { selector: "p" }),
    ).toBeDefined();
    expect(screen.getByTestId("school-form")).toBeDefined();
    expect(screen.getByTestId("school-form").textContent).toBe(
      "Green Valley High",
    );
  });
});
