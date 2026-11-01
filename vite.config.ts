import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// When running in isolated E2E test mode, require both configPath and persistState.path
// to reside strictly inside os.tmpdir(), never touching .wrangler/state or .dev.vars.
const isE2eMode = process.env.TLO_E2E_ISOLATED === "1";
const e2eConfigPath = process.env.TLO_E2E_WRANGLER_CONFIG;
const e2ePersistPath = process.env.TLO_E2E_PERSIST_PATH;

if (isE2eMode) {
  const sysTmp = resolve(tmpdir());
  if (!e2eConfigPath || !e2ePersistPath) {
    throw new Error(
      "Refusing to start E2E Vite server without TLO_E2E_WRANGLER_CONFIG and TLO_E2E_PERSIST_PATH.",
    );
  }
  const resolvedConfig = resolve(e2eConfigPath);
  const resolvedPersist = resolve(e2ePersistPath);
  if (!resolvedConfig.startsWith(sysTmp) || !resolvedPersist.startsWith(sysTmp)) {
    throw new Error(
      `Refusing E2E persistence outside OS temp directory (${sysTmp}): config=${resolvedConfig}, persist=${resolvedPersist}`,
    );
  }
}

// The Cloudflare Vite plugin runs the Worker locally inside workerd, so API
// code is exercised with the real runtime rather than a Node shim.
export default defineConfig({
  plugins: [
    react(),
    cloudflare({
      viteEnvironment: { name: "worker" },
      ...(isE2eMode && e2eConfigPath && e2ePersistPath
        ? {
            configPath: e2eConfigPath,
            persistState: { path: e2ePersistPath },
          }
        : {}),
    }),
  ],
  server: {
    // A fixed port for this project. E2E runs on dedicated port 8792 with strictPort: true
    // so it never collides with or reuses the developer's local server on 8791.
    port: isE2eMode ? 8792 : 8791,
    strictPort: true,
  },
  build: {
    // Learner-facing bundle must stay small and free of server secrets.
    target: "es2022",
    sourcemap: false,
  },
});
