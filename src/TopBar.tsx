import { useEditorStore } from "./store";
import { LevelData } from "./types";

export function TopBar() {
  const level = useEditorStore((s) => s.level);
  const clearAll = useEditorStore((s) => s.clearAll);
  const loadLevel = useEditorStore((s) => s.loadLevel);
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(level, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "level.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as LevelData;
        loadLevel(data);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-2 bg-slate-900/90 border-b border-slate-700 px-4 py-2 shadow-lg">
      <h1 className="text-sm font-bold text-white mr-4">3D Level Editor</h1>
      <button
        onClick={clearAll}
        className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs"
      >
        Clear All
      </button>
      <label className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs cursor-pointer">
        Import JSON
        <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
      </label>
      <button
        onClick={handleExport}
        className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs"
      >
        Export JSON
      </button>
      <button
        onClick={toggleGrid}
        className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs"
      >
        {showGrid ? "Hide Grid" : "Show Grid"}
      </button>
    </div>
  );
}
