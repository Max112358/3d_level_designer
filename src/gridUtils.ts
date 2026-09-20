import { CELL_SIZE, Direction } from "./types";

export type SurfaceFace = "floor" | "ceiling" | Direction;

/**
 * Returns [offsetX, offsetZ] relative to cell center.
 * Divides the cell into a 3x3 sub-grid (floor plane).
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
 * Maps a discrete 3x3 sub-grid index [col (0..2), row (0..2)] on a cell face
 * into local offsets relative to the cell's minimum origin (0, 0, 0).
 */
function getFaceSubOffset(
  face: SurfaceFace,
  col: number, // 0, 1, 2
  row: number, // 0, 1, 2
): [number, number, number] {
  const step = CELL_SIZE / 3;
  // Center point within each 1/3 quadrant
  const u = (col + 0.5) * step;
  const v = (row + 0.5) * step;

  switch (face) {
    case "floor":
      return [u, 0, v];

    case "ceiling":
      // Placed right on the ceiling plane at the top of the cell
      return [u, CELL_SIZE, v];

    case "north":
      return [u, CELL_SIZE - v, 0];

    case "south":
      return [u, CELL_SIZE - v, CELL_SIZE];

    case "west":
      return [0, CELL_SIZE - v, u];

    case "east":
      return [CELL_SIZE, CELL_SIZE - v, u];
  }
}

/**
 * Quantizes world coordinates to one of 9 discrete points on the designated cell face surface.
 * Offsets objects so they sit flush against walls and ceilings without clipping.
 */
export function calculateSurfaceWorldPos(
  cell: [number, number, number],
  clickPoint: { x: number; y: number; z: number },
  face: SurfaceFace,
  objectHeight: number = 0,
  objectThickness: number = CELL_SIZE * 0.05, // Half of the fallback box width by default
): [number, number, number] {
  const [cx, cy, cz] = cell;
  const originX = cx * CELL_SIZE;
  const originY = cy * CELL_SIZE;
  const originZ = cz * CELL_SIZE;

  const localX = Math.min(Math.max(clickPoint.x - originX, 0), CELL_SIZE);
  const localY = Math.min(Math.max(clickPoint.y - originY, 0), CELL_SIZE);
  const localZ = Math.min(Math.max(clickPoint.z - originZ, 0), CELL_SIZE);

  const step = CELL_SIZE / 3;

  const getSubIndex = (val: number) => {
    const idx = Math.floor(val / step);
    return Math.min(Math.max(idx, 0), 2);
  };

  let col = 0;
  let row = 0;

  if (face === "floor" || face === "ceiling") {
    col = getSubIndex(localX);
    row = getSubIndex(localZ);
  } else if (face === "north" || face === "south") {
    col = getSubIndex(localX);
    row = getSubIndex(CELL_SIZE - localY);
  } else if (face === "east" || face === "west") {
    col = getSubIndex(localZ);
    row = getSubIndex(CELL_SIZE - localY);
  }

  const [offX, offY, offZ] = getFaceSubOffset(face, col, row);

  let finalX = originX + offX;
  let finalY = originY + offY;
  let finalZ = originZ + offZ;

  // Offset logic based on surface face orientation:
  if (face === "ceiling") {
    // Shift downward into the room
    finalY -= objectHeight;
  } else if (face === "north") {
    // Wall at Z = 0; push into the cell (+Z direction)
    finalZ += objectThickness;
  } else if (face === "south") {
    // Wall at Z = CELL_SIZE; push into the cell (-Z direction)
    finalZ -= objectThickness;
  } else if (face === "west") {
    // Wall at X = 0; push into the cell (+X direction)
    finalX += objectThickness;
  } else if (face === "east") {
    // Wall at X = CELL_SIZE; push into the cell (-X direction)
    finalX -= objectThickness;
  }

  return [finalX, finalY, finalZ];
}
