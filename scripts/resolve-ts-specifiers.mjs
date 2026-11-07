/**
 * Resolver hook that lets plain Node import the project's TypeScript sources.
 *
 * The project is configured with `moduleResolution: bundler`, which is what
 * lets its imports omit the `.ts` extension. That style is correct for Vite,
 * Vitest and workerd — all of which bundle or resolve through a resolver of
 * their own — but Node's ESM loader insists on a real file path, so an operator
 * script that imports a module directly from the tree fails to start.
 *
 * This hook only completes specifiers that already exist on disk as `.ts`
 * files, and only for relative specifiers with a real parent file. It adds no
 * new file, redirects nothing, and changes nothing about the runtime the Worker
 * uses; it exists so the local scripts can share the same source the app and
 * the tests use instead of maintaining a copy.
 */
import { existsSync } from "node:fs";
import * as nodeModule from "node:module";
import { fileURLToPath } from "node:url";

/** A URL that came from a real file, so `fileURLToPath` is safe on it. */
function parentPath(parentURL) {
  if (!parentURL || !parentURL.startsWith("file:")) return null;
  try {
    return fileURLToPath(parentURL);
  } catch {
    return null;
  }
}

/**
 * Synchronous so it satisfies both the `module.registerHooks({ resolve })`
 * contract (Node 22.15+, Node 26+) and the legacy `module.register()` chain
 * hook, which this project used until Node 26 deprecated it with `DEP0205`.
 */
export function resolve(specifier, context, next) {
  if (specifier.startsWith(".")) {
    const parentURL = context?.parentURL;
    const parent = parentPath(parentURL);
    if (parent && parentURL) {
      // Only complete a specifier the project itself wrote without an
      // extension; a specifier Node already resolves is left alone.
      const resolved = new URL(specifier, parentURL);
      if (!/\.[cm]?[jt]sx?$/.test(resolved.pathname)) {
        const candidate = new URL(`${resolved.pathname}.ts`, resolved);
        if (existsSync(fileURLToPath(candidate))) {
          return { url: candidate.href, shortCircuit: true };
        }
      }
    }
  }
  return next(specifier, context);
}

/**
 * Register the resolver for the current process: `module.registerHooks` when the
 * runtime provides it (Node 22.15+ / Node 26+), otherwise the deprecated
 * `module.register` fallback for Node 22.12–22.14.
 *
 * Returns which path was taken so callers can assert the branch in tests.
 */
export function registerTsSpecifiers(moduleApi = nodeModule) {
  if (typeof moduleApi?.registerHooks === "function") {
    moduleApi.registerHooks({ resolve });
    return "registerHooks";
  }
  if (typeof moduleApi?.register === "function") {
    moduleApi.register(new URL("./resolve-ts-specifiers.mjs", import.meta.url).href);
    return "register";
  }
  throw new Error("No supported Node module loader hook is available on this runtime.");
}
