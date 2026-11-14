import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// When running in isolated E2E test mode, require both configPath and persistState.path
// to reside strictly inside os.tmpdir(), never touching .wrangler/state or .dev.vars.
function resolveIsolatedPaths(): {
  configPath: string;
  persistPath: string;
} | null {
  if (process.env.TLO_E2E_ISOLATED !== "1") return null;

  const sysTmp = resolve(tmpdir());
  const rawConfig = process.env.TLO_E2E_WRANGLER_CONFIG;
  const rawPersist = process.env.TLO_E2E_PERSIST_PATH;
  if (!rawConfig || !rawPersist) {
    throw new Error(
      "Refusing to start E2E Vite server without TLO_E2E_WRANGLER_CONFIG and TLO_E2E_PERSIST_PATH.",
    );
  }
  const resolvedConfig = resolve(rawConfig);
  const resolvedPersist = resolve(rawPersist);
  if (!resolvedConfig.startsWith(sysTmp) || !resolvedPersist.startsWith(sysTmp)) {
    throw new Error(
      `Refusing E2E persistence outside OS temp directory (${sysTmp}): config=${resolvedConfig}, persist=${resolvedPersist}`,
    );
  }
  return { configPath: resolvedConfig, persistPath: resolvedPersist };
}

// Validate immediately on module load when invoked by `scripts/run-e2e.mjs`,
// and re-evaluate per `defineConfig` call so in-process build tests can isolate
// config/state inside `os.tmpdir()` without touching `.wrangler/state` or `.dev.vars`.
resolveIsolatedPaths();

// The Cloudflare Vite plugin runs the Worker locally inside workerd, so API
// code is exercised with the real runtime rather than a Node shim.
// During `vite build`, strip `configPath` from the worker plugin config so
// `@cloudflare/vite-plugin` never reads or emits `.dev.vars` (which holds
// local `SESSION_SECRET` and `PARENT_PASSWORD_HASH`) into `dist/worker/`.
export default defineConfig(({ command }) => {
  const isolated = resolveIsolatedPaths();

  return {
    plugins: [
      react(),
      cloudflare({
        viteEnvironment: { name: "worker" },
        ...(isolated
          ? {
              configPath: isolated.configPath,
              persistState: { path: isolated.persistPath },
            }
          : {}),
        ...(command === "build"
          ? {
              config: (workerConfig) => {
                delete workerConfig.configPath;
              },
            }
          : {}),
      }),
      {
        name: "tlo-no-dev-vars-in-build",
        apply: "build",
        enforce: "post",
        generateBundle(_options, bundle) {
          for (const fileName of Object.keys(bundle)) {
            if (fileName === ".dev.vars" || fileName.startsWith(".dev.vars.")) {
              delete bundle[fileName];
            }
          }
        },
      },
    ],
    server: {
      // A fixed port for this project. E2E runs on dedicated port 8792 with strictPort: true
      // so it never collides with or reuses the developer's local server on 8791.
      port: isolated ? 8792 : 8791,
      strictPort: true,
    },
    build: {
      // Learner-facing bundle must stay small and free of server secrets.
      target: "es2022",
      sourcemap: false,
    },
  };
});
