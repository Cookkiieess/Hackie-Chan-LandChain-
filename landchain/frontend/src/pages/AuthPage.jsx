import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { login, signup } from "../utils/api";

const INITIAL_SIGNUP = {
  name: "",
  dob: "",
  aadhaarNumber: "",
  otp: "",
};

const INITIAL_LOGIN = {
  aadhaarNumber: "",
  otp: "",
};

function validateAadhaar(value) {
  return /^\d{12}$/.test(value);
}

function validateOtp(value) {
  return /^\d{6}$/.test(value);
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [signupForm, setSignupForm] = useState(INITIAL_SIGNUP);
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN);
  const [signupErrors, setSignupErrors] = useState({});
  const [loginErrors, setLoginErrors] = useState({});
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [sendingOtpFor, setSendingOtpFor] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const titleText = useMemo(
    () => (activeTab === "login" ? "Welcome back to LandChain" : "Create your LandChain identity"),
    [activeTab]
  );

  const persistSession = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("name", data.name);
  };

  const handleSendOtp = async (mode) => {
    setSendingOtpFor(mode);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (mode === "signup") {
      setSignupOtpSent(true);
    } else {
      setLoginOtpSent(true);
    }
    setSendingOtpFor("");
    toast.success("OTP sent to registered mobile");
  };

  const validateSignup = () => {
    const errors = {};

    if (!signupForm.name.trim()) {
      errors.name = "Full name is required.";
    }
    if (!signupForm.dob) {
      errors.dob = "Date of birth is required.";
    }
    if (!validateAadhaar(signupForm.aadhaarNumber)) {
      errors.aadhaarNumber = "Aadhaar number must be 12 digits.";
    }
    if (!validateOtp(signupForm.otp)) {
      errors.otp = "OTP must be 6 digits.";
    }

    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLogin = () => {
    const errors = {};

    if (!validateAadhaar(loginForm.aadhaarNumber)) {
      errors.aadhaarNumber = "Aadhaar number must be 12 digits.";
    }
    if (!validateOtp(loginForm.otp)) {
      errors.otp = "OTP must be 6 digits.";
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    if (!validateSignup()) {
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await signup(signupForm);
      persistSession(data);
      toast.success("Account created successfully");
      navigate("/home");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!validateLogin()) {
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await login(loginForm);
      persistSession(data);
      toast.success("Logged in successfully");
      navigate("/home");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to log in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,_#e2e8f0_0%,_#f8fafc_48%,_#dcfce7_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden bg-[#0F172A] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Fully digital property transfer
              </div>
              <h1 className="mt-8 text-4xl font-semibold leading-tight">
                LandChain keeps ownership records transparent, traceable, and fast.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
                A digital handoff platform for Indian property transfers with AI-backed
                analysis, official workflow tracking, and blockchain-style ownership history.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-300">Mock OTP for demo</p>
                <p className="mt-1 text-2xl font-semibold tracking-[0.3em]">123456</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <LockKeyhole className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">LandChain</p>
                  <p className="text-sm text-slate-500">{titleText}</p>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    activeTab === "login"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    activeTab === "signup"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {activeTab === "signup" ? (
                <form className="space-y-4" onSubmit={handleSignup}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={signupForm.name}
                      onChange={(event) =>
                        setSignupForm((current) => ({ ...current, name: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                      placeholder="Enter full name"
                    />
                    {signupErrors.name ? (
                      <p className="mt-1 text-sm text-red-500">{signupErrors.name}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={signupForm.dob}
                      onChange={(event) =>
                        setSignupForm((current) => ({ ...current, dob: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                    />
                    {signupErrors.dob ? (
                      <p className="mt-1 text-sm text-red-500">{signupErrors.dob}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={signupForm.aadhaarNumber}
                      onChange={(event) =>
                        setSignupForm((current) => ({
                          ...current,
                          aadhaarNumber: event.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                      placeholder="12 digit Aadhaar number"
                    />
                    {signupErrors.aadhaarNumber ? (
                      <p className="mt-1 text-sm text-red-500">{signupErrors.aadhaarNumber}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        disabled={!signupOtpSent}
                        value={signupForm.otp}
                        onChange={(event) =>
                          setSignupForm((current) => ({
                            ...current,
                            otp: event.target.value.replace(/\D/g, ""),
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition disabled:bg-slate-100 focus:border-emerald-500"
                        placeholder="Enter OTP"
                      />
                      {signupErrors.otp ? (
                        <p className="mt-1 text-sm text-red-500">{signupErrors.otp}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendOtp("signup")}
                      disabled={sendingOtpFor === "signup"}
                      className="mt-7 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                    >
                      {sendingOtpFor === "signup" ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending
                        </span>
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Create Account
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={loginForm.aadhaarNumber}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          aadhaarNumber: event.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                      placeholder="12 digit Aadhaar number"
                    />
                    {loginErrors.aadhaarNumber ? (
                      <p className="mt-1 text-sm text-red-500">{loginErrors.aadhaarNumber}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        disabled={!loginOtpSent}
                        value={loginForm.otp}
                        onChange={(event) =>
                          setLoginForm((current) => ({
                            ...current,
                            otp: event.target.value.replace(/\D/g, ""),
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition disabled:bg-slate-100 focus:border-emerald-500"
                        placeholder="Enter OTP"
                      />
                      {loginErrors.otp ? (
                        <p className="mt-1 text-sm text-red-500">{loginErrors.otp}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendOtp("login")}
                      disabled={sendingOtpFor === "login"}
                      className="mt-7 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                    >
                      {sendingOtpFor === "login" ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending
                        </span>
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Login
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
