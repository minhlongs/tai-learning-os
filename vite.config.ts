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
  server: {
    // A fixed port for this project. The default 5173 is what every other Vite
    // app on this machine also picks, and picking a second number when it is
    // taken is how a machine ends up with several orphaned dev servers. Another
    // project already owns 5173 here, so this one binds explicitly.
    port: 8791,
    strictPort: true,
  },
  build: {
    // Learner-facing bundle must stay small and free of server secrets.
    target: "es2022",
    sourcemap: false,
  },
});
