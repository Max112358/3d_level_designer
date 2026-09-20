export type Tool =
  | "pointer"
  | "paint"
  | "prop"
  | "entity"
  | "trigger"
  | "light"
  | "audio"
  | "item"
  | "eraser"
  | "eyedropper";

export type Direction = "north" | "south" | "east" | "west";

export interface PropData {
  id: string;
  type: string;
  pos: [number, number, number];
  cell?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  properties?: Record<string, unknown>;
}

export interface ItemData {
  id: string;
  type: string;
  pos: [number, number, number];
  cell?: [number, number, number];
  properties?: Record<string, unknown>;
}

export interface CellFaceData {
  floor?: string;
  ceiling?: string;
  walls?: Partial<Record<Direction, string>>;
}

export interface CellData {
  floor: string;
  ceiling: string;
  walls: Record<Direction, string>;
}

export interface TriggerData {
  id: string;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
  properties?: Record<string, unknown>;
}

export interface LightData {
  id: string;
  pos: [number, number, number];
  color: string;
  intensity: number;
  radius: number;
  flicker?: boolean;
  properties?: Record<string, unknown>;
}

export interface AudioData {
  id: string;
  pos: [number, number, number];
  soundClip: string;
  volume: number;
  maxDistance: number;
  isLooping: boolean;
  properties?: Record<string, unknown>;
}

export interface EntityData {
  id: string;
  type: string;
  pos: [number, number, number];
  cell?: [number, number, number];
  rotation: [number, number, number];
  properties?: Record<string, unknown>;
}

export interface LevelData {
  version: number;
  cells: Record<string, CellData>;
  props: PropData[];
  triggers: TriggerData[];
  lights: LightData[];
  audio: AudioData[];
  entities: EntityData[];
  items: ItemData[];
}

export interface ManifestEntry {
  id: string;
  name: string;
  type?: string;
  path?: string;
  category: string;
}

export interface Manifest {
  textures: ManifestEntry[];
  props: ManifestEntry[];
  entities: ManifestEntry[];
  items: ManifestEntry[];
}

export const CELL_SIZE = 5;

export function cellKey(x: number, y: number, z: number) {
  return `${x},${y},${z}`;
}

export function parseCellKey(key: string): [number, number, number] {
  const [x, y, z] = key.split(",").map((n) => parseInt(n, 10));
  return [x, y, z];
}

export function cellCenter(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  return [(x + 0.5) * CELL_SIZE, y * CELL_SIZE, (z + 0.5) * CELL_SIZE];
}

export function cellMin(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  return [x * CELL_SIZE, y * CELL_SIZE, z * CELL_SIZE];
}

export function cellMax(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  return [(x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE, (z + 1) * CELL_SIZE];
}

export function snapToGrid(value: number): number {
  return Math.round(value / CELL_SIZE) * CELL_SIZE;
}

export function snapToGridCenter(value: number): number {
  return Math.floor(value / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
}

export function ensureCellDefaults(cell: CellFaceData): CellData {
  return {
    floor: cell.floor ?? "none",
    ceiling: cell.ceiling ?? "none",
    walls: {
      north: cell.walls?.north ?? "none",
      south: cell.walls?.south ?? "none",
      east: cell.walls?.east ?? "none",
      west: cell.walls?.west ?? "none",
    },
  };
}

export function emptyLevel(): LevelData {
  return {
    version: 1,
    cells: {},
    props: [],
    triggers: [],
    lights: [],
    audio: [],
    entities: [],
    items: [],
  };
}
