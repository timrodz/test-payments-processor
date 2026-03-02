import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoginFormFeature } from "@/features/login/login-form-feature";
import { useAuth } from "@/providers/auth-context";
import { useMutation } from "@tanstack/react-query";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
}));

vi.mock("@/lib/client/@tanstack/react-query.gen", () => ({
  loginAccessTokenApiV1LoginAccessTokenPostMutation: vi.fn(() => ({
    mutationKey: ["login"],
  })),
}));

describe("LoginFormFeature", () => {
  const mockLogin = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      login: mockLogin,
    });
    (useMutation as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the login form", () => {
    render(<LoginFormFeature />);
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /login/i })).toBeDefined();
  });

  it("shows validation errors for invalid input", async () => {
    render(<LoginFormFeature />);

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeDefined();
      expect(screen.getByText(/password is required/i)).toBeDefined();
    });
  });

  it("calls mutate with correct values on valid submission", async () => {
    render(<LoginFormFeature />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            username: "test@example.com",
            password: "password123",
          },
        }),
        expect.any(Object),
      );
    });
  });

  it("calls login on successful mutation", async () => {
    (useMutation as any).mockReturnValue({
      mutate: vi.fn((_vars, options) => {
        options.onSuccess({ access_token: "fake-token" });
      }),
      isPending: false,
    });

    render(<LoginFormFeature />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("fake-token");
    });
  });

  it("shows error message on failed mutation", async () => {
    (useMutation as any).mockReturnValue({
      mutate: vi.fn((_vars, options) => {
        options.onError(new Error("Invalid credentials"));
      }),
      isPending: false,
    });

    render(<LoginFormFeature />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeDefined();
    });
  });

  it("disables button when loading", () => {
    (useMutation as any).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });

    render(<LoginFormFeature />);

    const button = screen.getByRole("button", { name: /logging in.../i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
