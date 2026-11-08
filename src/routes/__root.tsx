import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { CartDrawer } from "../components/CartDrawer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFAF6] px-4">
      <div className="max-w-md text-center">
        <p className="text-xs tracking-[0.25em] uppercase text-[#A34E55] font-body mb-2">
          Error 404
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-[#2C2420]">Página no encontrada</h1>
        <p className="mt-3 text-sm text-[#5C4D42] font-body leading-relaxed">
          El arreglo o sección que buscas ya no está disponible o cambió de dirección.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-[#2C2420] px-6 py-2.5 text-xs uppercase tracking-widest font-medium text-white transition-colors hover:bg-[#4A3E37]"
          >
            Volver al inicio
          </Link>
          <Link
            to="/catalogo"
            className="inline-flex items-center justify-center rounded-full border border-[#2C2420]/25 bg-white px-6 py-2.5 text-xs uppercase tracking-widest font-medium text-[#2C2420] transition-colors hover:bg-[#F5EFE6]"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFAF6] px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-[#2C2420]">No pudimos cargar esta página</h1>
        <p className="mt-2 text-sm text-[#5C4D42] font-body">
          Ocurrió un inconveniente temporal de conexión. Puedes reintentar o volver al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-[#2C2420] px-6 py-2.5 text-xs uppercase tracking-widest font-medium text-white transition-colors hover:bg-[#4A3E37] cursor-pointer"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[#2C2420]/25 bg-white px-6 py-2.5 text-xs uppercase tracking-widest font-medium text-[#2C2420] transition-colors hover:bg-[#F5EFE6]"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) || "https://sdrkiomeesoctsxeidmu.supabase.co";
const siteUrl = (
  (import.meta.env.VITE_SITE_URL as string) || "https://floreriamiraflores.com"
).replace(/\/+$/, "");

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: ({ matches }) => {
    const lastMatch = matches[matches.length - 1];
    const rawPath = lastMatch?.pathname || "/";
    const cleanPath = rawPath === "/" ? "/" : rawPath.replace(/\/+$/, "");
    const isPrivateRoute =
      cleanPath.startsWith("/admin") ||
      cleanPath.startsWith("/checkout") ||
      cleanPath.startsWith("/confirmacion");
    const canonicalHref = cleanPath === "/" ? `${siteUrl}/` : `${siteUrl}${cleanPath}`;

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "Florería Miraflores | Flores y Regalos a Domicilio en Lima" },
        {
          name: "description",
          content:
            "Boutique floral en Miraflores, Lima. Ramos, cajas florales y arreglos exclusivos con entrega el mismo día.",
        },
        ...(isPrivateRoute ? [{ name: "robots", content: "noindex, nofollow" }] : []),
        { name: "theme-color", content: "#C4848A" },
        { property: "og:site_name", content: "Florería Miraflores" },
        { property: "og:locale", content: "es_PE" },
        { property: "og:title", content: "Florería Miraflores" },
        {
          property: "og:description",
          content:
            "Boutique floral en Miraflores, Lima. Ramos y arreglos exclusivos con entrega a domicilio.",
        },
        { property: "og:image", content: `${siteUrl}/Logo.webp` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "geo.region", content: "PE-LIM" },
        { name: "geo.placename", content: "Miraflores, Lima" },
        { name: "geo.position", content: "-12.1217;-77.0298" },
        { name: "ICBM", content: "-12.1217, -77.0298" },
      ],
      links: [
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "",
        },
        {
          rel: "preconnect",
          href: supabaseUrl,
          crossOrigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,400;1,9..40,600&display=swap",
        },
        {
          rel: "stylesheet",
          href: appCss,
        },
        ...(!isPrivateRoute
          ? [
              {
                rel: "canonical",
                href: canonicalHref,
              },
            ]
          : []),
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "/favicon.svg",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        {
          rel: "icon",
          href: "/favicon.ico",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "manifest",
          href: "/site.webmanifest",
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <CartDrawer />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
