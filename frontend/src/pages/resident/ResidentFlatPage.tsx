import { useEffect, useState } from "react";
import { Building2, Home, MapPin } from "lucide-react";

const API_BASE_URL = "http://localhost:3000/api/v1";

interface Flat {
  _id: string;
  flatNumber: string;
  block: string;
  floor: number;
  flatType: string;
  flatStatus: string;
  area?: number;
}

interface Society {
  name: string;
  address?: {
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  checkUser?: { flat?: T | null; society?: T | null };
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
  });
  const result = (await response.json()) as T & {
    success?: boolean;
    message?: string;
  };
  if (!response.ok || result.success === false)
    throw new Error(result.message || `Request failed (${response.status})`);
  return result;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function ResidentFlatPage() {
  const [flat, setFlat] = useState<Flat | null>(null);
  const [society, setSociety] = useState<Society | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let current = true;
    Promise.allSettled([
      getJson<ApiResponse<Flat>>("/users/flats"),
      getJson<ApiResponse<Society>>("/users/societies"),
    ])
      .then(([flatResult, societyResult]) => {
        if (!current) return;
        const nextErrors: string[] = [];
        if (flatResult.status === "fulfilled")
          setFlat(flatResult.value.checkUser?.flat ?? null);
        else
          nextErrors.push(
            flatResult.reason instanceof Error
              ? flatResult.reason.message
              : "Could not load flat details.",
          );
        if (societyResult.status === "fulfilled")
          setSociety(societyResult.value.checkUser?.society ?? null);
        else
          nextErrors.push(
            societyResult.reason instanceof Error
              ? societyResult.reason.message
              : "Could not load society details.",
          );
        setErrors(nextErrors);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const address = [
    society?.address?.addressLine,
    society?.address?.city,
    society?.address?.state,
    society?.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-medium text-[#0C8C5E]">Resident workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A]">
          My Flat
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Your home and society details.
        </p>
      </header>
      {errors.length > 0 && (
        <div
          role="alert"
          className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
      {loading ? (
        <div className="h-52 animate-pulse rounded-2xl bg-white" />
      ) : !flat ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
          <Home className="mx-auto text-gray-400" size={24} />
          <p className="mt-3 text-sm font-medium text-gray-800">
            No flat assigned
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Contact your society office to link a flat to your account.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-2xl bg-[#083D33] p-6 text-white shadow-sm sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#8FE0BC]">
                <Building2 size={23} />
              </span>
              <div>
                <p className="text-sm text-white/65">
                  {society?.name || "Society"}
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {flat.block} · {flat.flatNumber}
                </h2>
              </div>
            </div>
            <p className="mt-5 inline-flex items-center gap-2 text-sm text-white/75">
              <MapPin size={16} />
              {address || "Society address unavailable"}
            </p>
          </section>

          <section
            aria-label="Flat details"
            className="grid gap-3 sm:grid-cols-2"
          >
            <Detail label="Flat number" value={flat.flatNumber} />
            <Detail label="Block" value={flat.block} />
            <Detail label="Floor" value={String(flat.floor)} />
            <Detail label="Flat type" value={flat.flatType} />
            <Detail
              label="Occupancy"
              value={flat.flatStatus.toLowerCase().replaceAll("_", " ")}
            />
            {flat.area !== undefined && (
              <Detail label="Area" value={`${flat.area} sq. ft.`} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
