import { expect, type BrowserContext, type Page } from "@playwright/test";

export type OutboundNetworkRecorder = {
  blockedUrls: string[];
  allowedLocalCount: number;
  assertZeroOutbound(): void;
};

function isAllowedLocalUrl(rawUrl: string): boolean {
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:") || rawUrl.startsWith("about:")) {
    return true;
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "file:") return true;
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:" && parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      return false;
    }
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";
  } catch {
    return false;
  }
}

/**
 * Gate G2 active zero-outbound network interceptor.
 *
 * Intercepts EVERY request across `context.route("**\/*", ...)` and `page.route("**\/*", ...)`,
 * allowing only `localhost` / `127.0.0.1` / `data:` / `blob:` / `file:` and aborting
 * any external network request immediately while recording the offending URL so
 * `assertZeroOutbound()` fails loudly with exact forensic evidence.
 */
export async function attachZeroOutboundGuard(
  target: BrowserContext | Page,
): Promise<OutboundNetworkRecorder> {
  const blockedUrls: string[] = [];
  let allowedLocalCount = 0;

  await target.route("**/*", async (route) => {
    const url = route.request().url();
    if (isAllowedLocalUrl(url)) {
      allowedLocalCount += 1;
      await route.continue();
      return;
    }
    blockedUrls.push(url);
    await route.abort("blockedbyclient");
  });

  return {
    blockedUrls,
    get allowedLocalCount() {
      return allowedLocalCount;
    },
    assertZeroOutbound() {
      expect(
        blockedUrls,
        `Gate G2 violation: non-local outbound network request(s) attempted: ${JSON.stringify(blockedUrls)}`,
      ).toEqual([]);
    },
  };
}
