import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function useLogout() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function logout() {
    setIsLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("http://localhost:3000/api/auth/users/logout", {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Logout failed. Please try again.");

      await refreshSession();
      navigate("/login", { replace: true });
    } catch (cause) {
      setLogoutError(cause instanceof Error ? cause.message : "Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return { logout, isLoggingOut, logoutError, clearLogoutError: () => setLogoutError("") };
}
