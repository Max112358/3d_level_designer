import { useEditorStore } from "./store";
import { Direction } from "./types";

const FACES: ("floor" | "ceiling" | Direction)[] = ["floor", "ceiling", "north", "south", "east", "west"];

export function FaceSelector() {
  const activeFace = useEditorStore((s) => s.activeFace);
  const setActiveFace = useEditorStore((s) => s.setActiveFace);
  const tool = useEditorStore((s) => s.tool);

  if (tool !== "paint" && tool !== "eraser" && tool !== "eyedropper") return null;

  return (
    <div className="flex flex-wrap gap-1 bg-slate-900/90 border border-slate-700 rounded-lg p-2 shadow-lg">
      {FACES.map((face) => (
        <button
          key={face}
          onClick={() => setActiveFace(face)}
          className={`px-2 py-1 rounded text-xs capitalize ${
            activeFace === face
              ? "bg-sky-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {face}
        </button>
      ))}
    </div>
  );
}
