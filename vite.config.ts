import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// The Cloudflare Vite plugin runs the Worker locally inside workerd, so API
// code is exercised with the real runtime rather than a Node shim.
export default defineConfig({
  plugins: [
    react(),
    cloudflare({
      viteEnvironment: { name: "worker" },
    }),
  ],
  build: {
    // Learner-facing bundle must stay small and free of server secrets.
    target: "es2022",
    sourcemap: false,
  },
});
