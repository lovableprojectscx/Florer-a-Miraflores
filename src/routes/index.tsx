import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { Novedades } from "@/components/Novedades";
import { Occasions } from "@/components/Occasions";
import { About } from "@/components/About";
import { DeliveryZones } from "@/components/DeliveryZones";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { PopupModal } from "@/components/PopupModal";
import type { TagSeccion } from "@/components/Novedades";

import {
  getCategorias,
  getConfig,
  getColecciones,
  getOcasiones,
  getBanners,
  getPopup,
  getTags,
  getProductosPorTag,
} from "@/lib/queries";

export const Route = createFileRoute("/")({
  loader: async () => {
    // Fetch paralelo — todos los datos del home en una sola ronda
    const [categorias, config, colecciones, ocasiones, banners, popup, tags] = await Promise.all([
      getCategorias(),
      getConfig().catch(() => null),
      getColecciones().catch(() => []),
      getOcasiones().catch(() => []),
      getBanners().catch(() => []),
      getPopup().catch(() => null),
      getTags().catch(() => []),
    ]);

    // Para cada tag activo, cargar sus productos en paralelo (máx 5: 4 visibles + 1 para saber si hay más)
    const tagSecciones: TagSeccion[] = [];
    if (tags.length > 0) {
      const resultados = await Promise.all(
        tags.map((tag) => getProductosPorTag(tag.clave, 5).catch(() => [])),
      );
      tags.forEach((tag, i) => {
        tagSecciones.push({ tag, productos: resultados[i] });
      });
    }

    return { categorias, config, colecciones, ocasiones, banners, popup, tagSecciones };
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
  const { categorias, config, colecciones, ocasiones, banners, popup, tagSecciones } =
    Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      {config?.anuncio_barra && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />
      <main>
        <Hero banners={banners} />
        <Novedades tagSecciones={tagSecciones} />
        <CategoryShowcase colecciones={colecciones} />
        <Occasions ocasiones={ocasiones} />
        <About />
        <DeliveryZones />
        <Faq />
      </main>
      <Footer config={config} />
      <WhatsappFab config={config} />
      {popup && <PopupModal popup={popup} />}
    </div>
  );
}
