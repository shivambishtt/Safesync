import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardList, Clock3, CheckCircle2, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import {
  formatComplaintDate,
  getMaintenanceWorkload,
  readableValue,
  type AssignedComplaint,
} from "./maintenanceApi";

export default function MaintenanceDashboard() {
  const [complaints, setComplaints] = useState<AssignedComplaint[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    getMaintenanceWorkload()
      .then((workload) => {
        if (current) {
          setComplaints(workload.assignedComplaints);
          setCompletedCount(workload.completedComplaints.length);
        }
      })
      .catch((cause: unknown) => {
        if (current) setError(cause instanceof Error ? cause.message : "Could not load assigned complaints.");
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const highPriority = complaints.filter((complaint) => complaint.priority === "HIGH").length;
  const recentComplaints = complaints.slice(0, 4);

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">Maintenance workspace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#08090A]">Your work overview</h1>
        <p className="mt-2 text-sm text-gray-500">Review the complaints assigned to you and keep repairs moving.</p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}

      <section aria-label="Work summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Assigned complaints" value={loading ? "—" : complaints.length} hint="Currently in your assigned queue" icon={ClipboardList} />
        <Metric label="In progress" value={loading ? "—" : complaints.filter((complaint) => complaint.status === "IN_PROGRESS").length} hint="Work you have started" icon={Wrench} />
        <Metric label="Completed" value={loading ? "—" : completedCount} hint="Resolved complaints in your history" icon={CheckCircle2} />
        <Metric label="High priority" value={loading ? "—" : highPriority} hint="Needs prompt attention" icon={AlertTriangle} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold text-gray-900">Recent assignments</h2>
            <p className="mt-1 text-sm text-gray-500">Complaints currently assigned to you.</p>
          </div>
          <Link to="/maintenance/complaints" className="text-sm font-semibold text-[#0C8C5E] hover:text-[#083D33]">View assigned complaints →</Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-5" aria-label="Loading assignments">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}</div>
        ) : recentComplaints.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500"><ClipboardList size={20} /></span>
            <p className="mt-3 text-sm font-medium text-gray-800">No assigned complaints</p>
            <p className="mt-1 text-sm text-gray-500">New assignments will show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentComplaints.map((complaint, index) => <ComplaintRow key={`${complaint.title}-${complaint.createdAt ?? index}`} complaint={complaint} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, hint, icon: Icon }: { label: string; value: string | number; hint: string; icon: typeof ClipboardList }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-medium text-gray-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-[#08090A]">{value}</p></div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0C8C5E]/10 text-[#0C8C5E]"><Icon size={21} /></span>
      </div>
      <p className="mt-4 text-xs text-gray-500">{hint}</p>
    </article>
  );
}

function ComplaintRow({ complaint }: { complaint: AssignedComplaint }) {
  return (
    <article className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-gray-900">{complaint.title}</h3>
          <PriorityBadge priority={complaint.priority} />
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{readableValue(complaint.status)}</span>
        </div>
        {complaint.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{complaint.description}</p>}
        <p className="mt-2 text-xs text-gray-500">
          {readableValue(complaint.category)}
          {complaint.flat && typeof complaint.flat === "object" ? ` · ${complaint.flat.block ?? ""} ${complaint.flat.flatNumber ?? ""}` : ""}
        </p>
      </div>
      <div className="shrink-0 space-y-1 text-xs text-gray-500">
        <p className="inline-flex items-center gap-1.5"><Clock3 size={14} />{formatComplaintDate(complaint.createdAt)}</p>
        {complaint.estimatedClosureTime && <p>Est. by {formatComplaintDate(complaint.estimatedClosureTime)}</p>}
      </div>
    </article>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = priority === "HIGH" ? "bg-red-50 text-red-700" : priority === "MEDIUM" ? "bg-amber-50 text-amber-800" : "bg-gray-100 text-gray-700";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{readableValue(priority)}</span>;
}
