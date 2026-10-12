import { test as base, expect, type Page } from "@playwright/test";

/**
 * Lista blanca documentada de errores de consola permitidos (solo favicon).
 */
const CONSOLE_ERROR_ALLOWLIST: RegExp[] = [/favicon/i];

function isAllowedError(msg: string): boolean {
  return CONSOLE_ERROR_ALLOWLIST.some((regex) => regex.test(msg));
}

/**
 * Espera a que React 19 termine de hidratar el árbol SSR en el cliente
 * verificando que el nodo interactivo tenga adjuntas las propiedades internas de React (__reactProps$ / __reactFiber$).
 */
export async function waitForHydration(page: Page, selector = "header, main"): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      return Object.keys(el).some((k) => k.startsWith("__react"));
    },
    selector,
    { timeout: 15_000 },
  );
}

type ExtraFixtures = {
  allowedConsolePatterns: RegExp[];
  allowConsoleErrors: (patterns: RegExp[]) => void;
};

export const test = base.extend<ExtraFixtures>({
  // eslint-disable-next-line no-empty-pattern
  allowedConsolePatterns: async ({}, run) => {
    await run([]);
  },

  allowConsoleErrors: async ({ allowedConsolePatterns }, run) => {
    await run((patterns: RegExp[]) => {
      allowedConsolePatterns.push(...patterns);
    });
  },

  page: async ({ page, allowedConsolePatterns }, runTest) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        const url = msg.location()?.url ?? "";
        const fullText = url ? `${text} [url: ${url}]` : text;
        const allowedByTest =
          /status of 404/i.test(text) && allowedConsolePatterns.some((regex) => regex.test(url));
        if (!isAllowedError(fullText) && !allowedByTest) {
          errors.push(`[console.error] ${fullText}`);
        }
      }
    });

    page.on("pageerror", (err) => {
      const text = err.message || String(err);
      if (!isAllowedError(text)) {
        errors.push(`[pageerror] ${text}`);
      }
    });

    await runTest(page);

    expect(
      errors,
      `Se detectaron errores en consola o errores de página no permitidos:\n${errors.join("\n")}`,
    ).toEqual([]);
  },
});

export { expect };
