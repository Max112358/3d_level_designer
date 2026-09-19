import { useMemo } from "react";
import * as THREE from "three";
import { useEditorStore } from "./store";
import { CELL_SIZE, parseCellKey, Direction } from "./types";
import { getMaterials, getEntryById } from "./assetManager";

const FACES: Direction[] = ["north", "south", "east", "west"];

// Small visual displacement inward/outward along face normal to prevent z-fighting
const OFFSET = 0.01;

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

      if (faceVisible(cell, "floor")) {
        const normal = new THREE.Vector3(0, 1, 0);
        const shift = normal.clone().multiplyScalar(OFFSET);
        out.push({
          key,
          face: "floor",
          id: cell.floor,
          p1: new THREE.Vector3(min.x, min.y, min.z).add(shift),
          p2: new THREE.Vector3(max.x, min.y, min.z).add(shift),
          p3: new THREE.Vector3(max.x, min.y, max.z).add(shift),
          p4: new THREE.Vector3(min.x, min.y, max.z).add(shift),
          normal,
        });
      }
      if (faceVisible(cell, "ceiling")) {
        const normal = new THREE.Vector3(0, -1, 0);
        const shift = normal.clone().multiplyScalar(OFFSET);
        out.push({
          key,
          face: "ceiling",
          id: cell.ceiling,
          p1: new THREE.Vector3(min.x, max.y, max.z).add(shift),
          p2: new THREE.Vector3(max.x, max.y, max.z).add(shift),
          p3: new THREE.Vector3(max.x, max.y, min.z).add(shift),
          p4: new THREE.Vector3(min.x, max.y, min.z).add(shift),
          normal,
        });
      }
      FACES.forEach((face) => {
        if (faceVisible(cell, face)) {
          const id = cell.walls[face];
          let normal: THREE.Vector3;
          let p1: THREE.Vector3;
          let p2: THREE.Vector3;
          let p3: THREE.Vector3;
          let p4: THREE.Vector3;

          if (face === "north") {
            normal = new THREE.Vector3(0, 0, -1);
            p1 = new THREE.Vector3(max.x, max.y, min.z);
            p2 = new THREE.Vector3(min.x, max.y, min.z);
            p3 = new THREE.Vector3(min.x, min.y, min.z);
            p4 = new THREE.Vector3(max.x, min.y, min.z);
          } else if (face === "south") {
            normal = new THREE.Vector3(0, 0, 1);
            p1 = new THREE.Vector3(min.x, max.y, max.z);
            p2 = new THREE.Vector3(max.x, max.y, max.z);
            p3 = new THREE.Vector3(max.x, min.y, max.z);
            p4 = new THREE.Vector3(min.x, min.y, max.z);
          } else if (face === "east") {
            normal = new THREE.Vector3(1, 0, 0);
            p1 = new THREE.Vector3(max.x, max.y, max.z);
            p2 = new THREE.Vector3(max.x, max.y, min.z);
            p3 = new THREE.Vector3(max.x, min.y, min.z);
            p4 = new THREE.Vector3(max.x, min.y, max.z);
          } else {
            // west
            normal = new THREE.Vector3(-1, 0, 0);
            p1 = new THREE.Vector3(min.x, max.y, min.z);
            p2 = new THREE.Vector3(min.x, max.y, max.z);
            p3 = new THREE.Vector3(min.x, min.y, max.z);
            p4 = new THREE.Vector3(min.x, min.y, min.z);
          }

          const shift = normal.clone().multiplyScalar(OFFSET);
          out.push({
            key,
            face,
            id,
            p1: p1.add(shift),
            p2: p2.add(shift),
            p3: p3.add(shift),
            p4: p4.add(shift),
            normal,
          });
        }
      });
    });
    return out;
  }, [level.cells, layerY, isolateLayer]);

  return (
    <group>
      {quads.map((q) => {
        const entry = getEntryById(q.id); //
        const materials = getMaterials(q.id, entry?.path);
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
        //const uvs = [0, 0, 1, 0, 1, 1, 0, 1];
        const uvs = [0, 1, 1, 1, 1, 0, 0, 0];
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
        // Group 0: Front face (index count: 6, material index: 0)
        geometry.addGroup(0, 6, 0);
        // Group 1: Back face (index count: 6, material index: 1)
        geometry.addGroup(0, 6, 1);

        geometry.computeBoundingSphere();
        return (
          <mesh
            key={`${q.key}-${q.face}`}
            geometry={geometry}
            material={materials}
            userData={{ kind: "cell", key: q.key, face: q.face }}
          />
        );
      })}
    </group>
  );
}
