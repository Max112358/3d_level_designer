import { CELL_SIZE } from "./types";

/**
 * Returns [offsetX, offsetZ] relative to cell center.
 * Divides the cell into a 3x3 sub-grid.
 */
export function getSubPosOffset(subPos: string = "center"): [number, number] {
  const step = CELL_SIZE / 3;
  switch (subPos) {
    case "north_west":
      return [-step, -step];
    case "north":
      return [0, -step];
    case "north_east":
      return [step, -step];
    case "west":
      return [-step, 0];
    case "center":
      return [0, 0];
    case "east":
      return [step, 0];
    case "south_west":
      return [-step, step];
    case "south":
      return [0, step];
    case "south_east":
      return [step, step];
    default:
      return [0, 0];
  }
}

/**
 * Computes snapped world space [X, Y, Z] from cell grid index,
 * hover click coordinates, and vertical height offset.
 */
export function calculateWorldPos(
  cell: [number, number, number],
  clickX: number,
  clickZ: number,
  heightOffset: number = 0,
): [number, number, number] {
  const [cx, cy, cz] = cell;
  const centerX = (cx + 0.5) * CELL_SIZE;
  const centerY = cy * CELL_SIZE + heightOffset;
  const centerZ = (cz + 0.5) * CELL_SIZE;

  const subPos = worldPointToSubPos(clickX, clickZ, cx, cz);
  const [offsetX, offsetZ] = getSubPosOffset(subPos);

  return [centerX + offsetX, centerY, centerZ + offsetZ];
}

/**
 * Given a world point (X, Z) and a cell index [cx, cz],
 * calculates which sub-position quadrant the point falls into.
 */
export function worldPointToSubPos(
  worldX: number,
  worldZ: number,
  cellX: number,
  cellZ: number,
): string {
  const centerX = (cellX + 0.5) * CELL_SIZE;
  const centerZ = (cellZ + 0.5) * CELL_SIZE;

  const localX = worldX - centerX;
  const localZ = worldZ - centerZ;

  const threshold = CELL_SIZE / 6;

  let xCol: "west" | "center" | "east" = "center";
  if (localX < -threshold) xCol = "west";
  else if (localX > threshold) xCol = "east";

  let zRow: "north" | "center" | "south" = "center";
  if (localZ < -threshold) zRow = "north";
  else if (localZ > threshold) zRow = "south";

  if (zRow === "north") {
    if (xCol === "west") return "north_west";
    if (xCol === "east") return "north_east";
    return "north";
  } else if (zRow === "south") {
    if (xCol === "west") return "south_west";
    if (xCol === "east") return "south_east";
    return "south";
  } else {
    if (xCol === "west") return "west";
    if (xCol === "east") return "east";
    return "center";
  }
}
