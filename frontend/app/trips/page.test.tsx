import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TripsPage from "./page";
import { useAuth } from "@/providers/auth-context";
import { useQuery } from "@tanstack/react-query";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  readTripsApiV1TripsGetOptions: vi.fn(() => ({ queryKey: ["trips"] })),
}));

describe("TripsPage", () => {
  const mockTrips = [
    {
      id: "1",
      title: "Science Museum",
      location: "London",
      date: "2024-05-20",
      cost: 25,
      max_students: 30,
      registration_count: 10,
      description: "A trip to the science museum",
    },
    {
      id: "2",
      title: "Full Trip",
      location: "Paris",
      date: "2024-06-15",
      cost: 100,
      max_students: 20,
      registration_count: 20,
      description: "A full trip",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { is_superuser: false } });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state", () => {
    (useQuery as any).mockReturnValue({ isLoading: true });
    render(<TripsPage />);
    expect(screen.getByText("Available Trips")).toBeDefined();
  });

  it("renders error state", () => {
    (useQuery as any).mockReturnValue({
      isLoading: false,
      error: new Error("Fail"),
    });
    render(<TripsPage />);
    expect(screen.getByText(/Error loading trips/i)).toBeDefined();
  });

  it("renders empty state", () => {
    (useQuery as any).mockReturnValue({ isLoading: false, data: { data: [] } });
    render(<TripsPage />);
    expect(screen.getByText(/No trips available/i)).toBeDefined();
  });

  it("renders list of trips for regular users", () => {
    (useQuery as any).mockReturnValue({
      isLoading: false,
      data: { data: mockTrips },
    });
    render(<TripsPage />);

    expect(screen.getByText("Science Museum")).toBeDefined();
    expect(
      screen.getByRole("link", { name: /View Details & Register/i }),
    ).toBeDefined();

    expect(screen.getByText("Full Trip")).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Full - No Spots Left/i }),
    ).toBeDefined();
    expect(
      (
        screen.getByRole("button", {
          name: /Full - No Spots Left/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("renders list of trips for superusers", () => {
    (useAuth as any).mockReturnValue({ user: { is_superuser: true } });
    (useQuery as any).mockReturnValue({
      isLoading: false,
      data: { data: mockTrips },
    });
    render(<TripsPage />);

    expect(screen.getByRole("link", { name: /Create Trip/i })).toBeDefined();
    expect(screen.getAllByRole("link", { name: /Edit Details/i })).toHaveLength(
      2,
    );
  });
});
