import { useEffect, useState } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import {
  formatComplaintDate,
  getMaintenanceWorkload,
  readableValue,
  type AssignedComplaint,
} from "./maintenanceApi";

export default function MaintenanceCompletedPage() {
  const [complaints, setComplaints] = useState<AssignedComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    getMaintenanceWorkload()
      .then((workload) => { if (current) setComplaints(workload.completedComplaints); })
      .catch((cause: unknown) => {
        if (current) setError(cause instanceof Error ? cause.message : "Could not load completed complaints.");
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">Maintenance workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">Completed Work</h1>
        <p className="mt-1 text-sm text-gray-500">Resolved complaints and their completion details.</p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-semibold text-gray-900">Completed complaints</h2>
            <p className="mt-1 text-sm text-gray-500">Your resolved work history.</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-[#083D33]">{loading ? "—" : complaints.length}</p>
            <p className="text-xs text-gray-500">completed</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5" aria-label="Loading completed complaints">{[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}</div>
        ) : complaints.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500"><CheckCircle2 size={20} /></span>
            <p className="mt-3 text-sm font-medium text-gray-800">No completed complaints yet</p>
            <p className="mt-1 text-sm text-gray-500">Resolved assignments will be listed here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {complaints.map((complaint) => (
              <article key={complaint._id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{complaint.title}</h3>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{readableValue(complaint.status)}</span>
                    </div>
                    {complaint.description && <p className="mt-2 text-sm leading-6 text-gray-600">{complaint.description}</p>}
                  </div>
                  <p className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-emerald-800"><Clock3 size={14} />Completed {formatComplaintDate(complaint.resolvedAt || complaint.updatedAt)}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <span>Flat: <strong className="font-medium text-gray-700">{complaint.flat && typeof complaint.flat === "object" ? `${complaint.flat.block ?? ""} ${complaint.flat.flatNumber ?? "—"}` : "—"}</strong></span>
                  <span>Category: <strong className="font-medium text-gray-700">{readableValue(complaint.category)}</strong></span>
                  <span>Priority: <strong className="font-medium text-gray-700">{readableValue(complaint.priority)}</strong></span>
                  <span>Resolved by: <strong className="font-medium text-gray-700">{complaint.resolvedBy?.name || "You"}</strong></span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
