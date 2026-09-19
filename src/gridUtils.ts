import { CELL_SIZE, SubPos } from "./types";

/**
 * Returns [offsetX, offsetZ] relative to cell center.
 * Divides the cell into a 3x3 sub-grid.
 */
export function getSubPosOffset(subPos: SubPos = "center"): [number, number] {
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
 * Computes world space [X, Y, Z] from cell grid index [x, y, z],
 * a subPos designation, and an optional vertical offset inside the cell.
 */
export function calculateWorldPos(
  cell: [number, number, number],
  subPos: SubPos = "center",
  heightOffset: number = 0,
): [number, number, number] {
  const [cx, cy, cz] = cell;
  const centerX = (cx + 0.5) * CELL_SIZE;
  const centerY = cy * CELL_SIZE + heightOffset;
  const centerZ = (cz + 0.5) * CELL_SIZE;

  const [offsetX, offsetZ] = getSubPosOffset(subPos);

  return [centerX + offsetX, centerY, centerZ + offsetZ];
}

/**
 * Given a world point (X, Z) and a cell index [cx, cz],
 * calculates which sub-position (NW, N, NE, etc.) the point falls into.
 */
export function worldPointToSubPos(
  worldX: number,
  worldZ: number,
  cellX: number,
  cellZ: number,
): SubPos {
  // Center of the target grid cell in world coordinates
  const centerX = (cellX + 0.5) * CELL_SIZE;
  const centerZ = (cellZ + 0.5) * CELL_SIZE;

  // Local offset from cell center: ranges approximately [-CELL_SIZE/2, CELL_SIZE/2]
  const localX = worldX - centerX;
  const localZ = worldZ - centerZ;

  // Divide the cell into 3 equal columns and rows along X and Z
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
