import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Receipt, Wallet } from "lucide-react";
import { getMyBills, type MaintenanceBill } from "./billingApi";

function currency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function dateLabel(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function ResidentMaintenanceBillsPage() {
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [pending, setPending] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getMyBills(page);
      setBills(result.bills);
      setPending(result.summary?.pendingCount ?? 0);
      setPendingAmount(result.summary?.pendingAmount ?? 0);
      setPaid(result.summary?.paidCount ?? 0);
      setPaidAmount(result.summary?.paidAmount ?? 0);
      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load your maintenance bills.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadBills();
  }, [loadBills]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">Resident workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
          My Maintenance
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          See your flat’s maintenance bills and payments recorded by your
          society secretary.
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
      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Wallet size={20} />
          </span>
          <p className="mt-4 text-sm text-gray-500">Outstanding balance</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {currency(pendingAmount)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {pending} unpaid bill{pending === 1 ? "" : "s"} · Contact your
            secretary to arrange payment.
          </p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#0C8C5E]">
            <CheckCircle2 size={20} />
          </span>
          <p className="mt-4 text-sm text-gray-500">Payments recorded</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {currency(paidAmount)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {paid} payment{paid === 1 ? "" : "s"} in your flat’s history
          </p>
        </article>
      </section>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Bill and payment history
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Payment status is updated by your society secretary.
          </p>
        </div>
        {loading ? (
          <div className="space-y-3 p-5" aria-label="Loading maintenance bills">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        ) : bills.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <Receipt className="mx-auto text-gray-400" size={24} />
            <h2 className="mt-3 font-semibold text-gray-900">
              No maintenance bills yet
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
              When your society secretary generates bills, they will appear here
              with the billing period and due date.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bills.map((bill) => (
              <ResidentBillCard key={bill._id} bill={bill} />
            ))}
          </div>
        )}
        {!loading && bills.length > 0 && (
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

function ResidentBillCard({ bill }: { bill: MaintenanceBill }) {
  const overdue =
    bill.status === "PENDING" && bill.dueDate.slice(0, 10) < localToday();
  return (
    <article className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bill.status === "PAID" ? "bg-emerald-50 text-[#0C8C5E]" : "bg-amber-50 text-amber-700"}`}
        >
          {bill.status === "PAID" ? (
            <CheckCircle2 size={19} />
          ) : (
            <Clock3 size={19} />
          )}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {bill.flat?.block} · {bill.flat?.flatNumber}
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bill.status === "PAID" ? "bg-emerald-50 text-emerald-800" : overdue ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}
            >
              {bill.status === "PAID"
                ? "Paid"
                : overdue
                  ? "Overdue"
                  : "Pending"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {dateLabel(bill.periodStart)} – {dateLabel(bill.periodEnd)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Due {dateLabel(bill.dueDate)}
          </p>
          {bill.status === "PAID" && (
            <p className="mt-2 text-sm text-gray-600">
              Paid {dateLabel(bill.paidAt)} by{" "}
              {bill.recordedBy?.name ?? "your secretary"} via{" "}
              {bill.paymentMethod?.replace("_", " ") ?? "—"}
              {bill.paymentReference ? ` · Ref ${bill.paymentReference}` : ""}
            </p>
          )}
          {bill.paymentNotes && (
            <p className="mt-1 text-xs text-gray-500">{bill.paymentNotes}</p>
          )}
        </div>
      </div>
      <p className="pl-[52px] text-xl font-semibold text-[#083D33] sm:pl-0">
        {currency(bill.amount)}
      </p>
    </article>
  );
}
