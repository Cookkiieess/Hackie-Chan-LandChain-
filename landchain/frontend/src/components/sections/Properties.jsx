import { MapPinned, ShieldCheck, GitFork, ArrowRight, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserProperties, splitProperty, fetchProperty } from "../../utils/api";
import toast from "react-hot-toast";

function formatTaxRecord(record) {
  return `${record.year}: Rs. ${record.amount} - ${record.status}`;
}

export default function Properties({ userId, setActiveSection, setTransferPrefill }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-properties");
  
  // Split Modal State
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [splits, setSplits] = useState([]);
  const [splitLoading, setSplitLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);

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

  const handleOpenSplitModal = async (property) => {
    const toastId = toast.loading("Checking approved divisions in registry...");
    try {
      const { data } = await fetchProperty(property.ulpin, userId);

      if (!data.revenueData?.divisions || data.revenueData.divisions.length < 2) {
        toast.error("This property does not have approved divisions in the official database. Division blocked.", { id: toastId });
        return;
      }

      toast.success("Predefined sub-divisions verified!", { id: toastId });
      setSelectedProperty(property);
      setSplits(
        data.revenueData.divisions.map((d) => ({
          ulpin: d.ulpin,
          area: d.area,
          targetBuyerUserId: "",
          targetSalePrice: "",
        }))
      );
      setShowSplitModal(true);
    } catch (err) {
      toast.error("Failed to verify approved divisions.", { id: toastId });
    }
  };

  const addSplit = () => {
    const nextLetter = String.fromCharCode(65 + splits.length); // A, B, C...
    setSplits([
      ...splits,
      { ulpin: `${selectedProperty.ulpin}/${nextLetter}`, area: "", targetBuyerUserId: "", targetSalePrice: "" }
    ]);
  };

  const removeSplit = (index) => {
    if (splits.length <= 2) {
      toast.error("A property split requires at least 2 child parcels.");
      return;
    }
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSplitChange = (index, field, value) => {
    setSplits(
      splits.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSplitSubmit = async (e) => {
    e.preventDefault();

    for (const s of splits) {
      if (!s.ulpin.trim() || !s.area.trim() || !s.targetBuyerUserId.trim() || !s.targetSalePrice) {
        toast.error("Please fill in all details for all split parcels.");
        return;
      }
    }

    setSplitLoading(true);
    setLoadingPhase(0);

    try {
      await splitProperty(selectedProperty.ulpin, splits.map(s => ({
        ulpin: s.ulpin.toUpperCase().trim(),
        area: s.area.trim(),
        targetBuyerUserId: s.targetBuyerUserId.toUpperCase().trim(),
        targetSalePrice: Number(s.targetSalePrice)
      })));

      toast.success("Survey request registered! Simulating government verification...");

      const phases = [
        "Notifying Revenue Department...",
        "Assigning Government Surveyor...",
        "Verifying boundary coordinates on-site...",
        "Adding split nodes to the blockchain...",
        "Division completed! Check your inbox."
      ];

      for (let i = 0; i < phases.length; i++) {
        setLoadingPhase(i);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setLoadingPhase(phases.length);

      toast.success("Land division complete!");
      setShowSplitModal(false);
      await loadProperties();
      setActiveTab("divided-properties");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to submit survey request.");
      setSplitLoading(false);
    }
  };

  const handleInitiateSplitTransfer = (property) => {
    if (setTransferPrefill && setActiveSection) {
      setTransferPrefill({
        ulpin: property.ulpin,
        buyerUserId: property.targetBuyerUserId,
        price: property.targetSalePrice,
      });
      setActiveSection("transfer");
      toast.success(`Prefilled transfer details for child property ${property.ulpin}`);
    }
  };

  // Filter properties
  const myProperties = properties.filter(
    (p) => !p.isDivided && (!p.parentUlpin || !p.targetBuyerUserId || p.targetBuyerUserId === userId)
  );

  const dividedProperties = properties.filter(
    (p) => p.parentUlpin && p.targetBuyerUserId && p.targetBuyerUserId !== userId
  );

  return (
    <section className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Properties Registry</h1>
          <p className="text-sm text-slate-500">
            View every land parcel currently owned or divided under your account.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            {myProperties.length} active
          </span>
          {dividedProperties.length > 0 && (
            <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
              {dividedProperties.length} divided
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("my-properties")}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === "my-properties"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          My Properties ({myProperties.length})
        </button>
        <button
          onClick={() => setActiveTab("divided-properties")}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === "divided-properties"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Divided Properties ({dividedProperties.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-[24px] bg-white shadow-sm" />
          ))}
        </div>
      ) : activeTab === "my-properties" ? (
        // Active Properties Tab
        myProperties.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <MapPinned className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">No active properties owned yet</h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Once a land parcel is fetched for you or transferred to you, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {myProperties.map((property) => (
              <div key={property.landId} className="flex flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Unique Land ID</p>
                      <h2 className="mt-1 text-2xl font-semibold text-slate-900">{property.landId}</h2>
                      <p className="mt-2 text-sm font-medium text-slate-500">ULPIN: {property.ulpin}</p>
                      {property.parentUlpin && (
                        <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block mt-1">
                          Split from: {property.parentUlpin}
                        </p>
                      )}
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                      Active
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
                        <p className="text-xs text-slate-500">No tax records available (Paid by default for split parcels).</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenSplitModal(property)}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  <GitFork className="h-4 w-4" />
                  Initiate Property Split
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        // Divided Properties Tab
        dividedProperties.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <GitFork className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">No divided properties yet</h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              When you initiate a split and the survey is completed, child properties awaiting transfer will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {dividedProperties.map((property) => (
              <div key={property.landId} className="flex flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Child Land ID</p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-900">{property.landId}</h2>
                      <p className="mt-2 text-sm font-medium text-slate-500">ULPIN: {property.ulpin}</p>
                      <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block mt-1">
                        Parent ULPIN: {property.parentUlpin}
                      </p>
                    </div>
                    <div className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                      Divided Child
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Child Area</p>
                      <p className="mt-2 font-semibold text-slate-900">{property.area}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Target Buyer ID</p>
                      <p className="mt-2 font-semibold text-slate-950 truncate">{property.targetBuyerUserId}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pre-Agreed Price</p>
                    <p className="mt-2 text-lg font-bold text-emerald-600">
                      Rs. {new Intl.NumberFormat("en-IN").format(property.targetSalePrice)}
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Location</p>
                    <p className="mt-2 font-semibold text-slate-900">{property.location}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleInitiateSplitTransfer(property)}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <ArrowRight className="h-4 w-4" />
                  Initiate Split Transfer
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Split survey modal */}
      {showSplitModal && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-[32px] bg-white p-8 shadow-2xl transition-all my-8">
            {splitLoading ? (
              // Split progress state
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-16 w-16 animate-spin text-emerald-500" />
                <h3 className="mt-6 text-2xl font-bold text-slate-900">Simulating Government Survey</h3>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  The Revenue Department is verifying coordinates and assigning surveyors.
                </p>

                <div className="mt-8 w-full max-w-md space-y-3">
                  {[
                    "Notifying Revenue Department...",
                    "Assigning Government Surveyor...",
                    "Verifying boundary coordinates on-site...",
                    "Adding split nodes to the blockchain...",
                    "Division completed! Check your inbox."
                  ].map((phase, idx) => (
                    <div
                      key={phase}
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                        loadingPhase > idx
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : loadingPhase === idx
                          ? "border-amber-200 bg-amber-50 text-amber-800 animate-pulse"
                          : "border-slate-100 bg-slate-50 text-slate-400"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          loadingPhase > idx
                            ? "bg-emerald-500 text-white"
                            : loadingPhase === idx
                            ? "bg-amber-500 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-sm font-semibold">{phase}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Form State
              <form onSubmit={handleSplitSubmit} className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Initiate Land Split Survey</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Request a division of property <span className="font-semibold">{selectedProperty.ulpin}</span> ({selectedProperty.area})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSplitModal(false)}
                    className="rounded-full bg-slate-100 p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  >
                    &times;
                  </button>
                </div>

                 <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-5">
                   {splits.map((split, index) => (
                     <div key={index} className="rounded-2xl border border-slate-200 p-5 space-y-4 relative bg-slate-50">
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-semibold text-slate-700">Parcel #{index + 1} (Predefined)</span>
                       </div>
 
                       <div className="grid gap-4 md:grid-cols-2">
                         <div>
                           <label className="block text-xs font-medium text-slate-500 mb-1">New ULPIN</label>
                           <input
                             type="text"
                             required
                             readOnly
                             value={split.ulpin}
                             className="w-full rounded-xl border border-slate-200 bg-slate-100 cursor-not-allowed px-3 py-2 text-sm outline-none"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-slate-500 mb-1">Area</label>
                           <input
                             type="text"
                             required
                             readOnly
                             value={split.area}
                             className="w-full rounded-xl border border-slate-200 bg-slate-100 cursor-not-allowed px-3 py-2 text-sm outline-none"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-slate-500 mb-1">Target Buyer User ID</label>
                           <input
                             type="text"
                             required
                             placeholder="e.g. LC-1002"
                             value={split.targetBuyerUserId}
                             onChange={(e) => handleSplitChange(index, "targetBuyerUserId", e.target.value.toUpperCase())}
                             className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-slate-500 mb-1">Pre-Agreed Price (Rs.)</label>
                           <input
                             type="number"
                             required
                             placeholder="Price in Rs."
                             value={split.targetSalePrice}
                             onChange={(e) => handleSplitChange(index, "targetSalePrice", e.target.value)}
                             className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                           />
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
 
                 <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                   <button
                     type="button"
                     onClick={() => setShowSplitModal(false)}
                     className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition"
                   >
                     Submit Split & Survey Request
                   </button>
                 </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
