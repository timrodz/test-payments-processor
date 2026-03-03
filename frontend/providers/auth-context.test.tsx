import { render, waitFor, cleanup, act, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "./auth-context";
import { useRouter, usePathname } from "next/navigation";
import { readUserMeApiV1UsersMeGet } from "@/lib/client/sdk.gen";
import { client } from "@/lib/client/client.gen";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("@/lib/client/sdk.gen", () => ({
  readUserMeApiV1UsersMeGet: vi.fn(),
}));

vi.mock("@/lib/client/client.gen", () => ({
  client: {
    setConfig: vi.fn(),
  },
}));

const TestComponent = () => {
  const { user, login, logout, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="user">{user ? user.email : "no user"}</div>
      <button onClick={() => login("fake-token")}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  const mockPush = vi.fn();
  const mockUser = { email: "test@example.com", id: 1 };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (usePathname as any).mockReturnValue("/");
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects to /login if no token and not at /login", async () => {
    (usePathname as any).mockReturnValue("/dashboard");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("loads user if token exists in localStorage", async () => {
    localStorage.setItem("token", "valid-token");
    (readUserMeApiV1UsersMeGet as any).mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe(mockUser.email);
    });

    expect(client.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { Authorization: "Bearer valid-token" },
      }),
    );
  });

  it("logs out and redirects to /login if token is invalid", async () => {
    localStorage.setItem("token", "invalid-token");
    (readUserMeApiV1UsersMeGet as any).mockResolvedValue({ data: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("handles login successfully", async () => {
    (usePathname as any).mockReturnValue("/login");
    (readUserMeApiV1UsersMeGet as any).mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // We need to wait for initial loading to finish
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).toBeNull();
    });

    const loginButton = screen.getByText("Login");
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("fake-token");
      expect(screen.getByTestId("user").textContent).toBe(mockUser.email);
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("handles logout successfully", async () => {
    localStorage.setItem("token", "valid-token");
    (readUserMeApiV1UsersMeGet as any).mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe(mockUser.email);
    });

    const logoutButton = screen.getByText("Logout");
    await act(async () => {
      logoutButton.click();
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
