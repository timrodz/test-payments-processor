import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ParentHomeFeature } from "./parent-home-feature";
import { useAuth } from "@/providers/auth-context";
import { useQuery } from "@tanstack/react-query";

vi.mock("@/providers/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  readMyRegistrationsApiV1RegistrationsMeGetOptions: vi.fn(() => ({
    queryKey: ["my-registrations"],
  })),
}));

describe("ParentHomeFeature", () => {
  const mockUser = {
    email: "parent@example.com",
    full_name: "Jane Doe",
    is_superuser: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state", () => {
    (useQuery as any).mockReturnValue({ isLoading: true });
    render(<ParentHomeFeature />);
    expect(screen.getByText(/Dashboard/i)).toBeDefined();
    // Skeleton list should be rendered (difficult to query directly, but we can check if content is missing)
    expect(screen.queryByText(/Welcome/i)).toBeNull();
  });

  it("renders error state", () => {
    (useQuery as any).mockReturnValue({
      isLoading: false,
      error: new Error("Failed"),
    });
    render(<ParentHomeFeature />);
    expect(screen.getByText(/Error loading dashboard/i)).toBeDefined();
  });

  it("renders empty state when no registrations", () => {
    (useQuery as any).mockReturnValue({ isLoading: false, data: { data: [] } });
    render(<ParentHomeFeature />);
    expect(screen.getByText(/No registrations found/i)).toBeDefined();
    expect(
      screen.getByRole("link", { name: /Browse Available Trips/i }),
    ).toBeDefined();
  });

  it("renders list of registrations", () => {
    const mockRegistrations = [
      {
        id: "reg-1",
        status: "pending",
        student_name: "Child One",
        trip_id: "trip-1",
        trip: {
          title: "Science Museum",
          location: "London",
          date: "2024-05-20",
        },
      },
      {
        id: "reg-2",
        status: "confirmed",
        student_name: "Child Two",
        trip_id: "trip-2",
        trip: { title: "Zoo Trip", location: "City Zoo", date: "2024-06-15" },
      },
    ];

    (useQuery as any).mockReturnValue({
      isLoading: false,
      data: { data: mockRegistrations },
    });
    render(<ParentHomeFeature />);

    expect(screen.getByText(/Science Museum/i)).toBeDefined();
    expect(screen.getByText(/Child One/i)).toBeDefined();
    expect(screen.getByText(/pending/i)).toBeDefined();
    expect(
      screen.getByRole("link", { name: /Complete Payment/i }),
    ).toBeDefined();

    expect(screen.getByText(/Zoo Trip/i)).toBeDefined();
    expect(screen.getByText(/Child Two/i)).toBeDefined();
    expect(screen.getByText(/confirmed/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /View Trip/i })).toBeDefined();
  });
});
