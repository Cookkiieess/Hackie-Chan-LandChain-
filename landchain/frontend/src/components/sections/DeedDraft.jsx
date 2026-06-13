import { FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { buyerDecline, buyerSign, getUserTransfers } from "../../utils/api";
import AgreementModal from "../shared/AgreementModal";
import ProgressTracker from "../shared/ProgressTracker";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export default function DeedDraft({ userId }) {
  const [transfers, setTransfers] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const loadTransfers = async () => {
    try {
      const { data } = await getUserTransfers(userId);
      setTransfers(data.filter((item) => item.buyerUserId === userId));
    } catch (error) {
      setTransfers([]);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, [userId]);

  const buyerTransfers = useMemo(() => transfers, [transfers]);

  const handleSign = async (transfer) => {
    try {
      const { data } = await buyerSign(transfer.transferId);
      const signedTransfer = {
        ...transfer,
        status: data.status,
        buyerSignature: {
          signed: true,
          timestamp: new Date().toISOString(),
        },
      };
      setSelectedTransfer(null);
      await loadTransfers();
      return signedTransfer;
    } catch (error) {
      toast.error("Failed to sign agreement");
      throw error;
    }
  };

  const handleDecline = async (transfer) => {
    try {
      await buyerDecline(transfer.transferId);
      toast.success("Agreement declined");
      setSelectedTransfer(null);
      await loadTransfers();
    } catch (error) {
      toast.error("Failed to decline agreement");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between rounded-[28px] bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Deed Draft</h1>
          <p className="text-sm text-slate-500">Review and sign property offers sent to you.</p>
        </div>
        <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
          {buyerTransfers.length} draft{buyerTransfers.length === 1 ? "" : "s"}
        </div>
      </div>

      {buyerTransfers.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
          No pending deed requests
        </div>
      ) : (
        <div className="space-y-5">
          {buyerTransfers.map((transfer) => (
            <div key={transfer.transferId} className="space-y-4">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="flex">
                  <div className="w-1.5 bg-violet-500" />
                  <div className="flex flex-1 items-start gap-4 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            Property offer from {transfer.sellerUserId}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {transfer.geminiSummary?.landDetails?.location || transfer.ulpin}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {transfer.geminiSummary?.landDetails?.area || "Area unavailable"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-emerald-600">
                            {formatCurrency(transfer.price)}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-500">{transfer.status}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedTransfer(transfer)}
                        className="mt-5 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        View Full Agreement
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <ProgressTracker transfer={transfer} />
            </div>
          ))}
        </div>
      )}

      {selectedTransfer ? (
        <AgreementModal
          transfer={selectedTransfer}
          onClose={() => setSelectedTransfer(null)}
          onSign={() => handleSign(selectedTransfer)}
          onDecline={() => handleDecline(selectedTransfer)}
          isBuyer
        />
      ) : null}
    </section>
  );
}
