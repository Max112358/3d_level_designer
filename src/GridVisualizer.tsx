import { useRef } from "react";
import * as THREE from "three";
import { useEditorStore } from "./store";
import { CELL_SIZE } from "./types";

export function GridVisualizer() {
  const showGrid = useEditorStore((s) => s.showGrid);
  const layerY = useEditorStore((s) => s.layerY);
  const gridRef = useRef<THREE.GridHelper>(null);

  if (!showGrid) return null;

  return (
    <gridHelper
      ref={gridRef}
      args={[100, 20, "#334155", "#1e293b"]}
      position={[0, layerY * CELL_SIZE, 0]}
    />
  );
}
