import {
  ArrowRightLeft,
  Inbox,
  Link as LinkIcon,
  LogOut,
  Receipt,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const navItems = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "transfer", label: "Transfer", icon: ArrowRightLeft },
  { key: "deedDraft", label: "Deed Draft", icon: FileText },
  { key: "taxPayment", label: "Tax Payment", icon: Receipt },
];

export default function Sidebar({ activeSection, setActiveSection, userName, userId }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    navigate("/");
  };

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between bg-[#0F172A] px-4 py-6 text-white md:flex">
      <div>
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <LinkIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">LandChain</p>
            <p className="text-xs text-slate-400">Digital title transfer rail</p>
          </div>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key)}
                className={`flex w-full items-center gap-3 rounded-r-2xl border-l-4 px-4 py-3 text-left transition ${
                  active
                    ? "border-emerald-400 bg-white/10 text-white"
                    : "border-transparent text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
            {(userName || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-xs text-slate-400">{userId}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
