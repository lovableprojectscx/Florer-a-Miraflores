import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { getCategorias, getConfig } from "@/lib/queries";

export const Route = createFileRoute("/libro-de-reclamaciones")({
  loader: async () => {
    const [categorias, config] = await Promise.all([
      getCategorias().catch(() => []),
      getConfig().catch(() => null),
    ]);
    return { categorias, config };
  },
  head: () => ({
    meta: [
      { title: "Libro de Reclamaciones · Miraflores Boutique Floral" },
      {
        name: "description",
        content:
          "Registra tu queja o reclamo conforme al Código de Protección y Defensa del Consumidor del Perú. Te responderemos en un plazo máximo de 15 días hábiles.",
      },
    ],
  }),
  component: LibroReclamaciones,
});

function LibroReclamaciones() {
  const { categorias, config } = Route.useLoaderData();
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar config={config} />
      <Header categorias={categorias} />
      <main className="px-6 md:px-10 lg:px-16 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="text-[11px] tracking-wider-2 uppercase font-body font-light text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver al inicio
          </Link>

          <div className="mt-8 border border-foreground/15 bg-ivory p-8 md:p-12">
            <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-foreground/15">
              <div>
                <p className="font-italic-serif text-rose-accent text-base">— conforme a Ley N° 29571</p>
                <h1 className="font-display text-3xl md:text-5xl text-foreground mt-1">
                  Libro de Reclamaciones
                </h1>
              </div>
              <div className="text-right font-body text-xs text-muted-foreground">
                <p>Hoja N° ___</p>
                <p className="mt-1">Fecha: {new Date().toLocaleDateString("es-PE")}</p>
              </div>
            </div>

            <p className="mt-6 font-body font-light text-sm text-foreground/80 leading-relaxed">
              <strong className="font-medium">Razón social:</strong> Miraflores Boutique Floral S.A.C. ·{" "}
              <strong className="font-medium">RUC:</strong> 20XXXXXXXXX ·{" "}
              <strong className="font-medium">Domicilio:</strong> Av. Larco 345, Miraflores, Lima — Perú.
            </p>

            {sent ? (
              <div className="mt-10 p-8 bg-ivory-soft text-center">
                <h2 className="font-display text-2xl md:text-3xl text-foreground">
                  Gracias, hemos recibido tu reclamo.
                </h2>
                <p className="mt-3 font-body font-light text-foreground/75">
                  Te responderemos al correo registrado en un plazo máximo de 15 días hábiles, conforme a la Ley de Protección al Consumidor.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-[11px] tracking-wider-2 uppercase font-body text-rose-accent hover:underline"
                >
                  Registrar otro reclamo
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="mt-8 space-y-10"
              >
                <Fieldset title="1. Identificación del consumidor">
                  <Field label="Nombre completo" name="nombre" required />
                  <Field label="DNI / CE" name="documento" required />
                  <Field label="Domicilio" name="domicilio" />
                  <Field label="Correo electrónico" name="email" type="email" required />
                  <Field label="Teléfono" name="telefono" type="tel" required />
                  <Field label="Padre o madre (si es menor de edad)" name="tutor" />
                </Fieldset>

                <Fieldset title="2. Identificación del bien contratado">
                  <Radio name="tipo" options={["Producto", "Servicio"]} />
                  <Field label="Monto reclamado (S/.)" name="monto" type="number" />
                  <Field label="Descripción del producto o servicio" name="descripcion" textarea />
                </Fieldset>

                <Fieldset title="3. Detalle de la reclamación">
                  <Radio name="motivo" options={["Reclamo (disconformidad del servicio)", "Queja (malestar respecto a la atención)"]} />
                  <Field label="Detalle de tu reclamo o queja" name="detalle" textarea required />
                  <Field label="Pedido del consumidor" name="pedido" textarea required />
                </Fieldset>

                <div className="pt-6 border-t border-foreground/15">
                  <p className="font-body font-light text-xs text-muted-foreground leading-relaxed">
                    La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para denuncias ante INDECOPI. El proveedor debe dar respuesta en un plazo no mayor a 15 días hábiles.
                  </p>
                  <button
                    type="submit"
                    className="mt-6 inline-flex items-center justify-center h-12 px-10 bg-foreground text-primary-foreground text-[11px] tracking-wider-2 uppercase font-body font-light hover:bg-foreground/90 transition-colors"
                  >
                    Enviar reclamo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer config={config} />
      <WhatsappFab />
    </div>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="font-display text-lg md:text-xl text-foreground mb-5">{title}</legend>
      <div className="grid sm:grid-cols-2 gap-5">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  textarea,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const cls =
    "w-full bg-transparent border-b border-foreground/25 focus:border-rose-accent outline-none py-2 font-body font-light text-foreground placeholder:text-muted-foreground/60 transition-colors";
  return (
    <label className={textarea ? "sm:col-span-2 block" : "block"}>
      <span className="text-[10px] tracking-wider-2 uppercase font-body font-light text-muted-foreground">
        {label} {required && <span className="text-rose-accent">*</span>}
      </span>
      {textarea ? (
        <textarea name={name} required={required} rows={3} className={cls + " resize-none mt-2"} />
      ) : (
        <input name={name} type={type} required={required} className={cls + " mt-2"} />
      )}
    </label>
  );
}

function Radio({ name, options }: { name: string; options: string[] }) {
  return (
    <div className="sm:col-span-2 flex flex-wrap gap-6">
      {options.map((o) => (
        <label key={o} className="flex items-center gap-2 font-body font-light text-foreground/85 text-sm cursor-pointer">
          <input type="radio" name={name} value={o} className="accent-rose-accent" required />
          {o}
        </label>
      ))}
    </div>
  );
}
