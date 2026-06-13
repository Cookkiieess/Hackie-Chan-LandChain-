import { AlertTriangle, FileText, ShieldCheck, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { generateSaleDeed } from "../../utils/generateDeed";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function riskClass(level) {
  if (level === "HIGH") {
    return "bg-red-100 text-red-700";
  }
  if (level === "MEDIUM") {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-emerald-100 text-emerald-700";
}

export default function AgreementModal({ transfer, onClose, onSign, onDecline, isBuyer }) {
  const detail = transfer.geminiSummary?.landDetails || {};

  const handleBuyerSign = async () => {
    try {
      const signedTransfer = await onSign();
      const buyerName = sessionStorage.getItem("name") || transfer.buyerUserId || "Buyer";

      await generateSaleDeed(signedTransfer || transfer, {
        seller: {
          name: transfer.sellerName || transfer.sellerUserId || "Seller",
          userId: transfer.sellerUserId,
          timestamp: transfer.sellerSignature?.timestamp,
          signed: true,
        },
        buyer: {
          name: buyerName || transfer.buyerName || transfer.buyerUserId || "Buyer",
          userId: transfer.buyerUserId,
          timestamp: signedTransfer?.buyerSignature?.timestamp || new Date().toISOString(),
          signed: true,
        },
        registrar: {
          name: "Registrar Officer",
          timestamp: null,
          signed: false,
        },
        panchayat: {
          name: "Panchayat Officer",
          timestamp: null,
          signed: false,
        },
      });

      toast.success("Sale Deed downloaded successfully");
    } catch (error) {
      // `onSign` already surfaces the failure toast.
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 px-4 py-6">
      <div className="mx-auto max-w-5xl rounded-[28px] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[28px] border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Property Transfer Agreement</h2>
            <p className="text-sm text-slate-500">Transfer ID: {transfer.transferId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-[24px] border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Property Details</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">ULPIN</p>
                <p className="mt-1 font-medium text-slate-800">{transfer.ulpin}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Area</p>
                <p className="mt-1 font-medium text-slate-800">{detail.area || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Type</p>
                <p className="mt-1 font-medium text-slate-800">{detail.type || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Survey Number</p>
                <p className="mt-1 font-medium text-slate-800">{detail.surveyNumber || "N/A"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Location: {detail.location || "N/A"}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Ownership History</h3>
            <div className="mt-4 space-y-4">
              {transfer.geminiSummary?.previousOwners?.map((owner, index) => (
                <div key={`${owner}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="h-3 w-3 rounded-full bg-slate-900" />
                    {index < transfer.geminiSummary.previousOwners.length - 1 ? (
                      <span className="mt-1 h-full w-px bg-slate-200" />
                    ) : null}
                  </div>
                  <p className="pb-3 text-sm text-slate-600">{owner}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-semibold">AI Analysis</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${riskClass(transfer.geminiSummary?.riskLevel)}`}>
                {transfer.geminiSummary?.riskLevel || "LOW"}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{transfer.geminiSummary?.summary}</p>
          </div>

          {transfer.geminiSummary?.flags?.length ? (
            <div className="space-y-3">
              {transfer.geminiSummary.flags.map((flag) => (
                <div
                  key={flag}
                  className="flex items-start gap-3 rounded-[20px] border border-red-200 bg-red-50 p-4 text-red-700"
                >
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm">{flag}</p>
                </div>
              ))}
            </div>
          ) : null}

          {transfer.agreementConditions ? (
            <div className="rounded-[24px] border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-slate-900">
                <FileText className="h-5 w-5 text-slate-500" />
                <h3 className="text-lg font-semibold">Agreement Conditions</h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{transfer.agreementConditions}</p>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[24px] border border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Financial Details</h3>
              <p className="mt-4 text-3xl font-semibold text-emerald-600">
                {formatCurrency(transfer.price)}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Tax status: {transfer.geminiSummary?.taxStatus || "Not available"}
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Seller Signature</h3>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-800">Seller User ID: {transfer.sellerUserId}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Timestamp:{" "}
                  {transfer.sellerSignature?.timestamp
                    ? new Date(transfer.sellerSignature.timestamp).toLocaleString()
                    : "Not signed yet"}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Digitally Signed
                </div>
              </div>
            </div>
          </div>

          {isBuyer && transfer.status === "SENT" ? (
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={onDecline}
                className="rounded-2xl border border-red-200 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleBuyerSign}
                className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600"
              >
                Agree & Sign Digitally
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
