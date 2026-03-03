import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PaymentPage from "./page";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  readTripByIdApiV1TripsTripIdGetOptions: vi.fn(() => ({ queryKey: ["trip"] })),
  readRegistrationByIdApiV1RegistrationsRegistrationIdGetOptions: vi.fn(() => ({
    queryKey: ["reg"],
  })),
  submitPaymentApiV1PaymentsPostMutation: vi.fn(() => ({
    mutationKey: ["pay"],
  })),
}));

describe("PaymentPage", () => {
  const mockTrip = { id: "trip-1", title: "Science Museum", cost: 25.0 };
  const mockReg = { id: "reg-1", student_name: "Johnny Doe" };
  const mockPush = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({
      trip_id: "trip-1",
      registration_id: "reg-1",
    });
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
    const { container } = render(<PaymentPage />);
    expect(container.querySelector(".animate-spin")).toBeDefined();
  });

  it("renders payment form", () => {
    (useQuery as any).mockImplementation((options: any) => {
      if (options.queryKey[0] === "trip")
        return { isLoading: false, data: mockTrip };
      if (options.queryKey[0] === "reg")
        return { isLoading: false, data: mockReg };
      return { isLoading: false };
    });

    render(<PaymentPage />);

    expect(screen.getByText(/Johnny Doe's/i)).toBeDefined();
    expect(screen.getByText("$25.00", { selector: "span" })).toBeDefined();
    expect(screen.getByLabelText(/Card Number/i)).toBeDefined();
  });

  it("validates expiry date format", async () => {
    (useQuery as any).mockImplementation((options: any) => {
      if (options.queryKey[0] === "trip")
        return { isLoading: false, data: mockTrip };
      if (options.queryKey[0] === "reg")
        return { isLoading: false, data: mockReg };
      return { isLoading: false };
    });

    render(<PaymentPage />);

    fireEvent.change(screen.getByLabelText(/Card Number/i), {
      target: { value: "4111111111111111" },
    });
    fireEvent.change(screen.getByLabelText(/Expiry Date/i), {
      target: { value: "13/25" },
    }); // Invalid month
    fireEvent.change(screen.getByLabelText(/CVV/i), {
      target: { value: "123" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /Pay \$25\.00/i }).closest("form")!,
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Invalid expiry date format. Use MM/YY.",
    );
  });

  it("submits payment successfully", async () => {
    (useQuery as any).mockImplementation((options: any) => {
      if (options.queryKey[0] === "trip")
        return { isLoading: false, data: mockTrip };
      if (options.queryKey[0] === "reg")
        return { isLoading: false, data: mockReg };
      return { isLoading: false };
    });

    mockMutateAsync.mockResolvedValue({ status: "success", id: "pay-1" });

    render(<PaymentPage />);

    fireEvent.change(screen.getByLabelText(/Card Number/i), {
      target: { value: "4111111111111111" },
    });
    fireEvent.change(screen.getByLabelText(/Expiry Date/i), {
      target: { value: "12/26" },
    });
    fireEvent.change(screen.getByLabelText(/CVV/i), {
      target: { value: "123" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /Pay \$25\.00/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Payment successful!");
      expect(mockPush).toHaveBeenCalledWith("/trips/trip-1/confirmation/pay-1");
    });
  });
});
