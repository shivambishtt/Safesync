import { Bell, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

import { UserAvatar } from "../../UserAvatar"
import { useAuth } from "../../../context/AuthContext";

interface TopbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  "/secretary/dashboard": "Dashboard",
  "/secretary/residents": "Residents",
  "/secretary/flats": "Flats",
  "/secretary/security": "Security Guards",
  "/secretary/complaints": "Complaints",
  "/secretary/visitors": "Visitors",

  "/security/dashboard": "Dashboard",
  "/security/visitors": "Visitors",
  "/security/history": "Visitor History",
  "/security/profile": "My Profile",

  "/resident/dashboard": "Dashboard",
  "/resident/visitors": "My Visitors",
  "/resident/complaints": "Complaints",
  "/resident/flat": "My Flat",

  "/maintenance/dashboard": "Dashboard",
  "/maintenance/complaints": "Assigned Complaints",
  "/maintenance/completed": "Completed Work",

  "/profile": "My Profile",
  "/settings": "Settings",
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { session } = useAuth();
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || "SafeSync";

  return (
    <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">

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
    </header>
  );
}
