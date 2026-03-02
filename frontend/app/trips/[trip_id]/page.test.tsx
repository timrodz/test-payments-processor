import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TripDetailPage from "./page";
import { useAuth } from "@/providers/auth-context";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  readTripByIdApiV1TripsTripIdGetOptions: vi.fn(() => ({ queryKey: ["trip"] })),
}));

describe("TripDetailPage", () => {
  const mockTrip = {
    id: "123",
    title: "Science Museum",
    location: "London",
    date: "2024-05-20T10:00:00Z",
    cost: 25.5,
    max_students: 30,
    registration_count: 10,
    description: "A fun day out at the science museum.",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { is_superuser: false } });
    (useParams as any).mockReturnValue({ trip_id: "123" });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state", () => {
    (useQuery as any).mockReturnValue({ isLoading: true });
    render(<TripDetailPage />);
    expect(screen.queryByText("Science Museum")).toBeNull();
  });

  it("renders error state", () => {
    (useQuery as any).mockReturnValue({
      isLoading: false,
      error: new Error("Fail"),
    });
    render(<TripDetailPage />);
    expect(screen.getByText(/Error loading trip/i)).toBeDefined();
  });

  it("renders trip details for regular users", () => {
    (useQuery as any).mockReturnValue({ isLoading: false, data: mockTrip });
    render(<TripDetailPage />);

    expect(screen.getByText("Science Museum")).toBeDefined();
    expect(screen.getByText("London")).toBeDefined();
    expect(screen.getByText(/10 \/ 30 Students/i)).toBeDefined();
    expect(screen.getByText(/A fun day out/i)).toBeDefined();
    expect(
      screen.getByRole("link", { name: /Register Student/i }),
    ).toBeDefined();
    expect(screen.queryByText(/Edit Trip/i)).toBeNull();
  });

  it("renders edit button for superusers", () => {
    (useAuth as any).mockReturnValue({ user: { is_superuser: true } });
    (useQuery as any).mockReturnValue({ isLoading: false, data: mockTrip });
    render(<TripDetailPage />);

    expect(screen.getByRole("link", { name: /Edit Trip/i })).toBeDefined();
  });

  it("renders full status when registrations reach capacity", () => {
    (useQuery as any).mockReturnValue({
      isLoading: false,
      data: { ...mockTrip, registration_count: 30 },
    });
    render(<TripDetailPage />);

    expect(
      screen.getByRole("button", { name: /Register Student/i }),
    ).toBeDefined();
    expect(
      (
        screen.getByRole("button", {
          name: /Register Student/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      screen.getByText(/This trip has reached its maximum capacity/i),
    ).toBeDefined();
  });
});
