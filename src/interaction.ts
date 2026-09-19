import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEditorStore, EditorActions } from "./store";
import {
  Direction,
  CELL_SIZE,
  cellKey,
  parseCellKey,
  cellCenter,
} from "./types";
import { getEntryById } from "./assetManager";

const FACES: Direction[] = ["north", "south", "east", "west"];

function getFaceNormal(face: "floor" | "ceiling" | Direction): THREE.Vector3 {
  switch (face) {
    case "floor":
      return new THREE.Vector3(0, 1, 0);
    case "ceiling":
      return new THREE.Vector3(0, -1, 0);
    case "north":
      return new THREE.Vector3(0, 0, -1);
    case "south":
      return new THREE.Vector3(0, 0, 1);
    case "east":
      return new THREE.Vector3(1, 0, 0);
    case "west":
      return new THREE.Vector3(-1, 0, 0);
  }
}

function getFacePlane(
  face: "floor" | "ceiling" | Direction,
  x: number,
  y: number,
  z: number,
): THREE.Plane {
  const normal = getFaceNormal(face);
  const min = new THREE.Vector3(x * CELL_SIZE, y * CELL_SIZE, z * CELL_SIZE);
  const max = new THREE.Vector3(
    (x + 1) * CELL_SIZE,
    (y + 1) * CELL_SIZE,
    (z + 1) * CELL_SIZE,
  );
  let point = new THREE.Vector3();
  if (face === "floor")
    point = new THREE.Vector3((min.x + max.x) / 2, min.y, (min.z + max.z) / 2);
  else if (face === "ceiling")
    point = new THREE.Vector3((min.x + max.x) / 2, max.y, (min.z + max.z) / 2);
  else if (face === "north")
    point = new THREE.Vector3((min.x + max.x) / 2, (min.y + max.y) / 2, min.z);
  else if (face === "south")
    point = new THREE.Vector3((min.x + max.x) / 2, (min.y + max.y) / 2, max.z);
  else if (face === "east")
    point = new THREE.Vector3(max.x, (min.y + max.y) / 2, (min.z + max.z) / 2);
  else if (face === "west")
    point = new THREE.Vector3(min.x, (min.y + max.y) / 2, (min.z + max.z) / 2);
  return new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point);
}

function intersectFace(
  raycaster: THREE.Raycaster,
  face: "floor" | "ceiling" | Direction,
  x: number,
  y: number,
  z: number,
): THREE.Vector3 | null {
  const plane = getFacePlane(face, x, y, z);
  const target = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(plane, target);
  if (!hit) return null;
  const min = new THREE.Vector3(x * CELL_SIZE, y * CELL_SIZE, z * CELL_SIZE);
  const max = new THREE.Vector3(
    (x + 1) * CELL_SIZE,
    (y + 1) * CELL_SIZE,
    (z + 1) * CELL_SIZE,
  );
  const eps = 0.001;
  if (face === "floor" || face === "ceiling") {
    if (
      target.x >= min.x - eps &&
      target.x <= max.x + eps &&
      target.z >= min.z - eps &&
      target.z <= max.z + eps
    )
      return target;
  } else if (face === "north" || face === "south") {
    if (
      target.x >= min.x - eps &&
      target.x <= max.x + eps &&
      target.y >= min.y - eps &&
      target.y <= max.y + eps
    )
      return target;
  } else {
    if (
      target.z >= min.z - eps &&
      target.z <= max.z + eps &&
      target.y >= min.y - eps &&
      target.y <= max.y + eps
    )
      return target;
  }
  return null;
}

export function useSceneInteraction() {
  const { camera, scene, gl } = useThree();
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  const activeAssetId = useEditorStore((s) => s.activeAssetId);
  const activeFace = useEditorStore((s) => s.activeFace);
  const layerY = useEditorStore((s) => s.layerY);
  const level = useEditorStore((s) => s.level);
  const setCellFace = useEditorStore((s) => s.setCellFace);
  const eraseCellFace = useEditorStore((s) => s.eraseCellFace);
  const addProp = useEditorStore((s) => s.addProp);
  const addTrigger = useEditorStore((s) => s.addTrigger);
  const addLight = useEditorStore((s) => s.addLight);
  const addAudio = useEditorStore((s) => s.addAudio);
  const addEntity = useEditorStore((s) => s.addEntity);
  const addItem = useEditorStore((s) => s.addItem);
  const setSelection = useEditorStore((s) => s.setSelection);
  const setActiveAssetId = useEditorStore((s) => s.setActiveAssetId);
  const setActiveFace = useEditorStore((s) => s.setActiveFace);

  const [hover, setHover] = useState<{
    key: string;
    face: "floor" | "ceiling" | Direction;
    point: THREE.Vector3;
  } | null>(null);
  const shiftRef = useRef(false);

  // Refs for suppressing object placement when performing a click-and-drag camera orbit
  const isDraggingRef = useRef(false);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => (shiftRef.current = e.shiftKey);
    const onKeyUp = (e: KeyboardEvent) => (shiftRef.current = e.shiftKey);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      // Mark as drag if mouse moves more than 3 pixels from initial press location
      const dist = Math.hypot(
        e.clientX - pointerDownPosRef.current.x,
        e.clientY - pointerDownPosRef.current.y,
      );
      if (dist > 3) {
        isDraggingRef.current = true;
      }

      if (tool === "pointer") {
        setHover(null);
        return;
      }
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      let best: {
        key: string;
        face: "floor" | "ceiling" | Direction;
        point: THREE.Vector3;
        dist: number;
      } | null = null;

      Object.keys(level.cells).forEach((key) => {
        const [x, y, z] = parseCellKey(key);
        if (Math.abs(y - layerY) > 1) return;
        const cell = level.cells[key];
        const faces: ("floor" | "ceiling" | Direction)[] = [
          "floor",
          "ceiling",
          ...FACES,
        ];
        faces.forEach((face) => {
          const matId =
            face === "floor"
              ? cell.floor
              : face === "ceiling"
                ? cell.ceiling
                : cell.walls[face];
          if (matId && matId !== "none") {
            const p = intersectFace(raycaster, face, x, y, z);
            if (p) {
              const d = p.distanceTo(camera.position);
              if (!best || d < best.dist)
                best = { key, face, point: p, dist: d };
            }
          }
        });
      });

      if (
        !best &&
        (tool === "paint" ||
          tool === "prop" ||
          tool === "entity" ||
          tool === "item" ||
          tool === "trigger" ||
          tool === "light" ||
          tool === "audio")
      ) {
        const plane = new THREE.Plane(
          new THREE.Vector3(0, 1, 0),
          -layerY * CELL_SIZE,
        );
        const p = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, p)) {
          const fx = Math.floor(p.x / CELL_SIZE);
          const fz = Math.floor(p.z / CELL_SIZE);
          best = {
            key: cellKey(fx, layerY, fz),
            face: "floor",
            point: p,
            dist: p.distanceTo(camera.position),
          };
        }
      }

      setHover(best);
    };

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || isDraggingRef.current) return;

      // 1. Selection logic (only for pointer / eyedropper)
      if (tool === "pointer" || tool === "eyedropper") {
        const rect = gl.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        for (const hit of intersects) {
          const userData = hit.object.userData;

          if (
            typeof userData.kind === "string" &&
            typeof userData.index === "number"
          ) {
            if (tool === "eyedropper") {
              // Retrieve the object entry/item ID from store arrays
              const state = useEditorStore.getState();
              const kind = userData.kind as "prop" | "entity" | "item";
              const list =
                state.level[
                  kind === "prop"
                    ? "props"
                    : kind === "entity"
                      ? "entities"
                      : "items"
                ];
              const item = list?.[userData.index];

              if (item?.id) {
                setActiveAssetId(item.id);
                setTool(kind); // Switch active placement tool
                return;
              }
            } else {
              setSelection({
                kind: userData.kind as any,
                index: userData.index,
              });
              return;
            }
          }

          if (userData.kind === "cell" && userData.key && tool === "pointer") {
            setSelection({ kind: "cell", key: userData.key });
            return;
          }
        }

        if (tool === "pointer") setSelection(null);
      }

      // 2. Eraser logic for scene objects (props, entities, lights, audio, triggers, items)
      if (tool === "eraser") {
        const rect = gl.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        for (const hit of intersects) {
          const kind = hit.object.userData.kind;
          const index = hit.object.userData.index;
          if (typeof kind === "string" && typeof index === "number") {
            const actionName = `remove${kind.charAt(0).toUpperCase() + kind.slice(1)}`;
            const remove = useEditorStore.getState()[
              actionName as keyof EditorActions
            ] as (i: number) => void;
            if (remove) {
              remove(index);
              return;
            }
          }
        }
      }

      if (!hover) return;

      // 3. Eraser logic for cell faces / tile textures
      if (tool === "paint") {
        if (activeAssetId) {
          setCellFace(hover.key, hover.face, activeAssetId);
        }
      } else if (tool === "eraser") {
        eraseCellFace(hover.key, hover.face);
      } else if (tool === "eyedropper") {
        const cell = level.cells[hover.key];
        if (cell) {
          const id =
            hover.face === "floor"
              ? cell.floor
              : hover.face === "ceiling"
                ? cell.ceiling
                : cell.walls[hover.face];
          if (id && id !== "none") {
            setActiveAssetId(id);
            setActiveFace(hover.face);
            setTool("paint"); // Switch to paint tool upon sampling tile face
          }
        }
      } else if (tool === "prop" && activeAssetId) {
        const entry = getEntryById(activeAssetId);
        const [x, y, z] = parseCellKey(hover.key);
        const center = cellCenter(x, y, z);
        const pos: [number, number, number] = shiftRef.current
          ? [hover.point.x, hover.point.y + 1, hover.point.z]
          : [center[0], center[1] + 1, center[2]];
        addProp({
          id: activeAssetId,
          type: entry?.type ?? "prop",
          pos,
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          properties: {},
        });
      } else if (tool === "entity" && activeAssetId) {
        const entry = getEntryById(activeAssetId);
        const [x, y, z] = parseCellKey(hover.key);
        const center = cellCenter(x, y, z);
        const pos: [number, number, number] = shiftRef.current
          ? [hover.point.x, hover.point.y + 1, hover.point.z]
          : [center[0], center[1] + 1, center[2]];
        addEntity({
          id: activeAssetId,
          type: entry?.type ?? "spawn_point",
          pos,
          rotation: [0, 0, 0],
          properties: {},
        });
      } else if (tool === "item" && activeAssetId) {
        const entry = getEntryById(activeAssetId);
        const [x, y, z] = parseCellKey(hover.key);
        const center = cellCenter(x, y, z);
        const pos: [number, number, number] = shiftRef.current
          ? [hover.point.x, hover.point.y + 0.8, hover.point.z]
          : [center[0], center[1] + 0.8, center[2]];
        addItem({
          id: activeAssetId,
          type: entry?.type ?? "item_pickup",
          pos,
          properties: {},
        });
      } else if (tool === "light") {
        const [x, y, z] = parseCellKey(hover.key);
        const center = cellCenter(x, y, z);
        const pos: [number, number, number] = shiftRef.current
          ? [hover.point.x, hover.point.y + 2.5, hover.point.z]
          : [center[0], center[1] + 2.5, center[2]];
        addLight({
          id: `light_${Date.now()}`,
          pos,
          color: "#4488ff",
          intensity: 2,
          radius: 12,
          flicker: false,
          properties: {},
        });
      } else if (tool === "audio") {
        const [x, y, z] = parseCellKey(hover.key);
        const center = cellCenter(x, y, z);
        const pos: [number, number, number] = shiftRef.current
          ? [hover.point.x, hover.point.y + 4, hover.point.z]
          : [center[0], center[1] + 4, center[2]];
        addAudio({
          id: `audio_${Date.now()}`,
          pos,
          soundClip: "audio/sfx/drip_loop.wav",
          volume: 0.6,
          maxDistance: 15,
          isLooping: true,
          properties: {},
        });
      } else if (tool === "trigger") {
        const [x, y, z] = parseCellKey(hover.key);
        const min = [x * CELL_SIZE, y * CELL_SIZE, z * CELL_SIZE] as [
          number,
          number,
          number,
        ];
        const max = [
          (x + 2) * CELL_SIZE,
          (y + 3) * CELL_SIZE,
          (z + 2) * CELL_SIZE,
        ] as [number, number, number];
        addTrigger({
          id: `trigger_${Date.now()}`,
          bounds: { min, max },
          properties: {
            triggerOnce: true,
            onEnterScript: "",
            requiredTarget: "player",
          },
        });
      }
    };

    gl.domElement.addEventListener("pointerdown", onPointerDown);
    gl.domElement.addEventListener("pointermove", onPointerMove);
    gl.domElement.addEventListener("click", onClick);
    return () => {
      gl.domElement.removeEventListener("pointerdown", onPointerDown);
      gl.domElement.removeEventListener("pointermove", onPointerMove);
      gl.domElement.removeEventListener("click", onClick);
    };
  }, [
    camera,
    scene,
    gl,
    tool,
    activeAssetId,
    activeFace,
    layerY,
    level,
    hover,
    setCellFace,
    eraseCellFace,
    addProp,
    addTrigger,
    addLight,
    addAudio,
    addEntity,
    addItem,
    setSelection,
    setActiveAssetId,
    setActiveFace,
  ]);

  return hover;
}
