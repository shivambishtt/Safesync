import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Receipt,
  Wallet,
} from "lucide-react";
import {
  generateBills,
  getBillingPlan,
  getSocietyBills,
  recordPayment,
  saveBillingPlan,
  type BillingFrequency,
  type BillingPage,
  type MaintenanceBill,
  type PaymentMethod,
} from "./billingApi";

const initialForm = {
  amount: "",
  frequency: "MONTHLY" as BillingFrequency,
  nextPeriodStart: "",
};
const methods: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

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

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function SecretaryMaintenanceBillingPage() {
  const [form, setForm] = useState(initialForm);
  const [hasPlan, setHasPlan] = useState(false);
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [summary, setSummary] = useState<BillingPage["summary"]>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [payingId, setPayingId] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "UPI" as PaymentMethod,
    paymentReference: "",
    paymentNotes: "",
  });
  const [paymentBill, setPaymentBill] = useState<MaintenanceBill | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getSocietyBills(page, filter);
      setBills(result.bills);
      setSummary(result.summary);
      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load maintenance bills.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    let active = true;
    getBillingPlan()
      .then((planResult) => {
        if (!active) return;
        const plan = planResult.plan;
        if (plan) {
          setHasPlan(true);
          setForm({
            amount: String(plan.amount),
            frequency: plan.frequency,
            nextPeriodStart: plan.nextPeriodStart.slice(0, 10),
          });
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load billing details.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void loadBills();
  }, [loadBills]);

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await saveBillingPlan({
        ...form,
        amount: Number(form.amount),
      });
      const plan = result.plan as NonNullable<typeof result.plan>;
      setHasPlan(true);
      setForm({
        amount: String(plan.amount),
        frequency: plan.frequency,
        nextPeriodStart: plan.nextPeriodStart.slice(0, 10),
      });
      setMessage("Society maintenance plan saved.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save the billing plan.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onGenerateBills() {
    setGenerating(true);
    setError("");
    setMessage("");
    try {
      const result = await generateBills();
      setMessage(
        `${String(result.billsCreated ?? 0)} bill(s) generated. ${String(result.alreadyGenerated ?? 0)} already existed.`,
      );
      await loadBills();
      const planResult = await getBillingPlan();
      if (planResult.plan)
        setForm((current) => ({
          ...current,
          nextPeriodStart: planResult.plan!.nextPeriodStart.slice(0, 10),
        }));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not generate bills.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentBill) return;
    setPayingId(paymentBill._id);
    setError("");
    setMessage("");
    try {
      await recordPayment(paymentBill._id, paymentForm);
      setMessage(
        `Payment for ${paymentBill.flat?.block ?? ""} ${paymentBill.flat?.flatNumber ?? "flat"} recorded.`,
      );
      setPaymentBill(null);
      setPaymentForm({
        paymentMethod: "UPI",
        paymentReference: "",
        paymentNotes: "",
      });
      await loadBills();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not record payment.",
      );
    } finally {
      setPayingId("");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">
          Secretary workspace
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
          Maintenance Billing
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Set one maintenance charge for every resident-owned flat and keep
          payment records organized.
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
      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <CircleAlert size={20} />
          </span>
          <p className="mt-4 text-sm text-gray-500">Outstanding bills</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {summary?.pendingCount ?? 0}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {currency(summary?.pendingAmount ?? 0)} due
          </p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#0C8C5E]">
            <CheckCircle2 size={20} />
          </span>
          <p className="mt-4 text-sm text-gray-500">Payments collected</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {currency(summary?.paidAmount ?? 0)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {summary?.paidCount ?? 0} payment records across all periods
          </p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <CalendarDays size={20} />
          </span>
          <p className="mt-4 text-sm text-gray-500">Next billing date</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {form.nextPeriodStart
              ? dateLabel(form.nextPeriodStart)
              : "Not configured"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {hasPlan
              ? form.frequency.replace("_", " ").toLowerCase()
              : "Set up a plan to begin"}
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <form
          onSubmit={submitPlan}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Society billing plan
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              The same amount is charged to every owner-occupied flat each
              period.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Maintenance amount per flat
              <input
                required
                type="number"
                min="1"
                step="1"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
                placeholder="e.g. 2500"
                className="mt-1.5 h-10 w-full rounded-md border border-gray-300 px-3 font-normal"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Billing frequency
              <select
                value={form.frequency}
                onChange={(event) =>
                  setForm({
                    ...form,
                    frequency: event.target.value as BillingFrequency,
                  })
                }
                className="mt-1.5 h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-normal"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="HALF_YEARLY">Half-yearly</option>
                <option value="ANNUALLY">Annually</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">
              Next billing period starts
              <input
                required
                type="date"
                min={today()}
                value={form.nextPeriodStart}
                onChange={(event) =>
                  setForm({ ...form, nextPeriodStart: event.target.value })
                }
                className="mt-1.5 h-10 w-full rounded-md border border-gray-300 px-3 font-normal sm:max-w-xs"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={saving}
              className="h-10 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white hover:bg-[#08764F] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save billing plan"}
            </button>
            <button
              type="button"
              onClick={() => void onGenerateBills()}
              disabled={generating || !hasPlan}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#0C8C5E]/30 px-4 text-sm font-semibold text-[#083D33] hover:bg-emerald-50 disabled:opacity-50"
            >
              <Receipt size={16} />
              {generating ? "Generating…" : "Generate next bills"}
            </button>
          </div>
          {hasPlan && (
            <p className="text-xs leading-5 text-gray-500">
              Generating bills advances the next billing date automatically.
              Existing bills are not changed when you update the plan.
            </p>
          )}
        </form>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#0C8C5E]">
              <Wallet size={19} />
            </span>
            <div>
              <h2 className="font-semibold text-gray-900">Payment handling</h2>
              <p className="text-sm text-gray-500">
                Record payments received by the society
              </p>
            </div>
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-gray-600">
            <li className="flex gap-2">
              <CheckCircle2
                size={16}
                className="mt-1 shrink-0 text-[#0C8C5E]"
              />
              Record the payment method and optional reference or note.
            </li>
            <li className="flex gap-2">
              <CheckCircle2
                size={16}
                className="mt-1 shrink-0 text-[#0C8C5E]"
              />
              The resident can see when and how their payment was recorded.
            </li>
            <li className="flex gap-2">
              <Banknote size={16} className="mt-1 shrink-0 text-[#0C8C5E]" />
              Payments are recorded manually; this screen does not collect money
              online.
            </li>
          </ul>
        </section>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Flat bills</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review due and paid maintenance charges.
            </p>
          </div>
          <select
            aria-label="Filter bills by status"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="">All bills</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        {loading ? (
          <div className="space-y-3 p-5" aria-label="Loading maintenance bills">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        ) : bills.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Receipt className="mx-auto text-gray-400" size={24} />
            <p className="mt-3 font-semibold text-gray-900">No bills found</p>
            <p className="mt-1 text-sm text-gray-500">
              Set a billing plan and generate bills for the next period.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Flat / resident</th>
                    <th className="px-5 py-3">Billing period</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Due date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bills.map((bill) => {
                    const overdue =
                      bill.status === "PENDING" &&
                      bill.dueDate.slice(0, 10) < today();
                    return (
                      <tr key={bill._id}>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            {bill.flat?.block} · {bill.flat?.flatNumber}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {bill.resident?.name ?? "Resident"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {dateLabel(bill.periodStart)} –{" "}
                          {dateLabel(bill.periodEnd)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {currency(bill.amount)}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {dateLabel(bill.dueDate)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bill.status === "PAID" ? "bg-emerald-50 text-emerald-800" : overdue ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}
                          >
                            {bill.status === "PAID"
                              ? "Paid"
                              : overdue
                                ? "Overdue"
                                : "Pending"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {bill.status === "PAID" ? (
                            <>
                              {bill.paymentMethod?.replace("_", " ")}
                              <br />
                              <span className="text-xs">
                                {dateLabel(bill.paidAt)}
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {bill.status === "PENDING" && (
                            <button
                              onClick={() => setPaymentBill(bill)}
                              className="rounded-md border border-[#0C8C5E]/30 px-3 py-2 text-xs font-semibold text-[#08764F] hover:bg-emerald-50"
                            >
                              Record payment
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-gray-100 md:hidden">
              {bills.map((bill) => (
                <article key={bill._id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {bill.flat?.block} · {bill.flat?.flatNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {bill.resident?.name ?? "Resident"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bill.status === "PAID" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
                    >
                      {bill.status === "PAID" ? "Paid" : "Pending"}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-gray-500">Amount</dt>
                      <dd className="mt-1 font-semibold">
                        {currency(bill.amount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Due</dt>
                      <dd className="mt-1">{dateLabel(bill.dueDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Period</dt>
                      <dd className="mt-1">
                        {dateLabel(bill.periodStart)} –{" "}
                        {dateLabel(bill.periodEnd)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Payment</dt>
                      <dd className="mt-1">
                        {bill.paymentMethod?.replace("_", " ") ?? "—"}
                      </dd>
                    </div>
                  </dl>
                  {bill.status === "PENDING" && (
                    <button
                      onClick={() => setPaymentBill(bill)}
                      className="h-9 rounded-md border border-[#0C8C5E]/30 px-3 text-sm font-semibold text-[#08764F]"
                    >
                      Record payment
                    </button>
                  )}
                </article>
              ))}
            </div>
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
          </>
        )}
      </section>

      {paymentBill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPaymentBill(null);
          }}
        >
          <form
            onSubmit={submitPayment}
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Record maintenance payment
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {paymentBill.flat?.block} · {paymentBill.flat?.flatNumber} ·{" "}
                {currency(paymentBill.amount)}
              </p>
            </div>
            <label className="block text-sm font-medium text-gray-700">
              Payment method
              <select
                value={paymentForm.paymentMethod}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    paymentMethod: event.target.value as PaymentMethod,
                  })
                }
                className="mt-1.5 h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-normal"
              >
                {methods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Transaction / cheque reference (optional)
              <input
                value={paymentForm.paymentReference}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    paymentReference: event.target.value,
                  })
                }
                maxLength={120}
                className="mt-1.5 h-10 w-full rounded-md border border-gray-300 px-3 font-normal"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Notes (optional)
              <textarea
                value={paymentForm.paymentNotes}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    paymentNotes: event.target.value,
                  })
                }
                maxLength={500}
                rows={3}
                className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 font-normal"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentBill(null)}
                className="h-10 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                disabled={payingId === paymentBill._id}
                className="h-10 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {payingId === paymentBill._id
                  ? "Recording…"
                  : "Confirm payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
