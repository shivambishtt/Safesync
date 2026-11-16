import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {UserAvatar} from "../components/UserAvatar";

export default function Navbar() {
  const { session, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/users/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed. Please try again.");
      }

      await refreshSession();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Logout failed. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link className="navbar-logo" to="/">
          SafeSync
        </Link>

        <nav className="navbar-links">
          <Link to="/" className="navbar-link">
            Home
          </Link>

          <a href="#features" className="navbar-link">
            Features
          </a>

          <Link to="/about" className="navbar-link">
            About Us
          </Link>
        </nav>

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
              <Link to="/dashboard">
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
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label={isLoggingOut ? "Logging out" : "Log out"}
                className="navbar-logout"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">
                  {isLoggingOut ? "Logging out…" : "Log out"}
                </span>
              </button>
            </div>
          )}
          {logoutError && (
            <p role="alert" className="navbar-error">
              {logoutError}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
