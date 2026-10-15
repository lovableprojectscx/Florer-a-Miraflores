import { createFileRoute, Link } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { getCategorias, getConfig } from "@/lib/queries";

export const Route = createFileRoute("/privacidad")({
  loader: async () => {
    const [categorias, config] = await Promise.all([
      getCategorias(),
      getConfig().catch(() => null),
    ]);
    return { categorias, config };
  },
  head: () => ({
    meta: [
      { title: "Política de privacidad | Florería Miraflores" },
      {
        name: "description",
        content:
          "Política de privacidad y protección de datos personales de Florería Miraflores (Grupo Flowerstore SAC), conforme a la Ley N.° 29733.",
      },
      { property: "og:title", content: "Política de privacidad | Florería Miraflores" },
      {
        property: "og:description",
        content:
          "Información sobre el tratamiento de datos personales en Florería Miraflores. Tienda virtual en Lima, Perú.",
      },
    ],
  }),
  component: PrivacidadPage,
});

function PrivacidadPage() {
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
                Política de privacidad
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#8A7A6E] font-light">
                Última actualización: 15 de octubre de 2026
              </p>
            </header>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                1. Responsable
              </h2>
              <p>
                El responsable del tratamiento de tus datos personales es{" "}
                <strong className="font-semibold text-[#2C2420]">Grupo Flowerstore SAC</strong>, RUC{" "}
                <strong className="font-semibold text-[#2C2420]">20613383159</strong>, que opera la
                tienda virtual Florería Miraflores (Lima, Perú).
              </p>
              <p>Contacto para temas de datos personales: pedidos@floreriamiraflores.com</p>
              <p>
                Esta política cumple con la Ley N.° 29733, Ley de Protección de Datos Personales, y
                su Reglamento.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                2. Qué datos recopilamos
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="font-semibold text-[#2C2420]">Al comprar:</strong> nombre,
                  teléfono, correo, dirección y referencia de entrega, nombre y teléfono de quien
                  recibe, y el mensaje de la tarjeta.
                </li>
                <li>
                  <strong className="font-semibold text-[#2C2420]">Al suscribirte al Club:</strong>{" "}
                  nombre y número de WhatsApp.
                </li>
                <li>
                  <strong className="font-semibold text-[#2C2420]">
                    Al usar el Libro de Reclamaciones:
                  </strong>{" "}
                  los datos que indica el formulario.
                </li>
              </ul>
              <p>
                No recopilamos ni almacenamos los datos completos de tu tarjeta: los pagos con
                tarjeta los procesa la pasarela de pago.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                3. Para qué los usamos
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="font-semibold text-[#2C2420]">Gestionar tu pedido:</strong>{" "}
                  confirmarlo, prepararlo, entregarlo y comunicarnos contigo o con quien recibe. Sin
                  estos datos no podemos atender tu compra.
                </li>
                <li>
                  <strong className="font-semibold text-[#2C2420]">
                    Atender reclamos y cumplir obligaciones legales y tributarias.
                  </strong>
                </li>
                <li>
                  <strong className="font-semibold text-[#2C2420]">
                    Enviarte promociones y novedades por WhatsApp:
                  </strong>{" "}
                  solo si lo aceptas expresamente marcando la casilla del Club. Es opcional y puedes
                  darte de baja cuando quieras.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                4. Con quién los compartimos
              </h2>
              <p>
                No vendemos tus datos. Solo los compartimos con proveedores que nos ayudan a operar
                la tienda: servicios de alojamiento web y base de datos, la pasarela de pago y el
                personal de reparto. Algunos de estos proveedores tecnológicos tienen sus servidores
                fuera del Perú; al usar nuestra web y aceptar esta política, consientes esa
                transferencia, que se realiza con proveedores que aplican medidas de seguridad
                adecuadas.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                5. Cuánto tiempo los guardamos
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Datos de pedidos: el tiempo necesario para atenderlos y el que exijan las normas
                  tributarias y de protección al consumidor.
                </li>
                <li>Datos del Club: hasta que te des de baja.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                6. Tus derechos
              </h2>
              <p>
                Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición
                (ARCO), así como revocar tu consentimiento, escribiendo a
                pedidos@floreriamiraflores.com con tu nombre y el derecho que deseas ejercer. Para
                dejar de recibir promociones basta con escribirnos &ldquo;BAJA&rdquo; por WhatsApp.
              </p>
              <p>
                Si consideras que no hemos atendido tu solicitud, puedes acudir a la Autoridad
                Nacional de Protección de Datos Personales del Ministerio de Justicia y Derechos
                Humanos.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                7. Seguridad
              </h2>
              <p>
                Aplicamos medidas técnicas y organizativas razonables para proteger tus datos contra
                pérdida, acceso no autorizado o uso indebido.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                8. Almacenamiento en tu navegador
              </h2>
              <p>
                Usamos el almacenamiento local de tu navegador solo para recordar tu carrito y si ya
                viste o completaste el formulario del Club. No usamos cookies publicitarias de
                terceros.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] font-normal pt-2">
                9. Cambios a esta política
              </h2>
              <p>
                Podemos actualizar esta política. La versión vigente siempre estará publicada en
                esta página con su fecha de actualización.
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
