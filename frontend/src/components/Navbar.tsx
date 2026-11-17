import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserAvatar } from "../components/UserAvatar";
import { useLogout } from "../lib/useLogout";

const dashboardPaths: Record<string, string> = {
  SUPER_ADMIN: "/super-admin/dashboard",
  SECRETARY: "/secretary/dashboard",
  RESIDENT: "/resident/dashboard",
  SECURITY: "/security/dashboard",
  MAINTENANCE: "/maintenance/dashboard",
};

export default function Navbar() {
  const { session } = useAuth();
  const { logout, isLoggingOut, logoutError } = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dashboardPath = dashboardPaths[session.user?.role ?? ""] ?? "/";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link className="navbar-logo" to="/">
          SafeSync
        </Link>

        <nav className="navbar-links" aria-label="Main navigation">
          <Link to="/" className="navbar-link" onClick={closeMobileMenu}>
            Home
          </Link>

          <Link
            to="/#features"
            className="navbar-link"
            onClick={closeMobileMenu}
          >
            Features
          </Link>

          <Link to="/about" className="navbar-link" onClick={closeMobileMenu}>
            About Us
          </Link>
        </nav>

        <button
          type="button"
          className="navbar-menu-toggle"
          aria-label={
            mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="navbar-right">
          {!session.isAuthenticated ? (
            <div className="navbar-actions">
              <Link to="/signup">
                <Button className="btn-filled bg-gray-700">Signup</Button>
              </Link>

              <Link to="/login">
                <Button className="btn-filled bg-[#0c8c5e] text-black">
                  Login
                </Button>
              </Link>
            </div>
          ) : (
            <div className="navbar-actions">
              <button
                type="button"
                onClick={() => void logout()}
                disabled={isLoggingOut}
                aria-label={isLoggingOut ? "Logging out" : "Log out"}
                className="navbar-logout"
              >
                <LogOut size={16} />
                <span className="navbar-logout-label">
                  {isLoggingOut ? "Logging out…" : "Log out"}
                </span>
              </button>

              <Link to={dashboardPath}>
                <Button className="btn-filled bg-[#0c8c5e] text-black">
                  Dashboard
                </Button>
              </Link>

              <Link
                to="/profile"
                aria-label="View profile"
                title={session.user?.name}
              >
                <UserAvatar name={session.user?.name} size="md" />
              </Link>
            </div>
          )}
          {logoutError && (
            <p role="alert" className="navbar-error">
              {logoutError}
            </p>
          )}
        </div>

        {mobileMenuOpen && (
          <nav className="navbar-mobile-panel" aria-label="Mobile navigation">
            <Link to="/" onClick={closeMobileMenu}>
              Home
            </Link>
            <Link to="/#features" onClick={closeMobileMenu}>
              Features
            </Link>
            <Link to="/about" onClick={closeMobileMenu}>
              About Us
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
