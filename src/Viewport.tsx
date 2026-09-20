import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { LevelGeometry } from "./LevelGeometry";
import { Objects } from "./Objects";
import { GridVisualizer } from "./GridVisualizer";
import { HoverPreview } from "./HoverPreview";
import { useCameraHotkeys, useGlobalHotkeys } from "./hotkeys";

// Component that captures the main scene camera and passes it up
function CameraTracker({
  onCameraReady,
}: {
  onCameraReady: (cam: THREE.Camera) => void;
}) {
  const { camera } = useThree();
  useEffect(() => {
    onCameraReady(camera);
  }, [camera, onCameraReady]);
  return null;
}

function Scene({
  onCameraReady,
}: {
  onCameraReady: (cam: THREE.Camera) => void;
}) {
  const { camera } = useThree();
  useCameraHotkeys();
  useGlobalHotkeys();

  useEffect(() => {
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <CameraTracker onCameraReady={onCameraReady} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 80, 30]} intensity={0.8} castShadow />
      <OrbitControls
        makeDefault
        enablePan
        enableZoom={false}
        enableRotate
        enableDamping={false} // Prevents inertia/momentum when releasing right-click
        mouseButtons={{
          LEFT: undefined,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />
      <GridVisualizer />
      <LevelGeometry />
      <Objects />
      <HoverPreview />
    </>
  );
}

export function Viewport({
  onCameraReady,
}: {
  onCameraReady: (cam: THREE.Camera) => void;
}) {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ fov: 50, near: 0.1, far: 1000, position: [20, 20, 20] }}
        gl={{ antialias: true }}
      >
        <Scene onCameraReady={onCameraReady} />
      </Canvas>
    </div>
  );
}
