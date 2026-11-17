import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Megaphone, Pin, Search } from "lucide-react";
import {
  getNotice,
  getResidentNotices,
  type Notice,
  type NoticeCategory,
  type NoticePriority,
} from "./noticeApi";

const categories: NoticeCategory[] = [
  "GENERAL",
  "MAINTENANCE",
  "EVENT",
  "EMERGENCY",
  "PAYMENT",
  "OTHER",
];
const priorities: NoticePriority[] = ["NORMAL", "IMPORTANT", "URGENT"];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function readable(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ResidentNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getResidentNotices({ page, limit: 10, category, priority, search })
      .then((result) => {
        if (!active) return;
        setNotices(result.notices);
        setTotalPages(Math.max(result.pagination.totalPages, 1));
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load notices.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, category, priority, search]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">Resident workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
          Notice Board
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Updates published by your society secretary.
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-gray-100 p-4 md:grid-cols-[1fr_180px_180px]">
          <label className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              aria-label="Search notices"
              placeholder="Search notices"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-[#0C8C5E]"
            />
          </label>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {readable(item)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by priority"
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="">All priorities</option>
            {priorities.map((item) => (
              <option key={item} value={item}>
                {readable(item)}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="space-y-3 p-5" aria-label="Loading notices">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#0C8C5E]">
              <Megaphone size={20} />
            </span>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              No notices available
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Published society updates will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
            {notices.map((notice) => (
              <article
                key={notice._id}
                className="flex min-w-0 flex-col rounded-xl border border-gray-200 p-5 transition hover:border-emerald-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {readable(notice.category)}
                      </span>
                      {notice.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                          <Pin size={12} /> Pinned
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 break-words text-lg font-semibold text-gray-900">
                      {notice.title}
                    </h2>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${notice.priority === "URGENT" ? "bg-red-50 text-red-700" : notice.priority === "IMPORTANT" ? "bg-amber-50 text-amber-800" : "bg-gray-100 text-gray-700"}`}
                  >
                    {readable(notice.priority)}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {notice.content}
                </p>
                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
                  <p className="text-xs leading-5 text-gray-500">
                    Published {formatDate(notice.publishedAt)}
                    {notice.expiresAt
                      ? ` · Expires ${formatDate(notice.expiresAt)}`
                      : ""}
                  </p>
                  <Link
                    to={`/resident/notices/${notice._id}`}
                    className="text-sm font-semibold text-[#0C8C5E] hover:text-[#08764F]"
                  >
                    Read notice →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && notices.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function ResidentNoticeDetailPage() {
  const { noticeId = "" } = useParams();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getNotice(noticeId)
      .then((item) => {
        if (active) setNotice(item);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load notice.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [noticeId]);

  if (loading)
    return (
      <div className="animate-pulse rounded-2xl bg-white p-8 text-sm text-gray-500">
        Loading notice…
      </div>
    );
  if (error || !notice)
    return (
      <div className="space-y-4">
        <Link
          to="/resident/notices"
          className="text-sm font-semibold text-[#0C8C5E]"
        >
          ← Back to notices
        </Link>
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {error || "Notice not found."}
        </div>
      </div>
    );

  return (
    <article className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <Link
        to="/resident/notices"
        className="inline-block text-sm font-semibold text-[#0C8C5E]"
      >
        ← Back to notices
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          {readable(notice.category)}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${notice.priority === "URGENT" ? "bg-red-50 text-red-700" : notice.priority === "IMPORTANT" ? "bg-amber-50 text-amber-800" : "bg-gray-100 text-gray-700"}`}
        >
          {readable(notice.priority)}
        </span>
        {notice.isPinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <Pin size={12} /> Pinned
          </span>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {notice.title}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Published {formatDate(notice.publishedAt)}
          {notice.expiresAt ? ` · Expires ${formatDate(notice.expiresAt)}` : ""}
        </p>
      </div>
      <div className="whitespace-pre-wrap border-t border-gray-100 pt-5 text-sm leading-7 text-gray-700">
        {notice.content}
      </div>
    </article>
  );
}
