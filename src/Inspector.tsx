import { useEditorStore } from "./store";
import { Direction } from "./types";

const DIRECTIONS: Direction[] = ["north", "south", "east", "west"];
const DIFFICULTY_LEVELS = ["easy", "normal", "hard", "impossible"] as const;

export function Inspector() {
  const selection = useEditorStore((s) => s.selection);
  const level = useEditorStore((s) => s.level);
  const updateProp = useEditorStore((s) => s.updateProp);
  const updateEntity = useEditorStore((s) => s.updateEntity);
  const updateItem = useEditorStore((s) => s.updateItem);
  const updateLight = useEditorStore((s) => s.updateLight);
  const updateAudio = useEditorStore((s) => s.updateAudio);
  const updateTrigger = useEditorStore((s) => s.updateTrigger);
  const eraseCellFace = useEditorStore((s) => s.eraseCellFace);
  const updateSelectionProperties = useEditorStore(
    (s) => s.updateSelectionProperties,
  );
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
          Select a cell or object to view in Inspector.
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
        <div className="text-xs font-semibold text-slate-400 flex justify-between items-center pb-2 border-b border-slate-800">
          <span>Cell Selection</span>
          <span className="text-sky-400 font-mono">{selection.key}</span>
        </div>

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
            >
              Delete
            </button>
          </div>
        </div>

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
            >
              Delete
            </button>
          </div>
        </div>

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
    let objectIndex: number | null = null;
    let updateFn: ((index: number, updated: any) => void) | null = null;

    if (selection.kind === "prop") {
      objectIndex = selection.index;
      data = level.props[selection.index] as unknown as Record<string, unknown>;
      updateFn = updateProp;
      onDelete = () => {
        removeProp(selection.index);
        setSelection(null);
      };
    } else if (selection.kind === "entity") {
      objectIndex = selection.index;
      data = level.entities[selection.index] as unknown as Record<
        string,
        unknown
      >;
      updateFn = updateEntity;
      onDelete = () => {
        removeEntity(selection.index);
        setSelection(null);
      };
    } else if (selection.kind === "item") {
      objectIndex = selection.index;
      data = level.items[selection.index] as unknown as Record<string, unknown>;
      updateFn = updateItem;
      onDelete = () => {
        removeItem(selection.index);
        setSelection(null);
      };
    } else if (selection.kind === "light") {
      objectIndex = selection.index;
      data = level.lights[selection.index] as unknown as Record<
        string,
        unknown
      >;
      updateFn = updateLight;
      onDelete = () => {
        removeLight(selection.index);
        setSelection(null);
      };
    } else if (selection.kind === "audio") {
      objectIndex = selection.index;
      data = level.audio[selection.index] as unknown as Record<string, unknown>;
      updateFn = updateAudio;
      onDelete = () => {
        removeAudio(selection.index);
        setSelection(null);
      };
    } else if (selection.kind === "trigger") {
      objectIndex = selection.index;
      data = level.triggers[selection.index] as unknown as Record<
        string,
        unknown
      >;
      updateFn = updateTrigger;
      onDelete = () => {
        removeTrigger(selection.index);
        setSelection(null);
      };
    }

    if (!data || objectIndex === null || !updateFn) return null;

    const handleFieldChange = (path: string[], value: unknown) => {
      const copy = JSON.parse(JSON.stringify(data));
      let current: any = copy;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;

      // Keep cell grid coordinate in sync with raw position edits
      if (path[0] === "pos" && Array.isArray(value)) {
        const [x, y, z] = value as [number, number, number];
        if (copy.cell) {
          copy.cell = [Math.floor(x / 5), Math.floor(y / 5), Math.floor(z / 5)];
        }
      }

      updateFn!(objectIndex!, copy);
    };

    const properties = (data.properties ?? {}) as Record<string, unknown>;
    const activeDifficulties = Array.isArray(properties.difficulties)
      ? (properties.difficulties as string[])
      : ["easy", "normal", "hard", "impossible"];

    const toggleDifficulty = (diff: string) => {
      const updated = activeDifficulties.includes(diff)
        ? activeDifficulties.filter((d) => d !== diff)
        : [...activeDifficulties, diff];
      handleFieldChange(["properties", "difficulties"], updated);
    };

    const renderDynamicInput = (key: string, val: unknown, path: string[]) => {
      // Lock down type and id so they are non-editable
      if (key === "type" || key === "id" || key === "difficulties") return null;

      const label = key.replace(/([A-Z])/g, " $1").toLowerCase();

      // Numbers & Strings
      if (
        typeof val === "string" ||
        typeof val === "number" ||
        typeof val === "boolean"
      ) {
        return (
          <div key={path.join(".")} className="space-y-1">
            <label className="block text-xs text-slate-300 capitalize">
              {label}
            </label>
            <input
              type={typeof val === "number" ? "number" : "text"}
              value={String(val ?? "")}
              onChange={(e) => {
                const nextVal =
                  typeof val === "number"
                    ? parseFloat(e.target.value) || 0
                    : e.target.value;
                handleFieldChange(path, nextVal);
              }}
              className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono"
            />
          </div>
        );
      }

      // Arrays (Vectors, Positions, Bounds)
      if (Array.isArray(val)) {
        const isNumericArray = val.every((v) => typeof v === "number");
        if (isNumericArray) {
          const axisLabels = ["X", "Y", "Z", "W"];
          return (
            <div key={path.join(".")} className="space-y-1">
              <label className="block text-xs text-slate-300 capitalize">
                {label}
              </label>
              <div className="flex gap-1.5">
                {val.map((item: number, idx: number) => (
                  <div
                    key={idx}
                    className="flex-1 flex items-center bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5"
                  >
                    <span className="text-[10px] text-slate-500 font-semibold mr-1">
                      {axisLabels[idx] || idx}:
                    </span>
                    <input
                      type="number"
                      value={item}
                      onChange={(e) => {
                        const newArr = [...val];
                        newArr[idx] = parseFloat(e.target.value) || 0;
                        handleFieldChange(path, newArr);
                      }}
                      className="w-full bg-transparent text-white text-xs font-mono focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        }
      }

      // Nested Objects
      if (typeof val === "object" && val !== null) {
        return (
          <div
            key={path.join(".")}
            className="space-y-2 p-2 bg-slate-800/40 border border-slate-700/40 rounded"
          >
            <span className="block text-xs font-semibold text-slate-400 capitalize">
              {label}
            </span>
            {Object.entries(val).map(([nestedKey, nestedVal]) =>
              renderDynamicInput(nestedKey, nestedVal, [...path, nestedKey]),
            )}
          </div>
        );
      }

      return null;
    };

    return (
      <div className="space-y-4">
        {/* Unity-style Header Block */}
        <div className="space-y-1 pb-2 border-b border-slate-800">
          <div className="text-xs text-slate-400 capitalize flex justify-between items-center">
            <span className="font-bold text-sky-400">
              {String(data.id ?? selection.kind)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {selection.kind} #{objectIndex}
            </span>
          </div>
          {data.type ? (
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Type:</span>
              <span className="font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                {String(data.type)}
              </span>
            </div>
          ) : null}
        </div>

        {/* Spawn Difficulties */}
        <div className="space-y-1.5 p-2 bg-slate-800/80 rounded border border-slate-700/60">
          <label className="block text-xs font-semibold text-slate-300">
            Spawn Difficulties
          </label>
          <div className="flex gap-1.5">
            {DIFFICULTY_LEVELS.map((diff) => {
              const active = activeDifficulties.includes(diff);
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => toggleDifficulty(diff)}
                  className={`flex-1 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                    active
                      ? "bg-sky-600 text-white"
                      : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-Populated Inputs */}
        <div className="space-y-3">
          {Object.entries(data).map(([key, val]) =>
            renderDynamicInput(key, val, [key]),
          )}
        </div>

        {onDelete && (
          <button
            onClick={onDelete}
            className="w-full py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors mt-4"
          >
            Delete Object
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
