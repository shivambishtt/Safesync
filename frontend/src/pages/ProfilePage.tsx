import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserAvatar } from "../components/UserAvatar";

const API_BASE_URL = "http://localhost:3000/api/v1";

function ProfileField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <span className="mt-0.5 text-[#0C8C5E]"><Icon size={18} /></span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(date);
}

export default function ProfilePage() {
  const { session } = useAuth();
  const user = session.user;
  const [societyName, setSocietyName] = useState("Loading society…");

  useEffect(() => {
    if (!user?.society) {
      setSocietyName("Not assigned");
      return;
    }

    let current = true;
    fetch(`${API_BASE_URL}/users/societies`, { credentials: "include" })
      .then(async (response) => {
        const result = (await response.json()) as {
          success: boolean;
          message?: string;
          checkUser?: { society?: { name?: string } | null };
        };

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Could not load society details.");
        }

        return result.checkUser?.society?.name || "Society name unavailable";
      })
      .then((name) => {
        if (current) setSocietyName(name);
      })
      .catch(() => {
        if (current) {
          setSocietyName("Society name unavailable");
        }
      });

    return () => {
      current = false;
    };
  }, [user?._id, user?.society]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">Account</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Your account and society details.</p>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <UserAvatar name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
          <p className="mt-1 text-sm text-gray-500">{user.role.replaceAll("_", " ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${user.isVerified ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
            <BadgeCheck size={14} /> {user.isVerified ? "Verified" : "Not verified"}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${user.isActive === false ? "bg-red-50 text-red-800" : "bg-gray-100 text-gray-700"}`}>
            <ShieldCheck size={14} /> {user.isActive === false ? "Inactive" : "Active"}
          </span>
        </div>
      </section>

      <section aria-label="Profile details" className="grid gap-3 sm:grid-cols-2">
        <ProfileField label="Full name" value={user.name || "—"} icon={UserRound} />
        <ProfileField label="Email address" value={user.email || "—"} icon={Mail} />
        <ProfileField label="Phone number" value={user.phoneNumber || "—"} icon={Phone} />
        <ProfileField label="Role" value={user.role.replaceAll("_", " ")} icon={ShieldCheck} />
        <ProfileField label="Society" value={societyName} icon={Building2} />
        <ProfileField label="Flat assignment" value={user.flat ? "Flat assigned" : "No flat assigned"} icon={Building2} />
        <ProfileField label="Application status" value={user.applicationStatus?.replaceAll("_", " ") || "Accepted"} icon={BadgeCheck} />
        <ProfileField label="Account created" value={formatDate(user.createdAt)} icon={CalendarDays} />
      </section>
    </div>
  );
}
