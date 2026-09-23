import { LevelData } from "./types";

const LEVELS_KEY = "3d-level-editor:levels";
const LAST_LEVEL_KEY = "3d-level-editor:lastLevel";

export interface StoredLevel {
  name: string;
  data: LevelData;
  updatedAt: number;
}

function readLevels(): Record<string, StoredLevel> {
  try {
    const raw = localStorage.getItem(LEVELS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLevels(levels: Record<string, StoredLevel>) {
  localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
}

export function getStoredLevels(): StoredLevel[] {
  const levels = readLevels();
  return Object.values(levels).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getStoredLevel(name: string): LevelData | null {
  const stored = readLevels()[name];
  return stored ? stored.data : null;
}

export function saveStoredLevel(level: LevelData) {
  const name = level.name?.trim() || "Untitled";
  const data: LevelData = { ...level, name };
  const levels = readLevels();
  levels[name] = { name, data, updatedAt: Date.now() };
  writeLevels(levels);
  setLastLevelName(name);
}

export function deleteStoredLevel(name: string) {
  const levels = readLevels();
  delete levels[name];
  writeLevels(levels);
}

export function getLastLevelName(): string | null {
  try {
    return localStorage.getItem(LAST_LEVEL_KEY);
  } catch {
    return null;
  }
}

export function setLastLevelName(name: string) {
  localStorage.setItem(LAST_LEVEL_KEY, name);
}

export function clearLastLevelName() {
  localStorage.removeItem(LAST_LEVEL_KEY);
}
