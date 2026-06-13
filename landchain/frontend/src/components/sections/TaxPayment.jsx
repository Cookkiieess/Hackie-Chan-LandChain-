import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getUserProperties, payPropertyTax } from "../../utils/api";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function TaxPayment({ userId }) {
  const [properties, setProperties] = useState([]);
  const [activePayment, setActivePayment] = useState(null);
  const [loadingId, setLoadingId] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProperties = async () => {
    try {
      const { data } = await getUserProperties(userId);
      setProperties(data);
    } catch (error) {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [userId]);

  const totalUnpaid = useMemo(
    () =>
      properties.reduce(
        (sum, property) =>
          sum +
          (property.taxRecords || []).reduce(
            (recordSum, record) =>
              recordSum + (String(record.status).toLowerCase() === "unpaid" ? record.amount : 0),
            0
          ),
        0
      ),
    [properties]
  );

  const handlePayNow = async (property, year) => {
    setLoadingId(`${property.ulpin}-${year}`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoadingId("");
    const record = (property.taxRecords || []).find((item) => Number(item.year) === Number(year));
    setActivePayment({
      ulpin: property.ulpin,
      year,
      amount: record.amount,
    });
  };

  const confirmTaxPayment = async () => {
    if (!upiId.trim()) {
      toast.error("Enter UPI ID to continue");
      return;
    }

    try {
      await payPropertyTax(activePayment.ulpin, activePayment.year);
      toast.success(`Tax payment of ${formatCurrency(activePayment.amount)} recorded`);
      setActivePayment(null);
      setUpiId("");
      await loadProperties();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to record tax payment");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between rounded-[28px] bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tax Payment</h1>
          <p className="text-sm text-slate-500">
            Review annual dues and clear outstanding property tax before transfer.
          </p>
        </div>
        <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
          Outstanding: {formatCurrency(totalUnpaid)}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-[24px] bg-white shadow-sm" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
          No properties available for tax payment yet.
        </div>
      ) : (
        <div className="space-y-5">
          {properties.map((property) => (
            <div key={property.ulpin} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{property.ulpin}</h2>
                  <p className="text-sm text-slate-500">{property.location}</p>
                  <p className="text-sm text-slate-500">Land ID: {property.landId}</p>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-medium">Year</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(property.taxRecords || []).map((record) => (
                      <tr key={`${property.ulpin}-${record.year}`} className="border-b border-slate-100">
                        <td className="py-4 text-slate-700">{record.year}</td>
                        <td className="py-4 text-slate-700">{formatCurrency(record.amount)}</td>
                        <td className="py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              record.status === "Paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="py-4">
                          {record.status === "Paid" ? (
                            <span className="text-slate-400">Recorded</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePayNow(property, record.year)}
                              disabled={loadingId === `${property.ulpin}-${record.year}`}
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
                            >
                              {loadingId === `${property.ulpin}-${record.year}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : null}
                              Pay Now
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activePayment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold text-slate-900">Mock UPI Payment</h2>
            <p className="mt-2 text-sm text-slate-500">
              Paying {formatCurrency(activePayment.amount)} for {activePayment.ulpin} ({activePayment.year})
            </p>
            <input
              type="text"
              value={upiId}
              onChange={(event) => setUpiId(event.target.value)}
              placeholder="Enter UPI ID"
              className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setActivePayment(null);
                  setUpiId("");
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTaxPayment}
                className="rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600"
              >
                Pay {formatCurrency(activePayment.amount)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
