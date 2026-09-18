import { useEditorStore } from "./store";
import { Minus, Plus, Eye, EyeOff } from "lucide-react";

export function LayerControls() {
  const layerY = useEditorStore((s) => s.layerY);
  const setLayerY = useEditorStore((s) => s.setLayerY);
  const isolateLayer = useEditorStore((s) => s.isolateLayer);
  const toggleIsolateLayer = useEditorStore((s) => s.toggleIsolateLayer);

  return (
    <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
      <span className="text-xs text-slate-300">Layer Y</span>
      <button
        onClick={() => setLayerY(Math.max(0, layerY - 1))}
        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white"
      >
        <Minus size={14} />
      </button>
      <span className="text-sm font-mono text-white w-6 text-center">{layerY}</span>
      <button
        onClick={() => setLayerY(layerY + 1)}
        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white"
      >
        <Plus size={14} />
      </button>
      <button
        onClick={toggleIsolateLayer}
        title={isolateLayer ? "Show all layers" : "Isolate layer"}
        className={`p-1 rounded ${isolateLayer ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
      >
        {isolateLayer ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}
