import { useMemo } from "react";
import * as THREE from "three";
import { useEditorStore } from "./store";
import { CELL_SIZE, parseCellKey, Direction } from "./types";
import { getMaterial } from "./assetManager";

const FACES: Direction[] = ["north", "south", "east", "west"];

function faceVisible(
  cell: { floor: string; ceiling: string; walls: Record<Direction, string> },
  face: "floor" | "ceiling" | Direction,
): boolean {
  const id =
    face === "floor"
      ? cell.floor
      : face === "ceiling"
        ? cell.ceiling
        : cell.walls[face];
  return id !== undefined && id !== "none";
}

function isOccluded(
  levelCells: Record<
    string,
    { floor: string; ceiling: string; walls: Record<Direction, string> }
  >,
  x: number,
  y: number,
  z: number,
  face: "floor" | "ceiling" | Direction,
): boolean {
  const neighborKey =
    face === "floor"
      ? `${x},${y - 1},${z}`
      : face === "ceiling"
        ? `${x},${y + 1},${z}`
        : face === "north"
          ? `${x},${y},${z - 1}`
          : face === "south"
            ? `${x},${y},${z + 1}`
            : face === "east"
              ? `${x + 1},${y},${z}`
              : `${x - 1},${y},${z}`;

  const neighbor = levelCells[neighborKey];
  if (!neighbor) return false;

  if (face === "floor") return neighbor.ceiling !== "none";
  if (face === "ceiling") return neighbor.floor !== "none";

  // Back-to-back walls should remain visible from their respective cell interiors
  return false;
}

export function LevelGeometry() {
  const level = useEditorStore((s) => s.level);
  const layerY = useEditorStore((s) => s.layerY);
  const isolateLayer = useEditorStore((s) => s.isolateLayer);

  const quads = useMemo(() => {
    const out: {
      key: string;
      face: "floor" | "ceiling" | Direction;
      id: string;
      p1: THREE.Vector3;
      p2: THREE.Vector3;
      p3: THREE.Vector3;
      p4: THREE.Vector3;
      normal: THREE.Vector3;
    }[] = [];

    Object.entries(level.cells).forEach(([key, cell]) => {
      const [x, y, z] = parseCellKey(key);
      if (isolateLayer && y !== layerY) return;
      const min = new THREE.Vector3(
        x * CELL_SIZE,
        y * CELL_SIZE,
        z * CELL_SIZE,
      );
      const max = new THREE.Vector3(
        (x + 1) * CELL_SIZE,
        (y + 1) * CELL_SIZE,
        (z + 1) * CELL_SIZE,
      );

      if (
        faceVisible(cell, "floor") &&
        !isOccluded(level.cells, x, y, z, "floor")
      ) {
        out.push({
          key,
          face: "floor",
          id: cell.floor,
          p1: new THREE.Vector3(min.x, min.y, min.z),
          p2: new THREE.Vector3(max.x, min.y, min.z),
          p3: new THREE.Vector3(max.x, min.y, max.z),
          p4: new THREE.Vector3(min.x, min.y, max.z),
          normal: new THREE.Vector3(0, 1, 0),
        });
      }
      if (
        faceVisible(cell, "ceiling") &&
        !isOccluded(level.cells, x, y, z, "ceiling")
      ) {
        out.push({
          key,
          face: "ceiling",
          id: cell.ceiling,
          p1: new THREE.Vector3(min.x, max.y, max.z),
          p2: new THREE.Vector3(max.x, max.y, max.z),
          p3: new THREE.Vector3(max.x, max.y, min.z),
          p4: new THREE.Vector3(min.x, max.y, min.z),
          normal: new THREE.Vector3(0, -1, 0),
        });
      }
      FACES.forEach((face) => {
        if (
          faceVisible(cell, face) &&
          !isOccluded(level.cells, x, y, z, face)
        ) {
          const id = cell.walls[face];
          if (face === "north") {
            out.push({
              key,
              face,
              id,
              p1: new THREE.Vector3(max.x, max.y, min.z),
              p2: new THREE.Vector3(min.x, max.y, min.z),
              p3: new THREE.Vector3(min.x, min.y, min.z),
              p4: new THREE.Vector3(max.x, min.y, min.z),
              normal: new THREE.Vector3(0, 0, -1),
            });
          } else if (face === "south") {
            out.push({
              key,
              face,
              id,
              p1: new THREE.Vector3(min.x, max.y, max.z),
              p2: new THREE.Vector3(max.x, max.y, max.z),
              p3: new THREE.Vector3(max.x, min.y, max.z),
              p4: new THREE.Vector3(min.x, min.y, max.z),
              normal: new THREE.Vector3(0, 0, 1),
            });
          } else if (face === "east") {
            out.push({
              key,
              face,
              id,
              p1: new THREE.Vector3(max.x, max.y, max.z),
              p2: new THREE.Vector3(max.x, max.y, min.z),
              p3: new THREE.Vector3(max.x, min.y, min.z),
              p4: new THREE.Vector3(max.x, min.y, max.z),
              normal: new THREE.Vector3(1, 0, 0),
            });
          } else if (face === "west") {
            out.push({
              key,
              face,
              id,
              p1: new THREE.Vector3(min.x, max.y, min.z),
              p2: new THREE.Vector3(min.x, max.y, max.z),
              p3: new THREE.Vector3(min.x, min.y, max.z),
              p4: new THREE.Vector3(min.x, min.y, min.z),
              normal: new THREE.Vector3(-1, 0, 0),
            });
          }
        }
      });
    });
    return out;
  }, [level.cells, layerY, isolateLayer]);

  return (
    <group>
      {quads.map((q) => {
        const geometry = new THREE.BufferGeometry();
        const positions = [
          q.p1.x,
          q.p1.y,
          q.p1.z,
          q.p2.x,
          q.p2.y,
          q.p2.z,
          q.p3.x,
          q.p3.y,
          q.p3.z,
          q.p4.x,
          q.p4.y,
          q.p4.z,
        ];
        const normals = [
          q.normal.x,
          q.normal.y,
          q.normal.z,
          q.normal.x,
          q.normal.y,
          q.normal.z,
          q.normal.x,
          q.normal.y,
          q.normal.z,
          q.normal.x,
          q.normal.y,
          q.normal.z,
        ];
        const uvs = [0, 0, 1, 0, 1, 1, 0, 1];
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(positions, 3),
        );
        geometry.setAttribute(
          "normal",
          new THREE.Float32BufferAttribute(normals, 3),
        );
        geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex([0, 1, 2, 0, 2, 3]);
        geometry.computeBoundingSphere();
        return (
          <mesh
            key={`${q.key}-${q.face}`}
            geometry={geometry}
            material={getMaterial(q.id)}
            userData={{ kind: "cell", key: q.key, face: q.face }}
          />
        );
      })}
    </group>
  );
}
