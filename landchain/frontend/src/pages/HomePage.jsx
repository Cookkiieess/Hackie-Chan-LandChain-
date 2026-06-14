import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DeedDraft from "../components/sections/DeedDraft";
import Inbox from "../components/sections/Inbox";
import Properties from "../components/sections/Properties";
import TaxPayment from "../components/sections/TaxPayment";
import Transfer from "../components/sections/Transfer";
import BlockchainExplorer from "../components/sections/BlockchainExplorer";

const mobileSections = [
  { key: "inbox", label: "Inbox" },
  { key: "properties", label: "Properties" },
  { key: "transfer", label: "Transfer" },
  { key: "deedDraft", label: "Deed Draft" },
  { key: "taxPayment", label: "Tax Payment" },
  { key: "blockchain", label: "Blockchain" },
];

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("inbox");
  const [transferPrefill, setTransferPrefill] = useState(null);
  const userId = sessionStorage.getItem("userId") || "";
  const userName = sessionStorage.getItem("name") || "LandChain User";

  const sectionContent = useMemo(() => {
    switch (activeSection) {
      case "properties":
        return (
          <Properties
            userId={userId}
            setActiveSection={setActiveSection}
            setTransferPrefill={setTransferPrefill}
          />
        );
      case "transfer":
        return (
          <Transfer
            userId={userId}
            prefill={transferPrefill}
            clearPrefill={() => setTransferPrefill(null)}
          />
        );
      case "deedDraft":
        return <DeedDraft userId={userId} />;
      case "taxPayment":
        return <TaxPayment userId={userId} />;
      case "blockchain":
        return <BlockchainExplorer userId={userId} />;
      case "inbox":
      default:
        return <Inbox userId={userId} />;
    }
  }, [activeSection, userId]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        userName={userName}
        userId={userId}
      />
      <main className="min-h-screen pl-0 md:pl-64">
        <div className="mx-auto max-w-7xl p-4 md:p-8">
          <div className="mb-4 flex gap-2 overflow-x-auto rounded-[24px] bg-white p-2 shadow-sm md:hidden">
            {mobileSections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  activeSection === section.key
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
          {sectionContent}
        </div>
      </main>
    </div>
  );
}
