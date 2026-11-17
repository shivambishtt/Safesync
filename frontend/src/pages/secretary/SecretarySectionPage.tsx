import { useEffect, useState } from "react";
import {
  Building2,
  ClipboardList,
  Shield,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "http://localhost:3000/api/v1";

type Section = "residents" | "flats" | "security" | "complaints" | "visitors";

interface Flat {
  _id: string;
  flatNumber: string;
  block: string;
  floor: number;
  flatType: string;
  flatStatus: string;
}

interface Visitor {
  _id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  purpose: string;
  visitStatus: string;
  createdAt: string;
  updatedAt?: string;
  checkInTime?: string | null;
  checkoutTime?: string | null;
  visitTo?: { flatNumber?: string; block?: string } | null;
  resident?: { name?: string; email?: string; phoneNumber?: string } | null;
  allowedBy?: { name?: string } | null;
}

interface Complaint {
  _id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  flat?: { flatNumber?: string; block?: string } | null;
  registeredBy?: { name?: string; email?: string } | null;
  assignedTo?: { name?: string } | null;
  resolvedBy?: { name?: string } | null;
}

interface ComplaintAssignmentResponse {
  success: boolean;
  message?: string;
}

interface SecurityGuard {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  isActive?: boolean;
  isVerified?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  flats?: T;
  visitors?: T;
  complaints?: T;
  complaint?: T;
  guards?: T;
}

interface TableRow {
  id: string;
  cells: string[];
}

const sectionContent: Record<
  Section,
  { title: string; description: string; icon: typeof Users; columns: string[] }
> = {
  residents: {
    title: "Residents",
    description: "Resident accounts and their assigned flats.",
    icon: Users,
    columns: ["Resident", "Block", "Flat", "Email", "Phone"],
  },
  flats: {
    title: "Flats",
    description: "Flats registered in your society and their occupancy status.",
    icon: Building2,
    columns: ["Flat", "Block", "Floor", "Type", "Status"],
  },
  security: {
    title: "Security Guards",
    description: "Security staff assigned to your society.",
    icon: Shield,
    columns: ["Name", "Email", "Phone", "Status"],
  },
  complaints: {
    title: "Complaints",
    description: "Recent issues submitted by residents in your society.",
    icon: ClipboardList,
    columns: [
      "Complaint",
      "Reported By",
      "Flat",
      "Category",
      "Priority",
      "Status",
      "Assigned To",
      "Created",
      "Resolved At",
      "Resolved By",
    ],
  },
  visitors: {
    title: "Visitors",
    description: "Recent visitor activity across your society.",
    icon: UserRoundCheck,
    columns: [
      "Visitor",
      "Phone",
      "Email",
      "Resident",
      "Block",
      "Flat",
      "Purpose",
      "Current Status",
      "Approved By",
      "Check In",
      "Check Out",
      "Last Updated",
    ],
  },
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
  });
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result as T;
}

async function assignAvailableStaffToUnassignedComplaints(
  complaints: Complaint[],
) {
  let assignedCount = 0;
  let noStaffAvailable = false;

  for (const complaint of complaints) {
    if (complaint.status !== "PENDING" && complaint.status !== "OPEN") continue;

    const response = await fetch(
      `${API_BASE_URL}/complaints/${complaint._id}/assign`,
      { method: "POST", credentials: "include" },
    );
    const result = (await response.json()) as ComplaintAssignmentResponse;

    if (response.ok && result.success) {
      assignedCount += 1;
      continue;
    }

    if (
      response.status === 409 &&
      result.message === "No staff available for this complaint at the moment"
    ) {
      noStaffAvailable = true;
      break;
    }

    // Another request may have assigned this complaint while the page loaded.
    if (response.status === 409) continue;

    throw new Error(
      result.message || `Could not assign complaint (${response.status})`,
    );
  }

  return { assignedCount, noStaffAvailable };
}

function displayDate(value?: string | number | Date | null) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === 0 ||
    value === "0"
  ) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function pretty(value: string | undefined) {
  return (
    value
      ?.toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "—"
  );
}

export default function SecretarySectionPage({
  section,
}: {
  section: Section;
}) {
  const { session } = useAuth();
  const societyId = session.user?.society;
  const content = sectionContent[section];
  const Icon = content.icon;
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let current = true;

    const load = async () => {
      setLoading(true);
      setError("");
      setNotice("");
      setRows([]);

      try {
        if (!societyId && section !== "visitors") {
          throw new Error("Your account is not linked to a society yet.");
        }

        let nextRows: TableRow[] = [];

        if (section === "security") {
          const result =
            await getJson<ApiResponse<SecurityGuard[]>>("/security/guards");
          nextRows = (result.guards ?? []).map((guard) => ({
            id: guard._id,
            cells: [
              guard.name,
              guard.email,
              guard.phoneNumber,
              guard.isActive === false
                ? "Inactive"
                : guard.isVerified
                  ? "Verified"
                  : "Pending verification",
            ],
          }));
        } else if (section === "flats") {
          const result = await getJson<ApiResponse<Flat[]>>(
            `/societies/${societyId}/flats`,
          );
          nextRows = (result.flats ?? []).map((flat) => ({
            id: flat._id,
            cells: [
              flat.flatNumber,
              flat.block,
              String(flat.floor),
              flat.flatType,
              pretty(flat.flatStatus),
            ],
          }));
        } else if (section === "residents") {
          const result = await getJson<
            ApiResponse<
              Array<{
                _id: string;
                flatNumber: string;
                block: string;
                owner?: { name?: string; email?: string; phoneNumber?: string };
              }>
            >
          >(`/users/societies/${societyId}/residents`);
          nextRows = (result.flats ?? []).map((flat) => ({
            id: flat._id,
            cells: [
              flat.owner?.name || "—",
              flat.block || "—",
              flat.flatNumber || "—",
              flat.owner?.email || "—",
              flat.owner?.phoneNumber || "—",
            ],
          }));
        } else if (section === "visitors") {
          const result = await getJson<ApiResponse<Visitor[]>>("/");
          nextRows = (result.visitors ?? []).slice(0, 50).map((visitor) => ({
            id: visitor._id,
            cells: [
              visitor.name,
              visitor.phoneNumber || "—",
              visitor.email || "—",
              visitor.resident?.name || "—",
              `${visitor.visitTo?.block || ""}`,
              `${visitor.visitTo?.flatNumber || "—"}`.trim(),
              pretty(visitor.purpose),
              pretty(visitor.visitStatus),
              visitor.allowedBy?.name || "—",
              displayDate(visitor.checkInTime),
              displayDate(visitor.checkoutTime),
              displayDate(visitor.updatedAt || visitor.createdAt),
            ],
          }));
        } else if (section === "complaints") {
          let list = await getJson<ApiResponse<Complaint[]>>(
            `/societies/complaints/${societyId}`,
          );
          let complaints = list.complaints ?? [];

          // Visiting the Secretary complaints page auto-assigns pending/open
          // complaints through the backend's secretary-only assignment endpoint.
          const { assignedCount, noStaffAvailable } =
            await assignAvailableStaffToUnassignedComplaints(complaints);

          if (assignedCount > 0) {
            list = await getJson<ApiResponse<Complaint[]>>(
              `/societies/complaints/${societyId}`,
            );
            complaints = list.complaints ?? [];
          }

          if (assignedCount > 0 || noStaffAvailable) {
            const assignmentNotice =
              assignedCount > 0
                ? `Automatically assigned ${assignedCount} complaint${assignedCount === 1 ? "" : "s"} to available maintenance staff.`
                : "No maintenance staff are available right now. Pending complaints remain unassigned.";
            if (current) setNotice(assignmentNotice);
          }

          nextRows = complaints.map((complaint) => ({
            id: complaint._id,
            cells: [
              complaint.title,
              complaint.registeredBy?.name || "—",
              `${complaint.flat?.block || ""} ${complaint.flat?.flatNumber || "—"}`.trim(),
              pretty(complaint.category),
              pretty(complaint.priority),
              pretty(complaint.status),
              complaint.assignedTo?.name || "—",
              displayDate(complaint.createdAt),
              complaint.resolvedAt ? displayDate(complaint.resolvedAt) : "—",
              complaint.resolvedBy?.name || "—",
            ],
          }));
        }

        if (current) setRows(nextRows);
      } catch (cause) {
        if (current) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load this section.",
          );
        }
      } finally {
        if (current) setLoading(false);
      }
    };

    void load();
    return () => {
      current = false;
    };
  }, [section, societyId]);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0C8C5E]/10 text-[#0C8C5E]">
          <Icon size={23} strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-sm font-medium text-[#0C8C5E]">
            Secretary workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
            {content.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{content.description}</p>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {notice && (
          <div
            role="status"
            className="m-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}
        {error ? (
          <div
            role="alert"
            className="m-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {error}
          </div>
        ) : loading ? (
          <div
            className="space-y-3 p-6"
            aria-label={`Loading ${content.title.toLowerCase()}`}
          >
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-10 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-800">
              No {content.title.toLowerCase()} found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Records will appear here when they are available.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  {content.columns.map((column) => (
                    <th key={column} className="px-5 py-3.5">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="text-gray-700 hover:bg-gray-50/70"
                  >
                    {row.cells.map((cell, index) => (
                      <td key={`${row.id}-${index}`} className="px-5 py-4">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
