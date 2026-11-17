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
import SecurityDashboard from "./pages/security/SecurityDashboard.tsx";
import SecurityVisitorsPage, {
  SecurityVisitorHistoryPage,
} from "./pages/security/SecurityVisitorsPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import ResidentDashboard from "./pages/resident/ResidentDashboard.tsx";
import ResidentVisitorsPage from "./pages/resident/ResidentVisitorsPage.tsx";
import ResidentComplaintsPage from "./pages/resident/ResidentComplaintsPage.tsx";
import ResidentFlatPage from "./pages/resident/ResidentFlatPage.tsx";
import MaintenanceDashboard from "./pages/maintenance/MaintenanceDashboard.tsx";
import MaintenanceComplaintsPage from "./pages/maintenance/MaintenanceComplaintsPage.tsx";
import MaintenanceCompletedPage from "./pages/maintenance/MaintenanceCompletedPage.tsx";
import SecretaryNoticesPage from "./pages/notices/SecretaryNoticesPage.tsx";
import ResidentNoticesPage, {
  ResidentNoticeDetailPage,
} from "./pages/notices/ResidentNoticesPage.tsx";
import SecurityAttendancePage from "./pages/security/SecurityAttendancePage.tsx";
import SecretaryAttendancePage from "./pages/secretary/SecretaryAttendancePage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import ResidentMarketplacePage from "./pages/resident/ResidentMarketplacePage.tsx";
import SecretaryMaintenanceBillingPage from "./pages/maintenanceBilling/SecretaryMaintenanceBillingPage.tsx";
import ResidentMaintenanceBillsPage from "./pages/maintenanceBilling/ResidentMaintenanceBillsPage.tsx";

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

function SecurityDashboardRoute() {
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

  if (session.user?.role !== "SECURITY") {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout />;
}

function ResidentDashboardRoute() {
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

  if (session.user?.role !== "RESIDENT") {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout />;
}

function MaintenanceDashboardRoute() {
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

  if (session.user?.role !== "MAINTENANCE") {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout />;
}

function AuthenticatedDashboardRoute() {
  const { session } = useAuth();

  if (session.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F2F2] text-sm text-gray-600">
        Loading your profile...
      </div>
    );
  }

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
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
    path: "/about",
    element: <AboutPage />,
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
        path: "security-attendance",
        element: <SecretaryAttendancePage />,
      },
      {
        path: "maintenance-billing",
        element: <SecretaryMaintenanceBillingPage />,
      },
      {
        path: "complaints",
        element: <SecretarySectionPage section="complaints" />,
      },
      {
        path: "visitors",
        element: <SecretarySectionPage section="visitors" />,
      },
      {
        path: "notices",
        element: <SecretaryNoticesPage />,
      },
    ],
  },
  {
    path: "/security",
    element: <SecurityDashboardRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <SecurityDashboard />,
      },
      {
        path: "visitors",
        element: <SecurityVisitorsPage />,
      },
      {
        path: "history",
        element: <SecurityVisitorHistoryPage />,
      },
      {
        path: "attendance",
        element: <SecurityAttendancePage />,
      },
    ],
  },
  {
    path: "/resident",
    element: <ResidentDashboardRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <ResidentDashboard />,
      },
      {
        path: "visitors",
        element: <ResidentVisitorsPage />,
      },
      {
        path: "complaints",
        element: <ResidentComplaintsPage />,
      },
      {
        path: "flat",
        element: <ResidentFlatPage />,
      },
      {
        path: "maintenance",
        element: <ResidentMaintenanceBillsPage />,
      },
      {
        path: "marketplace",
        element: <ResidentMarketplacePage />,
      },
      {
        path: "notices",
        element: <ResidentNoticesPage />,
      },
      {
        path: "notices/:noticeId",
        element: <ResidentNoticeDetailPage />,
      },
    ],
  },
  {
    path: "/maintenance",
    element: <MaintenanceDashboardRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <MaintenanceDashboard />,
      },
      {
        path: "complaints",
        element: <MaintenanceComplaintsPage />,
      },
      {
        path: "completed",
        element: <MaintenanceCompletedPage />,
      },
    ],
  },
  {
    path: "/profile",
    element: <AuthenticatedDashboardRoute />,
    children: [
      {
        index: true,
        element: <ProfilePage />,
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
