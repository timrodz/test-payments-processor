import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import NewTripPage from "./page";
import { useAuth } from "@/providers/auth-context";
import { redirect } from "next/navigation";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/features/trips/trip-form-feature", () => ({
  TripFormFeature: () => <div data-testid="trip-form" />,
}));

describe("NewTripPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("redirects regular users", () => {
    (useAuth as any).mockReturnValue({ user: { is_superuser: false } });
    render(<NewTripPage />);
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders for superusers", () => {
    (useAuth as any).mockReturnValue({ user: { is_superuser: true } });
    render(<NewTripPage />);
    expect(screen.getByText(/Create New Trip/i)).toBeDefined();
    expect(screen.getByTestId("trip-form")).toBeDefined();
  });
});
