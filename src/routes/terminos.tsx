import { createFileRoute, Link } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { getCategorias, getConfig } from "@/lib/queries";

export const Route = createFileRoute("/terminos")({
  loader: async () => {
    const [categorias, config] = await Promise.all([
      getCategorias(),
      getConfig().catch(() => null),
    ]);
    return { categorias, config };
  },
  head: () => ({
    meta: [
      { title: "Términos y condiciones | Florería Miraflores" },
      {
        name: "description",
        content:
          "Términos y condiciones de uso y compra en la tienda virtual Florería Miraflores, operada por Grupo Flowerstore SAC.",
      },
      { property: "og:title", content: "Términos y condiciones | Florería Miraflores" },
      {
        property: "og:description",
        content:
          "Términos y condiciones de compra en Florería Miraflores. Tienda virtual en Lima, Perú.",
      },
    ],
  }),
  component: TerminosPage,
});

function TerminosPage() {
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
                Términos y condiciones
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#8A7A6E] font-light">
                Última actualización: 15 de octubre de 2026
              </p>
            </header>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                1. Quiénes somos
              </h2>
              <p>
                Florería Miraflores es una tienda virtual operada por{" "}
                <strong className="font-semibold text-[#2C2420]">Grupo Flowerstore SAC</strong>, RUC{" "}
                <strong className="font-semibold text-[#2C2420]">20613383159</strong>, con atención
                exclusivamente en línea en Lima, Perú. No contamos con tienda física.
              </p>
              <p>
                Contacto: pedidos@floreriamiraflores.com · WhatsApp +51 999 600 482 · Atención de
                9:00 a. m. a 9:00 p. m., todos los días.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                2. Aceptación
              </h2>
              <p>
                Al realizar un pedido en florer-a-miraflores.vercel.app aceptas estos Términos y
                condiciones y nuestra Política de cambios y devoluciones. Te pedimos marcarlo
                expresamente antes de confirmar tu compra.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                3. Productos
              </h2>
              <p>
                Nuestros arreglos se elaboran con flores naturales y frescas. Por su naturaleza,
                cada arreglo puede presentar pequeñas variaciones de color, tamaño, forma o apertura
                respecto de las fotografías, que son referenciales.
              </p>
              <p>
                Si alguna flor o insumo no está disponible por temporada, podremos reemplazarlo por
                otro de igual o mayor valor y de estilo similar, manteniendo el diseño general del
                arreglo.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                4. Precios
              </h2>
              <p>
                Los precios se muestran en soles (S/) e incluyen IGV. El costo de delivery se
                muestra por separado antes de confirmar el pedido. Los precios y promociones pueden
                cambiar sin previo aviso, pero se respeta el precio vigente al momento de tu compra.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                5. Pedidos y pagos
              </h2>
              <p>
                Aceptamos Visa, Mastercard, American Express, Yape y Plin. El pedido se considera
                confirmado cuando el pago ha sido verificado. Si no podemos atender tu pedido, te
                contactaremos para coordinar una alternativa o devolverte el importe pagado.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                6. Entregas
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Hacemos delivery en Lima y Callao, en los distritos indicados en la web.</li>
                <li>
                  Entrega el mismo día para pedidos confirmados antes de las 5:00 p. m., sujeto a
                  disponibilidad.
                </li>
                <li>
                  Es responsabilidad del cliente ingresar correctamente la dirección, la referencia
                  y los datos de quien recibe.
                </li>
                <li>
                  Si la dirección es incorrecta o nadie recibe el pedido, se reprogramará la entrega
                  y el cliente deberá pagar un nuevo delivery. En estos casos no corresponde
                  reembolso.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                7. Cancelaciones
              </h2>
              <p>
                Puedes cancelar tu pedido hasta 24 horas antes de la fecha de entrega,
                escribiéndonos por WhatsApp o al correo de contacto. Pasado ese plazo, el arreglo ya
                está en preparación y no es posible cancelarlo.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                8. Cambios, reclamos y devoluciones
              </h2>
              <p>
                Se rigen por nuestra{" "}
                <Link
                  to="/cambios-y-devoluciones"
                  className="text-[#2C2420] underline underline-offset-2 hover:text-[#C4848A]"
                >
                  Política de cambios y devoluciones
                </Link>
                . Además, ponemos a tu disposición nuestro{" "}
                <Link
                  to="/libro-de-reclamaciones"
                  className="text-[#2C2420] underline underline-offset-2 hover:text-[#C4848A]"
                >
                  Libro de Reclamaciones
                </Link>{" "}
                virtual, conforme a la normativa vigente.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                9. Datos personales
              </h2>
              <p>
                El tratamiento de tus datos se rige por nuestra{" "}
                <Link
                  to="/privacidad"
                  className="text-[#2C2420] underline underline-offset-2 hover:text-[#C4848A]"
                >
                  Política de privacidad
                </Link>
                .
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                10. Ley aplicable
              </h2>
              <p>
                Estos términos se rigen por las leyes de la República del Perú, incluido el Código
                de Protección y Defensa del Consumidor (Ley N.° 29571).
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
