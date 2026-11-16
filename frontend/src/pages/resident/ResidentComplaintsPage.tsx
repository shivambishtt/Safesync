import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Clock3, Send } from "lucide-react";

const API_BASE_URL = "http://localhost:3000/api/v1";
const categories = ["ELECTRICAL", "PLUMBING", "SECURITY", "MAINTENANCE", "CLEANING", "OTHER"];
const priorities = ["LOW", "MEDIUM", "HIGH"];

interface Flat {
  _id: string;
  flatNumber: string;
  block: string;
}

interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  estimatedClosureTime?: string | null;
  resolvedAt?: string | null;
  flat?: { flatNumber?: string; block?: string } | null;
  assignedTo?: { name?: string } | null;
  resolvedBy?: { name?: string } | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  checkUser?: { flat?: T | null };
  complaint?: T;
  complaints?: T;
  totalComplaints?: number;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include" });
  const result = (await response.json()) as T & { success?: boolean; message?: string };
  if (!response.ok || result.success === false) throw new Error(result.message || `Request failed (${response.status})`);
  return result;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function pretty(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ResidentComplaintsPage() {
  const [flat, setFlat] = useState<Flat | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [priority, setPriority] = useState("MEDIUM");

  const loadComplaints = async () => {
    const result = await getJson<ApiResponse<Complaint[]>>("/my-complaints");
    setComplaints(result.complaints ?? []);
  };

  useEffect(() => {
    let current = true;
    Promise.allSettled([
      getJson<ApiResponse<Flat>>("/users/flats"),
      getJson<ApiResponse<Complaint[]>>("/my-complaints"),
    ]).then(([flatResult, complaintsResult]) => {
      if (!current) return;
      const errors: string[] = [];
      if (flatResult.status === "fulfilled") setFlat(flatResult.value.checkUser?.flat ?? null);
      else errors.push(flatResult.reason instanceof Error ? flatResult.reason.message : "Could not load flat assignment.");
      if (complaintsResult.status === "fulfilled") setComplaints(complaintsResult.value.complaints ?? []);
      else errors.push(complaintsResult.reason instanceof Error ? complaintsResult.reason.message : "Could not load complaints.");
      setPageError(errors.join(" · "));
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!flat?._id) {
      setFormError("Your account needs an assigned flat before you can submit a complaint.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setFormError("Add a title and description before submitting.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setNotice("");
    try {
      const response = await fetch(`${API_BASE_URL}/societies/complaints/${flat._id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), category, priority }),
      });
      const result = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !result.success) throw new Error(result.message || `Request failed (${response.status})`);

      setTitle("");
      setDescription("");
      setCategory("OTHER");
      setPriority("MEDIUM");
      setNotice(result.message || "Complaint submitted.");
      await loadComplaints();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Could not submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">Resident workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">Complaints</h1>
        <p className="mt-1 text-sm text-gray-500">Report an issue and track its current status.</p>
      </header>

      {pageError && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{pageError}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900">Submit a complaint</h2>
          <p className="mt-1 text-sm text-gray-500">{flat ? `For ${flat.block} · ${flat.flatNumber}` : "Link a flat to your account to submit a complaint."}</p>
        </div>
        {formError && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5 sm:col-span-3">
              <span className="text-sm font-medium text-gray-700">Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-[#0C8C5E] focus:ring-2 focus:ring-[#0C8C5E]/15" placeholder="Briefly describe the issue" />
            </label>
            <label className="space-y-1.5 sm:col-span-3">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={2000} className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0C8C5E] focus:ring-2 focus:ring-[#0C8C5E]/15" placeholder="Add details that can help resolve the issue" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#0C8C5E]">
                {categories.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Priority</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#0C8C5E]">
                {priorities.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <button type="submit" disabled={submitting || loading || !flat} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white transition hover:bg-[#08764F] disabled:cursor-not-allowed disabled:opacity-60">
                <Send size={16} /> {submitting ? "Submitting…" : "Submit complaint"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">My complaint history</h2>
          <p className="mt-1 text-sm text-gray-500">Your submitted complaints, ordered by latest update.</p>
        </div>
        {loading ? (
          <div className="space-y-3" aria-label="Loading complaints">{[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-white" />)}</div>
        ) : complaints.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center"><AlertCircle className="mx-auto text-gray-400" size={22} /><p className="mt-3 text-sm font-medium text-gray-800">No complaints submitted</p><p className="mt-1 text-sm text-gray-500">Your submitted issues will appear here.</p></div>
        ) : (
          <div className="space-y-3">
            {complaints.map((complaint) => (
              <article key={complaint._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{complaint.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{complaint.description}</p>
                    <p className="mt-2 text-xs text-gray-500">{pretty(complaint.category)} · {pretty(complaint.priority)} · {complaint.flat ? `${complaint.flat.block} ${complaint.flat.flatNumber}` : `${flat?.block ?? ""} ${flat?.flatNumber ?? ""}`}</p>
                  </div>
                  <span className="w-fit rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-700">{pretty(complaint.status)}</span>
                </div>
                <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                  <p className="text-xs text-gray-500"><Clock3 className="mr-1 inline" size={13} /> Last updated<br /><strong className="mt-1 inline-block font-medium text-gray-800">{formatDate(complaint.updatedAt || complaint.createdAt)}</strong></p>
                  <p className="text-xs text-gray-500">Assigned to<br /><strong className="mt-1 inline-block font-medium text-gray-800">{complaint.assignedTo?.name || "Not assigned yet"}</strong></p>
                  <p className="text-xs text-gray-500">Estimated closure<br /><strong className="mt-1 inline-block font-medium text-gray-800">{complaint.estimatedClosureTime ? formatDate(complaint.estimatedClosureTime) : "Available after staff assignment"}</strong></p>
                  <p className="text-xs text-gray-500">Resolved at<br /><strong className="mt-1 inline-block font-medium text-gray-800">{complaint.resolvedAt ? formatDate(complaint.resolvedAt) : "Not resolved yet"}</strong></p>
                </div>
                {complaint.resolvedBy?.name && <p className="mt-3 text-xs text-gray-500">Resolved by <strong className="font-medium text-gray-800">{complaint.resolvedBy.name}</strong></p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
