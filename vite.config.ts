// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  cloudflare: !process.env.VERCEL,
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (
                id.includes("recharts") ||
                id.includes("d3") ||
                id.includes("react-resize-detector")
              ) {
                return "vendor-charts";
              }
              if (id.includes("lucide-react")) {
                return "vendor-lucide";
              }
              if (
                id.includes("@supabase/supabase-js") ||
                id.includes("@supabase/postgrest-js") ||
                id.includes("@supabase/gotrue-js") ||
                id.includes("@supabase/storage-js") ||
                id.includes("@supabase/functions-js")
              ) {
                return "vendor-supabase";
              }
            }
          },
        },
      },
    },
  },
});
