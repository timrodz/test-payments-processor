import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import NewSchoolPage from "./page";
import { useAuth } from "@/providers/auth-context";
import { redirect } from "next/navigation";

vi.mock("@/providers/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/features/schools/school-form-feature", () => ({
  SchoolFormFeature: () => <div data-testid="school-form" />,
}));

describe("NewSchoolPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("redirects regular users", () => {
    (useAuth as any).mockReturnValue({ user: { is_superuser: false } });
    render(<NewSchoolPage />);
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders for superusers", () => {
    (useAuth as any).mockReturnValue({ user: { is_superuser: true } });
    render(<NewSchoolPage />);
    expect(screen.getByText(/Add New School/i)).toBeDefined();
    expect(screen.getByTestId("school-form")).toBeDefined();
  });
});
