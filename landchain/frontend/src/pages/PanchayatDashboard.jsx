import { CheckCircle2, Landmark, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getAllTransfers, panchayatApprove, panchayatDecline } from "../utils/api";
import { generateSaleDeed } from "../utils/generateDeed";

const mockTransfer = {
  transferId: "TXN-1718250200000",
  createdAt: new Date().toISOString(),
  ulpin: "KA-MNG-142-3B",
  sellerUserId: "LC-4821",
  buyerUserId: "LC-9043",
  price: 2400000,
  agreementConditions: "Vacant possession to be handed over within 30 days.",
  status: "PANCHAYAT_REVIEW",
  geminiSummary: {
    summary: "Local records show no unpaid dues or restrictions in this mocked packet.",
    riskLevel: "LOW",
    flags: [],
    landDetails: {
      area: "2.4 acres",
      location: "Hosahalli Village, Mangaluru Taluk",
    },
  },
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function AuthCard({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-[0_25px_70px_rgba(15,23,42,0.16)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Landmark className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-semibold text-slate-900">Panchayat Portal</h1>
        <div className="mt-8 space-y-4">
          <input
            type="text"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            placeholder="Username (panchayat)"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Password (panchayat123)"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => onLogin(form)}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PanchayatDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [lastApprovedTransfer, setLastApprovedTransfer] = useState(null);

  const loadTransfers = async () => {
    try {
      const { data } = await getAllTransfers();
      const pending = data.filter((item) => item.status === "PANCHAYAT_REVIEW");
      setTransfers(pending.length ? pending : [mockTransfer]);
    } catch (error) {
      setTransfers([mockTransfer]);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadTransfers();
    }
  }, [authenticated]);

  const pendingCount = useMemo(() => transfers.length, [transfers]);

  const handleLogin = ({ username, password }) => {
    if (username === "panchayat" && password === "panchayat123") {
      setAuthenticated(true);
      return;
    }

    toast.error("Invalid panchayat credentials");
  };

  const handleApprove = async (transferId) => {
    try {
      await panchayatApprove(transferId);
      toast.success("Approved. Transfer forwarded for payment.");
      const approvedTransfer = transfers.find((item) => item.transferId === transferId);
      if (approvedTransfer) {
        setLastApprovedTransfer({
          ...approvedTransfer,
          status: "PAYMENT_PENDING",
          panchayatAction: {
            approved: true,
            timestamp: new Date().toISOString(),
            comment: "",
          },
        });
      }
      setTransfers((current) => current.filter((item) => item.transferId !== transferId));
    } catch (error) {
      toast.error("Failed to approve transfer");
    }
  };

  const handleDecline = async (transferId) => {
    const comment = window.prompt("Enter decline reason");

    if (!comment) {
      return;
    }

    try {
      await panchayatDecline(transferId, comment);
      toast.success("Transfer declined");
      setTransfers((current) => current.filter((item) => item.transferId !== transferId));
    } catch (error) {
      toast.error("Failed to decline transfer");
    }
  };

  if (!authenticated) {
    return <AuthCard onLogin={handleLogin} />;
  }

  const handleDownloadMasterCopy = async () => {
    if (!lastApprovedTransfer) {
      return;
    }

    await generateSaleDeed(lastApprovedTransfer, {
      seller: {
        name: lastApprovedTransfer.sellerName || lastApprovedTransfer.sellerUserId,
        userId: lastApprovedTransfer.sellerUserId,
        timestamp: lastApprovedTransfer.sellerSignature?.timestamp,
        signed: true,
      },
      buyer: {
        name: lastApprovedTransfer.buyerName || lastApprovedTransfer.buyerUserId,
        userId: lastApprovedTransfer.buyerUserId,
        timestamp: lastApprovedTransfer.buyerSignature?.timestamp,
        signed: true,
      },
      registrar: {
        name: "Registrar Officer",
        timestamp: lastApprovedTransfer.registrarAction?.timestamp,
        signed: true,
      },
      panchayat: {
        name: "Panchayat Officer",
        timestamp: lastApprovedTransfer.panchayatAction?.timestamp,
        signed: true,
      },
    });

    toast.success("Master deed copy downloaded");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="rounded-[24px] bg-emerald-100 px-6 py-4 text-sm font-semibold text-emerald-900">
        PANCHAYAT VIEW - Gram Panchayat, Mangaluru - Official Government Portal
      </div>

      <div className="mt-6 flex items-center justify-between rounded-[28px] bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pending Transfer Approvals</h1>
          <p className="text-sm text-slate-500">Final local body review before payment collection.</p>
        </div>
        <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          {pendingCount} pending
        </div>
      </div>

      {lastApprovedTransfer ? (
        <div className="mt-6 flex items-center justify-between rounded-[24px] border border-emerald-200 bg-emerald-50 px-6 py-4">
          <div>
            <p className="font-semibold text-emerald-800">Master copy ready</p>
            <p className="text-sm text-emerald-700">
              Transfer {lastApprovedTransfer.transferId} now has the fully approved deed copy.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadMasterCopy}
            className="rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Download Approved Copy
          </button>
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        {transfers.map((transfer) => (
          <div key={transfer.transferId} className="grid gap-6 rounded-[28px] bg-white p-6 shadow-sm xl:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Transfer</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">{transfer.transferId}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(transfer.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="grid gap-4 rounded-[24px] bg-slate-50 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Property</p>
                  <p className="mt-1 font-semibold text-slate-900">{transfer.ulpin}</p>
                  <p className="text-sm text-slate-500">{transfer.geminiSummary?.landDetails?.location}</p>
                  <p className="text-sm text-slate-500">{transfer.geminiSummary?.landDetails?.area}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Financials</p>
                  <p className="mt-1 font-semibold text-emerald-600">{formatCurrency(transfer.price)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Seller</p>
                  <p className="mt-1 font-semibold text-slate-900">{transfer.sellerUserId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Buyer</p>
                  <p className="mt-1 font-semibold text-slate-900">{transfer.buyerUserId}</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Agreement conditions</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {transfer.agreementConditions || "No special agreement conditions added."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 p-5">
                <h3 className="text-lg font-semibold text-slate-900">AI Analysis Report</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{transfer.geminiSummary?.summary}</p>
                <div className="mt-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {transfer.geminiSummary?.riskLevel || "LOW"} Risk
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 p-5">
                <h3 className="text-lg font-semibold text-slate-900">Local Validation Checklist</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Mutation request packet received</p>
                  <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Local tax ledger checked</p>
                  <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Encumbrance note reviewed</p>
                  <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Registrar approval attached</p>
                </div>
              </div>

              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready to forward for payment on approval.
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleDecline(transfer.transferId)}
                  className="flex-1 rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(transfer.transferId)}
                  className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600"
                >
                  Approve & Sign Digitally
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
