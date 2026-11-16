import { useEffect, useState } from "react";
import { Clock3, Users } from "lucide-react";

const API_BASE_URL = "http://localhost:3000/api/v1";

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
}

interface ApiResponse {
  success: boolean;
  message?: string;
  visitors?: Visitor[];
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function ResidentVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    fetch(`${API_BASE_URL}/my-visitors`, { credentials: "include" })
      .then(async (response) => {
        const result = (await response.json()) as ApiResponse;
        if (response.status === 404 && result.message === "No visitors found for this resident") return [];
        if (!response.ok || !result.success) throw new Error(result.message || `Request failed (${response.status})`);
        return result.visitors ?? [];
      })
      .then((items) => { if (current) setVisitors(items); })
      .catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : "Could not load visitors."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">Resident workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">My Visitors</h1>
        <p className="mt-1 text-sm text-gray-500">Visitor requests and entry status for your flat.</p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-6" aria-label="Loading visitors">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-gray-100" />)}</div>
        ) : visitors.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500"><Users size={20} /></span>
            <p className="mt-3 text-sm font-medium text-gray-800">No visitor records yet</p>
            <p className="mt-1 text-sm text-gray-500">Requests created for your flat will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visitors.map((visitor) => (
              <article key={visitor._id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-semibold text-gray-900">{visitor.name}</h2>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-700">{visitor.visitStatus.toLowerCase().replaceAll("_", " ")}</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                    <div><dt className="text-xs text-gray-500">Purpose</dt><dd className="mt-1 text-sm font-medium capitalize text-gray-900">{visitor.purpose.toLowerCase()}</dd></div>
                    <div><dt className="text-xs text-gray-500">Phone</dt><dd className="mt-1 break-words text-sm font-medium text-gray-900">{visitor.phoneNumber || "—"}</dd></div>
                    <div><dt className="text-xs text-gray-500">Email</dt><dd className="mt-1 break-all text-sm font-medium text-gray-900">{visitor.email || "—"}</dd></div>
                    <div><dt className="text-xs text-gray-500">Check in</dt><dd className="mt-1 text-sm font-medium text-gray-900">{formatDate(visitor.checkInTime)}</dd></div>
                    <div><dt className="text-xs text-gray-500">Check out</dt><dd className="mt-1 text-sm font-medium text-gray-900">{formatDate(visitor.checkoutTime)}</dd></div>
                  </dl>
                </div>
                <p className="inline-flex shrink-0 items-center gap-1.5 text-xs text-gray-500"><Clock3 size={14} /> Updated {formatDate(visitor.updatedAt || visitor.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
