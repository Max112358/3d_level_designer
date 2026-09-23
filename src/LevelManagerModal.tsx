import { useEffect, useState } from "react";
import { useEditorStore } from "./store";
import { emptyLevel } from "./types";
import {
  deleteStoredLevel,
  getStoredLevel,
  getStoredLevels,
  saveStoredLevel,
  setLastLevelName,
  StoredLevel,
} from "./storage";

interface LevelManagerModalProps {
  open: boolean;
  onClose: () => void;
}

function LevelRow({
  level,
  isCurrent,
  onRename,
  onDelete,
}: {
  level: StoredLevel;
  isCurrent: boolean;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [renameValue, setRenameValue] = useState(level.name);

  if (editing) {
    return (
      <li className="flex items-center gap-2">
        <input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          className="flex-1 bg-slate-800 text-white text-xs border border-slate-600 rounded px-2 py-1"
        />
        <button
          onClick={() => {
            onRename(level.name, renameValue);
            setEditing(false);
          }}
          className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs"
        >
          Save
        </button>
        <button
          onClick={() => {
            setRenameValue(level.name);
            setEditing(false);
          }}
          className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs"
        >
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded px-3 py-2">
      <span className="text-sm text-white">
        {level.name}
        {isCurrent && (
          <span className="ml-2 text-xs text-sky-400">(current)</span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditing(true)}
          className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs"
        >
          Rename
        </button>
        <button
          onClick={() => onDelete(level.name)}
          className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export function LevelManagerModal({ open, onClose }: LevelManagerModalProps) {
  const level = useEditorStore((s) => s.level);
  const loadLevel = useEditorStore((s) => s.loadLevel);

  const [newName, setNewName] = useState("");
  const [levels, setLevels] = useState<StoredLevel[]>([]);

  const refresh = () => setLevels(getStoredLevels());

  useEffect(() => {
    if (open) {
      refresh();
      setNewName("");
    }
  }, [open]);

  const handleCreate = () => {
    const name = newName.trim() || "Untitled";
    if (levels.some((l) => l.name === name)) {
      alert(`A level named "${name}" already exists.`);
      return;
    }
    const fresh = { ...emptyLevel(), name };
    saveStoredLevel(fresh);
    loadLevel(fresh);
    setLastLevelName(name);
    refresh();
    setNewName("");
    onClose();
  };

  const handleDelete = (name: string) => {
    if (!window.confirm(`Delete level "${name}"? This cannot be undone.`))
      return;

    deleteStoredLevel(name);

    if (level.name === name) {
      const remaining = getStoredLevels();
      if (remaining.length > 0) {
        loadLevel(remaining[0].data);
        setLastLevelName(remaining[0].name);
      } else {
        const fresh = { ...emptyLevel(), name: "Untitled" };
        loadLevel(fresh);
      }
    }

    refresh();
  };

  const handleRename = (oldName: string, newNameRaw: string) => {
    const newName = newNameRaw.trim();
    if (!newName || newName === oldName) return;

    if (levels.some((l) => l.name === newName)) {
      alert(`A level named "${newName}" already exists.`);
      return;
    }

    const stored = getStoredLevel(oldName);
    if (!stored) return;

    deleteStoredLevel(oldName);
    const renamed = { ...stored, name: newName };
    saveStoredLevel(renamed);

    if (level.name === oldName) {
      loadLevel(renamed);
    }

    refresh();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-[28rem] max-w-[90vw] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-4">Manage Levels</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New level name"
            className="flex-1 bg-slate-800 text-white text-sm border border-slate-600 rounded px-3 py-2 outline-none focus:border-sky-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium"
          >
            Create
          </button>
        </div>

        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {levels.map((l) => (
            <LevelRow
              key={l.name}
              level={l}
              isCurrent={level.name === l.name}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
          {levels.length === 0 && (
            <li className="text-sm text-slate-400 italic">
              No stored levels yet.
            </li>
          )}
        </ul>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
