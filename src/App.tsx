import { Viewport } from "./Viewport";
import { Toolbar } from "./Toolbar";
import { Catalog } from "./Catalog";
import { PropertiesPanel } from "./PropertiesPanel";
import { TopBar } from "./TopBar";
import { LayerControls } from "./LayerControls";
import { FaceSelector } from "./FaceSelector";

function App() {
  return (
    <div className="relative w-full h-full flex flex-col">
      <TopBar />
      <div className="relative flex-1">
        <Viewport />
        <div className="absolute top-4 left-4 z-10">
          <Toolbar />
        </div>
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
          <LayerControls />
          <FaceSelector />
          <Catalog />
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
