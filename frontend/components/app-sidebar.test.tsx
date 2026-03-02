import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/providers/auth-context";
import { usePathname } from "next/navigation";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// Mock the Sidebar UI components to keep things simple
vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: any) => <aside>{children}</aside>,
  SidebarContent: ({ children }: any) => <nav>{children}</nav>,
  SidebarFooter: ({ children }: any) => <footer>{children}</footer>,
  SidebarHeader: ({ children }: any) => <header>{children}</header>,
  SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
  SidebarMenuButton: ({ children, onClick, isActive }: any) => (
    <button onClick={onClick} data-active={isActive}>
      {children}
    </button>
  ),
  SidebarRail: () => null,
}));

describe("AppSidebar", () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as any).mockReturnValue("/");
    (useAuth as any).mockReturnValue({
      user: { is_superuser: false },
      logout: mockLogout,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders basic navigation items for regular users", () => {
    render(<AppSidebar />);
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Trips")).toBeDefined();
    // Should NOT show Schools
    expect(screen.queryByText("Schools")).toBeNull();
  });

  it("renders extra navigation items for superusers", () => {
    (useAuth as any).mockReturnValue({
      user: { is_superuser: true },
      logout: mockLogout,
    });
    render(<AppSidebar />);
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Trips")).toBeDefined();
    expect(screen.getByText("Schools")).toBeDefined();
  });

  it("calls logout when logout button is clicked", () => {
    render(<AppSidebar />);
    const logoutButton = screen.getByText("Logout");
    logoutButton.click();
    expect(mockLogout).toHaveBeenCalled();
  });

  it("marks the active item based on pathname", () => {
    (usePathname as any).mockReturnValue("/trips");
    render(<AppSidebar />);

    // The button wrapping "Trips" should be active
    const tripsButton = screen.getByText("Trips").closest("button");
    expect(tripsButton?.getAttribute("data-active")).toBe("true");

    const homeButton = screen.getByText("Home").closest("button");
    expect(homeButton?.getAttribute("data-active")).toBe("false");
  });
});
