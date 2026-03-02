import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RegisterPage from "./page";
import { useAuth } from "@/providers/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

vi.mock("@/providers/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  readTripByIdApiV1TripsTripIdGetOptions: vi.fn(() => ({ queryKey: ["trip"] })),
  createRegistrationApiV1RegistrationsPostMutation: vi.fn(() => ({
    mutationKey: ["createReg"],
  })),
}));

describe("RegisterPage", () => {
  const mockTrip = {
    id: "123",
    title: "Science Museum",
    registration_count: 5,
    max_students: 30,
  };
  const mockUser = { full_name: "Jane Parent", email: "jane@example.com" };
  const mockPush = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (useParams as any).mockReturnValue({ trip_id: "123" });
    (useRouter as any).mockReturnValue({ push: mockPush });
    (useMutation as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state", () => {
    (useQuery as any).mockReturnValue({ isLoading: true });
    const { container } = render(<RegisterPage />);
    expect(container.querySelector(".animate-spin")).toBeDefined();
  });

  it("renders the registration form with user defaults", () => {
    (useQuery as any).mockReturnValue({ isLoading: false, data: mockTrip });
    render(<RegisterPage />);

    expect(screen.getByText(/Science Museum/i)).toBeDefined();
    expect(screen.getByLabelText(/Student Full Name/i)).toBeDefined();
    expect(
      (screen.getByLabelText(/Parent Full Name/i) as HTMLInputElement).value,
    ).toBe("Jane Parent");
    expect(
      (screen.getByLabelText(/Email Address/i) as HTMLInputElement).value,
    ).toBe("jane@example.com");
  });

  it("submits the form successfully", async () => {
    (useQuery as any).mockReturnValue({ isLoading: false, data: mockTrip });
    mockMutateAsync.mockResolvedValue({ id: "reg-456" });

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/Student Full Name/i), {
      target: { value: "Johnny Doe" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Continue to Payment/i }),
    );

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        body: expect.objectContaining({
          trip_id: "123",
          student_name: "Johnny Doe",
        }),
      });
      expect(mockPush).toHaveBeenCalledWith("/trips/123/payment/reg-456");
    });
  });

  it("disables form when trip is full", () => {
    (useQuery as any).mockReturnValue({
      isLoading: false,
      data: { ...mockTrip, registration_count: 30, max_students: 30 },
    });

    render(<RegisterPage />);

    expect(screen.getByText(/This trip is at full capacity/i)).toBeDefined();
    expect(
      (screen.getByLabelText(/Student Full Name/i) as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: /Continue to Payment/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
