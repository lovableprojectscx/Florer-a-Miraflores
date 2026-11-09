import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { Novedades } from "@/components/Novedades";
import { DeliveryZones } from "@/components/DeliveryZones";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { PopupModal } from "@/components/PopupModal";
import { HomeTestimonios } from "@/components/HomeTestimonios";
import { HomeRecuerdos } from "@/components/HomeRecuerdos";
import type { TagSeccion } from "@/components/Novedades";
import { imagenUrl, imagenSrcSet } from "@/lib/image-utils";
import { safeJsonLd } from "@/lib/utils";

import {
  getCategorias,
  getConfig,
  getColecciones,
  getBanners,
  getPopup,
  getTags,
  getProductosPorTag,
  getTestimoniosHome,
  getRecuerdosHome,
  getDistritos,
} from "@/lib/queries";

export const Route = createFileRoute("/")({
  staleTime: 120_000, // 2 minutos de frescura en cliente: evita re-fetch masivo en navegación interna
  loader: async () => {
    // Fetch paralelo — todos los datos del home en una sola ronda
    const [
      categorias,
      config,
      colecciones,
      banners,
      popup,
      tags,
      testimonios,
      recuerdos,
      distritos,
    ] = await Promise.all([
      getCategorias(),
      getConfig().catch(() => null),
      getColecciones().catch(() => []),
      getBanners().catch(() => []),
      getPopup().catch(() => null),
      getTags().catch(() => []),
      getTestimoniosHome().catch(() => []),
      getRecuerdosHome(8).catch(() => []),
      getDistritos().catch(() => []),
    ]);

    // Para cada tag activo, cargar hasta 8 productos para el slider optimizado
    const tagSecciones: TagSeccion[] = [];
    if (tags.length > 0) {
      const resultados = await Promise.all(
        tags.map((tag) => getProductosPorTag(tag.clave, 8).catch(() => [])),
      );
      tags.forEach((tag, i) => {
        tagSecciones.push({ tag, productos: resultados[i] });
      });
    }

    return {
      categorias,
      config,
      colecciones,
      banners,
      popup,
      tagSecciones,
      testimonios,
      recuerdos,
      distritos,
    };
  },

  head: ({ loaderData }) => {
    const firstBanner = loaderData?.banners?.[0];
    const heroPreloadHref = firstBanner?.imagen_mobile_url
      ? firstBanner.imagen_mobile_url
      : firstBanner?.imagen_url
        ? imagenUrl(firstBanner.imagen_url, 960)
        : null;
    const heroPreloadSrcSet =
      firstBanner?.imagen_url && !firstBanner?.imagen_mobile_url
        ? imagenSrcSet(firstBanner.imagen_url, { original: 2560, anchos: [960] })
        : undefined;

    return {
      meta: [
        { title: "Florería Miraflores | Flores y regalos a domicilio en Lima" },
        {
          name: "description",
          content:
            "Boutique floral en Miraflores, Lima. Ramos, box florales y arreglos únicos con delivery el mismo día en Miraflores, Surco, Barranco, Lince y San Isidro.",
        },
        {
          property: "og:title",
          content: "Florería Miraflores | Flores y regalos a domicilio en Lima",
        },
        {
          property: "og:description",
          content:
            "Flores y regalos a domicilio en Lima. Delivery el mismo día en Miraflores, Surco, Barranco, Lince y San Isidro.",
        },
        { property: "og:type", content: "website" },
        { name: "geo.region", content: "PE-LIM" },
        { name: "geo.placename", content: "Miraflores, Lima" },
        { name: "geo.position", content: "-12.1217;-77.0298" },
        { name: "ICBM", content: "-12.1217, -77.0298" },
      ],
      links: heroPreloadHref
        ? [
            {
              rel: "preload",
              as: "image",
              href: heroPreloadHref,
              ...(heroPreloadSrcSet ? { imageSrcSet: heroPreloadSrcSet, imageSizes: "100vw" } : {}),
              fetchPriority: "high",
            },
          ]
        : [],
    };
  },
  component: HomePage,
});

function HomePage() {
  const {
    categorias,
    config,
    colecciones,
    banners,
    popup,
    tagSecciones,
    testimonios,
    recuerdos,
    distritos,
  } = Route.useLoaderData();

  // Partición de secciones de tags por directriz editorial de Sofía:
  // 1. Franja inicial: Lanzamientos, Más solicitados, Edición limitada, Ofertas especiales y Orquídeas.
  // 2. Franja inferior: "Globos para enamorar", situada específicamente debajo de "Explora nuestras colecciones".
  const TAGS_POST_COLECCIONES = new Set(["globos_para_enamorar"]);

  const seccionesPrincipales = tagSecciones.filter((s) => !TAGS_POST_COLECCIONES.has(s.tag.clave));
  const seccionesPostColecciones = tagSecciones.filter((s) =>
    TAGS_POST_COLECCIONES.has(s.tag.clave),
  );

  const floristSchema = {
    "@context": "https://schema.org",
    "@type": "Florist",
    name: "Florería Miraflores",
    image: "https://floreriamiraflores.com/Logo.webp",
    telephone: "+51999600482",
    url: "https://floreriamiraflores.com",
    priceRange: "S/.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Miraflores",
      addressRegion: "Lima",
      addressCountry: "PE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -12.1217,
      longitude: -77.0298,
    },
    areaServed: [
      "Miraflores",
      "San Isidro",
      "Santiago de Surco",
      "Barranco",
      "San Borja",
      "La Molina",
      "Jesús María",
      "Magdalena del Mar",
      "Lince",
      "Lima Metropolitana",
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "08:00",
        closes: "20:00",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Marcado estructurado Schema.org Florist & LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(floristSchema) }}
      />
      {config?.anuncio_barra && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />
      <main>
        <Hero banners={banners} />
        <Novedades tagSecciones={seccionesPrincipales} />
        <CategoryShowcase colecciones={colecciones} />
        {seccionesPostColecciones.length > 0 && (
          <Novedades
            tagSecciones={seccionesPostColecciones}
            id="novedades-post-colecciones"
            sinFallback
          />
        )}
        <HomeTestimonios testimonios={testimonios} config={config} />
        <HomeRecuerdos recuerdos={recuerdos} categorias={categorias} distritos={distritos} />
        <DeliveryZones />
        <Faq />
      </main>
      <Footer config={config} />
      <WhatsappFab config={config} />
      <PopupModal popup={popup} config={config} />
    </div>
  );
}
