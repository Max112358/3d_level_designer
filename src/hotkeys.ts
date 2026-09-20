import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useEditorStore } from "./store";

export function useCameraHotkeys() {
  const { camera, controls } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const speed = 0.8;
  const wheelSpeed = 1.5;

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))
        return;
      keys.current[e.key.toLowerCase()] = true;
      if (e.key === " ") keys.current["space"] = true;
    };

    const onUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
      if (e.key === " ") keys.current["space"] = false;
    };

    // Right-click handling: Move target right in front of lens to rotate in place without collapsing direction
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2 && controls && "target" in controls) {
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);

        // Place target slightly ahead along current view vector to maintain direction
        (controls as unknown as { target: THREE.Vector3 }).target
          .copy(camera.position)
          .addScaledVector(dir, 0.01);
        (controls as unknown as { update: () => void }).update();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2 && controls && "target" in controls) {
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);

        // Restore target further out along current view vector to prevent camera snapping/flicking
        (controls as unknown as { target: THREE.Vector3 }).target
          .copy(camera.position)
          .addScaledVector(dir, 10);
        (controls as unknown as { update: () => void }).update();
      }
    };

    // Mouse wheel 3D dolly movement
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const dir3D = new THREE.Vector3();
      camera.getWorldDirection(dir3D);

      const moveDistance = e.deltaY < 0 ? wheelSpeed : -wheelSpeed;
      dir3D.multiplyScalar(moveDistance);

      camera.position.add(dir3D);

      if (controls && "target" in controls) {
        (controls as unknown as { target: THREE.Vector3 }).target.add(dir3D);
        (controls as unknown as { update: () => void }).update();
      }
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("wheel", onWheel);
    };
  }, [camera, controls]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3()
        .crossVectors(forward, new THREE.Vector3(0, 1, 0))
        .normalize();

      const dir = new THREE.Vector3();

      if (keys.current["w"]) dir.add(forward);
      if (keys.current["s"]) dir.sub(forward);
      if (keys.current["a"]) dir.sub(right);
      if (keys.current["d"]) dir.add(right);
      if (keys.current["space"]) dir.y += 1;
      if (keys.current["shift"]) dir.y -= 1;

      if (dir.lengthSq() > 0) {
        dir.normalize().multiplyScalar(speed);
        camera.position.add(dir);

        if (controls && "target" in controls) {
          (controls as unknown as { target: THREE.Vector3 }).target.add(dir);
          (controls as unknown as { update: () => void }).update();
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [camera, controls]);
}

export function useGlobalHotkeys() {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const setTool = useEditorStore((s) => s.setTool);
  const clearSelection = useEditorStore((s) => s.clearSelection);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTool("pointer");
        clearSelection();
      }
      if (e.key.toLowerCase() === "i") {
        setTool("eyedropper");
      }
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, setTool, clearSelection]);
}
