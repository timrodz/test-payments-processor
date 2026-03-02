import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import LoginPage from "./page";

vi.mock("@/features/login/login-form-feature", () => ({
  LoginFormFeature: () => <div data-testid="login-form" />,
}));

describe("LoginPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the login page with the login form", () => {
    render(<LoginPage />);
    expect(screen.getByText(/Welcome/i)).toBeDefined();
    expect(screen.getByTestId("login-form")).toBeDefined();
  });
});
