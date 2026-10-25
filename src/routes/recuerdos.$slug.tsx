import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import {
  MapPin,
  Calendar,
  ArrowLeft,
  ShoppingBag,
  MessageCircle,
  Camera,
  Heart,
  Sparkles,
} from "lucide-react";

import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { ProductGrid } from "@/components/ProductGrid";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { useCartStore } from "@/store/cart";
import { getRecuerdoPorSlug, getCategorias, getConfig } from "@/lib/queries";
import {
  formatRecuerdoDate,
  construirMensajeWhatsAppRecuerdo,
  generateRecuerdoSchema,
} from "@/lib/recuerdos-utils";
import type { RecuerdoRow, CategoriaRow, ProductoRow, DistritoRow } from "@/types/database";

export const Route = createFileRoute("/recuerdos/$slug")({
  loader: async ({ params }) => {
    const [recuerdoData, categorias, config] = await Promise.all([
      getRecuerdoPorSlug(params.slug),
      getCategorias().catch(() => [] as CategoriaRow[]),
      getConfig().catch(() => null),
    ]);

    if (!recuerdoData) {
      throw notFound();
    }

    return {
      recuerdo: recuerdoData.recuerdo,
      categoriaRelacionada: recuerdoData.categoriaRelacionada,
      distrito: recuerdoData.distrito,
      productoRelacionado: recuerdoData.productoRelacionado,
      productosRelacionados: recuerdoData.productosRelacionados,
      categorias,
      config,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { recuerdo, distrito } = loaderData;
    const pageTitle =
      recuerdo.meta_title?.trim() ||
      `${recuerdo.titulo} ${distrito ? `en ${distrito.nombre}` : ""} | Florería Miraflores`;
    const pageDesc =
      recuerdo.meta_description?.trim() ||
      recuerdo.resumen?.trim() ||
      `Mira esta entrega de flores real: "${recuerdo.titulo}". Arreglos florales frescos en Lima.`;

    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: pageDesc },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: pageDesc },
        ...(recuerdo.imagen_portada_url
          ? [{ property: "og:image", content: recuerdo.imagen_portada_url }]
          : []),
        { property: "og:type", content: "article" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-[#FDFAF6] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#C4956A] mb-4">
        <Camera className="w-8 h-8 stroke-[1.2]" />
      </div>
      <h1 className="font-display text-3xl sm:text-4xl mb-3 text-[#2C2420]">
        Recuerdo no encontrado
      </h1>
      <p className="font-body font-light text-sm text-[#8A7A6E] mb-6 max-w-md">
        El momento o recuerdo de entrega que buscas no existe o aún no ha sido publicado. Explora
        otros recuerdos en nuestro mural.
      </p>
      <Link
        to="/recuerdos"
        className="inline-flex items-center justify-center px-6 py-3 bg-[#2C2420] text-white text-xs uppercase tracking-widest font-body rounded hover:bg-[#1A1A1A] transition-colors"
      >
        Volver al Mural de Recuerdos
      </Link>
    </div>
  ),
  component: RecuerdoDetailPage,
});

function RecuerdoDetailPage() {
  const {
    recuerdo,
    categoriaRelacionada,
    distrito,
    productoRelacionado,
    productosRelacionados,
    categorias,
    config,
  } = Route.useLoaderData();

  const { agregarItem, abrirCarrito } = useCartStore();

  const CANONICAL_SITE_URL = "https://floreriamiraflores.com";

  const jsonLd = generateRecuerdoSchema({
    recuerdo,
    siteUrl: CANONICAL_SITE_URL,
  });

  const whatsappMsg = construirMensajeWhatsAppRecuerdo({
    titulo: recuerdo.titulo,
    slug: recuerdo.slug,
    tieneProducto: Boolean(recuerdo.producto_id && productoRelacionado),
    siteUrl: CANONICAL_SITE_URL,
  });

  const whatsappNum = (config?.whatsapp ?? "+51 999 600 482").replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="min-h-screen bg-[#FDFAF6] flex flex-col">
      {config && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />

      {/* Marcado estructurado Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 max-w-[1340px] w-full mx-auto px-4 sm:px-6 lg:px-12 pt-4 md:pt-6 pb-20">
        {/* Navegación y retorno */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/recuerdos"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-body text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Mural
          </Link>
        </div>

        {/* Contenedor Principal: Foto Real + Información Emocional & Conversión */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Columna Izquierda: Fotografía Real de Entrega */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-[#E8DDD0] bg-[#FFFFFF] shadow-md">
              {recuerdo.imagen_portada_url ? (
                <ResponsiveImage
                  url={recuerdo.imagen_portada_url}
                  fallbackUrl={recuerdo.imagen_portada_url}
                  anchoMiniatura={960}
                  anchosMiniatura={[960]}
                  originalWidth={1600}
                  alt={recuerdo.titulo}
                  fetchPriority="high"
                  style={{ objectPosition: "center 18%" }}
                  className="w-full h-auto max-h-[750px] object-cover"
                />
              ) : (
                <div className="aspect-[4/5] flex items-center justify-center bg-[#FAF8F5] text-[#8A7A6E]">
                  <Heart className="w-12 h-12 stroke-[1.2] text-[#C4956A]" />
                </div>
              )}
            </div>

            {/* Galería adicional si existe */}
            {recuerdo.fotos_galeria && recuerdo.fotos_galeria.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {recuerdo.fotos_galeria.map((foto, idx) => (
                  <ResponsiveImage
                    key={idx}
                    url={foto}
                    fallbackUrl={foto}
                    anchoMiniatura={480}
                    anchosMiniatura={[480]}
                    alt={`${recuerdo.titulo} - foto ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-[#E8DDD0] cursor-pointer hover:opacity-80 transition-opacity"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Detalle Emocional y Bloque de Conversión Directa */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#E8DDD0] shadow-sm space-y-5">
              {/* Badges de Ocasión y Distrito (solo si realmente existen) */}
              {(categoriaRelacionada || distrito) && (
                <div className="flex flex-wrap items-center gap-2">
                  {categoriaRelacionada && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-body tracking-wider uppercase bg-[#FAF8F5] text-rose-accent border border-[#E8DDD0]">
                      {categoriaRelacionada.nombre}
                    </span>
                  )}
                  {distrito && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-body tracking-wider uppercase bg-[#2C2420] text-white">
                      <MapPin className="w-3 h-3 text-rose-accent" />
                      Entrega en {distrito.nombre}
                    </span>
                  )}
                </div>
              )}

              {/* Título de la historia */}
              <h1 className="font-display text-2xl sm:text-3xl text-[#2C2420] leading-tight">
                {recuerdo.titulo}
              </h1>

              {/* Frase destacada / dedicatoria del momento (solo si no está vacía) */}
              {recuerdo.resumen && recuerdo.resumen.trim() && (
                <div className="p-4 rounded-xl bg-[#FAF8F5] border-l-4 border-rose-accent">
                  <p className="font-body italic text-sm text-[#5C5046] leading-relaxed">
                    "{recuerdo.resumen.trim()}"
                  </p>
                </div>
              )}

              {/* Historia de la entrega: solo si hay texto */}
              {recuerdo.contenido && recuerdo.contenido.trim() && (
                <div className="font-body font-light text-sm text-[#2C2420]/85 leading-relaxed space-y-3 border-t border-[#E8DDD0]/60 pt-4">
                  <ReactMarkdown>{recuerdo.contenido.trim()}</ReactMarkdown>
                </div>
              )}

              {/* ─── BLOQUE DE CONVERSIÓN: Flores de este recuerdo (solo si hay producto_id y producto) ─── */}
              {recuerdo.producto_id && productoRelacionado ? (
                <div className="mt-6 pt-6 border-t border-[#E8DDD0] space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-accent" />
                    <h2 className="font-display text-lg text-[#2C2420]">Flores de este recuerdo</h2>
                  </div>

                  <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8DDD0]">
                    {productoRelacionado.imagenes && productoRelacionado.imagenes[0] && (
                      <img
                        src={productoRelacionado.imagenes[0]}
                        alt={productoRelacionado.nombre}
                        className="w-16 h-16 object-cover rounded-lg border border-[#E8DDD0] shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm text-[#2C2420] truncate">
                        {productoRelacionado.nombre}
                      </h3>
                      <p className="font-body font-semibold text-base text-[#2C2420] mt-0.5">
                        S/. {Number(productoRelacionado.precio).toFixed(2)}{" "}
                        <span className="text-[10px] font-normal text-[#8A7A6E]">PEN</span>
                      </p>
                    </div>
                  </div>

                  {/* Botones de Conversión */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        agregarItem({
                          id: productoRelacionado.id,
                          nombre: productoRelacionado.nombre,
                          precio: Number(productoRelacionado.precio),
                          imagen: productoRelacionado.imagenes?.[0] ?? "",
                        });
                        abrirCarrito();
                      }}
                      className="w-full py-3 px-4 bg-[#2C2420] hover:bg-[#1A1A1A] text-white text-xs font-body uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Agregar al carrito
                    </button>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-body uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-center"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Pedir por WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                /* Si no hay producto_id: solo botón WhatsApp "Quiero un arreglo así" */
                <div className="mt-6 pt-6 border-t border-[#E8DDD0] space-y-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-body uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-center font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Quiero un arreglo así
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Arreglos recomendados solo si tiene ocasión/categoría relacionada */}
        {recuerdo.categoria_relacionada_id && productosRelacionados.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#E8DDD0]">
            <div className="mb-8">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420]">
                {categoriaRelacionada
                  ? `Más arreglos para ${categoriaRelacionada.nombre}`
                  : "Arreglos recomendados"}
              </h2>
              <p className="font-body font-light text-xs sm:text-sm text-[#8A7A6E] mt-1">
                Explora otras opciones listas para enviar a domicilio en Lima Metropolitana.
              </p>
            </div>
            <ProductGrid products={productosRelacionados} />
          </section>
        )}
      </main>

      <Footer config={config} />
      {config && <WhatsappFab config={config} />}
    </div>
  );
}
