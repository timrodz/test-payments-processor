import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ConfirmationPage from "./page";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  readTripByIdApiV1TripsTripIdGetOptions: vi.fn(() => ({ queryKey: ["trip"] })),
  readPaymentByIdApiV1PaymentsPaymentIdGetOptions: vi.fn(() => ({
    queryKey: ["pay"],
  })),
  readRegistrationByIdApiV1RegistrationsRegistrationIdGetOptions: vi.fn(() => ({
    queryKey: ["reg"],
  })),
}));

describe("ConfirmationPage", () => {
  const mockTrip = {
    id: "trip-1",
    title: "Science Museum",
    location: "London",
    date: "2024-05-20",
  };
  const mockReg = {
    id: "reg-1",
    student_name: "Johnny Doe",
    parent_email: "jane@example.com",
  };
  const mockPay = {
    id: "pay-1",
    amount: 25.0,
    transaction_id: "TXN123",
    registration_id: "reg-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({
      trip_id: "trip-1",
      payment_id: "pay-1",
    });
    // Mock window.print
    vi.spyOn(window, "print").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state", () => {
    (useQuery as any).mockReturnValue({ isLoading: true });
    const { container } = render(<ConfirmationPage />);
    expect(container.querySelector(".animate-spin")).toBeDefined();
  });

  it("renders confirmation details", () => {
    (useQuery as any).mockImplementation((options: any) => {
      if (options.queryKey[0] === "trip")
        return { isLoading: false, data: mockTrip };
      if (options.queryKey[0] === "reg")
        return { isLoading: false, data: mockReg };
      if (options.queryKey[0] === "pay")
        return { isLoading: false, data: mockPay };
      return { isLoading: false };
    });

    render(<ConfirmationPage />);

    expect(screen.getByText(/Payment Successful!/i)).toBeDefined();
    expect(
      screen.getByText("Johnny Doe", { selector: "p span" }),
    ).toBeDefined();
    expect(
      screen.getByText("Science Museum", { selector: "span" }),
    ).toBeDefined();
    expect(screen.getByText(/\$25.00/i)).toBeDefined();
    expect(screen.getByText("TXN123")).toBeDefined();
  });

  it("calls window.print when print button is clicked", () => {
    (useQuery as any).mockImplementation((options: any) => {
      if (options.queryKey[0] === "trip")
        return { isLoading: false, data: mockTrip };
      if (options.queryKey[0] === "reg")
        return { isLoading: false, data: mockReg };
      if (options.queryKey[0] === "pay")
        return { isLoading: false, data: mockPay };
      return { isLoading: false };
    });

    render(<ConfirmationPage />);

    fireEvent.click(screen.getByRole("button", { name: /Print Receipt/i }));
    expect(window.print).toHaveBeenCalled();
  });
});
