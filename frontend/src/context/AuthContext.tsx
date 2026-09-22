import { createContext, useContext, useEffect, useState } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  society: string | null;
  flat: string | null;
  isVerified: boolean;
  applicationStatus?: string;
}

interface Session {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType {
  session: Session;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  const refreshSession = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/users/get-data", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        setSession({
          user: null,
          isAuthenticated: false,
          loading: false,
        });

        return;
      }

      const data = await response.json();
      setSession({
        user: data.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      console.error("Session check failed:", error);

      setSession({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
