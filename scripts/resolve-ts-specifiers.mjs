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

export async function resolve(specifier, context, next) {
  if (specifier.startsWith(".")) {
    const parent = parentPath(context.parentURL);
    if (parent) {
      // Only complete a specifier the project itself wrote without an
      // extension; a specifier Node already resolves is left alone.
      const resolved = new URL(specifier, context.parentURL);
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
