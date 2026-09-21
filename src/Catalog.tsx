import { useState } from "react";
import { ChevronRight, ChevronDown, Image, Box, User, Package, PanelRight } from "lucide-react";
import { useEditorStore } from "./store";
import { useManifest, useCatalog } from "./hooks";
import { ManifestEntry } from "./types";

function CatalogSection({
  title,
  icon: Icon,
  entries,
  selectedId,
  onSelect,
}: {
  title: string;
  icon: React.ElementType;
  entries: ManifestEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  if (entries.length === 0) return null;
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left text-sm font-semibold text-slate-300 hover:text-white py-1"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Icon size={14} />
        {title}
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-1 pl-4">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onSelect(entry.id)}
              className={`text-xs p-2 rounded border text-left truncate ${
                selectedId === entry.id
                  ? "bg-sky-600 border-sky-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
              title={entry.name}
            >
              <div className="w-full h-8 rounded mb-1 bg-slate-600 flex items-center justify-center text-[10px]">
                {entry.id.slice(0, 2).toUpperCase()}
              </div>
              {entry.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Catalog() {
  const { manifest, error } = useManifest();
  const catalog = useCatalog(manifest);
  const activeAssetId = useEditorStore((s) => s.activeAssetId);
  const setActiveAssetId = useEditorStore((s) => s.setActiveAssetId);
  const tool = useEditorStore((s) => s.tool);
  const [collapsed, setCollapsed] = useState(false);

  if (error) return <div className="p-4 text-red-400 text-sm">{error}</div>;
  if (!manifest) return <div className="p-4 text-slate-400 text-sm">Loading catalog...</div>;

  return (
    <div className="bg-slate-900/90 border border-slate-700 rounded-lg w-64 shadow-lg flex flex-col max-h-[50vh]">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full px-3 py-2 text-left"
      >
        <h3 className="text-sm font-bold text-white">Catalog</h3>
        <PanelRight size={14} className={`text-slate-400 transition-transform ${collapsed ? "" : "rotate-180"}`} />
      </button>
      {!collapsed && (
        <div className="px-3 pb-3 overflow-y-auto">
      <CatalogSection
        title="Textures"
        icon={Image}
        entries={catalog.textures}
        selectedId={activeAssetId}
        onSelect={(id) => {
          setActiveAssetId(id);
          if (tool !== "paint" && tool !== "eyedropper") useEditorStore.getState().setTool("paint");
        }}
      />
      <CatalogSection
        title="Props"
        icon={Box}
        entries={catalog.props}
        selectedId={activeAssetId}
        onSelect={(id) => {
          setActiveAssetId(id);
          useEditorStore.getState().setTool("prop");
        }}
      />
      <CatalogSection
        title="Entities"
        icon={User}
        entries={catalog.entities}
        selectedId={activeAssetId}
        onSelect={(id) => {
          setActiveAssetId(id);
          useEditorStore.getState().setTool("entity");
        }}
      />
      <CatalogSection
        title="Items"
        icon={Package}
        entries={catalog.items}
        selectedId={activeAssetId}
        onSelect={(id) => {
          setActiveAssetId(id);
          useEditorStore.getState().setTool("item");
        }}
      />
        </div>
      )}
    </div>
  );
}
