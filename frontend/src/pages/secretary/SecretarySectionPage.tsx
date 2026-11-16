import { useEffect, useState } from "react";
import { Building2, ClipboardList, Shield, UserRoundCheck, Users } from "lucide-react";
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
  purpose: string;
  visitStatus: string;
  createdAt: string;
  visitTo?: { flatNumber?: string; block?: string } | null;
  resident?: { name?: string } | null;
}

interface Complaint {
  _id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  flats?: T;
  visitors?: T;
  complaints?: T;
  complaint?: T;
}

interface TableRow {
  id: string;
  cells: string[];
}

const sectionContent: Record<Section, { title: string; description: string; icon: typeof Users; columns: string[] }> = {
  residents: {
    title: "Residents",
    description: "Resident accounts and their assigned flats.",
    icon: Users,
    columns: ["Resident", "Flat", "Email", "Phone"],
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
    columns: ["Complaint", "Category", "Priority", "Status", "Created"],
  },
  visitors: {
    title: "Visitors",
    description: "Recent visitor activity across your society.",
    icon: UserRoundCheck,
    columns: ["Visitor", "Resident", "Flat", "Purpose", "Status", "Arrived"],
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

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function pretty(value: string | undefined) {
  return value?.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "—";
}

export default function SecretarySectionPage({ section }: { section: Section }) {
  const { session } = useAuth();
  const societyId = session.user?.society;
  const content = sectionContent[section];
  const Icon = content.icon;
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;

    const load = async () => {
      setLoading(true);
      setError("");
      setRows([]);

      try {
        if (section === "security") {
          throw new Error("Security guard management is not registered in the backend router yet.");
        }
        if (!societyId && section !== "visitors") {
          throw new Error("Your account is not linked to a society yet.");
        }

        let nextRows: TableRow[] = [];

        if (section === "flats") {
          const result = await getJson<ApiResponse<Flat[]>>(`/societies/${societyId}/flats`);
          nextRows = (result.flats ?? []).map((flat) => ({
            id: flat._id,
            cells: [flat.flatNumber, flat.block, String(flat.floor), flat.flatType, pretty(flat.flatStatus)],
          }));
        } else if (section === "residents") {
          const result = await getJson<ApiResponse<Array<{ _id: string; flatNumber: string; block: string; owner?: { name?: string; email?: string; phoneNumber?: string } }>>>("/users/societies/residents");
          nextRows = (result.flats ?? []).map((flat) => ({
            id: flat._id,
            cells: [flat.owner?.name || "—", `${flat.block} ${flat.flatNumber}`, flat.owner?.email || "—", flat.owner?.phoneNumber || "—"],
          }));
        } else if (section === "visitors") {
          const result = await getJson<ApiResponse<Visitor[]>>("/visitor/");
          nextRows = (result.visitors ?? []).slice(0, 50).map((visitor) => ({
            id: visitor._id,
            cells: [
              visitor.name,
              visitor.resident?.name || "—",
              `${visitor.visitTo?.block || ""} ${visitor.visitTo?.flatNumber || "—"}`.trim(),
              pretty(visitor.purpose),
              pretty(visitor.visitStatus),
              displayDate(visitor.createdAt),
            ],
          }));
        } else if (section === "complaints") {
          const list = await getJson<ApiResponse<Array<{ _id: string }>>>(`/societies/complaints/${societyId}`);
          const complaints = await Promise.all(
            (list.complaints ?? []).map(async ({ _id }) => {
              const result = await getJson<ApiResponse<Complaint>>(`/complaints/${_id}`);
              return result.complaint;
            }),
          );
          nextRows = complaints.filter((complaint): complaint is Complaint => Boolean(complaint)).map((complaint) => ({
            id: complaint._id,
            cells: [complaint.title, pretty(complaint.category), pretty(complaint.priority), pretty(complaint.status), displayDate(complaint.createdAt)],
          }));
        }

        if (current) setRows(nextRows);
      } catch (cause) {
        if (current) {
          setError(cause instanceof Error ? cause.message : "Could not load this section.");
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
          <p className="text-sm font-medium text-[#0C8C5E]">Secretary workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">{content.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{content.description}</p>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {error ? (
          <div role="alert" className="m-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-3 p-6" aria-label={`Loading ${content.title.toLowerCase()}`}>
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-10 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-800">No {content.title.toLowerCase()} found</p>
            <p className="mt-1 text-sm text-gray-500">Records will appear here when they are available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>{content.columns.map((column) => <th key={column} className="px-5 py-3.5">{column}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id} className="text-gray-700 hover:bg-gray-50/70">
                    {row.cells.map((cell, index) => <td key={`${row.id}-${index}`} className="px-5 py-4">{cell}</td>)}
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
