import { Bell, LogOut, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

import { UserAvatar } from "../../UserAvatar"
import { useAuth } from "../../../context/AuthContext";
import { useLogout } from "../../../lib/useLogout";

interface TopbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  "/secretary/dashboard": "Dashboard",
  "/secretary/residents": "Residents",
  "/secretary/flats": "Flats",
  "/secretary/security": "Security Guards",
  "/secretary/security-attendance": "Guard Attendance",
  "/secretary/maintenance-billing": "Maintenance Billing",
  "/secretary/complaints": "Complaints",
  "/secretary/visitors": "Visitors",
  "/secretary/notices": "Notice Board",
  "/secretary/analytics": "Society Analytics",

  "/security/dashboard": "Dashboard",
  "/security/visitors": "Visitors",
  "/security/history": "Visitor History",
  "/security/attendance": "My Attendance",
  "/security/profile": "My Profile",

  "/resident/dashboard": "Dashboard",
  "/resident/visitors": "My Visitors",
  "/resident/complaints": "Complaints",
  "/resident/flat": "My Flat",
  "/resident/maintenance": "My Maintenance",
  "/resident/marketplace": "Society Marketplace",
  "/resident/notices": "Notice Board",

  "/maintenance/dashboard": "Dashboard",
  "/maintenance/complaints": "Assigned Complaints",
  "/maintenance/completed": "Completed Work",

  "/profile": "My Profile",
  "/settings": "Settings",
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { session } = useAuth();
  const { logout, isLoggingOut, logoutError } = useLogout();
  const location = useLocation();

  const pageTitle = location.pathname.startsWith("/resident/notices/")
    ? "Notice Details"
    : pageTitles[location.pathname] || "SafeSync";

  return (
    <header className="relative flex h-20 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">

      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-lg font-semibold text-[#08090A]">
            {pageTitle}
          </h2>

          <p className="hidden text-xs text-gray-500 sm:block">
            Welcome to SafeSync
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">

        <button
          className="relative rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#0C8C5E]" />
        </button>

        <button
          type="button"
          onClick={() => void logout()}
          disabled={isLoggingOut}
          aria-label={isLoggingOut ? "Logging out" : "Log out"}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#0C8C5E]/25 bg-white px-3 text-sm font-medium text-[#083D33] transition-colors hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">{isLoggingOut ? "Logging out…" : "Log out"}</span>
        </button>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-800">
              {session.user?.name}
            </p>

            <p className="text-xs text-gray-500">
              {session.user?.role?.replace("_", " ")}
            </p>
          </div>

          <UserAvatar
            name={session.user?.name}
            size="md"
          />
        </div>

      </div>

      {logoutError && <p role="alert" className="absolute right-4 top-[calc(100%+4px)] z-10 max-w-[min(320px,calc(100vw-32px))] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 shadow-sm">{logoutError}</p>}
    </header>
  );
}
