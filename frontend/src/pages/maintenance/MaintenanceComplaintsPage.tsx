import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ClipboardList, Play, CheckCircle2 } from "lucide-react";
import {
  formatComplaintDate,
  getMaintenanceWorkload,
  readableValue,
  resolveComplaint,
  startComplaintWork,
  type AssignedComplaint,
} from "./maintenanceApi";

export default function MaintenanceComplaintsPage() {
  const [complaints, setComplaints] = useState<AssignedComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyComplaintId, setBusyComplaintId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("ALL");

  const reloadComplaints = useCallback(async () => {
    const workload = await getMaintenanceWorkload();
    setComplaints(workload.assignedComplaints);
  }, []);

  useEffect(() => {
    let current = true;
    reloadComplaints()
      .catch((cause: unknown) => {
        if (current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load assigned complaints.",
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [reloadComplaints]);

  const handleStartWork = async (complaintId: string) => {
    setBusyComplaintId(complaintId);
    setError("");
    setNotice("");
    try {
      await startComplaintWork(complaintId);
      await reloadComplaints();
      setNotice(
        "Work started. Residents can now see the estimated closure time.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start this complaint.",
      );
    } finally {
      setBusyComplaintId("");
    }
  };

  const handleResolve = async (complaintId: string) => {
    setBusyComplaintId(complaintId);
    setError("");
    setNotice("");
    try {
      await resolveComplaint(complaintId);
      await reloadComplaints();
      setNotice("Complaint marked resolved and added to completed work.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not resolve this complaint.",
      );
    } finally {
      setBusyComplaintId("");
    }
  };

  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase();
    return complaints.filter((complaint) => {
      const matchesSearch =
        !query ||
        [
          complaint.title,
          complaint.description,
          complaint.category,
          complaint.status,
          complaint.priority,
        ].some((value) => value?.toLowerCase().includes(query));
      return (
        matchesSearch && (priority === "ALL" || complaint.priority === priority)
      );
    });
  }, [complaints, priority, search]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">
          Maintenance workspace
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
          Assigned Complaints
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Your active assignment queue, ordered by the backend.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={17}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, description, category…"
            className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#0C8C5E] focus:ring-2 focus:ring-[#0C8C5E]/15"
          />
        </label>
        <label className="sr-only" htmlFor="maintenance-priority">
          Filter by priority
        </label>
        <select
          id="maintenance-priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#0C8C5E]"
        >
          <option value="ALL">All priorities</option>
          <option value="HIGH">High priority</option>
          <option value="MEDIUM">Medium priority</option>
          <option value="LOW">Low priority</option>
        </select>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-5" aria-label="Loading complaints">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <ClipboardList size={20} />
            </span>
            <p className="mt-3 text-sm font-medium text-gray-800">
              {complaints.length
                ? "No complaints match your search"
                : "No assigned complaints"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {complaints.length
                ? "Try another keyword or priority."
                : "New assignments will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredComplaints.map((complaint, index) => (
              <article
                key={
                  complaint._id ||
                  `${complaint.title}-${complaint.createdAt ?? index}`
                }
                className="px-5 py-5 sm:px-6"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-gray-900">
                        {complaint.title}
                      </h2>
                      <Badge value={complaint.priority} priority />
                      <Badge value={complaint.status} />
                    </div>
                    {complaint.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                        {complaint.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <p className="text-xs text-gray-500">
                      Reported {formatComplaintDate(complaint.createdAt)}
                    </p>
                    {complaint.status === "ASSIGNED" && (
                      <button
                        type="button"
                        disabled={busyComplaintId === complaint._id}
                        onClick={() => void handleStartWork(complaint._id)}
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-[#0C8C5E] px-3 text-sm font-semibold text-white hover:bg-[#08764F] disabled:opacity-60"
                      >
                        <Play size={15} />{" "}
                        {busyComplaintId === complaint._id
                          ? "Starting…"
                          : "Accept & start work"}
                      </button>
                    )}
                    {complaint.status === "IN_PROGRESS" && (
                      <button
                        type="button"
                        disabled={busyComplaintId === complaint._id}
                        onClick={() => void handleResolve(complaint._id)}
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-[#083D33] px-3 text-sm font-semibold text-white hover:bg-[#062E27] disabled:opacity-60"
                      >
                        <CheckCircle2 size={15} />{" "}
                        {busyComplaintId === complaint._id
                          ? "Saving…"
                          : "Mark resolved"}
                      </button>
                    )}
                  </div>
                </div>
                {complaint.flat && typeof complaint.flat === "object" && (
                  <p className="mt-3 text-xs text-gray-500">
                    Flat: {complaint.flat.block ?? ""}{" "}
                    {complaint.flat.flatNumber ?? "—"}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <span>
                    Category:{" "}
                    <strong className="font-medium text-gray-700">
                      {readableValue(complaint.category)}
                    </strong>
                  </span>
                  <span>
                    Priority:{" "}
                    <strong className="font-medium text-gray-700">
                      {readableValue(complaint.priority)}
                    </strong>
                  </span>
                  <span>
                    Updated:{" "}
                    <strong className="font-medium text-gray-700">
                      {formatComplaintDate(
                        complaint.updatedAt || complaint.createdAt,
                      )}
                    </strong>
                  </span>
                  <span>
                    Estimated closure:{" "}
                    <strong className="font-medium text-gray-700">
                      {formatComplaintDate(
                        complaint.estimatedClosureTime ?? undefined,
                      )}
                    </strong>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Badge({
  value,
  priority = false,
}: {
  value: string;
  priority?: boolean;
}) {
  const color =
    priority && value === "HIGH"
      ? "bg-red-50 text-red-700"
      : priority && value === "MEDIUM"
        ? "bg-amber-50 text-amber-800"
        : priority
          ? "bg-gray-100 text-gray-700"
          : "bg-blue-50 text-blue-800";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
      {readableValue(value)}
    </span>
  );
}
