import { useMemo } from "react";
import * as THREE from "three";
import { useEditorStore } from "./store";
import { CELL_SIZE, parseCellKey, Direction } from "./types";

const FACES: Direction[] = ["north", "south", "east", "west"];

function faceVisible(cell: { floor: string; ceiling: string; walls: Record<Direction, string> }, face: "floor" | "ceiling" | Direction): boolean {
  const id = face === "floor" ? cell.floor : face === "ceiling" ? cell.ceiling : cell.walls[face];
  return id !== undefined && id !== "none";
}

function isOccluded(levelCells: Record<string, { floor: string; ceiling: string; walls: Record<Direction, string> }>, x: number, y: number, z: number, face: "floor" | "ceiling" | Direction): boolean {
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
  const opposite: Record<Direction, Direction> = { north: "south", south: "north", east: "west", west: "east" };
  return neighbor.walls[opposite[face]] !== "none";
}

export function LevelGeometry() {
  const level = useEditorStore((s) => s.level);
  const layerY = useEditorStore((s) => s.layerY);
  const isolateLayer = useEditorStore((s) => s.isolateLayer);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    let indexOffset = 0;

    const addQuad = (p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, p4: THREE.Vector3, normal: THREE.Vector3, color: THREE.Color) => {
      positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);
      normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z);
      uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);
      indices.push(indexOffset, indexOffset + 1, indexOffset + 2, indexOffset, indexOffset + 2, indexOffset + 3);
      indexOffset += 4;
    };

    Object.entries(level.cells).forEach(([key, cell]) => {
      const [x, y, z] = parseCellKey(key);
      if (isolateLayer && y !== layerY) return;
      const min = new THREE.Vector3(x * CELL_SIZE, y * CELL_SIZE, z * CELL_SIZE);
      const max = new THREE.Vector3((x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE, (z + 1) * CELL_SIZE);

      if (faceVisible(cell, "floor") && !isOccluded(level.cells, x, y, z, "floor")) {
        const c = new THREE.Color().setHex(0x888888);
        addQuad(
          new THREE.Vector3(min.x, min.y, min.z),
          new THREE.Vector3(max.x, min.y, min.z),
          new THREE.Vector3(max.x, min.y, max.z),
          new THREE.Vector3(min.x, min.y, max.z),
          new THREE.Vector3(0, 1, 0),
          c
        );
      }
      if (faceVisible(cell, "ceiling") && !isOccluded(level.cells, x, y, z, "ceiling")) {
        const c = new THREE.Color().setHex(0xaaaaaa);
        addQuad(
          new THREE.Vector3(min.x, max.y, max.z),
          new THREE.Vector3(max.x, max.y, max.z),
          new THREE.Vector3(max.x, max.y, min.z),
          new THREE.Vector3(min.x, max.y, min.z),
          new THREE.Vector3(0, -1, 0),
          c
        );
      }
      FACES.forEach((face) => {
        if (faceVisible(cell, face) && !isOccluded(level.cells, x, y, z, face)) {
          const c = new THREE.Color().setHex(0x999999);
          if (face === "north") {
            addQuad(
              new THREE.Vector3(max.x, max.y, min.z),
              new THREE.Vector3(min.x, max.y, min.z),
              new THREE.Vector3(min.x, min.y, min.z),
              new THREE.Vector3(max.x, min.y, min.z),
              new THREE.Vector3(0, 0, -1),
              c
            );
          } else if (face === "south") {
            addQuad(
              new THREE.Vector3(min.x, max.y, max.z),
              new THREE.Vector3(max.x, max.y, max.z),
              new THREE.Vector3(max.x, min.y, max.z),
              new THREE.Vector3(min.x, min.y, max.z),
              new THREE.Vector3(0, 0, 1),
              c
            );
          } else if (face === "east") {
            addQuad(
              new THREE.Vector3(max.x, max.y, max.z),
              new THREE.Vector3(max.x, max.y, min.z),
              new THREE.Vector3(max.x, min.y, min.z),
              new THREE.Vector3(max.x, min.y, max.z),
              new THREE.Vector3(1, 0, 0),
              c
            );
          } else if (face === "west") {
            addQuad(
              new THREE.Vector3(min.x, max.y, min.z),
              new THREE.Vector3(min.x, max.y, max.z),
              new THREE.Vector3(min.x, min.y, max.z),
              new THREE.Vector3(min.x, min.y, min.z),
              new THREE.Vector3(-1, 0, 0),
              c
            );
          }
        }
      });
    });

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeBoundingSphere();
    return geo;
  }, [level.cells, layerY, isolateLayer]);

  return (
    <mesh geometry={geometry} userData={{ kind: "level" }}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}