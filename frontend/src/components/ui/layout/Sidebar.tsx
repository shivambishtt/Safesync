import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  ClipboardList,
  UserRoundCheck,
  UserRound,
  CheckCircle2,
  Settings,
  X,
  Megaphone,
  CalendarCheck,
  Store,
  Wallet,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";


interface SidebarProps {
  onClose?: () => void;
}

const navigation = {
  SECRETARY: [
    { name: "Overview", path: "/secretary/dashboard", icon: LayoutDashboard },
    { name: "Residents", path: "/secretary/residents", icon: Users },
    { name: "Flats", path: "/secretary/flats", icon: Building2 },
    { name: "Security Guards", path: "/secretary/security", icon: Shield },
    { name: "Guard Attendance", path: "/secretary/security-attendance", icon: CalendarCheck },
    { name: "Maintenance Billing", path: "/secretary/maintenance-billing", icon: Wallet },
    { name: "Complaints", path: "/secretary/complaints", icon: ClipboardList },
    { name: "Visitors", path: "/secretary/visitors", icon: UserRoundCheck },
    { name: "Notice Board", path: "/secretary/notices", icon: Megaphone },
    { name: "Profile", path: "/profile", icon: UserRound },
  ],

  SECURITY: [
    { name: "Overview", path: "/security/dashboard", icon: LayoutDashboard },
    { name: "Visitors", path: "/security/visitors", icon: UserRoundCheck },
    { name: "Visitor History", path: "/security/history", icon: ClipboardList },
    { name: "My Attendance", path: "/security/attendance", icon: CalendarCheck },
    { name: "Profile", path: "/profile", icon: UserRound },
  ],

  RESIDENT: [
    { name: "Overview", path: "/resident/dashboard", icon: LayoutDashboard },
    { name: "My Visitors", path: "/resident/visitors", icon: UserRoundCheck },
    { name: "Complaints", path: "/resident/complaints", icon: ClipboardList },
    { name: "Notice Board", path: "/resident/notices", icon: Megaphone },
    { name: "My Flat", path: "/resident/flat", icon: Building2 },
    { name: "Maintenance", path: "/resident/maintenance", icon: Wallet },
    { name: "Marketplace", path: "/resident/marketplace", icon: Store },
    { name: "Profile", path: "/profile", icon: UserRound },
  ],

  MAINTENANCE: [
    { name: "Overview", path: "/maintenance/dashboard", icon: LayoutDashboard },
    { name: "Assigned Complaints", path: "/maintenance/complaints", icon: ClipboardList },
    { name: "Completed Work", path: "/maintenance/completed", icon: CheckCircle2 },
    { name: "Profile", path: "/profile", icon: UserRound },
  ],
};

export default function Sidebar({ onClose }: SidebarProps) {
  const { session } = useAuth();

  const role = session.user?.role as keyof typeof navigation;
  const menuItems = navigation[role] ?? [];

  return (
    <aside className="flex h-full w-[250px] flex-col bg-[#083D33] text-white">

      {/* Logo */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Safe<span className="text-[#0C8C5E]">Sync</span>
        </h1>

        {onClose && (
          <button onClick={onClose} className="lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-white/40">
          Workspace
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path !== "/resident/notices"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#0C8C5E] text-white shadow-sm"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-4">
        <NavLink
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-white/65 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Settings size={19} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
