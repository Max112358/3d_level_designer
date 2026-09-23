import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Viewport } from "./Viewport";
import { Toolbar } from "./Toolbar";
import { RightSidebar } from "./RightSidebar";
import { TopBar } from "./TopBar";
import { LayerControls } from "./LayerControls";
import { Compass } from "./Compass";
import { LoadingScreen } from "./LoadingScreen";
import { useManifest } from "./hooks";
import { useEditorStore } from "./store";
import { emptyLevel, LevelData } from "./types";
import {
  getLastLevelName,
  getStoredLevel,
  getStoredLevels,
  saveStoredLevel,
} from "./storage";

export default function App() {
  const { loading } = useManifest();
  const [mainCamera, setMainCamera] = useState<THREE.Camera | null>(null);

  const level = useEditorStore((s) => s.level);
  const loadLevel = useEditorStore((s) => s.loadLevel);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    let saved: LevelData | null = null;
    const lastName = getLastLevelName();
    if (lastName) saved = getStoredLevel(lastName);

    if (!saved) {
      const all = getStoredLevels();
      if (all.length > 0) saved = all[0].data;
    }

    if (saved) loadLevel(saved);
    else loadLevel({ ...emptyLevel(), name: "Untitled" });
  }, [loadLevel]);

  useEffect(() => {
    if (!level.name) return;
    saveStoredLevel(level);
  }, [level]);

  return (
    <div className="relative w-full h-full flex flex-col">
      <LoadingScreen loading={loading} />
      <TopBar />
      <div className="relative flex-1 min-h-0">
        <Viewport onCameraReady={setMainCamera} />
        <div className="absolute top-4 left-4 z-10">
          <Toolbar />
        </div>
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end max-h-[calc(100vh-2rem)] pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <Compass mainCamera={mainCamera ?? undefined} />
            <LayerControls />
          </div>
          <div className="pointer-events-auto">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
