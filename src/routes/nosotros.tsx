import { createFileRoute, Link } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { DeliveryZones } from "@/components/DeliveryZones";
import { getCategorias, getConfig } from "@/lib/queries";
import aboutImg from "@/assets/about-boutique.webp";
import { Sparkles, HeartHandshake, Clock, ShieldCheck, ArrowRight, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/nosotros")({
  loader: async () => {
    const [categorias, config] = await Promise.all([
      getCategorias(),
      getConfig().catch(() => null),
    ]);
    return { categorias, config };
  },
  head: () => ({
    meta: [
      { title: "Sobre Nosotros | Florería Miraflores" },
      {
        name: "description",
        content:
          "Conoce la historia, valores y pasión de Florería Miraflores. Boutique floral especializada en arreglos de lujo, ramos exclusivos y delivery premium en Lima.",
      },
      { property: "og:title", content: "Sobre Nosotros | Florería Miraflores" },
      {
        property: "og:description",
        content:
          "Boutique floral en Miraflores, Lima. Pasión por el diseño contemporáneo, frescura diaria y flores que hablan por ti.",
      },
    ],
  }),
  component: NosotrosPage,
});

function NosotrosPage() {
  const { categorias, config } = Route.useLoaderData();

  const floristPhone = (config?.whatsapp ?? "+51 999 600 482").replace(/\D/g, "");
  const waUrl = `https://wa.me/${floristPhone}?text=${encodeURIComponent(
    "¡Hola Florería Miraflores! Me gustaría consultar por un arreglo floral personalizado 🌸",
  )}`;

  return (
    <div className="min-h-screen bg-[#FAF8F5]/40 flex flex-col">
      {config?.anuncio_barra && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />

      <main className="flex-1">
        {/* Cabecera / Breadcrumb */}
        <section className="bg-white border-b border-[#E8DDD0]/60 py-10 md:py-16">
          <div className="max-w-4xl mx-auto px-5 text-center">
            <nav className="flex items-center justify-center gap-2 text-xs font-body uppercase tracking-[0.16em] text-[#8A7A6E] mb-4">
              <Link to="/" className="hover:text-[#2C2420] transition-colors">
                Inicio
              </Link>
              <span>/</span>
              <span className="text-[#2C2420] font-medium">Nosotros</span>
            </nav>
            <p className="font-body text-[11px] md:text-xs tracking-[0.2em] uppercase text-[#8A7A6E] mb-2 font-normal">
              — Nuestra Esencia
            </p>
            <h1 className="font-display text-[#2C2420] text-3xl sm:text-5xl md:text-6xl font-normal leading-tight">
              Flores que hablan por ti.
            </h1>
            <p className="mt-4 font-body font-light text-sm sm:text-base md:text-lg text-[#2C2420]/75 max-w-2xl mx-auto leading-relaxed">
              Boutique floral nacida en el corazón de Miraflores, dedicada a transformar momentos ordinarios en emociones imborrables a través del arte floral.
            </p>
          </div>
        </section>

        {/* Sección Historia y Atelier */}
        <section className="py-14 md:py-20 px-5 md:px-12 lg:px-16 max-w-[1536px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Fotografía de la Boutique */}
            <div className="relative overflow-hidden rounded-2xl shadow-xl bg-[#FAF8F5] aspect-[4/3] group">
              <img
                src={aboutImg}
                alt="Maestro florista en el atelier de Florería Miraflores"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7 bg-white/95 backdrop-blur-md px-5 py-3 rounded-xl shadow-lg border border-[#E8DDD0]/80">
                <p className="font-body text-[10px] tracking-widest uppercase font-medium text-[#2C2420]">
                  Atelier Florería Miraflores
                </p>
                <p className="font-display text-xs sm:text-sm text-[#8A7A6E] italic">
                  Flores 100% frescas seleccionadas cada mañana
                </p>
              </div>
            </div>

            {/* Texto Editorial */}
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#C4848A] font-medium font-body block">
                  Nuestro Manifiesto
                </span>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#2C2420] font-normal leading-snug">
                  Pasión, sensibilidad y devoción por el detalle botánico.
                </h2>
              </div>
              <p className="font-body font-light text-sm sm:text-base text-[#2C2420]/80 leading-relaxed">
                En Florería Miraflores entendemos que regalar flores es un acto de profunda conexión personal. Por ello, seleccionamos personalmente cada tallo desde los mejores cultivos nacionales e importados antes de los primeros rayos de sol.
              </p>
              <p className="font-body font-light text-sm sm:text-base text-[#2C2420]/80 leading-relaxed">
                Cada uno de nuestros ramos, cajas de lujo y arreglos florales es concebido como una obra de autor: paletas cromáticas armónicas, envolturas de textura premium y follajes aromáticos que despiertan sensaciones únicas desde el primer instante.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/catalogo"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2C2420] hover:bg-[#1E1E1D] text-white text-xs font-body uppercase tracking-[0.16em] rounded-xl transition-all shadow-md group cursor-pointer"
                >
                  <span>Explorar Catálogo</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-body uppercase tracking-[0.14em] font-medium rounded-xl transition-all shadow-md active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Asesoría por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pilares de Excelencia */}
        <section className="bg-white border-y border-[#E8DDD0]/60 py-16 md:py-24 px-5 md:px-12 lg:px-16">
          <div className="max-w-[1536px] mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
              <p className="font-body text-[11px] md:text-xs tracking-[0.2em] uppercase text-[#8A7A6E] mb-2 font-normal">
                — Por qué elegirnos
              </p>
              <h2 className="font-display text-[#2C2420] text-3xl sm:text-4xl md:text-5xl font-normal leading-tight">
                El estándar Miraflores
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="bg-[#FAF8F5]/60 border border-[#E8DDD0]/80 rounded-2xl p-6 sm:p-7 text-center space-y-3.5 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#C4848A]/10 text-[#C4848A] flex items-center justify-center">
                  <Sparkles className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg text-[#2C2420] font-normal">
                  Frescura Insuperable
                </h3>
                <p className="font-body text-xs sm:text-sm text-[#736B63] font-light leading-relaxed">
                  Tallos hidratados y seleccionados diariamente para garantizar la máxima longevidad y fragancia.
                </p>
              </div>

              <div className="bg-[#FAF8F5]/60 border border-[#E8DDD0]/80 rounded-2xl p-6 sm:p-7 text-center space-y-3.5 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#C4848A]/10 text-[#C4848A] flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg text-[#2C2420] font-normal">
                  Diseño de Autor
                </h3>
                <p className="font-body text-xs sm:text-sm text-[#736B63] font-light leading-relaxed">
                  Composiciones creadas por expertos floristas con equilibrio visual, estética contemporánea y armonía.
                </p>
              </div>

              <div className="bg-[#FAF8F5]/60 border border-[#E8DDD0]/80 rounded-2xl p-6 sm:p-7 text-center space-y-3.5 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#C4848A]/10 text-[#C4848A] flex items-center justify-center">
                  <Clock className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg text-[#2C2420] font-normal">
                  Delivery el Mismo Día
                </h3>
                <p className="font-body text-xs sm:text-sm text-[#736B63] font-light leading-relaxed">
                  Reparto puntual y dedicado en Miraflores, San Isidro, Surco, Barranco y los principales distritos de Lima.
                </p>
              </div>

              <div className="bg-[#FAF8F5]/60 border border-[#E8DDD0]/80 rounded-2xl p-6 sm:p-7 text-center space-y-3.5 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#C4848A]/10 text-[#C4848A] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg text-[#2C2420] font-normal">
                  Garantía de Satisfacción
                </h3>
                <p className="font-body text-xs sm:text-sm text-[#736B63] font-light leading-relaxed">
                  Cuidamos cada envío con dedicación absoluta para que tu regalo llegue impecable a su destino.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Zonas de Cobertura */}
        <DeliveryZones />
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />
    </div>
  );
}
