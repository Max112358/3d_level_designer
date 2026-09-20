import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  assetsInclude: ["**/*.glb"], // <-- Tells Vite to handle .glb files as static asset URLs
});
