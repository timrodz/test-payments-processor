import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { SuperuserHomeFeature } from "./superuser-home-feature";

describe("SuperuserHomeFeature", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the admin dashboard with management cards", () => {
    render(<SuperuserHomeFeature />);

    expect(screen.getByText(/Admin Dashboard/i)).toBeDefined();
    // Using more specific text matching to avoid the description text
    expect(
      screen.getByText("Manage Trips", {
        selector: '[data-slot="card-title"]',
      }),
    ).toBeDefined();
    expect(
      screen.getByText("Manage Schools", {
        selector: '[data-slot="card-title"]',
      }),
    ).toBeDefined();

    expect(screen.getByRole("link", { name: /View Trips/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /View Schools/i })).toBeDefined();
  });
});
