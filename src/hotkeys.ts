import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useEditorStore } from "./store";

export function useCameraHotkeys() {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const speed = 0.8;

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (e.key === " ") keys.current["space"] = true;
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
      if (e.key === " ") keys.current["space"] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      const dir = new THREE.Vector3();
      if (keys.current["w"]) dir.add(forward);
      if (keys.current["s"]) dir.sub(forward);
      if (keys.current["d"]) dir.add(right);
      if (keys.current["a"]) dir.sub(right);
      if (keys.current["space"]) dir.y += 1;
      if (keys.current["shift"]) dir.y -= 1;
      if (dir.lengthSq() > 0) {
        dir.normalize().multiplyScalar(speed);
        camera.position.add(dir);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [camera]);
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
