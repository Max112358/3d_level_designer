import { useEffect, useState } from "react";
import { Manifest, ManifestEntry } from "./types";
import { fetchManifest } from "./assetManager";

export function useManifest() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchManifest()
      .then(setManifest)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  return { manifest, loading, error };
}

export function useCatalog(manifest: Manifest | null) {
  return {
    textures: manifest?.textures ?? [],
    props: manifest?.props ?? [],
    entities: manifest?.entities ?? [],
    items: manifest?.items ?? [],
  };
}

export function useAssetEntry(id: string | null, manifest: Manifest | null): ManifestEntry | null {
  if (!id || !manifest) return null;
  return (
    manifest.textures.find((e) => e.id === id) ||
    manifest.props.find((e) => e.id === id) ||
    manifest.entities.find((e) => e.id === id) ||
    manifest.items.find((e) => e.id === id) ||
    null
  );
}
