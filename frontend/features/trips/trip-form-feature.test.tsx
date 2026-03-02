import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TripFormFeature } from "./trip-form-feature";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  createTripApiV1TripsPostMutation: vi.fn(() => ({ mutationKey: ["createTrip"] })),
  updateTripApiV1TripsTripIdPatchMutation: vi.fn(() => ({ mutationKey: ["updateTrip"] })),
  deleteTripApiV1TripsTripIdDeleteMutation: vi.fn(() => ({ mutationKey: ["deleteTrip"] })),
  readSchoolsApiV1SchoolsGetOptions: vi.fn(() => ({ queryKey: ["schools"] })),
  readTripsApiV1TripsGetQueryKey: vi.fn(() => ["trips"]),
}));

// Mocking Select component parts to make them easier to test
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value, disabled }: any) => (
    <select 
      id="school_id"
      data-testid="mock-select" 
      value={value} 
      disabled={disabled}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

describe("TripFormFeature", () => {
  const mockPush = vi.fn();
  const mockInvalidateQueries = vi.fn();
  const mockSchools = [
    { id: "school-1", name: "Green Valley High" },
    { id: "school-2", name: "Riverside Academy" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (useQueryClient as any).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    (useQuery as any).mockReturnValue({ data: { data: mockSchools } });
    
    (useMutation as any).mockImplementation((options: any) => {
      return { 
        mutate: vi.fn((vars, mutationOptions) => {
          // Allow manual triggering of callbacks in tests if needed
        }), 
        isPending: false 
      };
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the create trip form", () => {
    render(<TripFormFeature />);
    expect(screen.getByLabelText(/School/i)).toBeDefined();
    expect(screen.getByLabelText(/Trip Title/i)).toBeDefined();
    expect(screen.getByLabelText(/Location/i)).toBeDefined();
    expect(screen.getByLabelText(/Cost/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Create Trip/i })).toBeDefined();
  });

  it("renders with initial values in edit mode", () => {
    const trip = {
      id: "trip-123",
      title: "Science Museum",
      location: "London",
      date: "2024-05-20T10:00:00Z",
      cost: 25.50,
      max_students: 40,
      school_id: "school-1",
      description: "A fun day out"
    } as any;

    render(<TripFormFeature trip={trip} />);

    expect(screen.getByDisplayValue("Science Museum")).toBeDefined();
    expect(screen.getByDisplayValue("London")).toBeDefined();
    expect(screen.getByDisplayValue("25.5")).toBeDefined();
    expect(screen.getByDisplayValue("40")).toBeDefined();
    expect(screen.getByDisplayValue("A fun day out")).toBeDefined();
    expect(screen.getByRole("button", { name: /Update Trip/i })).toBeDefined();
  });

  it("shows validation errors on empty submission", async () => {
    render(<TripFormFeature />);
    
    fireEvent.click(screen.getByRole("button", { name: /Create Trip/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please select a school/i)).toBeDefined();
      expect(screen.getByText(/Title is required/i)).toBeDefined();
      expect(screen.getByText(/Location is required/i)).toBeDefined();
      expect(screen.getByText(/Date is required/i)).toBeDefined();
    });
  });

  it("calls createMutation with formatted data on valid submission", async () => {
    const mockMutate = vi.fn();
    (useMutation as any).mockReturnValue({ mutate: mockMutate, isPending: false });

    render(<TripFormFeature />);
    
    // Using the mocked select
    fireEvent.change(screen.getByTestId("mock-select"), { target: { value: "school-2" } });
    
    fireEvent.change(screen.getByLabelText(/Trip Title/i), { target: { value: "Zoo Trip" } });
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: "City Zoo" } });
    fireEvent.change(screen.getByLabelText(/Date & Time/i), { target: { value: "2024-06-15T09:00" } });
    fireEvent.change(screen.getByLabelText(/Cost/i), { target: { value: "15.00" } });
    fireEvent.change(screen.getByLabelText(/Maximum Students/i), { target: { value: "50" } });

    fireEvent.click(screen.getByRole("button", { name: /Create Trip/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            title: "Zoo Trip",
            school_id: "school-2",
            cost: 15,
            max_students: "50", // register returns string for number inputs usually, though component casts it
          })
        })
      );
    });
  });

  it("handles trip deletion", async () => {
    const trip = { id: "trip-1", title: "Delete Me", date: new Date().toISOString() } as any;
    const mockDelete = vi.fn();
    
    (useMutation as any).mockImplementation((options: any) => {
      if (options.mutationKey?.[0] === "deleteTrip") {
        return { mutate: mockDelete, isPending: false };
      }
      return { mutate: vi.fn(), isPending: false };
    });

    render(<TripFormFeature trip={trip} />);
    
    // Click trash button
    fireEvent.click(screen.getByRole("button", { name: "" }));

    // Click Delete in dialog
    fireEvent.click(screen.getByRole("button", { name: /Delete Trip/i }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith({ path: { trip_id: "trip-1" } });
    });
  });
});
