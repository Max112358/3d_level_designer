import { useEditorStore } from "./store";
import { Direction } from "./types";

const DIRECTIONS: Direction[] = ["north", "south", "east", "west"];

export function PropertiesPanel() {
  const selection = useEditorStore((s) => s.selection);
  const level = useEditorStore((s) => s.level);
  const updateSelectionProperties = useEditorStore((s) => s.updateSelectionProperties);
  const removeProp = useEditorStore((s) => s.removeProp);
  const removeEntity = useEditorStore((s) => s.removeEntity);
  const removeItem = useEditorStore((s) => s.removeItem);
  const removeLight = useEditorStore((s) => s.removeLight);
  const removeAudio = useEditorStore((s) => s.removeAudio);
  const removeTrigger = useEditorStore((s) => s.removeTrigger);

  if (!selection) {
    return (
      <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-3 w-64 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-2">Properties</h3>
        <p className="text-xs text-slate-400">Select a cell or object to edit properties.</p>
      </div>
    );
  }

  const renderCell = () => {
    if (selection.kind !== "cell") return null;
    const cell = level.cells[selection.key];
    if (!cell) return null;
    return (
      <div className="space-y-2">
        <div className="text-xs text-slate-400">Cell {selection.key}</div>
        <label className="block text-xs text-slate-300">
          Floor
          <input
            type="text"
            value={cell.floor}
            onChange={(e) => updateSelectionProperties({ floor: e.target.value })}
            className="w-full mt-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
          />
        </label>
        <label className="block text-xs text-slate-300">
          Ceiling
          <input
            type="text"
            value={cell.ceiling}
            onChange={(e) => updateSelectionProperties({ ceiling: e.target.value })}
            className="w-full mt-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
          />
        </label>
        {DIRECTIONS.map((dir) => (
          <label key={dir} className="block text-xs text-slate-300 capitalize">
            {dir} Wall
            <input
              type="text"
              value={cell.walls[dir]}
              onChange={(e) => updateSelectionProperties({ [`wall_${dir}`]: e.target.value })}
              className="w-full mt-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </label>
        ))}
      </div>
    );
  };

  const renderObject = () => {
    let data: Record<string, unknown> | null = null;
    let onDelete: (() => void) | null = null;
    if (selection.kind === "prop") {
      data = level.props[selection.index] as unknown as Record<string, unknown>;
      onDelete = () => removeProp(selection.index);
    } else if (selection.kind === "entity") {
      data = level.entities[selection.index] as unknown as Record<string, unknown>;
      onDelete = () => removeEntity(selection.index);
    } else if (selection.kind === "item") {
      data = level.items[selection.index] as unknown as Record<string, unknown>;
      onDelete = () => removeItem(selection.index);
    } else if (selection.kind === "light") {
      data = level.lights[selection.index] as unknown as Record<string, unknown>;
      onDelete = () => removeLight(selection.index);
    } else if (selection.kind === "audio") {
      data = level.audio[selection.index] as unknown as Record<string, unknown>;
      onDelete = () => removeAudio(selection.index);
    } else if (selection.kind === "trigger") {
      data = level.triggers[selection.index] as unknown as Record<string, unknown>;
      onDelete = () => removeTrigger(selection.index);
    }
    if (!data) return null;

    const properties = (data.properties ?? {}) as Record<string, unknown>;

    return (
      <div className="space-y-2">
        <div className="text-xs text-slate-400 capitalize">{selection.kind}</div>
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
            className="w-full py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs"
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-3 w-64 shadow-lg max-h-[60vh] overflow-y-auto">
      <h3 className="text-sm font-bold text-white mb-2">Properties</h3>
      {selection.kind === "cell" ? renderCell() : renderObject()}
    </div>
  );
}