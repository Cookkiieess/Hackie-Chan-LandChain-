import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  FileText,
  Loader2,
  Scale,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  analyzeProperty,
  confirmPayment,
  fetchProperty,
  getUserTransfers,
  initiateTransfer,
  sellerSign,
} from "../../utils/api";
import { generateSaleDeed } from "../../utils/generateDeed";
import ProgressTracker from "../shared/ProgressTracker";

const STEP = {
  ULPIN_ENTRY: "ULPIN_ENTRY",
  FETCHING: "FETCHING",
  OVERVIEW: "OVERVIEW",
  BUYER_DETAILS: "BUYER_DETAILS",
  SENT: "SENT",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function riskStyles(level) {
  if (level === "HIGH") {
    return {
      wrap: "bg-red-50 text-red-700 border-red-200",
      text: "High Risk - Serious concerns found",
    };
  }

  if (level === "MEDIUM") {
    return {
      wrap: "bg-amber-50 text-amber-700 border-amber-200",
      text: "Medium Risk - Review flags",
    };
  }

  return {
    wrap: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "Low Risk - No concerns found",
  };
}

function PaymentCard({ transfer, onConfirm, pendingPaymentId, paymentRefs, setPaymentRefs }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">UPI Payment</p>
          <p className="text-sm text-slate-500">
            Buyer must complete the final transfer payment to close the chain.
          </p>
        </div>
        <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
          Pending Payment
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_180px]">
        <div className="space-y-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Amount</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(transfer.price)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">UPI ID</p>
            <p className="mt-1 font-semibold text-slate-900">landchain@upi</p>
          </div>
          <input
            type="text"
            value={paymentRefs[transfer.transferId] || ""}
            onChange={(event) =>
              setPaymentRefs((current) => ({
                ...current,
                [transfer.transferId]: event.target.value,
              }))
            }
            placeholder="Enter UPI Transaction ID"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => onConfirm(transfer)}
            disabled={pendingPaymentId === transfer.transferId}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
          >
            {pendingPaymentId === transfer.transferId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Confirm Payment
          </button>
        </div>

        <div className="flex items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50">
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-slate-200 text-sm font-medium text-slate-500">
            QR Placeholder
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Transfer({ userId }) {
  const [step, setStep] = useState(STEP.ULPIN_ENTRY);
  const [ulpin, setUlpin] = useState("");
  const [agreementConditions, setAgreementConditions] = useState("");
  const [buyerUserId, setBuyerUserId] = useState("");
  const [price, setPrice] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [combinedData, setCombinedData] = useState(null);
  const [geminiSummary, setGeminiSummary] = useState(null);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [pendingPaymentId, setPendingPaymentId] = useState("");
  const [paymentRefs, setPaymentRefs] = useState({});
  const [recentSignedTransfer, setRecentSignedTransfer] = useState(null);

  const visibleTransfers = useMemo(
    () =>
      transfers.filter(
        (transfer) => transfer.sellerUserId === userId || transfer.buyerUserId === userId
      ),
    [transfers, userId]
  );

  const loadTransfers = async () => {
    try {
      const { data } = await getUserTransfers(userId);
      setTransfers(data);
    } catch (error) {
      setTransfers([]);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, [userId]);

  const handleFetch = async () => {
    if (!ulpin.trim()) {
      setFetchError("ULPIN cannot be empty.");
      return;
    }

    setFetchError("");
    setStep(STEP.FETCHING);
    setLoadingPhase(0);

    const loadingSequence = [1, 2, 3, 4];
    loadingSequence.forEach((value, index) => {
      setTimeout(() => setLoadingPhase(value), index * 800);
    });

    try {
      const { data: fetched } = await fetchProperty(ulpin.trim(), userId);
      const analyzePayload = {
        revenue: fetched.revenueData,
        kaveri: fetched.kaveriData,
        court: fetched.courtData,
      };
      const { data: analysis } = await analyzeProperty(ulpin.trim(), analyzePayload);
      setCombinedData(fetched);
      setGeminiSummary(analysis.geminiSummary);
      setStep(STEP.OVERVIEW);
    } catch (error) {
      toast.error("Failed to fetch and analyze land records");
      setStep(STEP.ULPIN_ENTRY);
    }
  };

  const handleSendAgreement = async () => {
    if (!buyerUserId.trim()) {
      toast.error("Buyer User ID is required");
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error("Sale price must be greater than zero");
      return;
    }

    setSubmitting(true);
    try {
      const { data: initiated } = await initiateTransfer({
        sellerUserId: userId,
        ulpin: combinedData.ulpin,
        agreementConditions,
        price: Number(price),
        buyerUserId,
        geminiSummary,
        flags: geminiSummary?.flags || [],
      });
      await sellerSign(initiated.transferId);
      setRecentSignedTransfer({
        transferId: initiated.transferId,
        status: "SENT",
        ulpin: combinedData.ulpin,
        sellerUserId: userId,
        buyerUserId,
        price: Number(price),
        agreementConditions,
        geminiSummary,
        flags: geminiSummary?.flags || [],
        sellerSignature: {
          signed: true,
          timestamp: new Date().toISOString(),
        },
        buyerSignature: {
          signed: false,
          timestamp: null,
        },
        createdAt: new Date().toISOString(),
      });
      toast.success("Agreement sent! Waiting for buyer's response.");
      setStep(STEP.SENT);
      await loadTransfers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send agreement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async (transfer) => {
    const paymentRef = paymentRefs[transfer.transferId];

    if (!paymentRef?.trim()) {
      toast.error("Enter a UPI transaction ID first");
      return;
    }

    setPendingPaymentId(transfer.transferId);
    try {
      await confirmPayment(transfer.transferId, paymentRef);
      toast.success("Payment confirmed! Transfer completed and ownership updated.");
      setPaymentRefs((current) => ({
        ...current,
        [transfer.transferId]: "",
      }));
      await loadTransfers();
    } catch (error) {
      toast.error("Failed to confirm payment");
    } finally {
      setPendingPaymentId("");
    }
  };

  const riskBanner = riskStyles(geminiSummary?.riskLevel);
  const overview = combinedData?.revenueData;
  const loadingCards = [
    { icon: Building2, label: "Revenue Department (Bhoomi/ROR)" },
    { icon: FileText, label: "Sub-Registrar Office (Kaveri 2.0)" },
    { icon: Scale, label: "District Court Records" },
  ];

  const handleDownloadSellerCopy = async () => {
    if (!recentSignedTransfer) {
      return;
    }

    await generateSaleDeed(recentSignedTransfer, {
      seller: {
        name: sessionStorage.getItem("name") || recentSignedTransfer.sellerName || recentSignedTransfer.sellerUserId,
        userId,
        timestamp: recentSignedTransfer.sellerSignature?.timestamp,
        signed: true,
      },
      buyer: {
        name: recentSignedTransfer.buyerName || recentSignedTransfer.buyerUserId,
        userId: recentSignedTransfer.buyerUserId,
        timestamp: null,
        signed: false,
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
  };

  const handleDownloadFinalDeed = async (transfer) => {
    await generateSaleDeed(transfer, {
      seller: {
        name: transfer.sellerName || transfer.sellerUserId,
        userId: transfer.sellerUserId,
        timestamp: transfer.sellerSignature?.timestamp,
        signed: true,
      },
      buyer: {
        name: transfer.buyerName || transfer.buyerUserId,
        userId: transfer.buyerUserId,
        timestamp: transfer.buyerSignature?.timestamp,
        signed: true,
      },
      registrar: {
        name: "Registrar Officer",
        timestamp: transfer.registrarAction?.timestamp,
        signed: true,
      },
      panchayat: {
        name: "Panchayat Officer",
        timestamp: transfer.panchayatAction?.timestamp,
        signed: true,
      },
    });

    toast.success("Final Sale Deed downloaded successfully");
  };

  return (
    <section className="space-y-8">
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        {step === STEP.ULPIN_ENTRY ? (
          <div className="mx-auto max-w-xl py-12">
            <h1 className="text-3xl font-semibold text-slate-900">Start a Transfer</h1>
            <p className="mt-2 text-sm text-slate-500">
              Fetch the land record trail before sending an agreement to the buyer.
            </p>
            <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
              <label className="mb-3 block text-sm font-medium text-slate-700">
                Enter Land ULPIN
              </label>
              <input
                type="text"
                value={ulpin}
                onChange={(event) => setUlpin(event.target.value.toUpperCase())}
                placeholder="e.g. KA-MNG-142-3B"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              />
              <p className="mt-3 text-sm text-slate-500">
                Internal Code: <span className="font-semibold">LC-{ulpin || "..."}</span>
              </p>
              {fetchError ? <p className="mt-2 text-sm text-red-500">{fetchError}</p> : null}
              <button
                type="button"
                onClick={handleFetch}
                className="mt-6 w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600"
              >
                Fetch Land Records
              </button>
            </div>
          </div>
        ) : null}

        {step === STEP.FETCHING ? (
          <div className="mx-auto max-w-3xl py-10">
            <h1 className="text-3xl font-semibold text-slate-900">Fetching official records</h1>
            <p className="mt-2 text-sm text-slate-500">
              LandChain is aggregating records from the core offices one by one.
            </p>
            <div className="mt-8 space-y-4">
              {loadingCards.map((item, index) => {
                const Icon = item.icon;
                const visible = loadingPhase >= index + 1;

                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition ${
                      visible ? "opacity-100 translate-y-0" : "translate-y-3 opacity-30"
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.label}</p>
                    </div>
                    {visible ? <Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> : null}
                  </div>
                );
              })}

              <div
                className={`flex items-center gap-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 transition ${
                  loadingPhase === 4 ? "opacity-100 translate-y-0" : "translate-y-3 opacity-0"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="font-semibold text-emerald-800">Gemini AI is analyzing records...</p>
                <Loader2 className="ml-auto h-5 w-5 animate-spin text-emerald-500" />
              </div>
            </div>
          </div>
        ) : null}

        {step === STEP.OVERVIEW && overview && geminiSummary ? (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-emerald-700">
                    {geminiSummary.landDetails?.type || overview.landType}
                  </div>
                  <h1 className="mt-4 text-2xl font-semibold text-slate-900">{overview.area}</h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Survey No. {geminiSummary.landDetails?.surveyNumber || overview.surveyNumber}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Location</p>
                  <p>
                    {overview.village}, {overview.taluk}, {overview.district}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-[24px] border px-5 py-4 ${riskBanner.wrap}`}>
              <p className="font-semibold">{riskBanner.text}</p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                  <div className="mb-4 flex items-center gap-2 text-emerald-600">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                      AI Analysis
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-slate-600">{geminiSummary.summary}</p>
                  <div className="mt-6 space-y-4">
                    {geminiSummary.previousOwners?.map((owner, index) => (
                      <div key={`${owner}-${index}`} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className="h-3 w-3 rounded-full bg-emerald-500" />
                          {index < geminiSummary.previousOwners.length - 1 ? (
                            <span className="mt-1 h-full w-px bg-slate-200" />
                          ) : null}
                        </div>
                        <p className="pb-3 text-sm text-slate-600">{owner}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {geminiSummary.flags?.length ? (
                  <div className="space-y-3">
                    {geminiSummary.flags.map((flag) => (
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

                <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Agreement Conditions</h2>
                  <textarea
                    rows={4}
                    value={agreementConditions}
                    onChange={(event) => setAgreementConditions(event.target.value)}
                    placeholder="e.g. Property to be handed over vacant, no pending dues..."
                    className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(STEP.BUYER_DETAILS)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600"
                    >
                      Proceed
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Ownership History</h2>
                  <div className="mt-5 space-y-5">
                    {combinedData.kaveriData.registrationHistory.map((entry, index) => (
                      <div key={`${entry.year}-${entry.parties}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span className="h-3 w-3 rounded-full bg-slate-900" />
                          {index < combinedData.kaveriData.registrationHistory.length - 1 ? (
                            <span className="mt-1 h-full w-px bg-slate-200" />
                          ) : null}
                        </div>
                        <div className="pb-4">
                          <p className="font-semibold text-slate-900">
                            {entry.year} - {entry.type}
                          </p>
                          <p className="text-sm text-slate-500">{entry.parties}</p>
                          <p className="mt-1 text-sm text-slate-500">Value: Rs. {entry.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Tax Status</h2>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        String(geminiSummary.taxStatus || "").toLowerCase().includes("paid")
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {geminiSummary.taxStatus}
                    </span>
                  </div>
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    Encumbrances: {combinedData.kaveriData.encumbrances}
                    <br />
                    Mortgage: {combinedData.kaveriData.mortgageStatus}
                    <br />
                    Litigation: {combinedData.courtData.litigationStatus}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === STEP.BUYER_DETAILS && overview ? (
          <div className="mx-auto max-w-3xl space-y-6">
            <button
              type="button"
              onClick={() => setStep(STEP.OVERVIEW)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6">
              <h1 className="text-2xl font-semibold text-slate-900">Buyer Details</h1>
              <div className="mt-6 grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Buyer's User ID
                  </label>
                  <input
                    type="text"
                    value={buyerUserId}
                    onChange={(event) => setBuyerUserId(event.target.value.toUpperCase())}
                    placeholder="LC-XXXX"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Sale Price (Rs.)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="Enter final sale price"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="rounded-[24px] bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Agreement Preview</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">
                    {overview.village}, {overview.taluk}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{overview.area}</p>
                  <p className="mt-4 text-2xl font-semibold text-emerald-600">
                    {formatCurrency(price)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSendAgreement}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Send Agreement to Buyer
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {step === STEP.SENT ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-pulse">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-slate-900">
              Agreement Sent Successfully
            </h1>
            <p className="mt-3 max-w-md text-sm text-slate-500">Track progress below.</p>
            {recentSignedTransfer ? (
              <button
                type="button"
                onClick={handleDownloadSellerCopy}
                className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                Download My Copy
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Your Transfers</h2>
            <p className="text-sm text-slate-500">
              Monitor transfers where you are the seller or the buyer.
            </p>
          </div>
        </div>

        {visibleTransfers.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500">
            No transfers available yet.
          </div>
        ) : (
          <div className="space-y-5">
            {visibleTransfers.map((transfer) => (
              <div key={transfer.transferId} className="space-y-5">
                <ProgressTracker transfer={transfer} />
                {transfer.status === "PAYMENT_PENDING" && transfer.buyerUserId === userId ? (
                  <PaymentCard
                    transfer={transfer}
                    onConfirm={handleConfirmPayment}
                    pendingPaymentId={pendingPaymentId}
                    paymentRefs={paymentRefs}
                    setPaymentRefs={setPaymentRefs}
                  />
                ) : null}
                {transfer.status === "PAYMENT_PENDING" && transfer.sellerUserId === userId ? (
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Waiting for the buyer to complete the payment step.
                  </div>
                ) : null}
                {transfer.status === "COMPLETED" ? (
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-emerald-800">Transfer Completed Successfully</p>
                      <p className="text-sm text-emerald-700">
                        The ownership has been successfully updated on the blockchain.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadFinalDeed(transfer)}
                      className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Download Final Sale Deed
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
