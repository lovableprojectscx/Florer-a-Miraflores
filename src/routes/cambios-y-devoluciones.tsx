import { createFileRoute, Link } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { getCategorias, getConfig } from "@/lib/queries";

export const Route = createFileRoute("/cambios-y-devoluciones")({
  loader: async () => {
    const [categorias, config] = await Promise.all([
      getCategorias(),
      getConfig().catch(() => null),
    ]);
    return { categorias, config };
  },
  head: () => ({
    meta: [
      { title: "Política de cambios y devoluciones | Florería Miraflores" },
      {
        name: "description",
        content:
          "Condiciones y política de cambios, reposiciones y devoluciones para arreglos florales en Florería Miraflores.",
      },
      { property: "og:title", content: "Política de cambios y devoluciones | Florería Miraflores" },
      {
        property: "og:description",
        content:
          "Condiciones y política de cambios y devoluciones de Florería Miraflores. Tienda virtual en Lima, Perú.",
      },
    ],
  }),
  component: CambiosDevolucionesPage,
});

function CambiosDevolucionesPage() {
  const { categorias, config } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {config?.anuncio_barra && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />

      <main className="flex-1 px-5 md:px-10 py-12 md:py-16">
        <div className="max-w-[72ch] mx-auto">
          <Link
            to="/"
            className="text-[11px] tracking-wider-2 uppercase font-body font-light text-muted-foreground hover:text-foreground transition-colors inline-block mb-6"
          >
            ← Volver al inicio
          </Link>

          <article className="border border-foreground/15 bg-ivory p-6 sm:p-8 md:p-12 rounded-xs shadow-2xs font-body text-sm sm:text-[15px] text-[#2C2420]/85 leading-relaxed space-y-6">
            <header className="pb-6 border-b border-foreground/15">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#2C2420] font-normal leading-tight">
                Política de cambios y devoluciones
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#8A7A6E] font-light">
                Última actualización: 15 de octubre de 2026
              </p>
            </header>

            <p>
              Nuestros productos son flores naturales y perecibles. Por eso aplicamos estas
              condiciones, que aceptas al realizar tu compra.
            </p>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                1. Producto dañado o diferente
              </h2>
              <p>
                Si tu arreglo llega dañado o es distinto al que compraste, debes avisarnos{" "}
                <strong className="font-semibold text-[#2C2420]">
                  dentro de las 2 horas siguientes a la entrega
                </strong>
                , por WhatsApp (+51 999 600 482), enviando{" "}
                <strong className="font-semibold text-[#2C2420]">
                  foto o video del arreglo tal como llegó
                </strong>
                . Pasado ese plazo o sin esa evidencia, no podremos atender el reclamo como producto
                dañado.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                2. Variaciones naturales
              </h2>
              <p>
                Las flores son naturales: pueden presentar pequeñas variaciones de color, tamaño,
                forma o apertura respecto de las fotos, que son referenciales. Si una flor no está
                disponible por temporada, la reemplazamos por otra de igual o mayor valor. Estas
                variaciones no se consideran un producto diferente.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                3. Cómo lo solucionamos
              </h2>
              <p>
                Si tu reclamo procede,{" "}
                <strong className="font-semibold text-[#2C2420]">
                  primero reponemos o reenviamos el arreglo
                </strong>
                . El reembolso solo procede si no es posible reponerlo.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                4. Sin devoluciones por arrepentimiento
              </h2>
              <p>
                Por tratarse de productos perecibles elaborados a pedido, no aceptamos devoluciones
                por cambio de opinión.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                5. Dirección incorrecta o nadie recibe
              </h2>
              <p>
                Si la dirección está mal o nadie recibe el pedido, reprogramamos la entrega y el
                cliente paga un nuevo delivery. En estos casos no corresponde reembolso.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                6. Cancelaciones
              </h2>
              <p>
                Puedes cancelar hasta 24 horas antes de la fecha de entrega. Después, el arreglo ya
                está en preparación y no puede cancelarse.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                7. Libro de Reclamaciones
              </h2>
              <p>
                Esta política no limita tu derecho a presentar un reclamo o queja en nuestro{" "}
                <Link
                  to="/libro-de-reclamaciones"
                  className="text-[#2C2420] underline underline-offset-2 hover:text-[#C4848A]"
                >
                  Libro de Reclamaciones
                </Link>{" "}
                virtual, que responderemos dentro del plazo legal.
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />
    </div>
  );
}
