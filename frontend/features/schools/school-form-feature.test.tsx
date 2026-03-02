import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SchoolFormFeature } from "./school-form-feature";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  createSchoolApiV1SchoolsPostMutation: vi.fn(() => ({ mutationKey: ["createSchool"] })),
  updateSchoolApiV1SchoolsSchoolIdPatchMutation: vi.fn(() => ({ mutationKey: ["updateSchool"] })),
  deleteSchoolApiV1SchoolsSchoolIdDeleteMutation: vi.fn(() => ({ mutationKey: ["deleteSchool"] })),
  readSchoolsApiV1SchoolsGetQueryKey: vi.fn(() => ["schools"]),
}));

describe("SchoolFormFeature", () => {
  const mockPush = vi.fn();
  const mockInvalidateQueries = vi.fn();
  
  const mockCreateMutate = vi.fn();
  const mockUpdateMutate = vi.fn();
  const mockDeleteMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (useQueryClient as any).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    
    // Default implementation for mutations
    (useMutation as any).mockImplementation((options: any) => {
      if (options.mutationKey?.[0] === "createSchool") {
        return { mutate: mockCreateMutate, isPending: false };
      }
      if (options.mutationKey?.[0] === "updateSchool") {
        return { mutate: mockUpdateMutate, isPending: false };
      }
      if (options.mutationKey?.[0] === "deleteSchool") {
        return { mutate: mockDeleteMutate, isPending: false };
      }
      return { mutate: vi.fn(), isPending: false };
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the create school form", () => {
    render(<SchoolFormFeature />);
    expect(screen.getByLabelText(/School Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Address/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Create School/i })).toBeDefined();
  });

  it("renders the update school form with initial values", () => {
    const school = { id: "1", name: "Test School", address: "123 Test St" } as any;
    render(<SchoolFormFeature school={school} />);
    
    expect(screen.getByDisplayValue("Test School")).toBeDefined();
    expect(screen.getByDisplayValue("123 Test St")).toBeDefined();
    expect(screen.getByRole("button", { name: /Update School/i })).toBeDefined();
    // Delete button should also be visible in edit mode
    expect(screen.getByRole("button", { name: "" })).toBeDefined(); // Trash icon button
  });

  it("shows validation errors on empty submission", async () => {
    render(<SchoolFormFeature />);
    
    fireEvent.click(screen.getByRole("button", { name: /Create School/i }));

    await waitFor(() => {
      expect(screen.getByText(/School name is required/i)).toBeDefined();
      expect(screen.getByText(/Address is required/i)).toBeDefined();
    });
  });

  it("calls createMutation on valid submission for new school", async () => {
    render(<SchoolFormFeature />);
    
    fireEvent.change(screen.getByLabelText(/School Name/i), { target: { value: "New School" } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: "New Address" } });
    
    fireEvent.click(screen.getByRole("button", { name: /Create School/i }));

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { name: "New School", address: "New Address" },
        })
      );
    });
  });

  it("calls updateMutation on valid submission for existing school", async () => {
    const school = { id: "1", name: "Old School", address: "Old Address" } as any;
    render(<SchoolFormFeature school={school} />);
    
    fireEvent.change(screen.getByLabelText(/School Name/i), { target: { value: "Updated School" } });
    
    fireEvent.click(screen.getByRole("button", { name: /Update School/i }));

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { school_id: "1" },
          body: expect.objectContaining({ name: "Updated School", address: "Old Address" }),
        })
      );
    });
  });

  it("navigates back on cancel", () => {
    render(<SchoolFormFeature />);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(mockPush).toHaveBeenCalledWith("/schools");
  });

  it("shows success toast and navigates on successful creation", async () => {
    let successCallback: any;
    (useMutation as any).mockImplementation((options: any) => {
      if (options.mutationKey?.[0] === "createSchool") {
        successCallback = options.onSuccess;
        return { mutate: mockCreateMutate, isPending: false };
      }
      return { mutate: vi.fn(), isPending: false };
    });

    render(<SchoolFormFeature />);
    
    fireEvent.change(screen.getByLabelText(/School Name/i), { target: { value: "New School" } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: "New Address" } });
    fireEvent.click(screen.getByRole("button", { name: /Create School/i }));

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalled();
    });

    // Simulate successful mutation
    successCallback();

    expect(mockInvalidateQueries).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("School created successfully");
    expect(mockPush).toHaveBeenCalledWith("/schools");
  });

  it("shows error toast on mutation failure", async () => {
    let errorCallback: any;
    (useMutation as any).mockImplementation((options: any) => {
      if (options.mutationKey?.[0] === "createSchool") {
        errorCallback = options.onError;
        return { mutate: mockCreateMutate, isPending: false };
      }
      return { mutate: vi.fn(), isPending: false };
    });

    render(<SchoolFormFeature />);
    
    fireEvent.change(screen.getByLabelText(/School Name/i), { target: { value: "New School" } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: "New Address" } });
    fireEvent.click(screen.getByRole("button", { name: /Create School/i }));

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalled();
    });

    // Simulate mutation error
    errorCallback({ message: "API Error" });

    expect(toast.error).toHaveBeenCalledWith("API Error");
  });

  it("handles school deletion", async () => {
    const school = { id: "123", name: "To Delete", address: "..." } as any;
    let deleteSuccessCallback: any;
    
    (useMutation as any).mockImplementation((options: any) => {
      if (options.mutationKey?.[0] === "deleteSchool") {
        deleteSuccessCallback = options.onSuccess;
        return { mutate: mockDeleteMutate, isPending: false };
      }
      return { mutate: vi.fn(), isPending: false };
    });

    render(<SchoolFormFeature school={school} />);
    
    // Click the trash icon button
    fireEvent.click(screen.getByRole("button", { name: "" }));

    // Wait for the AlertDialog to appear
    expect(screen.getByText(/Are you absolutely sure/i)).toBeDefined();
    
    // Click the confirm delete button in the dialog
    fireEvent.click(screen.getByRole("button", { name: /Delete School/i }));

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith({ path: { school_id: "123" } });
    });

    // Simulate successful deletion
    deleteSuccessCallback();

    expect(mockInvalidateQueries).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("School deleted successfully");
    expect(mockPush).toHaveBeenCalledWith("/schools");
  });
});
