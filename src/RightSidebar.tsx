import { useState } from "react";
import { Catalog } from "./Catalog";
import { PropertiesPanel } from "./PropertiesPanel";

export function RightSidebar() {
  const [activeTab, setActiveTab] = useState<"catalog" | "properties">(
    "catalog",
  );

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg w-64 shadow-xl flex flex-col h-[calc(100vh-12rem)] max-h-[600px] overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-800/50 shrink-0">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${
            activeTab === "catalog"
              ? "text-sky-400 border-b-2 border-sky-400 bg-slate-800"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Catalog
        </button>
        <button
          onClick={() => setActiveTab("properties")}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${
            activeTab === "properties"
              ? "text-sky-400 border-b-2 border-sky-400 bg-slate-800"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Properties
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 min-h-0 relative">
        <div
          className={`h-full w-full ${activeTab === "catalog" ? "block" : "hidden"}`}
        >
          <Catalog />
        </div>
        <div
          className={`h-full w-full ${activeTab === "properties" ? "block" : "hidden"}`}
        >
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
}
