import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Manifest, ManifestEntry } from "./types";

const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const textureCache = new Map<string, THREE.Texture>();
const modelCache = new Map<string, GLTF>();
const materialCache = new Map<string, THREE.Material>();
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

export function getMaterial(id: string, texturePath?: string): THREE.Material {
  if (materialCache.has(id)) return materialCache.get(id)!;
  const mat = new THREE.MeshStandardMaterial({
    color: idToColor(id),
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  materialCache.set(id, mat);
  if (texturePath) {
    loadTexture(texturePath)
      .then((tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1);
        (mat as THREE.MeshStandardMaterial).map = tex;
        (mat as THREE.MeshStandardMaterial).needsUpdate = true;
      })
      .catch(() => {
        // keep fallback color
      });
  }
  return mat;
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
      (err) => reject(err)
    );
  });
}

export function loadModel(path: string): Promise<GLTF> {
  if (modelCache.has(path)) return Promise.resolve(modelCache.get(path)!);
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf) => {
        modelCache.set(path, gltf);
        resolve(gltf);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

export function createFallbackMesh(entry: ManifestEntry): THREE.Group {
  const group = new THREE.Group();
  group.name = entry.id;
  const color = idToColor(entry.id);
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

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
  sprite.position.y = 1.6;
  sprite.scale.set(3, 0.75, 1);
  group.add(sprite);

  return group;
}

export function createLightHelper(color: string): THREE.Group {
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 16, 16),
    new THREE.MeshBasicMaterial({ color })
  );
  group.add(sphere);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1, 32),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

export function createAudioHelper(): THREE.Group {
  const group = new THREE.Group();
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 1, 16),
    new THREE.MeshBasicMaterial({ color: "#f59e0b" })
  );
  cone.rotation.z = Math.PI;
  group.add(cone);
  const waves = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.05, 8, 32),
    new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.5 })
  );
  waves.rotation.x = Math.PI / 2;
  group.add(waves);
  return group;
}

export function createTriggerHelper(): THREE.Group {
  const group = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: "#ef4444", wireframe: true, transparent: true, opacity: 0.6 })
  );
  group.add(box);
  return group;
}

let manifest: Manifest | null = null;

export async function fetchManifest(): Promise<Manifest> {
  if (manifest) return manifest;
  const res = await fetch("./assets/manifest.json");
  if (!res.ok) throw new Error("Failed to load manifest");
  manifest = (await res.json()) as Manifest;
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
