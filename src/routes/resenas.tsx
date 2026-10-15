import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, ExternalLink, MessageSquareHeart } from "lucide-react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { ResenaCard } from "@/components/ResenaCard";
import { getCategorias, getConfig, getTestimonios } from "@/lib/queries";
import { formatGoogleSummary } from "@/lib/resenas-utils";
import type { TestimonioRow } from "@/types/database";

export const Route = createFileRoute("/resenas")({
  loader: async () => {
    const [categorias, config, testimonios] = await Promise.all([
      getCategorias().catch(() => []),
      getConfig().catch(() => null),
      getTestimonios().catch(() => []),
    ]);
    return { categorias, config, testimonios };
  },
  head: () => ({
    meta: [
      { title: "Reseñas | Florería Miraflores" },
      {
        name: "description",
        content:
          "Opiniones y testimonios reales de clientes de Florería Miraflores en Lima. Conoce experiencias verificadas sobre nuestros arreglos florales y servicio de entrega.",
      },
      { property: "og:title", content: "Reseñas | Florería Miraflores" },
      {
        property: "og:description",
        content: "Opiniones y testimonios reales de clientes de Florería Miraflores en Lima.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ResenasPage,
});

function ResenasPage() {
  const { categorias, config, testimonios } = Route.useLoaderData();

  const googleSummary = formatGoogleSummary(config?.google_rating, config?.google_reviews_count);
  const googleReviewsUrl = config?.google_reviews_url?.trim() || null;

  return (
    <div className="min-h-screen bg-[#FAF8F5]/40 flex flex-col">
      {config?.anuncio_barra && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />

      <main className="flex-1">
        {/* Cabecera de la página */}
        <section className="bg-white border-b border-[#E8DDD0]/60 py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            {/* Breadcrumb sencillo */}
            <nav className="mb-4 text-xs font-body text-[#8A7A6E]" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-[#2C2420] transition-colors">
                Inicio
              </Link>
              <span className="mx-2">/</span>
              <span className="text-[#2C2420] font-medium">Reseñas</span>
            </nav>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#2C2420] mb-4">
              Lo que dicen nuestros clientes
            </h1>

            <p className="font-body text-[#2C2420]/75 text-sm sm:text-base max-w-2xl mx-auto mb-6 leading-relaxed">
              Cada entrega es una historia de amor, gratitud y celebración. Descubre las
              experiencias reales de quienes confían en nuestros arreglos florales de autor.
            </p>

            {/* Resumen real de Google & Botón externo */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {googleSummary && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF8F5] border border-[#E8DDD0] rounded-full text-sm font-body font-medium text-[#2C2420]"
                  data-testid="google-summary"
                >
                  <Star className="w-4 h-4 fill-[#E0A96D] text-[#E0A96D]" />
                  <span>{googleSummary}</span>
                </div>
              )}

              {googleReviewsUrl && (
                <a
                  href={googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2420] hover:bg-[#2C2420]/85 text-white font-body text-xs tracking-widest uppercase font-medium rounded-full transition-all duration-200 shadow-xs hover:shadow"
                  data-testid="ver-todas-google-btn"
                >
                  <span>Ver todas en Google</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Sección de Reseñas / Grilla */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {testimonios.length > 0 ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-testid="resenas-grid"
            >
              {testimonios.map((testimonio: TestimonioRow) => (
                <ResenaCard key={testimonio.id} testimonio={testimonio} />
              ))}
            </div>
          ) : (
            <div
              className="max-w-md mx-auto text-center py-16 px-6 bg-white border border-[#E8DDD0]/60 rounded-lg shadow-xs"
              data-testid="resenas-empty-state"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#C4848A]">
                <MessageSquareHeart className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-xl text-[#2C2420] mb-2">
                Aún no hay reseñas publicadas
              </h2>
              <p className="font-body text-sm text-[#8A7A6E] mb-6 leading-relaxed">
                Estamos recopilando las experiencias más recientes de nuestros clientes.
                {googleReviewsUrl
                  ? " Puedes leer todas las opiniones directamente en nuestro perfil de Google."
                  : " ¡Pronto encontrarás aquí las historias de nuestros clientes!"}
              </p>
              {googleReviewsUrl ? (
                <a
                  href={googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2420] text-white font-body text-xs tracking-widest uppercase rounded-full hover:bg-[#2C2420]/85 transition-colors"
                >
                  <span>Ver opiniones en Google</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <Link
                  to="/catalogo"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2420] text-white font-body text-xs tracking-widest uppercase rounded-full hover:bg-[#2C2420]/85 transition-colors"
                >
                  <span>Explorar Catálogo</span>
                </Link>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />
    </div>
  );
}
