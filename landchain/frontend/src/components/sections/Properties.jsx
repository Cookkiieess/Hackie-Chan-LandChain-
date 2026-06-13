import { MapPinned, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserProperties } from "../../utils/api";

function formatTaxRecord(record) {
  return `${record.year}: Rs. ${record.amount} - ${record.status}`;
}

export default function Properties({ userId }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProperties = async () => {
      try {
        const { data } = await getUserProperties(userId);
        if (mounted) {
          setProperties(data);
        }
      } catch (error) {
        if (mounted) {
          setProperties([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProperties();
    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between rounded-[28px] bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Properties</h1>
          <p className="text-sm text-slate-500">
            View every land parcel currently owned by this account.
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          {properties.length} owned
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-[24px] bg-white shadow-sm" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <MapPinned className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-slate-900">No properties owned yet</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Once a land parcel is fetched for you or transferred to you, it will appear here with its unique land ID.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {properties.map((property) => (
            <div key={property.landId} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Unique Land ID</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">{property.landId}</h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">ULPIN: {property.ulpin}</p>
                  <p className="text-sm font-medium text-slate-500">Internal Code: {property.internalCode}</p>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Owned Now
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Type</p>
                  <p className="mt-2 font-semibold text-slate-900">{property.type}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Area</p>
                  <p className="mt-2 font-semibold text-slate-900">{property.area}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Location</p>
                <p className="mt-2 font-semibold text-slate-900">{property.location}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {property.village}, {property.taluk}, {property.district}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <p className="font-semibold">Tax Records</p>
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {property.taxRecords?.length ? (
                    property.taxRecords.map((record) => (
                      <p key={`${property.landId}-${record.year}`}>{formatTaxRecord(record)}</p>
                    ))
                  ) : (
                    <p>No tax records available.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
