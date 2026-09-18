import { useSceneInteraction } from "./interaction";
import { useEditorStore } from "./store";
import { CELL_SIZE, parseCellKey } from "./types";

export function HoverPreview() {
  const hover = useSceneInteraction();
  const tool = useEditorStore((s) => s.tool);
  const activeAssetId = useEditorStore((s) => s.activeAssetId);

  if (!hover) return null;

  const [x, y, z] = parseCellKey(hover.key);
  const min = [x * CELL_SIZE, y * CELL_SIZE, z * CELL_SIZE] as [number, number, number];
  const max = [(x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE, (z + 1) * CELL_SIZE] as [number, number, number];

  let position: [number, number, number] = [0, 0, 0];
  let scale: [number, number, number] = [CELL_SIZE, CELL_SIZE, CELL_SIZE];

  if (hover.face === "floor") {
    position = [(min[0] + max[0]) / 2, min[1] + 0.05, (min[2] + max[2]) / 2];
    scale = [CELL_SIZE, 0.1, CELL_SIZE];
  } else if (hover.face === "ceiling") {
    position = [(min[0] + max[0]) / 2, max[1] - 0.05, (min[2] + max[2]) / 2];
    scale = [CELL_SIZE, 0.1, CELL_SIZE];
  } else if (hover.face === "north") {
    position = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, min[2] + 0.05];
    scale = [CELL_SIZE, CELL_SIZE, 0.1];
  } else if (hover.face === "south") {
    position = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, max[2] - 0.05];
    scale = [CELL_SIZE, CELL_SIZE, 0.1];
  } else if (hover.face === "east") {
    position = [max[0] - 0.05, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    scale = [0.1, CELL_SIZE, CELL_SIZE];
  } else if (hover.face === "west") {
    position = [min[0] + 0.05, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    scale = [0.1, CELL_SIZE, CELL_SIZE];
  }

  const isObjectTool = tool === "prop" || tool === "entity" || tool === "item" || tool === "light" || tool === "audio" || tool === "trigger";

  if (isObjectTool) {
    position = [hover.point.x, hover.point.y, hover.point.z];
    scale = [1, 1, 1];
  }

  return (
    <mesh position={position} scale={scale}>
      <boxGeometry />
      <meshBasicMaterial color={activeAssetId ? "#38bdf8" : "#facc15"} transparent opacity={0.35} depthTest={false} />
    </mesh>
  );
}