import {
  Link as LinkIcon,
  ShieldCheck,
  AlertTriangle,
  GitFork,
  Clock,
  User,
  Database,
  Cpu,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getUserProperties, getBlockchain, verifyBlockchain } from "../../utils/api";
import toast from "react-hot-toast";

export default function BlockchainExplorer({ userId }) {
  const [properties, setProperties] = useState([]);
  const [selectedUlpin, setSelectedUlpin] = useState("");
  const [chain, setChain] = useState([]);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customUlpin, setCustomUlpin] = useState("");

  // Load user properties to populate default select dropdown
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const { data } = await getUserProperties(userId);
        setProperties(data);
        if (data.length > 0) {
          setSelectedUlpin(data[0].ulpin);
        }
      } catch (error) {
        setProperties([]);
      }
    };
    loadProperties();
  }, [userId]);

  // Load blockchain data whenever ULPIN changes
  useEffect(() => {
    if (!selectedUlpin) return;

    const loadChain = async () => {
      setLoading(true);
      try {
        const [chainRes, verifyRes] = await Promise.all([
          getBlockchain(selectedUlpin),
          verifyBlockchain(selectedUlpin),
        ]);
        // Handle new response structure { chain, integrity } or old array structure
        const chainData = chainRes.data && chainRes.data.chain ? chainRes.data.chain : (Array.isArray(chainRes.data) ? chainRes.data : []);
        setChain(chainData);

        const verifyData = verifyRes.data;
        if (verifyData && !verifyData.valid && !verifyData.invalidAt) {
          // Derives the invalid block ID from tamperedNodes or brokenLinks
          verifyData.invalidAt = verifyData.tamperedNodes?.[0] || verifyData.brokenLinks?.[0] || "Unknown Node";
        }
        setVerification(verifyData);
      } catch (error) {
        toast.error("Failed to load blockchain for ULPIN: " + selectedUlpin);
        setChain([]);
        setVerification(null);
      } finally {
        setLoading(false);
      }
    };

    loadChain();
  }, [selectedUlpin]);

  const handleCustomSearch = (e) => {
    e.preventDefault();
    if (customUlpin.trim()) {
      setSelectedUlpin(customUlpin.trim().toUpperCase());
      setCustomUlpin("");
    }
  };

  return (
    <section className="space-y-6">
      {/* Title Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Blockchain DAG Explorer</h1>
          <p className="text-sm text-slate-500">
            Cryptographically verify the chain of custody and lineage of land titles.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          <Database className="h-4 w-4" />
          Immutable Ledger
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Select Land Parcel</h2>

            {/* Select dropdown from owned properties */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your Properties
              </label>
              <select
                value={selectedUlpin}
                onChange={(e) => setSelectedUlpin(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500"
              >
                {properties.map((prop) => (
                  <option key={prop.ulpin} value={prop.ulpin}>
                    {prop.ulpin} ({prop.area})
                  </option>
                ))}
                {properties.length === 0 && (
                  <option value="">No properties fetched yet</option>
                )}
              </select>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-xs font-bold text-slate-400">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Direct ULPIN Search input */}
            <form onSubmit={handleCustomSearch} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Query Arbitrary ULPIN
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. KA-MNG-142-3B"
                  value={customUlpin}
                  onChange={(e) => setCustomUlpin(e.target.value)}
                  className="flex-grow rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>

          {/* Cryptographic Proof verification box */}
          {selectedUlpin && verification && (
            <div
              className={`rounded-[28px] border p-6 space-y-4 shadow-sm ${
                verification.valid
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-red-200 bg-red-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    verification.valid ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                  }`}
                >
                  {verification.valid ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Cryptographic Integrity</h3>
                  <p className="text-xs text-slate-500">Hash authentication result</p>
                </div>
              </div>

              {verification.valid ? (
                <div className="text-sm text-slate-700 leading-relaxed">
                  The blockchain ledger for <span className="font-semibold">{selectedUlpin}</span> has
                  been verified block-by-block. All digital signatures, hash links, and parent split references are
                  fully authenticated and un-tampered.
                </div>
              ) : (
                <div className="text-sm text-red-700 leading-relaxed">
                  Warning: Cryptographic verify failed at block index:{" "}
                  <code className="font-mono bg-red-100 px-1 py-0.5 rounded text-xs">
                    {verification.invalidAt}
                  </code>
                  . The block chain has been altered or contains invalid hash signatures!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side Visual Block Timeline */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white shadow-sm text-slate-500">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
              <p className="mt-4 text-sm font-semibold">Traversing block registry...</p>
            </div>
          ) : chain.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white text-center text-slate-500">
              <LinkIcon className="h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">No Blocks Found</h2>
              <p className="mt-1 text-sm text-slate-400 max-w-xs">
                Enter or select a ULPIN to fetch its blockchain custody records.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {chain.map((block, index) => {
                const isGenesis = index === 0;
                const isSplit = !!block.splitParentNodeId;

                return (
                  <div key={block.nodeId} className="flex flex-col items-center">
                    {/* Connecting line arrow */}
                    {!isGenesis && (
                      <div className="my-2 flex flex-col items-center gap-1 text-slate-400">
                        <ArrowDown className="h-5 w-5" />
                        {isSplit && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                            Fork/Split Linkage
                          </span>
                        )}
                      </div>
                    )}

                    <div className="w-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                              Block #{index}
                            </span>
                            {isGenesis ? (
                              <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Genesis
                              </span>
                            ) : isSplit ? (
                              <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 flex items-center gap-1">
                                <GitFork className="h-3 w-3" />
                                Split Genesis
                              </span>
                            ) : (
                              <span className="rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                Transfer
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-base font-bold text-slate-950 font-mono">
                            ID: {block.nodeId}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(block.timestamp).toLocaleString()}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
                        <div className="rounded-xl bg-slate-50 p-3.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Producer (POID)
                          </p>
                          <p className="mt-1 font-semibold text-slate-900 truncate">
                            {block.POID}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Consumer (COID)
                          </p>
                          <p className="mt-1 font-semibold text-slate-900 truncate flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {block.COID}
                          </p>
                        </div>
                      </div>

                      {/* Parent block reference for forks */}
                      {block.splitParentNodeId && (
                        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-3.5 flex items-center gap-2">
                          <GitFork className="h-4 w-4 text-indigo-500" />
                          <div className="text-xs">
                            <span className="font-bold text-indigo-800">Split Parent Node Pointer:</span>{" "}
                            <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-100 text-indigo-700">
                              {block.splitParentNodeId}
                            </code>
                          </div>
                        </div>
                      )}

                      {/* Cryptographic Hashes */}
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-slate-50 px-3 py-2 font-mono">
                          <span className="font-bold text-slate-400">Block Hash:</span>
                          <span className="font-semibold text-slate-700 break-all">
                            {block.blockHash}
                          </span>
                        </div>
                        {block.previousNodeId && (
                          <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-slate-50 px-3 py-2 font-mono">
                            <span className="font-bold text-slate-400">Prev Block Hash Pointer:</span>
                            <span className="font-semibold text-slate-700 break-all">
                              {block.previousNodeId}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
