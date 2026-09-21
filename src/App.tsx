import { Viewport } from "./Viewport";
import { Toolbar } from "./Toolbar";
import { Catalog } from "./Catalog";
import { PropertiesPanel } from "./PropertiesPanel";
import { TopBar } from "./TopBar";
import { LayerControls } from "./LayerControls";
import { FaceSelector } from "./FaceSelector";
import { LoadingScreen } from "./LoadingScreen";
import { useManifest } from "./hooks";

function App() {
  const { loading } = useManifest();
  return (
    <div className="relative w-full h-full flex flex-col">
      <LoadingScreen loading={loading} />
      <TopBar />
      <div className="relative flex-1">
        <Viewport />
        <div className="absolute top-4 left-4 z-10">
          <Toolbar />
        </div>
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end h-[calc(100%-2rem)]">
          <LayerControls />
          <FaceSelector />
          <div className="flex-1 min-h-0 flex flex-col gap-2 items-end overflow-hidden">
            <Catalog />
            <PropertiesPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
