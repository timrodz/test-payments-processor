import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import EditTripPage from "./page";
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

vi.mock("@/features/trips/trip-form-feature", () => ({
  TripFormFeature: ({ trip }: any) => (
    <div data-testid="trip-form">{trip?.title}</div>
  ),
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  readTripByIdApiV1TripsTripIdGetOptions: vi.fn(() => ({ queryKey: ["trip"] })),
}));

describe("EditTripPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { is_superuser: true } });
    (useParams as any).mockReturnValue({ trip_id: "123" });
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects regular users", () => {
    (useAuth as any).mockReturnValue({ user: { is_superuser: false } });
    (useQuery as any).mockReturnValue({ isLoading: true });
    render(<EditTripPage />);
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders loading state", () => {
    (useQuery as any).mockReturnValue({ isLoading: true });
    const { container } = render(<EditTripPage />);
    expect(container.querySelector(".animate-spin")).toBeDefined();
  });

  it("renders error state", () => {
    (useQuery as any).mockReturnValue({
      isLoading: false,
      error: new Error("Fail"),
    });
    render(<EditTripPage />);
    expect(screen.getByText(/Error loading trip/i)).toBeDefined();
  });

  it("renders the trip form for editing", () => {
    const mockTrip = { id: "123", title: "Science Museum Visit" };
    (useQuery as any).mockReturnValue({ isLoading: false, data: mockTrip });

    render(<EditTripPage />);

    expect(screen.getByText(/Edit Trip/i)).toBeDefined();
    expect(
      screen.getByText(/Science Museum Visit/i, { selector: "p" }),
    ).toBeDefined();
    expect(screen.getByTestId("trip-form")).toBeDefined();
    expect(screen.getByTestId("trip-form").textContent).toBe(
      "Science Museum Visit",
    );
  });
});
