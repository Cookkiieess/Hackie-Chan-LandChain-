import { Check, X } from "lucide-react";
import StatusBadge from "./StatusBadge";

const steps = [
  "Draft",
  "Sent to Buyer",
  "Buyer Signed",
  "Registrar Review",
  "Registrar Approved",
  "Panchayat Review",
  "Payment Pending",
  "Completed",
];

const statusToStep = {
  DRAFT: 1,
  SENT: 2,
  BUYER_SIGNED: 3,
  BUYER_DECLINED: 2,
  REGISTRAR_REVIEW: 4,
  REGISTRAR_APPROVED: 5,
  REGISTRAR_DECLINED: 5,
  PANCHAYAT_REVIEW: 6,
  PANCHAYAT_APPROVED: 7,
  PAYMENT_PENDING: 7,
  PANCHAYAT_DECLINED: 7,
  COMPLETED: 8,
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export default function ProgressTracker({ transfer }) {
  const activeStep = statusToStep[transfer.status] || 1;
  const isBuyerDeclined = transfer.status === "BUYER_DECLINED";
  const isRegistrarDeclined = transfer.status === "REGISTRAR_DECLINED";
  const isPanchayatDeclined = transfer.status === "PANCHAYAT_DECLINED";
  const isCompletedTransfer = transfer.status === "COMPLETED";

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">Transfer Progress</p>
          <p className="mt-1 text-sm text-slate-500">ULPIN: {transfer.ulpin}</p>
          <p className="text-sm text-slate-500">Transfer ID: {transfer.transferId}</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>Price: {formatCurrency(transfer.price)}</p>
          <p>
            Counterparty:{" "}
            {transfer.sellerUserId === sessionStorage.getItem("userId")
              ? transfer.buyerUserId
              : transfer.sellerUserId}
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <div className="flex min-w-[760px] items-start">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const completed =
              (stepNumber < activeStep && !isBuyerDeclined && !isRegistrarDeclined && !isPanchayatDeclined) ||
              (isCompletedTransfer && stepNumber === steps.length);
            const active = stepNumber === activeStep && !isCompletedTransfer;
            const declined =
              (isBuyerDeclined && stepNumber === 2) ||
              (isRegistrarDeclined && stepNumber === 5) ||
              (isPanchayatDeclined && stepNumber === 7);

            return (
              <div key={label} className="flex flex-1 items-start">
                <div className="flex w-full flex-col items-center text-center">
                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      declined
                        ? "border-red-500 bg-red-500 text-white"
                        : completed
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : active
                            ? "border-emerald-500 bg-white text-emerald-600"
                            : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {declined ? <X className="h-4 w-4" /> : completed ? <Check className="h-4 w-4" /> : null}
                    {active && !declined && !completed ? (
                      <span className="absolute h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
                    ) : null}
                  </div>
                  <p className="mt-3 max-w-[90px] text-xs font-medium text-slate-600">{label}</p>
                </div>
                {index < steps.length - 1 ? (
                  <div
                    className={`mt-5 h-1 flex-1 rounded-full ${
                      stepNumber < activeStep && !declined ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-3">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-600">Sub-Registrar</span>
          <StatusBadge
            approved={transfer.registrarAction?.approved}
            comment={transfer.registrarAction?.comment}
          />
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-600">Panchayat / Municipal</span>
          <StatusBadge
            approved={transfer.panchayatAction?.approved}
            comment={transfer.panchayatAction?.comment}
          />
        </div>
      </div>

      {transfer.status === "BUYER_DECLINED" ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <X className="h-4 w-4" /> Declined by Buyer
          </p>
          <p className="mt-2 text-sm text-red-700">
            <strong>Reason:</strong> {transfer.declineReason || "Declined by buyer due to validation verification check."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
