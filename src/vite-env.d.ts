// src/vite-env.d.ts
/// <reference types="vite/client" />

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
