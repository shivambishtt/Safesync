import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Archive, Megaphone, Pin, Plus, Search } from "lucide-react";
import {
  createNotice,
  getSecretaryNotices,
  noticeAction,
  setNoticePinned,
  updateNotice,
  type Notice,
  type NoticeCategory,
  type NoticePayload,
  type NoticePriority,
  type NoticeStatus,
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
const statuses: NoticeStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const emptyForm = {
  title: "",
  content: "",
  category: "GENERAL" as NoticeCategory,
  priority: "NORMAL" as NoticePriority,
  expiresAt: "",
};

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

export default function SecretaryNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [publishOnSave, setPublishOnSave] = useState(false);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getSecretaryNotices({
        page,
        limit: 10,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        search,
      });
      setNotices(result.notices);
      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load notices.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, priorityFilter, search]);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  function beginCreate() {
    setEditing(null);
    setForm(emptyForm);
    setPublishOnSave(false);
    setFormOpen(true);
    setMessage("");
  }

  function beginEdit(notice: Notice) {
    setEditing(notice);
    setForm({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      expiresAt: notice.expiresAt
        ? new Date(notice.expiresAt).toISOString().slice(0, 16)
        : "",
    });
    setPublishOnSave(false);
    setFormOpen(true);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const payload: NoticePayload = {
      ...form,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      ...(editing
        ? {}
        : {
            status: publishOnSave ? ("PUBLISHED" as const) : ("DRAFT" as const),
          }),
    };
    try {
      if (editing) await updateNotice(editing._id, payload);
      else await createNotice(payload);
      setMessage(
        editing
          ? "Notice updated."
          : publishOnSave
            ? "Notice published."
            : "Draft saved.",
      );
      setFormOpen(false);
      await loadNotices();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save this notice.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function runAction(
    notice: Notice,
    action: "publish" | "unpublish" | "archive" | "pin" | "unpin",
  ) {
    setBusyId(notice._id);
    setError("");
    setMessage("");
    try {
      if (action === "pin" || action === "unpin")
        await setNoticePinned(notice._id, action === "pin");
      else await noticeAction(notice._id, action);
      const actionMessage: Record<typeof action, string> = {
        publish: "published",
        unpublish: "returned to drafts",
        archive: "archived",
        pin: "pinned",
        unpin: "unpinned",
      };
      setMessage(`Notice ${actionMessage[action]}.`);
      await loadNotices();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update the notice.",
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0C8C5E]">
            Secretary workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
            Notice Board
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Share important updates with residents in your society.
          </p>
        </div>
        <button
          onClick={beginCreate}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white hover:bg-[#08764F]"
        >
          <Plus size={17} /> Create notice
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {message}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {editing ? "Edit notice" : "New notice"}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-gray-700 sm:col-span-2">
              Title
              <input
                required
                maxLength={120}
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                className="h-10 w-full rounded-md border border-gray-300 px-3 font-normal outline-none focus:border-[#0C8C5E]"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-gray-700 sm:col-span-2">
              Message
              <textarea
                required
                maxLength={10000}
                rows={5}
                value={form.content}
                onChange={(event) =>
                  setForm({ ...form, content: event.target.value })
                }
                className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-[#0C8C5E]"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-gray-700">
              Category
              <select
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value as NoticeCategory,
                  })
                }
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-normal"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {readable(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-gray-700">
              Priority
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm({
                    ...form,
                    priority: event.target.value as NoticePriority,
                  })
                }
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-normal"
              >
                {priorities.map((item) => (
                  <option key={item} value={item}>
                    {readable(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-gray-700 sm:col-span-2">
              Optional expiry date
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm({ ...form, expiresAt: event.target.value })
                }
                className="h-10 w-full rounded-md border border-gray-300 px-3 font-normal sm:max-w-sm"
              />
            </label>
          </div>
          {!editing && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={publishOnSave}
                onChange={(event) => setPublishOnSave(event.target.checked)}
                className="accent-[#0C8C5E]"
              />{" "}
              Publish immediately (otherwise save as draft)
            </label>
          )}
          <button
            disabled={saving}
            className="h-10 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white hover:bg-[#08764F] disabled:opacity-60"
          >
            {saving
              ? "Saving…"
              : editing
                ? "Save changes"
                : publishOnSave
                  ? "Publish notice"
                  : "Save draft"}
          </button>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-gray-100 p-4 md:grid-cols-2 xl:grid-cols-[1fr_160px_160px_160px]">
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
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {readable(item)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
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
            value={priorityFilter}
            onChange={(event) => {
              setPriorityFilter(event.target.value);
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
                className="h-28 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#0C8C5E]">
              <Megaphone size={20} />
            </span>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              No notices found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Create a notice or change your filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notices.map((notice) => (
              <article key={notice._id} className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-gray-900">
                        {notice.title}
                      </h2>
                      {notice.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                          <Pin size={12} /> Pinned
                        </span>
                      )}
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {readable(notice.status)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                      {notice.content}
                    </p>
                    <p className="mt-3 text-xs text-gray-500">
                      {readable(notice.category)} · {readable(notice.priority)}{" "}
                      · Created {formatDate(notice.createdAt)} · Published{" "}
                      {formatDate(notice.publishedAt)} · Expires{" "}
                      {formatDate(notice.expiresAt)}
                    </p>
                  </div>
                  <span
                    className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${notice.priority === "URGENT" ? "bg-red-50 text-red-700" : notice.priority === "IMPORTANT" ? "bg-amber-50 text-amber-800" : "bg-gray-100 text-gray-700"}`}
                  >
                    {readable(notice.priority)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {notice.status !== "ARCHIVED" && (
                    <button
                      disabled={busyId === notice._id}
                      onClick={() => beginEdit(notice)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  )}
                  {notice.status === "DRAFT" && (
                    <button
                      disabled={busyId === notice._id}
                      onClick={() => void runAction(notice, "publish")}
                      className="rounded-md bg-[#0C8C5E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#08764F]"
                    >
                      Publish
                    </button>
                  )}
                  {notice.status === "PUBLISHED" && (
                    <button
                      disabled={busyId === notice._id}
                      onClick={() => void runAction(notice, "unpublish")}
                      className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Unpublish
                    </button>
                  )}
                  {notice.status !== "ARCHIVED" && (
                    <button
                      disabled={busyId === notice._id}
                      onClick={() =>
                        void runAction(
                          notice,
                          notice.isPinned ? "unpin" : "pin",
                        )
                      }
                      className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {notice.isPinned ? "Unpin" : "Pin"}
                    </button>
                  )}
                  {notice.status !== "ARCHIVED" && (
                    <button
                      disabled={busyId === notice._id}
                      onClick={() => void runAction(notice, "archive")}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      <Archive size={13} /> Archive
                    </button>
                  )}
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
