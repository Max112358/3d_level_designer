import { create } from "zustand";
import {
  LevelData,
  PropData,
  TriggerData,
  LightData,
  AudioData,
  EntityData,
  ItemData,
  Tool,
  Direction,
  emptyLevel,
  ensureCellDefaults,
} from "./types";

export type Selection =
  | { kind: "cell"; key: string }
  | { kind: "prop"; index: number }
  | { kind: "trigger"; index: number }
  | { kind: "light"; index: number }
  | { kind: "audio"; index: number }
  | { kind: "entity"; index: number }
  | { kind: "item"; index: number }
  | null;

interface HistoryState {
  level: LevelData;
  selection: Selection;
}

interface EditorState {
  level: LevelData;
  tool: Tool;
  activeAssetId: string | null;
  activeFace: "floor" | "ceiling" | Direction;
  layerY: number;
  isolateLayer: boolean;
  showGrid: boolean;
  selection: Selection;
  history: HistoryState[];
  historyIndex: number;
}

export interface EditorActions {
  setTool: (tool: Tool) => void;
  setActiveAssetId: (id: string | null) => void;
  setActiveFace: (face: "floor" | "ceiling" | Direction) => void;
  setLayerY: (y: number) => void;
  toggleIsolateLayer: () => void;
  toggleGrid: () => void;
  setSelection: (sel: Selection) => void;
  clearSelection: () => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  setCellFace: (key: string, face: "floor" | "ceiling" | Direction, materialId: string) => void;
  eraseCellFace: (key: string, face: "floor" | "ceiling" | Direction) => void;
  addProp: (prop: PropData) => void;
  updateProp: (index: number, prop: PropData) => void;
  removeProp: (index: number) => void;
  addTrigger: (trigger: TriggerData) => void;
  updateTrigger: (index: number, trigger: TriggerData) => void;
  removeTrigger: (index: number) => void;
  addLight: (light: LightData) => void;
  updateLight: (index: number, light: LightData) => void;
  removeLight: (index: number) => void;
  addAudio: (audio: AudioData) => void;
  updateAudio: (index: number, audio: AudioData) => void;
  removeAudio: (index: number) => void;
  addEntity: (entity: EntityData) => void;
  updateEntity: (index: number, entity: EntityData) => void;
  removeEntity: (index: number) => void;
  addItem: (item: ItemData) => void;
  updateItem: (index: number, item: ItemData) => void;
  removeItem: (index: number) => void;
  clearAll: () => void;
  loadLevel: (level: LevelData) => void;
  updateSelectionProperties: (props: Record<string, unknown>) => void;
}

const initialLevel = emptyLevel();

function cloneLevel(level: LevelData): LevelData {
  return JSON.parse(JSON.stringify(level));
}

function cloneSelection(sel: Selection): Selection {
  if (!sel) return null;
  return { ...sel } as Selection;
}

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  level: initialLevel,
  tool: "pointer",
  activeAssetId: null,
  activeFace: "floor",
  layerY: 0,
  isolateLayer: false,
  showGrid: true,
  selection: null,
  history: [{ level: cloneLevel(initialLevel), selection: null }],
  historyIndex: 0,

  setTool: (tool) => set({ tool }),
  setActiveAssetId: (id) => set({ activeAssetId: id }),
  setActiveFace: (face) => set({ activeFace: face }),
  setLayerY: (y) => set({ layerY: y }),
  toggleIsolateLayer: () => set((s) => ({ isolateLayer: !s.isolateLayer })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setSelection: (sel) => set({ selection: sel }),
  clearSelection: () => set({ selection: null }),

  pushHistory: () => {
    const { level, selection, history, historyIndex } = get();
    const next = history.slice(0, historyIndex + 1);
    next.push({ level: cloneLevel(level), selection: cloneSelection(selection) });
    set({ history: next, historyIndex: next.length - 1 });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const next = historyIndex - 1;
      const state = history[next];
      set({
        historyIndex: next,
        level: cloneLevel(state.level),
        selection: cloneSelection(state.selection),
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const next = historyIndex + 1;
      const state = history[next];
      set({
        historyIndex: next,
        level: cloneLevel(state.level),
        selection: cloneSelection(state.selection),
      });
    }
  },

  setCellFace: (key, face, materialId) => {
    get().pushHistory();
    set((s) => {
      const cells = { ...s.level.cells };
      const existing = cells[key] ? { ...cells[key] } : ensureCellDefaults({});
      if (face === "floor" || face === "ceiling") {
        existing[face] = materialId;
      } else {
        existing.walls = { ...existing.walls, [face]: materialId };
      }
      cells[key] = existing;
      return { level: { ...s.level, cells } };
    });
  },

  eraseCellFace: (key, face) => {
    get().pushHistory();
    set((s) => {
      const cells = { ...s.level.cells };
      if (!cells[key]) return {};
      const existing = { ...cells[key] };
      if (face === "floor" || face === "ceiling") {
        existing[face] = "none";
      } else {
        existing.walls = { ...existing.walls, [face]: "none" };
      }
      cells[key] = existing;
      return { level: { ...s.level, cells } };
    });
  },

  addProp: (prop) => {
    get().pushHistory();
    set((s) => ({ level: { ...s.level, props: [...s.level.props, prop] } }));
  },
  updateProp: (index, prop) => {
    get().pushHistory();
    set((s) => {
      const props = [...s.level.props];
      props[index] = prop;
      return { level: { ...s.level, props } };
    });
  },
  removeProp: (index) => {
    get().pushHistory();
    set((s) => ({
      level: { ...s.level, props: s.level.props.filter((_, i) => i !== index) },
      selection: s.selection?.kind === "prop" && s.selection.index === index ? null : s.selection,
    }));
  },

  addTrigger: (trigger) => {
    get().pushHistory();
    set((s) => ({ level: { ...s.level, triggers: [...s.level.triggers, trigger] } }));
  },
  updateTrigger: (index, trigger) => {
    get().pushHistory();
    set((s) => {
      const triggers = [...s.level.triggers];
      triggers[index] = trigger;
      return { level: { ...s.level, triggers } };
    });
  },
  removeTrigger: (index) => {
    get().pushHistory();
    set((s) => ({
      level: { ...s.level, triggers: s.level.triggers.filter((_, i) => i !== index) },
      selection: s.selection?.kind === "trigger" && s.selection.index === index ? null : s.selection,
    }));
  },

  addLight: (light) => {
    get().pushHistory();
    set((s) => ({ level: { ...s.level, lights: [...s.level.lights, light] } }));
  },
  updateLight: (index, light) => {
    get().pushHistory();
    set((s) => {
      const lights = [...s.level.lights];
      lights[index] = light;
      return { level: { ...s.level, lights } };
    });
  },
  removeLight: (index) => {
    get().pushHistory();
    set((s) => ({
      level: { ...s.level, lights: s.level.lights.filter((_, i) => i !== index) },
      selection: s.selection?.kind === "light" && s.selection.index === index ? null : s.selection,
    }));
  },

  addAudio: (audio) => {
    get().pushHistory();
    set((s) => ({ level: { ...s.level, audio: [...s.level.audio, audio] } }));
  },
  updateAudio: (index, audio) => {
    get().pushHistory();
    set((s) => {
      const audioArr = [...s.level.audio];
      audioArr[index] = audio;
      return { level: { ...s.level, audio: audioArr } };
    });
  },
  removeAudio: (index) => {
    get().pushHistory();
    set((s) => ({
      level: { ...s.level, audio: s.level.audio.filter((_, i) => i !== index) },
      selection: s.selection?.kind === "audio" && s.selection.index === index ? null : s.selection,
    }));
  },

  addEntity: (entity) => {
    get().pushHistory();
    set((s) => ({ level: { ...s.level, entities: [...s.level.entities, entity] } }));
  },
  updateEntity: (index, entity) => {
    get().pushHistory();
    set((s) => {
      const entities = [...s.level.entities];
      entities[index] = entity;
      return { level: { ...s.level, entities } };
    });
  },
  removeEntity: (index) => {
    get().pushHistory();
    set((s) => ({
      level: { ...s.level, entities: s.level.entities.filter((_, i) => i !== index) },
      selection: s.selection?.kind === "entity" && s.selection.index === index ? null : s.selection,
    }));
  },

  addItem: (item) => {
    get().pushHistory();
    set((s) => ({ level: { ...s.level, items: [...s.level.items, item] } }));
  },
  updateItem: (index, item) => {
    get().pushHistory();
    set((s) => {
      const items = [...s.level.items];
      items[index] = item;
      return { level: { ...s.level, items } };
    });
  },
  removeItem: (index) => {
    get().pushHistory();
    set((s) => ({
      level: { ...s.level, items: s.level.items.filter((_, i) => i !== index) },
      selection: s.selection?.kind === "item" && s.selection.index === index ? null : s.selection,
    }));
  },

  clearAll: () => {
    get().pushHistory();
    set({ level: emptyLevel(), selection: null });
  },

  loadLevel: (level) => {
    get().pushHistory();
    const normalized: LevelData = {
      version: level.version ?? 1,
      cells: {},
      props: level.props ?? [],
      triggers: level.triggers ?? [],
      lights: level.lights ?? [],
      audio: level.audio ?? [],
      entities: level.entities ?? [],
      items: level.items ?? [],
    };
    Object.entries(level.cells ?? {}).forEach(([k, v]) => {
      normalized.cells[k] = ensureCellDefaults(v);
    });
    set({ level: normalized, selection: null });
  },

  updateSelectionProperties: (props) => {
    const { selection } = get();
    if (!selection) return;
    get().pushHistory();
    set((s) => {
      const next = cloneLevel(s.level);
      switch (selection.kind) {
        case "prop":
          next.props[selection.index] = { ...next.props[selection.index], properties: { ...next.props[selection.index].properties, ...props } };
          break;
        case "trigger":
          next.triggers[selection.index] = { ...next.triggers[selection.index], properties: { ...next.triggers[selection.index].properties, ...props } };
          break;
        case "light":
          next.lights[selection.index] = { ...next.lights[selection.index], ...props };
          break;
        case "audio":
          next.audio[selection.index] = { ...next.audio[selection.index], ...props };
          break;
        case "entity":
          next.entities[selection.index] = { ...next.entities[selection.index], properties: { ...next.entities[selection.index].properties, ...props } };
          break;
        case "item":
          next.items[selection.index] = { ...next.items[selection.index], properties: { ...next.items[selection.index].properties, ...props } };
          break;
        case "cell": {
          const cell = { ...next.cells[selection.key] };
          Object.entries(props).forEach(([k, v]) => {
            if (k === "floor" || k === "ceiling") {
              cell[k] = String(v);
            } else if (k.startsWith("wall_")) {
              const dir = k.replace("wall_", "") as Direction;
              cell.walls = { ...cell.walls, [dir]: String(v) };
            }
          });
          next.cells[selection.key] = cell;
          break;
        }
      }
      return { level: next };
    });
  },
}));
