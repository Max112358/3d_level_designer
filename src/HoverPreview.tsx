// HoverPreview.tsx
import { useSceneInteraction } from "./interaction";
import { useEditorStore } from "./store";
import { CELL_SIZE, parseCellKey } from "./types";
import { resolveObjectPlacement } from "./gridUtils";
import { AssetModel } from "./AssetModel";

export function HoverPreview() {
  const hover = useSceneInteraction();
  const tool = useEditorStore((s) => s.tool);
  const activeAssetId = useEditorStore((s) => s.activeAssetId);

  if (!hover) return null;

  const isObjectTool =
    tool === "prop" ||
    tool === "entity" ||
    tool === "item" ||
    tool === "light" ||
    tool === "audio" ||
    tool === "trigger";

  if (isObjectTool) {
    const { position, scale } = resolveObjectPlacement(
      hover.key,
      hover.point,
      hover.face,
      activeAssetId,
    );

    return (
      <group position={position} scale={scale}>
        {activeAssetId ? (
          <AssetModel assetId={activeAssetId} opacity={0.5} />
        ) : (
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial
              color="#facc15"
              transparent
              opacity={0.35}
              depthTest={false}
            />
          </mesh>
        )}
      </group>
    );
  }

  // Fallback for cell/face tile painting highlights
  const [x, y, z] = parseCellKey(hover.key);
  const min = [x * CELL_SIZE, y * CELL_SIZE, z * CELL_SIZE];
  const max = [(x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE, (z + 1) * CELL_SIZE];

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

  return (
    <mesh position={position} scale={scale}>
      <boxGeometry />
      <meshBasicMaterial
        color="#facc15"
        transparent
        opacity={0.35}
        depthTest={false}
      />
    </mesh>
  );
}
