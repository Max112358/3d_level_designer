import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { LevelGeometry } from "./LevelGeometry";
import { Objects } from "./Objects";
import { GridVisualizer } from "./GridVisualizer";
import { HoverPreview } from "./HoverPreview";
import { useCameraHotkeys, useGlobalHotkeys } from "./hotkeys";

function Scene() {
  const { camera } = useThree();
  useCameraHotkeys();
  useGlobalHotkeys();

  useEffect(() => {
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 80, 30]} intensity={0.8} castShadow />
      <OrbitControls makeDefault enablePan enableZoom enableRotate />
      <GridVisualizer />
      <LevelGeometry />
      <Objects />
      <HoverPreview />
    </>
  );
}

export function Viewport() {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ fov: 50, near: 0.1, far: 1000, position: [20, 20, 20] }}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}