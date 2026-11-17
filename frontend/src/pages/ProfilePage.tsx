import { useEffect, useState } from "react";
import type { FormEvent } from "react";
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
      <span className="mt-0.5 text-[#0C8C5E]">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-medium text-gray-900">
          {value}
        </p>
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
  const { session, refreshSession } = useAuth();
  const user = session.user;
  const [societyName, setSocietyName] = useState("Loading society…");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailPending, setEmailPending] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setPhoneNumber(user?.phoneNumber ?? "");
  }, [user?.name, user?.phoneNumber]);

  async function sendJson(
    path: string,
    payload: Record<string, string>,
    auth = false,
  ) {
    const response = await fetch(
      `${auth ? "http://localhost:3000/api/auth/users" : API_BASE_URL}${path}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const result = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
    };
    if (!response.ok || !result.success)
      throw new Error(result.message || `Request failed (${response.status})`);
    return result;
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setPageError("");
    setFeedback("");
    try {
      const response = await fetch(`${API_BASE_URL}/users/update`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phoneNumber }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };
      if (!response.ok || !result.success)
        throw new Error(result.message || "Could not update profile.");
      await refreshSession();
      setFeedback("Your profile details were saved.");
      setEditing(false);
    } catch (cause) {
      setPageError(
        cause instanceof Error ? cause.message : "Could not update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestEmailChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailBusy(true);
    setPageError("");
    setFeedback("");
    try {
      await sendJson("/users/email-change/request", {
        email: newEmail,
        currentPassword: emailPassword,
      });
      setEmailPending(true);
      setFeedback(
        "We sent a 6 digit verification code to your new email address.",
      );
    } catch (cause) {
      setPageError(
        cause instanceof Error
          ? cause.message
          : "Could not request an email change.",
      );
    } finally {
      setEmailBusy(false);
    }
  }

  async function handleVerifyEmailChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailBusy(true);
    setPageError("");
    setFeedback("");
    try {
      await sendJson("/users/email-change/verify", { code: emailCode });
      await refreshSession();
      setEmailOpen(false);
      setEmailPending(false);
      setNewEmail("");
      setEmailPassword("");
      setEmailCode("");
      setFeedback("Your email address was verified and updated.");
    } catch (cause) {
      setPageError(
        cause instanceof Error
          ? cause.message
          : "Could not verify your email address.",
      );
    } finally {
      setEmailBusy(false);
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setPageError("The new passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    setPageError("");
    setFeedback("");
    try {
      await sendJson(
        "/change-password",
        { currentPassword, newPassword },
        true,
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOpen(false);
      setFeedback("Your password was changed.");
    } catch (cause) {
      setPageError(
        cause instanceof Error ? cause.message : "Could not change password.",
      );
    } finally {
      setPasswordBusy(false);
    }
  }

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
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Your account and society details.
        </p>
      </header>

      {pageError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {pageError}
        </div>
      )}
      {feedback && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {feedback}
        </div>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <UserAvatar name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {user.role.replaceAll("_", " ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${user.isVerified ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
          >
            <BadgeCheck size={14} />{" "}
            {user.isVerified ? "Verified" : "Not verified"}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${user.isActive === false ? "bg-red-50 text-red-800" : "bg-gray-100 text-gray-700"}`}
          >
            <ShieldCheck size={14} />{" "}
            {user.isActive === false ? "Inactive" : "Active"}
          </span>
        </div>
      </section>

      <section
        aria-label="Profile details"
        className="grid gap-3 sm:grid-cols-2"
      >
        <ProfileField
          label="Full name"
          value={user.name || "—"}
          icon={UserRound}
        />
        <ProfileField
          label="Email address"
          value={user.email || "—"}
          icon={Mail}
        />
        <ProfileField
          label="Phone number"
          value={user.phoneNumber || "—"}
          icon={Phone}
        />
        <ProfileField
          label="Role"
          value={user.role.replaceAll("_", " ")}
          icon={ShieldCheck}
        />
        <ProfileField label="Society" value={societyName} icon={Building2} />
        <ProfileField
          label="Flat assignment"
          value={user.flat ? "Flat assigned" : "No flat assigned"}
          icon={Building2}
        />
        <ProfileField
          label="Application status"
          value={user.applicationStatus?.replaceAll("_", " ") || "Accepted"}
          icon={BadgeCheck}
        />
        <ProfileField
          label="Account created"
          value={formatDate(user.createdAt)}
          icon={CalendarDays}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Personal details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Update the contact details on your account.
            </p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setPageError("");
                setEditing(true);
              }}
              className="h-9 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Edit details
            </button>
          )}
        </div>
        {editing && (
          <form
            onSubmit={handleProfileSave}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="space-y-1.5 text-sm font-medium text-gray-700">
              Full name
              <input
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 font-normal outline-none focus:border-[#0C8C5E]"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-gray-700">
              Phone number
              <input
                required
                pattern="[6-9][0-9]{9}"
                title="Enter a valid 10 digit Indian mobile number"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 font-normal outline-none focus:border-[#0C8C5E]"
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button
                disabled={saving}
                className="h-10 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white hover:bg-[#08764F] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save details"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(user.name);
                  setPhoneNumber(user.phoneNumber);
                  setEditing(false);
                }}
                className="h-10 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Email address</p>
            <p className="mt-1 text-sm text-gray-500">
              {user.email} · verified changes require your password and a code
              sent to the new address
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPageError("");
              setEmailPending(false);
              setEmailOpen((value) => !value);
            }}
            className="h-9 shrink-0 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Change email
          </button>
        </div>
        {emailOpen && (
          <form
            onSubmit={
              emailPending ? handleVerifyEmailChange : handleRequestEmailChange
            }
            className="grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2"
          >
            {!emailPending ? (
              <>
                <label className="space-y-1.5 text-sm font-medium text-gray-700">
                  New email
                  <input
                    required
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-normal"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-gray-700">
                  Current password
                  <input
                    required
                    type="password"
                    value={emailPassword}
                    onChange={(event) => setEmailPassword(event.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-normal"
                  />
                </label>
              </>
            ) : (
              <label className="space-y-1.5 text-sm font-medium text-gray-700 sm:col-span-2">
                6 digit verification code
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-normal sm:max-w-xs"
                />
              </label>
            )}
            <button
              disabled={emailBusy}
              className="h-10 w-fit rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {emailBusy
                ? "Working…"
                : emailPending
                  ? "Verify new email"
                  : "Send verification code"}
            </button>
          </form>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Password</h2>
            <p className="mt-1 text-sm text-gray-500">
              Change your password using your current password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPageError("");
              setPasswordOpen((value) => !value);
            }}
            className="h-9 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {passwordOpen ? "Cancel" : "Change password"}
          </button>
        </div>
        {passwordOpen && (
          <form
            onSubmit={handlePasswordChange}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="space-y-1.5 text-sm font-medium text-gray-700">
              Current password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 font-normal"
              />
            </label>
            <span />
            <label className="space-y-1.5 text-sm font-medium text-gray-700">
              New password
              <input
                required
                minLength={6}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 font-normal"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-gray-700">
              Confirm new password
              <input
                required
                minLength={6}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 font-normal"
              />
            </label>
            <button
              disabled={passwordBusy}
              className="h-10 w-fit rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {passwordBusy ? "Changing…" : "Update password"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
