import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Different port from StagePilot (3000)
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
