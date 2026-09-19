import { Viewport } from "./Viewport";
import { Toolbar } from "./Toolbar";
import { RightSidebar } from "./RightSidebar";
import { TopBar } from "./TopBar";
import { LayerControls } from "./LayerControls";
import { LoadingScreen } from "./LoadingScreen";
import { useManifest } from "./hooks";

export default function App() {
  const { loading } = useManifest();
  return (
    <div className="relative w-full h-full flex flex-col">
      <LoadingScreen loading={loading} />
      <TopBar />
      <div className="relative flex-1 min-h-0">
        <Viewport />
        <div className="absolute top-4 left-4 z-10">
          <Toolbar />
        </div>
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end max-h-[calc(100vh-2rem)] pointer-events-none">
          <div className="pointer-events-auto">
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
