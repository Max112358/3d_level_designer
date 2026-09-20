import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { getEntryById, loadModel, createFallbackMesh } from "./assetManager";

interface AssetModelProps {
  assetId: string;
  opacity?: number;
  wireframe?: boolean;
}

export function AssetModel({
  assetId,
  opacity = 1,
  wireframe = false,
}: AssetModelProps) {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const entry = getEntryById(assetId);

  useEffect(() => {
    if (!entry) return;

    let isMounted = true;

    if (entry.path && entry.path.endsWith(".gltf")) {
      loadModel(entry.path)
        .then((gltf) => {
          if (!isMounted) return;
          // Clone scene so multiple instances in editor don't share identical scene hierarchy
          const clonedScene = gltf.scene.clone(true);
          setObject(clonedScene);
        })
        .catch(() => {
          if (!isMounted) return;
          // Fall back to asset manager's generated primitive
          setObject(createFallbackMesh(entry));
        });
    } else {
      // Fallback mesh for assets without a GLTF path
      setObject(createFallbackMesh(entry));
    }

    return () => {
      isMounted = false;
    };
  }, [entry]);

  if (!object) return null;

  // Apply visual overrides for preview opacity/wireframe if specified
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          mat.transparent = opacity < 1;
          mat.opacity = opacity;
          if ("wireframe" in mat)
            (mat as THREE.MeshStandardMaterial).wireframe = wireframe;
        });
      } else if (mesh.material) {
        mesh.material.transparent = opacity < 1;
        mesh.material.opacity = opacity;
        if ("wireframe" in mesh.material)
          (mesh.material as THREE.MeshStandardMaterial).wireframe = wireframe;
      }
    }
  });

  return <primitive object={object} />;
}
