import { useEffect, useState } from "react";

export function LoadingScreen({ loading }: { loading: boolean }) {
  const [visible, setVisible] = useState(loading);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!loading) {
      setFading(true);
      const t = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(t);
    }
    setVisible(true);
    setFading(false);
  }, [loading]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-6xl mb-6 animate-bounce">🏹</div>
      <h1 className="text-2xl font-bold text-white mb-2">3D Level Editor</h1>
      <p className="text-sm text-slate-400 mb-6">Loading assets...</p>
      <div className="w-48 h-2 bg-slate-800 rounded overflow-hidden">
        <div className="h-full bg-sky-500 animate-pulse w-full" />
      </div>
    </div>
  );
}
