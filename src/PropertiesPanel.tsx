// PropertiesPanel.tsx
import { useEditorStore } from "./store";
import { Direction } from "./types";

const DIRECTIONS: Direction[] = ["north", "south", "east", "west"];

export function PropertiesPanel() {
  const selection = useEditorStore((s) => s.selection);
  const level = useEditorStore((s) => s.level);
  const updateSelectionProperties = useEditorStore(
    (s) => s.updateSelectionProperties,
  );
  const eraseCellFace = useEditorStore((s) => s.eraseCellFace);
  const removeProp = useEditorStore((s) => s.removeProp);
  const removeEntity = useEditorStore((s) => s.removeEntity);
  const removeItem = useEditorStore((s) => s.removeItem);
  const removeLight = useEditorStore((s) => s.removeLight);
  const removeAudio = useEditorStore((s) => s.removeAudio);
  const removeTrigger = useEditorStore((s) => s.removeTrigger);
  const setSelection = useEditorStore((s) => s.setSelection);

  if (!selection) {
    return (
      <div className="w-full h-full p-3 overflow-y-auto">
        <p className="text-xs text-slate-400">
          Select a cell or object to edit properties.
        </p>
      </div>
    );
  }

  const renderCell = () => {
    if (selection.kind !== "cell") return null;
    const cell = level.cells[selection.key];
    if (!cell) return null;

    const clearFace = (face: "floor" | "ceiling" | Direction) => {
      eraseCellFace(selection.key, face);
    };

    const clearAllTextures = () => {
      eraseCellFace(selection.key, "floor");
      eraseCellFace(selection.key, "ceiling");
      DIRECTIONS.forEach((dir) => eraseCellFace(selection.key, dir));
    };

    return (
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400">
          Cell: <span className="text-sky-400">{selection.key}</span>
        </div>

        {/* Floor */}
        <div className="space-y-1">
          <label className="block text-xs text-slate-300">Floor Texture</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cell.floor || ""}
              onChange={(e) =>
                updateSelectionProperties({ floor: e.target.value })
              }
              className="flex-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
            />
            <button
              type="button"
              onClick={() => clearFace("floor")}
              className="px-2 py-1 rounded bg-red-900/60 hover:bg-red-700 text-red-200 text-xs font-medium"
              title="Remove floor texture"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Ceiling */}
        <div className="space-y-1">
          <label className="block text-xs text-slate-300">
            Ceiling Texture
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cell.ceiling || ""}
              onChange={(e) =>
                updateSelectionProperties({ ceiling: e.target.value })
              }
              className="flex-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
            />
            <button
              type="button"
              onClick={() => clearFace("ceiling")}
              className="px-2 py-1 rounded bg-red-900/60 hover:bg-red-700 text-red-200 text-xs font-medium"
              title="Remove ceiling texture"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Walls */}
        {DIRECTIONS.map((dir) => (
          <div key={dir} className="space-y-1">
            <label className="block text-xs text-slate-300 capitalize">
              {dir} Wall Texture
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cell.walls[dir] || ""}
                onChange={(e) =>
                  updateSelectionProperties({ [`wall_${dir}`]: e.target.value })
                }
                className="flex-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
              />
              <button
                type="button"
                onClick={() => clearFace(dir)}
                className="px-2 py-1 rounded bg-red-900/60 hover:bg-red-700 text-red-200 text-xs font-medium"
                title={`Remove ${dir} wall texture`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={clearAllTextures}
            className="w-full py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
          >
            Clear All Cell Textures
          </button>
        </div>
      </div>
    );
  };

  const renderObject = () => {
    let data: Record<string, unknown> | null = null;
    let onDelete: (() => void) | null = null;

    if (selection.kind === "prop") {
      data = level.props[selection.index] as unknown as Record<string, unknown>;
      onDelete = () => {
        removeProp(selection.index);
        setSelection(null);
      };
    } else if (selection.kind === "entity") {
      data = level.entities[selection.index] as unknown as Record<
        string,
        unknown
      >;
      onDelete = () => {
        removeEntity(selection.index);
        setSelection(null);
      };
    } else if (selection.kind === "item") {
      data = level.items[selection.index] as unknown as Record<string, unknown>;
      onDelete = () => {
        removeItem(selection.index);
        setSelection(null);
      };
    } else if (selection.kind === "light") {
      data = level.lights[selection.index] as unknown as Record<
        string,
        unknown
      >;
      onDelete = () => {
        removeLight(selection.index);
        setSelection(null);
      };
    } else if (selection.kind === "audio") {
      data = level.audio[selection.index] as unknown as Record<string, unknown>;
      onDelete = () => {
        removeAudio(selection.index);
        setSelection(null);
      };
    } else if (selection.kind === "trigger") {
      data = level.triggers[selection.index] as unknown as Record<
        string,
        unknown
      >;
      onDelete = () => {
        removeTrigger(selection.index);
        setSelection(null);
      };
    }

    if (!data) return null;

    const properties = (data.properties ?? {}) as Record<string, unknown>;

    return (
      <div className="space-y-2">
        <div className="text-xs text-slate-400 capitalize">
          {selection.kind}
        </div>
        <pre className="text-[10px] text-slate-300 bg-slate-800 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
        <label className="block text-xs text-slate-300">
          Custom JSON
          <textarea
            rows={4}
            defaultValue={JSON.stringify(properties, null, 2)}
            onBlur={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateSelectionProperties(parsed);
              } catch {
                // ignore invalid JSON
              }
            }}
            className="w-full mt-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono"
          />
        </label>
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-full py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full p-3 overflow-y-auto">
      {selection.kind === "cell" ? renderCell() : renderObject()}
    </div>
  );
}
