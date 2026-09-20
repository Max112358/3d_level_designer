import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Manifest, ManifestEntry, CELL_SIZE } from "./types";

const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const textureCache = new Map<string, THREE.Texture>();
const modelCache = new Map<string, GLTF>();
const materialCache = new Map<string, [THREE.Material, THREE.Material]>();
const colorCache = new Map<string, THREE.Color>();

export function idToColor(id: string): THREE.Color {
  if (!colorCache.has(id)) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = new THREE.Color().setHSL(Math.abs(hash % 360) / 360, 0.6, 0.5);
    colorCache.set(id, c);
  }
  return colorCache.get(id)!;
}

export function getMaterials(
  id: string,
  texturePath?: string,
): [THREE.Material, THREE.Material] {
  if (materialCache.has(id)) return materialCache.get(id)!;

  const baseColor = idToColor(id);

  // Default front material to white so texture maps render untinted
  const frontMat = new THREE.MeshStandardMaterial({
    color: texturePath ? 0xffffff : baseColor,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.FrontSide,
  });

  const backMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.BackSide,
  });

  if (texturePath) {
    loadTexture(texturePath)
      .then((tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1);
        frontMat.map = tex;
        frontMat.needsUpdate = true;
      })
      .catch(() => {
        // Fall back to tinted color if texture fails to load
        frontMat.color.set(baseColor);
        frontMat.needsUpdate = true;
      });
  }

  const tuple: [THREE.Material, THREE.Material] = [frontMat, backMat];
  materialCache.set(id, tuple);
  return tuple;
}

export function loadTexture(path: string): Promise<THREE.Texture> {
  if (textureCache.has(path)) return Promise.resolve(textureCache.get(path)!);
  return new Promise((resolve, reject) => {
    textureLoader.load(
      path,
      (tex) => {
        textureCache.set(path, tex);
        resolve(tex);
      },
      undefined,
      (err) => reject(err),
    );
  });
}

export function loadModel(path: string): Promise<GLTF> {
  if (modelCache.has(path)) return Promise.resolve(modelCache.get(path)!);
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf) => {
        // Compute model bounds and align the lowest Y-point to 0
        const bbox = new THREE.Box3().setFromObject(gltf.scene);
        gltf.scene.position.y = -bbox.min.y;

        modelCache.set(path, gltf);
        resolve(gltf);
      },
      undefined,
      (err) => reject(err),
    );
  });
}

export function createFallbackMesh(entry: ManifestEntry): THREE.Group {
  const group = new THREE.Group();
  group.name = entry.id;
  const color = idToColor(entry.id);

  // 1. Calculate side length (1/10th of a square/cell size)
  const size = CELL_SIZE * 0.1; // e.g., if CELL_SIZE is 2, size = 0.2

  // 2. Create cube geometry with the new size
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);

  // 3. Offset mesh Y by half its height so its base sits at Y = 0
  mesh.position.y = size / 2;

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  // 4. Adjust floating label sprite position to match smaller scale
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 256;
  labelCanvas.height = 64;
  const ctx = labelCanvas.getContext("2d")!;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(entry.name || entry.id, 128, 40);
  const tex = new THREE.CanvasTexture(labelCanvas);
  const spriteMat = new THREE.SpriteMaterial({ map: tex });
  const sprite = new THREE.Sprite(spriteMat);

  // Position sprite slightly above the top of the scaled cube
  sprite.position.y = size + 0.3;
  sprite.scale.set(1.5, 0.375, 1);
  group.add(sprite);

  return group;
}

export function createLightHelper(color: string): THREE.Group {
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 16, 16),
    new THREE.MeshBasicMaterial({ color }),
  );
  group.add(sphere);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1, 32),
    new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

export function createAudioHelper(): THREE.Group {
  const group = new THREE.Group();
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 1, 16),
    new THREE.MeshBasicMaterial({ color: "#f59e0b" }),
  );
  cone.rotation.z = Math.PI;
  group.add(cone);
  const waves = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.05, 8, 32),
    new THREE.MeshBasicMaterial({
      color: "#f59e0b",
      transparent: true,
      opacity: 0.5,
    }),
  );
  waves.rotation.x = Math.PI / 2;
  group.add(waves);
  return group;
}

export function createTriggerHelper(): THREE.Group {
  const group = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({
      color: "#ef4444",
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    }),
  );
  group.add(box);
  return group;
}

// 1. Auto-discover all models, meta files, and textures in subfolders
const modelFiles = import.meta.glob<string>("/src/assets/**/*.glb", {
  query: "?url",
  import: "default",
  eager: true,
});

const metaFiles = import.meta.glob<Partial<ManifestEntry>>(
  "/src/assets/**/*.meta.json",
  { import: "default", eager: true },
);

// Scan recursively through subfolders (floor, wall, ceiling)
const textureFiles = import.meta.glob<string>("/src/assets/textures/**/*.png", {
  query: "?url",
  import: "default",
  eager: true,
});

// 2. Helper to parse path, assign category based on parent folder, and merge metadata
function parseFilePath(path: string): ManifestEntry {
  const parts = path.split("/");
  const fileName = parts.pop() || "";
  const category = parts.pop() || "props"; // "floor", "wall", "ceiling", "props", "entities", "items"

  const id = fileName.replace(/\.[^/.]+$/, ""); // "stone_wall"
  const name = id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); // "Stone Wall"

  const metaPath = path.replace(/\.glb$/, ".meta.json");
  const metaData = metaFiles[metaPath] || {};

  const resolvedPath = modelFiles[path] || textureFiles[path] || path;

  return {
    id,
    name,
    category,
    path: resolvedPath,
    ...metaData,
  };
}

// 3. Build the manifest automatically from folder categories
const allTextures = Object.keys(textureFiles).map((p) => parseFilePath(p));
const allModels = Object.keys(modelFiles).map((p) => parseFilePath(p));

let manifest: Manifest = {
  textures: allTextures, // Contains all textures categorized as floor, wall, or ceiling
  props: allModels.filter((m) => m.category === "props"),
  entities: allModels.filter((m) => m.category === "entities"),
  items: allModels.filter((m) => m.category === "items"),
};

// 4. Return the synchronously built manifest (or keep fetchManifest as an async function returning it)
export async function fetchManifest(): Promise<Manifest> {
  return manifest;
}

export function getManifest(): Manifest | null {
  return manifest;
}

export function getEntryById(id: string): ManifestEntry | undefined {
  if (!manifest) return undefined;
  return (
    manifest.textures.find((e) => e.id === id) ||
    manifest.props.find((e) => e.id === id) ||
    manifest.entities.find((e) => e.id === id) ||
    manifest.items.find((e) => e.id === id)
  );
}
