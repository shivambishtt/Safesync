import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Signup from "./components/Signup.tsx";
import Login from "./components/Login.tsx";
import { Toaster } from "./components/ui/toast.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import DashboardLayout from "./components/ui/layout/DashboardLayout.tsx";
import SecretaryDashboard from "./pages/secretary/SecretaryDashboard.tsx";
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.tsx";
import SecretarySectionPage from "./pages/secretary/SecretarySectionPage.tsx";

function SecretaryDashboardRoute() {
  const { session } = useAuth();

  if (session.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F2F2] text-sm text-gray-600">
        Loading your dashboard...
      </div>
    );
  }

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (session.user?.role !== "SECRETARY") {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/secretary",
    element: <SecretaryDashboardRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <SecretaryDashboard />,
      },
      {
        path: "residents",
        element: <SecretarySectionPage section="residents" />,
      },
      {
        path: "flats",
        element: <SecretarySectionPage section="flats" />,
      },
      {
        path: "security",
        element: <SecretarySectionPage section="security" />,
      },
      {
        path: "complaints",
        element: <SecretarySectionPage section="complaints" />,
      },
      {
        path: "visitors",
        element: <SecretarySectionPage section="visitors" />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <Toaster />
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
