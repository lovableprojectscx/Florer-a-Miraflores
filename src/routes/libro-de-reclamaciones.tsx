import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { getCategorias, getConfig } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Download, Printer, Loader2 } from "lucide-react";

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
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<{
    numero: number;
    fecha: string;
    nombre: string;
    documento: string;
    domicilio: string;
    email: string;
    telefono: string;
    tutor: string;
    tipo: string;
    monto: string;
    descripcion: string;
    motivo: string;
    detalle: string;
    pedido: string;
  } | null>(null);

  const printPDF = (data: typeof claimData) => {
    if (!data) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Su reclamo fue registrado con éxito. Por favor habilite las ventanas emergentes (popups) en su navegador para imprimir o guardar su copia en PDF.");
      return;
    }

    const renderSheet = (copyLabel: string) => `
      <div class="container" style="position: relative;">
        <div style="position: absolute; right: 0; top: -10px; font-size: 10px; font-weight: bold; color: #C4956A; border: 1px solid #C4956A; padding: 4px 10px; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif;">
          ${copyLabel}
        </div>
        
        <table class="header-table">
          <tr>
            <td>
              <div class="logo-title">Miraflores</div>
              <div class="logo-sub">Boutique Floral</div>
            </td>
            <td>
              <div class="doc-title">LIBRO DE RECLAMACIONES</div>
              <div class="doc-info">
                <strong>Hoja N° ${String(data.numero).padStart(6, "0")}</strong><br>
                Fecha: ${data.fecha}
              </div>
            </td>
          </tr>
        </table>
        
        <p style="font-size: 12px; margin-top: -15px; margin-bottom: 20px;">
          <strong>Miraflores Boutique Floral S.A.C.</strong> &middot; RUC: 20600000000 &middot; Domicilio: Av. Larco 345, Miraflores, Lima — Perú
        </p>
        
        <div class="section-title">1. Identificación del consumidor</div>
        <div class="info-grid">
          <div class="info-item full-width">
            <div class="info-label">Nombre completo</div>
            <div class="info-value">${data.nombre}</div>
          </div>
          <div class="info-item">
            <div class="info-label">DNI / CE</div>
            <div class="info-value">${data.documento}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Teléfono</div>
            <div class="info-value">${data.telefono}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Correo electrónico</div>
            <div class="info-value">${data.email}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Domicilio</div>
            <div class="info-value">${data.domicilio || "—"}</div>
          </div>
          ${data.tutor ? `
          <div class="info-item full-width">
            <div class="info-label">Padre / Madre o Tutor (si es menor de edad)</div>
            <div class="info-value">${data.tutor}</div>
          </div>
          ` : ""}
        </div>
        
        <div class="section-title">2. Identificación del bien contratado</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Tipo de bien</div>
            <div class="info-value">${data.tipo}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Monto reclamado</div>
            <div class="info-value">${data.monto}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Descripción del producto o servicio</div>
            <div class="description-block">${data.descripcion || "—"}</div>
          </div>
        </div>
        
        <div class="section-title">3. Detalle de la reclamación</div>
        <div class="info-grid">
          <div class="info-item full-width">
            <div class="info-label">Tipo de acción</div>
            <div class="info-value">${data.motivo}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Detalle del reclamo o queja</div>
            <div class="description-block">${data.detalle}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Pedido concreto del consumidor</div>
            <div class="description-block">${data.pedido}</div>
          </div>
        </div>
        
        <div class="legal-notice">
          * RECLAMO: Disconformidad relacionada a los productos o servicios.<br>
          * QUEJA: Disconformidad no relacionada a los productos o servicios; o malestar o descontento respecto a la atención al público.<br>
          La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI. El proveedor deberá dar respuesta al reclamo en un plazo no mayor a quince (15) días hábiles improrrogables.
        </div>
        
        <div class="signatures">
          <div class="signature-line" style="margin-top: 40px;">Firma del Consumidor</div>
          <div class="signature-line" style="margin-top: 40px;">Firma del Proveedor</div>
        </div>
      </div>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hoja de Reclamacion N° ${String(data.numero).padStart(6, "0")}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #2c2420;
            padding: 30px;
            line-height: 1.5;
            background-color: #ffffff;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #e8ddd0;
            padding: 25px;
            box-sizing: border-box;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .header-table td {
            vertical-align: middle;
          }
          .logo-title {
            font-size: 26px;
            font-family: Georgia, serif;
            font-style: italic;
            font-weight: bold;
          }
          .logo-sub {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #8a7a6e;
          }
          .doc-title {
            font-size: 20px;
            font-weight: bold;
            text-align: right;
            margin-bottom: 5px;
          }
          .doc-info {
            font-size: 11px;
            color: #8a7a6e;
            text-align: right;
          }
          .section-title {
            background-color: #f5efe6;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 6px 10px;
            margin-top: 20px;
            margin-bottom: 12px;
            border: 1px solid #e8ddd0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 8px;
          }
          .info-item {
             font-size: 13px;
          }
          .info-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #8a7a6e;
            margin-bottom: 2px;
          }
          .info-value {
            font-weight: 500;
            border-bottom: 1px dashed #e8ddd0;
            padding-bottom: 2px;
          }
          .full-width {
            grid-column: span 2;
          }
          .description-block {
            font-size: 13px;
            background-color: #faf8f5;
            border: 1px solid #e8ddd0;
            padding: 10px;
            min-height: 60px;
            white-space: pre-wrap;
            margin-top: 4px;
          }
          .legal-notice {
            margin-top: 20px;
            font-size: 9px;
            color: #8a7a6e;
            text-align: justify;
            line-height: 1.3;
            border-top: 1px solid #e8ddd0;
            padding-top: 10px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 35px;
            padding: 0 30px;
          }
          .signature-line {
            border-top: 1px solid #2c2420;
            width: 180px;
            text-align: center;
            padding-top: 6px;
            font-size: 11px;
          }
          .page-break {
            page-break-before: always;
          }
          @media print {
            body {
              padding: 0;
            }
            .container {
              border: none;
              padding: 0;
            }
            .page-break {
              page-break-before: always;
              margin-top: 0;
            }
          }
        </style>
      </head>
      <body>
        ${renderSheet("Copia para el Consumidor")}
        <div class="page-break"></div>
        ${renderSheet("Copia para el Establecimiento")}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintPDF = () => {
    printPDF(claimData);
  };

  const handleDownloadTXT = () => {
    if (!claimData) return;
    const text = `
--------------------------------------------------
         LIBRO DE RECLAMACIONES OFICIAL
           MIRAFLORES BOUTIQUE FLORAL
--------------------------------------------------
Hoja de Reclamación N° ${String(claimData.numero).padStart(6, "0")}
Fecha de registro: ${claimData.fecha}

RAZÓN SOCIAL: Miraflores Boutique Floral S.A.C.
RUC: 20600000000
DOMICILIO: Av. Larco 345, Miraflores, Lima - Perú
--------------------------------------------------

1. IDENTIFICACIÓN DEL CONSUMIDOR:
Nombre Completo: ${claimData.nombre}
DNI / CE: ${claimData.documento}
Teléfono: ${claimData.telefono}
Correo Electrónico: ${claimData.email}
Domicilio: ${claimData.domicilio || "—"}
Tutor (menor de edad): ${claimData.tutor || "—"}

2. IDENTIFICACIÓN DEL BIEN CONTRATADO:
Tipo de Bien: ${claimData.tipo}
Monto Reclamado: ${claimData.monto}
Descripción: ${claimData.descripcion || "—"}

3. DETALLE DE LA RECLAMACIÓN:
Tipo de Acción: ${claimData.motivo}
Detalle del Reclamo/Queja: ${claimData.detalle}
Pedido concreto del Consumidor: ${claimData.pedido}

--------------------------------------------------
El proveedor dará respuesta al reclamo en un plazo 
no mayor a quince (15) días hábiles improrrogables.
--------------------------------------------------
    `.trim();

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Reclamo_Miraflores_Boutique_Floral_${String(claimData.numero).padStart(6, "0")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const nombre = formData.get("nombre") as string;
    const documento = formData.get("documento") as string;
    const domicilio = (formData.get("domicilio") as string) || "";
    const email = formData.get("email") as string;
    const telefono = formData.get("telefono") as string;
    const tutor = (formData.get("tutor") as string) || "";

    const tipo = formData.get("tipo") as string;
    const montoVal = formData.get("monto");
    const monto = montoVal ? Number(montoVal) : null;
    const descripcion = (formData.get("descripcion") as string) || "";

    const motivoRaw = formData.get("motivo") as string;
    const motivo = motivoRaw ? (motivoRaw.startsWith("Reclamo") ? "Reclamo" : "Queja") : "Reclamo";
    const detalle = formData.get("detalle") as string;
    const pedido = formData.get("pedido") as string;

    try {
      const { data, error: insertError } = await supabase
        .from("reclamaciones")
        .insert({
          nombre,
          documento,
          domicilio,
          email,
          telefono,
          tutor,
          tipo,
          monto,
          descripcion,
          motivo,
          detalle,
          pedido,
        })
        .select("numero, fecha")
        .single();

      if (insertError) throw new Error(insertError.message);

      const newClaim = {
        numero: data.numero,
        fecha: new Date(data.fecha).toLocaleDateString("es-PE"),
        nombre,
        documento,
        domicilio,
        email,
        telefono,
        tutor,
        tipo,
        monto: monto ? `S/. ${monto.toFixed(2)}` : "—",
        descripcion,
        motivo,
        detalle,
        pedido,
      };

      setClaimData(newClaim);
      setSent(true);

      // Descarga automática en segundo plano / trigger del PDF de ambas copias
      setTimeout(() => {
        printPDF(newClaim);
      }, 200);

    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al registrar el reclamo. Por favor intente nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar config={config} />
      <Header categorias={categorias} config={config} />
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
                <p className="font-italic-serif text-rose-accent text-base">
                  — conforme a Ley N° 29571
                </p>
                <h1 className="font-display text-3xl md:text-5xl text-foreground mt-1">
                  Libro de Reclamaciones
                </h1>
              </div>
              <div className="text-right font-body text-xs text-muted-foreground">
                <p>
                  {claimData
                    ? `Hoja N° ${String(claimData.numero).padStart(6, "0")}`
                    : "Hoja N° ___"}
                </p>
                <p className="mt-1">
                  Fecha: {claimData ? claimData.fecha : new Date().toLocaleDateString("es-PE")}
                </p>
              </div>
            </div>

            <p className="mt-6 font-body font-light text-sm text-foreground/80 leading-relaxed">
              <strong className="font-medium">Razón social:</strong> Miraflores Boutique Floral
              S.A.C. · <strong className="font-medium">RUC:</strong> 20600000000 ·{" "}
              <strong className="font-medium">Domicilio:</strong> Av. Larco 345, Miraflores, Lima —
              Perú.
            </p>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 font-body text-sm text-red-700">
                {error}
              </div>
            )}

            {sent && claimData ? (
              <div className="mt-10 p-8 bg-ivory-soft text-center max-w-2xl mx-auto border border-foreground/10">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-[#f5efe6] flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-[#C4956A]" strokeWidth={1.25} />
                  </div>
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-foreground">
                  ¡Reclamo registrado y guardado!
                </h2>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  Se ha generado y guardado la{" "}
                  <strong>Hoja de Reclamación N° {String(claimData.numero).padStart(6, "0")}</strong>
                </p>

                <p className="mt-4 font-body font-light text-sm text-foreground/75 leading-relaxed">
                  El reclamo ha sido guardado de forma segura en nuestro sistema y la descarga del PDF oficial 
                  (con la <strong>Copia del Consumidor</strong> y la <strong>Copia del Establecimiento</strong>) se ha iniciado automáticamente.
                  Si no se abrió la ventana de descarga, por favor usa el botón de abajo.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handlePrintPDF}
                    className="flex items-center justify-center gap-2 h-12 px-6 bg-foreground text-primary-foreground font-body text-xs tracking-wider uppercase transition-colors hover:bg-foreground/90 cursor-pointer animate-pulse"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir / Guardar PDF (Ambas Copias)
                  </button>

                  <button
                    onClick={handleDownloadTXT}
                    className="flex items-center justify-center gap-2 h-12 px-6 border border-[#C4956A] hover:bg-[#C4956A]/10 text-[#C4956A] font-body text-xs tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Descargar como Texto (.txt)
                  </button>
                </div>

                <div className="mt-8 border-t border-foreground/10 pt-6">
                  <button
                    onClick={() => {
                      setSent(false);
                      setClaimData(null);
                    }}
                    className="text-[11px] tracking-wider-2 uppercase font-body text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Registrar otro reclamo
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-10">
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
                  <Field
                    label="Descripción del producto o servicio"
                    name="descripcion"
                    textarea
                  />
                </Fieldset>

                <Fieldset title="3. Detalle de la reclamación">
                  <Radio
                    name="motivo"
                    options={[
                      "Reclamo (disconformidad del servicio)",
                      "Queja (malestar respecto a la atención)",
                    ]}
                  />
                  <Field label="Detalle de tu reclamo o queja" name="detalle" textarea required />
                  <Field label="Pedido del consumidor" name="pedido" textarea required />
                </Fieldset>

                <div className="pt-6 border-t border-foreground/15">
                  <p className="font-body font-light text-xs text-muted-foreground leading-relaxed">
                    La formulación del reclamo no impide acudir a otras vías de solución de
                    controversias ni es requisito previo para denuncias ante INDECOPI. El proveedor
                    debe dar respuesta en un plazo no mayor a 15 días hábiles.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-6 inline-flex items-center justify-center h-12 px-10 bg-foreground text-primary-foreground text-[11px] tracking-wider-2 uppercase font-body font-light hover:bg-foreground/90 disabled:opacity-40 transition-colors gap-2 cursor-pointer"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Enviar reclamo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer config={config} />
      <WhatsappFab config={config} />
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
        <label
          key={o}
          className="flex items-center gap-2 font-body font-light text-foreground/85 text-sm cursor-pointer"
        >
          <input type="radio" name={name} value={o} className="accent-rose-accent" required />
          {o}
        </label>
      ))}
    </div>
  );
}
