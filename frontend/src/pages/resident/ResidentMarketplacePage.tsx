import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Building2,
  Check,
  Home,
  Phone,
  Plus,
  Search,
  Tag,
  X,
} from "lucide-react";
import {
  closeListing,
  createListing,
  getMyListings,
  getSocietyListings,
  updateListing,
  type ListingType,
  type PropertyListing,
} from "./propertyListingApi";

type View = "browse" | "mine";
const initialForm = {
  listingType: "SALE" as ListingType,
  amount: "",
  showContact: false,
};
const API_BASE_URL = "http://localhost:3000/api/v1";

interface AssignedFlat {
  flatNumber: string;
  block: string;
  floor: number;
  flatType: string;
  area?: number;
}

function money(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function ListingCard({
  listing,
  mine,
  onEdit,
  onClose,
  busy,
}: {
  listing: PropertyListing;
  mine: boolean;
  onEdit: (listing: PropertyListing) => void;
  onClose: (listing: PropertyListing) => void;
  busy: boolean;
}) {
  const flat = listing.flat;
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${listing.listingType === "SALE" ? "bg-emerald-50 text-emerald-800" : "bg-sky-50 text-sky-800"}`}
        >
          <Tag size={13} />{" "}
          {listing.listingType === "SALE" ? "For sale" : "For rent"}
        </span>
        {mine && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${listing.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-gray-100 text-gray-600"}`}
          >
            {listing.status === "ACTIVE" ? "Active" : "Closed"}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0C8C5E]/10 text-[#0C8C5E]">
          <Building2 size={21} />
        </span>
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold text-gray-900">
            {flat ? `${flat.block} · ${flat.flatNumber}` : "Society flat"}
          </h2>
          <p className="mt-1 truncate text-sm text-gray-500">
            {listing.society?.name || "Your society"}
          </p>
        </div>
      </div>

      <p className="mt-5 text-2xl font-semibold tracking-tight text-[#083D33]">
        {money(listing.amount)}
        {listing.listingType === "RENT" && (
          <span className="text-sm font-medium text-gray-500"> / month</span>
        )}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4">
        <div>
          <dt className="text-xs text-gray-500">Configuration</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900">
            {flat?.flatType || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Floor</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900">
            {flat?.floor ?? "—"}
          </dd>
        </div>
        {flat?.area !== undefined && (
          <div>
            <dt className="text-xs text-gray-500">Area</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              {flat.area} sq. ft.
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-gray-500">
            {mine ? "Listed" : "Available since"}
          </dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900">
            {dateLabel(listing.createdAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Listed by</p>
          <p className="mt-0.5 truncate text-sm font-medium text-gray-800">
            {listing.owner?.name || "Resident"}
          </p>
        </div>
        {listing.owner?.phoneNumber ? (
          <a
            href={`tel:${listing.owner.phoneNumber}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#0C8C5E]/20 px-3 py-2 text-sm font-semibold text-[#08764F] hover:bg-emerald-50"
          >
            <Phone size={14} /> Contact
          </a>
        ) : (
          !mine && (
            <span className="text-xs text-gray-500">Contact not shared</span>
          )
        )}
        {mine && listing.status === "ACTIVE" && (
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => onEdit(listing)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Edit
            </button>
            <button
              disabled={busy}
              onClick={() => onClose(listing)}
              className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Close listing
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function ResidentMarketplacePage() {
  const [view, setView] = useState<View>("browse");
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listingTypeFilter, setListingTypeFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyListingId, setBusyListingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyListing | null>(null);
  const [form, setForm] = useState(initialForm);
  const [assignedFlat, setAssignedFlat] = useState<AssignedFlat | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/users/flats`, { credentials: "include" })
      .then(async (response) => {
        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
          checkUser?: { flat?: AssignedFlat | null };
        };
        if (!response.ok || !result.success)
          throw new Error(
            result.message || "Could not load your assigned flat.",
          );
        return result.checkUser?.flat ?? null;
      })
      .then((flat) => {
        if (active) setAssignedFlat(flat);
      })
      .catch(() => {
        if (active) setAssignedFlat(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result =
        view === "browse"
          ? await getSocietyListings({
              page,
              limit: 12,
              listingType: listingTypeFilter,
              minAmount,
              maxAmount,
            })
          : await getMyListings({ page, limit: 12 });
      setListings(result.listings);
      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load listings.",
      );
    } finally {
      setLoading(false);
    }
  }, [view, page, listingTypeFilter, minAmount, maxAmount]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  function startCreate() {
    setEditing(null);
    setForm(initialForm);
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  function startEdit(listing: PropertyListing) {
    setEditing(listing);
    setForm({
      listingType: listing.listingType,
      amount: String(listing.amount),
      showContact: listing.showContact,
    });
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await updateListing(editing._id, payload);
      else await createListing(payload);
      setFormOpen(false);
      setView("mine");
      setPage(1);
      setMessage(
        editing
          ? "Your listing was updated."
          : "Your flat is now listed for residents in your society.",
      );
      // The view/page changes above trigger loadListings through its effect.
      // Calling the current callback here would still use the old browse state.
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save your listing.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function closePropertyListing(listing: PropertyListing) {
    if (
      !window.confirm(
        "Close this listing? It will no longer appear in the society marketplace.",
      )
    )
      return;
    setBusyListingId(listing._id);
    setError("");
    setMessage("");
    try {
      await closeListing(listing._id);
      setMessage("Your listing is closed.");
      await loadListings();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not close this listing.",
      );
    } finally {
      setBusyListingId("");
    }
  }

  function switchView(nextView: View) {
    setView(nextView);
    setPage(1);
    setError("");
    setMessage("");
    setFormOpen(false);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0C8C5E]">
            Resident workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
            Society Marketplace
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Find a home in your community or list your own flat for sale or
            rent.
          </p>
        </div>
        {view === "mine" && (
          <button
            onClick={startCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white hover:bg-[#08764F]"
          >
            <Plus size={17} /> List my flat
          </button>
        )}
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

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div
          className="inline-flex w-fit rounded-lg bg-gray-100 p-1"
          role="tablist"
          aria-label="Marketplace views"
        >
          <button
            role="tab"
            aria-selected={view === "browse"}
            onClick={() => switchView("browse")}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${view === "browse" ? "bg-white text-[#083D33] shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            <Search size={15} className="mr-1.5 inline" />
            Browse homes
          </button>
          <button
            role="tab"
            aria-selected={view === "mine"}
            onClick={() => switchView("mine")}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${view === "mine" ? "bg-white text-[#083D33] shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            <Home size={15} className="mr-1.5 inline" />
            My listings
          </button>
        </div>
        {view === "browse" && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <select
              aria-label="Filter by listing type"
              value={listingTypeFilter}
              onChange={(event) => {
                setListingTypeFilter(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800"
            >
              <option value="">Sale and rent</option>
              <option value="SALE">For sale</option>
              <option value="RENT">For rent</option>
            </select>
            <input
              aria-label="Minimum price"
              inputMode="numeric"
              type="number"
              min="1"
              placeholder="Min ₹"
              value={minAmount}
              onChange={(event) => {
                setMinAmount(event.target.value);
                setPage(1);
              }}
              className="h-10 min-w-0 rounded-md border border-gray-300 px-3 text-sm sm:w-28"
            />
            <input
              aria-label="Maximum price"
              inputMode="numeric"
              type="number"
              min="1"
              placeholder="Max ₹"
              value={maxAmount}
              onChange={(event) => {
                setMaxAmount(event.target.value);
                setPage(1);
              }}
              className="h-10 min-w-0 rounded-md border border-gray-300 px-3 text-sm sm:w-28"
            />
          </div>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={submitListing}
          className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Edit your listing" : "List your flat"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Flat details are filled from the flat assigned to your account.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close form"
              onClick={() => setFormOpen(false)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
          {assignedFlat ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-gray-50 px-4 py-3 text-sm">
              <span className="font-semibold text-gray-900">
                {assignedFlat.block} · {assignedFlat.flatNumber}
              </span>
              <span className="text-gray-600">{assignedFlat.flatType}</span>
              <span className="text-gray-600">Floor {assignedFlat.floor}</span>
              {assignedFlat.area !== undefined && (
                <span className="text-gray-600">
                  {assignedFlat.area} sq. ft.
                </span>
              )}
            </div>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              There is no flat assigned to your account. Contact your society
              secretary before creating a listing.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-gray-700">
              Listing type
              <select
                value={form.listingType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    listingType: event.target.value as ListingType,
                  })
                }
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 font-normal"
              >
                <option value="SALE">For sale</option>
                <option value="RENT">For rent</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-gray-700">
              {form.listingType === "SALE"
                ? "Asking price (₹)"
                : "Monthly rent (₹)"}
              <input
                required
                type="number"
                inputMode="numeric"
                min="1"
                max="1000000000000"
                step="1"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
                className="h-10 w-full rounded-md border border-gray-300 px-3 font-normal outline-none focus:border-[#0C8C5E]"
              />
            </label>
          </div>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.showContact}
              onChange={(event) =>
                setForm({ ...form, showContact: event.target.checked })
              }
              className="mt-0.5 accent-[#0C8C5E]"
            />
            <span>
              <span className="font-medium">Show my phone number</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Your number will be visible only to residents signed in to your
                society.
              </span>
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy || !assignedFlat}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white hover:bg-[#08764F] disabled:opacity-60"
            >
              {busy ? (
                "Saving…"
              ) : (
                <>
                  <Check size={16} />
                  {editing ? "Save changes" : "Publish listing"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="h-10 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Loading marketplace listings"
        >
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#0C8C5E]">
            <Building2 size={22} />
          </span>
          <h2 className="mt-4 text-base font-semibold text-gray-900">
            {view === "browse" ? "No homes listed yet" : "You have no listings"}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
            {view === "browse"
              ? "There are no active sale or rental listings in your society right now."
              : "When you list your flat, you can manage or close it here."}
          </p>
          {view === "mine" && (
            <button
              onClick={startCreate}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-[#0C8C5E] px-4 text-sm font-semibold text-white hover:bg-[#08764F]"
            >
              <Plus size={16} /> List my flat
            </button>
          )}
        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                mine={view === "mine"}
                onEdit={startEdit}
                onClose={(item) => void closePropertyListing(item)}
                busy={busyListingId === listing._id}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
