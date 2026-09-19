import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

function CompassGizmo({ mainCamera }: { mainCamera?: THREE.Camera }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;

    // Use the main scene camera if provided, otherwise fallback to local
    const targetCamera = mainCamera || camera;
    groupRef.current.quaternion.copy(targetCamera.quaternion).invert();
  });

  return (
    <group ref={groupRef}>
      {/* Center Pivot */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* North Pointer (Red) */}
      <group position={[0, 0, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.15, 0.6, 16]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <Text
          position={[0, 0.7, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          fontSize={0.35}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
        >
          N
        </Text>
      </group>

      {/* South Pointer */}
      <group position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.12, 0.5, 16]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </group>

      {/* East Pointer */}
      <group position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.12, 0.5, 16]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      </group>

      {/* West Pointer */}
      <group position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.12, 0.5, 16]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      </group>
    </group>
  );
}

export function Compass({ mainCamera }: { mainCamera?: THREE.Camera }) {
  return (
    <div className="w-10 h-10 bg-slate-900/90 border border-slate-700 rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 4, 2]} intensity={1} />
        <CompassGizmo mainCamera={mainCamera} />
      </Canvas>
    </div>
  );
}
