import { useEffect, useState } from "react";
import * as THREE from "three";
import { useEditorStore } from "./store";
import { CELL_SIZE } from "./types";
import {
  loadModel,
  createFallbackMesh,
  createLightHelper,
  createAudioHelper,
  createTriggerHelper,
  getEntryById,
} from "./assetManager";
import { calculateWorldPos } from "./gridUtils";

function InstancedObjectGroup({
  items,
  kind,
  createHelper,
}: {
  items: {
    id: string;
    pos: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  }[];
  kind: string;
  createHelper?: (entry: {
    id: string;
    name: string;
    type?: string;
  }) => THREE.Group;
}) {
  const [groups, setGroups] = useState<THREE.Group[]>([]);

  useEffect(() => {
    let mounted = true;
    const newGroups: THREE.Group[] = [];
    items.forEach((item, index) => {
      const entry = getEntryById(item.id);
      const path = entry?.path;
      if (path) {
        loadModel(path)
          .then((gltf) => {
            if (!mounted) return;
            const clone = gltf.scene.clone(true);
            clone.userData = { kind, index };
            clone.traverse((child) => {
              child.userData = { kind, index };
            });
            newGroups[index] = clone;
            setGroups((prev) => {
              const arr = [...prev];
              arr[index] = clone;
              return arr;
            });
          })
          .catch(() => {
            if (!mounted) return;
            const fallback = createHelper
              ? createHelper(entry || { id: item.id, name: item.id })
              : createFallbackMesh(
                  entry || { id: item.id, name: item.id, category: kind },
                );
            fallback.userData = { kind, index };
            fallback.traverse((child) => {
              child.userData = { kind, index };
            });
            setGroups((prev) => {
              const arr = [...prev];
              arr[index] = fallback;
              return arr;
            });
          });
      } else {
        const fallback = createHelper
          ? createHelper(entry || { id: item.id, name: item.id })
          : createFallbackMesh(
              entry || { id: item.id, name: item.id, category: kind },
            );
        fallback.userData = { kind, index };
        fallback.traverse((child) => {
          child.userData = { kind, index };
        });
        newGroups[index] = fallback;
      }
    });
    setGroups(newGroups);
    return () => {
      mounted = false;
    };
  }, [items, kind, createHelper]);

  return (
    <group>
      {items.map((item, index) => {
        const g = groups[index];
        return (
          <group
            key={`${kind}-${index}`}
            position={item.pos}
            rotation={item.rotation ?? [0, 0, 0]}
            scale={item.scale ?? [1, 1, 1]}
            userData={{ kind, index }}
          >
            {g ? <primitive object={g} /> : null}
          </group>
        );
      })}
    </group>
  );
}

export function Objects() {
  const level = useEditorStore((s) => s.level);
  const layerY = useEditorStore((s) => s.layerY);
  const isolateLayer = useEditorStore((s) => s.isolateLayer);

  // Filter items by active layer
  const filteredProps = level.props.filter(
    (p) => !isolateLayer || Math.floor(p.pos[1] / CELL_SIZE) === layerY,
  );
  const filteredEntities = level.entities.filter(
    (e) => !isolateLayer || Math.floor(e.pos[1] / CELL_SIZE) === layerY,
  );
  const filteredItems = level.items.filter(
    (i) => !isolateLayer || Math.floor(i.pos[1] / CELL_SIZE) === layerY,
  );
  const filteredLights = level.lights.filter(
    (l) => !isolateLayer || Math.floor(l.pos[1] / CELL_SIZE) === layerY,
  );
  const filteredAudio = level.audio.filter(
    (a) => !isolateLayer || Math.floor(a.pos[1] / CELL_SIZE) === layerY,
  );
  const filteredTriggers = level.triggers.filter(
    (t) => !isolateLayer || Math.floor(t.bounds.min[1] / CELL_SIZE) === layerY,
  );

  // 2. Map through props and items to resolve world positions from subPos
  const resolvedProps = filteredProps.map((prop) => {
    if (prop.cell) {
      const computedPos = calculateWorldPos(
        prop.cell,
        prop.subPos ?? "center",
        prop.pos[1] % CELL_SIZE,
      );
      return { ...prop, pos: computedPos };
    }
    return prop;
  });

  const resolvedItems = filteredItems.map((item) => {
    if (item.cell) {
      const computedPos = calculateWorldPos(
        item.cell,
        item.subPos ?? "center",
        item.pos[1] % CELL_SIZE,
      );
      return { ...item, pos: computedPos };
    }
    return item;
  });

  // 3. Pass resolvedProps and resolvedItems to InstancedObjectGroup
  return (
    <>
      <InstancedObjectGroup items={resolvedProps} kind="prop" />
      <InstancedObjectGroup items={filteredEntities} kind="entity" />
      <InstancedObjectGroup items={resolvedItems} kind="item" />
      {filteredLights.map((light, index) => (
        <group
          key={`light-${index}`}
          position={light.pos}
          userData={{ kind: "light", index }}
        >
          <pointLight
            color={light.color}
            intensity={light.intensity}
            distance={light.radius}
          />
          <primitive object={createLightHelper(light.color)} />
        </group>
      ))}
      {filteredAudio.map((audio, index) => (
        <group
          key={`audio-${index}`}
          position={audio.pos}
          userData={{ kind: "audio", index }}
        >
          <primitive object={createAudioHelper()} />
        </group>
      ))}
      {filteredTriggers.map((trigger, index) => {
        const size = [
          trigger.bounds.max[0] - trigger.bounds.min[0],
          trigger.bounds.max[1] - trigger.bounds.min[1],
          trigger.bounds.max[2] - trigger.bounds.min[2],
        ] as [number, number, number];
        const center = [
          (trigger.bounds.min[0] + trigger.bounds.max[0]) / 2,
          (trigger.bounds.min[1] + trigger.bounds.max[1]) / 2,
          (trigger.bounds.min[2] + trigger.bounds.max[2]) / 2,
        ] as [number, number, number];
        return (
          <group
            key={`trigger-${index}`}
            position={center}
            userData={{ kind: "trigger", index }}
          >
            <mesh scale={size}>
              <boxGeometry />
              <meshBasicMaterial
                color="#ef4444"
                wireframe
                transparent
                opacity={0.3}
              />
            </mesh>
            <primitive object={createTriggerHelper()} scale={size} />
          </group>
        );
      })}
    </>
  );
}
