import {
  MousePointer2,
  Paintbrush,
  Box,
  User,
  Zap,
  Lightbulb,
  Volume2,
  Package,
  Eraser,
  Pipette,
} from "lucide-react";
import { useEditorStore } from "./store";
import { Tool } from "./types";

const TOOLS: { id: Tool; label: string; icon: React.ElementType }[] = [
  { id: "pointer", label: "Pointer", icon: MousePointer2 },
  { id: "paint", label: "Paint", icon: Paintbrush },
  { id: "prop", label: "Prop", icon: Box },
  { id: "entity", label: "Entity", icon: User },
  { id: "trigger", label: "Trigger", icon: Zap },
  { id: "light", label: "Light", icon: Lightbulb },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "item", label: "Item", icon: Package },
  { id: "eraser", label: "Eraser", icon: Eraser },
  { id: "eyedropper", label: "Eyedropper", icon: Pipette },
];

export function Toolbar() {
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);

  return (
    <div className="flex flex-col gap-1 bg-slate-900/90 p-2 rounded-lg border border-slate-700 shadow-lg">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={t.label}
            className={`p-2 rounded-md transition-colors ${
              tool === t.id ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}