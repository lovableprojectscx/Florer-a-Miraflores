import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { Novedades } from "@/components/Novedades";
import { Occasions } from "@/components/Occasions";
import { About } from "@/components/About";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { PopupModal } from "@/components/PopupModal";

import {
  getCategorias,
  getConfig,
  getColecciones,
  getOcasiones,
  getBanners,
  getProductosPorCategoria,
  getPopup,
} from "@/lib/queries";

export const Route = createFileRoute("/")({
  loader: async () => {
    // Fetch paralelo — todos los datos del home en una sola ronda
    const [categorias, config, colecciones, ocasiones, banners, popup] = await Promise.all([
      getCategorias(),
      getConfig().catch(() => null),
      getColecciones().catch(() => []),
      getOcasiones().catch(() => []),
      getBanners().catch(() => []),
      getPopup().catch(() => null),
    ]);

    // Productos con tag novedad: consultamos las categorías raíz (sin parent)
    // y traemos sus productos, luego filtramos por tag
    let novedades: Awaited<ReturnType<typeof getProductosPorCategoria>> = [];
    try {
      // Obtenemos IDs de todas las categorías (padres e hijas)
      const catIds = categorias.map((c) => c.id);
      // Traemos productos de todas las categorías en paralelo y aplanamos
      const todosLosProductos = (
        await Promise.all(catIds.map((id) => getProductosPorCategoria(id).catch(() => [])))
      ).flat();

      // Filtramos por tags novedad o edicion_limitada, máx 6
      novedades = todosLosProductos
        .filter((p) => p.tags?.includes("novedad") || p.tags?.includes("edicion_limitada"))
        .slice(0, 6);
    } catch {
      novedades = [];
    }

    return { categorias, config, colecciones, ocasiones, banners, novedades, popup };
  },

  head: () => ({
    meta: [
      { title: "Florería Miraflores | Flores y regalos a domicilio en Lima" },
      {
        name: "description",
        content:
          "Boutique floral en Miraflores, Lima. Ramos, box florales y arreglos únicos con delivery el mismo día en Miraflores, Surco, Barranco, Lince y San Isidro.",
      },
      { property: "og:title", content: "Florería Miraflores" },
      {
        property: "og:description",
        content:
          "Flores y regalos a domicilio en Lima. Delivery en Miraflores, Surco, Barranco, Lince y San Isidro.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { categorias, config, colecciones, ocasiones, banners, novedades, popup } =
    Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      {config?.anuncio_barra && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />
      <main>
        <Hero banners={banners} config={config} />
        <CategoryShowcase colecciones={colecciones} />
        <Novedades productos={novedades} />
        <Occasions ocasiones={ocasiones} />
        <About />
        <Faq />
      </main>
      <Footer config={config} />
      <WhatsappFab config={config} />
      {popup && <PopupModal popup={popup} />}
    </div>
  );
}
