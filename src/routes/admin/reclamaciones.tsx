import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import logoImg from "@/assets/logo-miraflores.webp";
import { Eye, X, Loader2, Search, Printer } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/reclamaciones")({
  head: () => ({ meta: [{ title: "Reclamaciones | Admin Floreria Miraflores" }] }),
  component: ReclamacionesPage,
});

// --- Tipos ---

interface Reclamacion {
  id: string;
  numero: number;
  fecha: string;
  nombre: string;
  documento: string;
  domicilio: string;
  email: string;
  telefono: string;
  tutor: string;
  tipo: string;
  monto: number | null;
  descripcion: string;
  motivo: string;
  detalle: string;
  pedido: string;
}

// --- Helpers ---

function formatFechaHora(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((n) => (
        <tr key={n} className="border-b border-[#E8DDD0] animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 w-16 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-24 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-36 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-20 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-8 bg-[#F5EFE6] rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}

// --- Modal de Detalle ---

interface DetalleModalProps {
  claim: Reclamacion;
  onClose: () => void;
}

function DetalleModal({ claim, onClose }: DetalleModalProps) {
  const printPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor habilite las ventanas emergentes (popups) en su navegador para imprimir o guardar.");
      return;
    }

    const fechaFormat = new Date(claim.fecha).toLocaleDateString("es-PE");
    const montoFormat = claim.monto ? `S/. ${claim.monto.toFixed(2)}` : "—";

    const renderSheet = (copyLabel: string) => `
      <div class="container" style="position: relative;">
        <div style="position: absolute; right: 0; top: -10px; font-size: 10px; font-weight: bold; color: #C4956A; border: 1px solid #C4956A; padding: 4px 10px; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif;">
          ${copyLabel}
        </div>
        
        <table class="header-table">
          <tr>
            <td>
              <img src="${logoImg}" alt="Florería Miraflores" style="height: 42px; width: auto; display: block; margin-bottom: 4px;" />
            </td>
            <td>
              <div class="doc-title">LIBRO DE RECLAMACIONES</div>
              <div class="doc-info">
                <strong>Hoja N° ${String(claim.numero).padStart(6, "0")}</strong><br>
                Fecha: ${fechaFormat}
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
            <div class="info-value">${claim.nombre}</div>
          </div>
          <div class="info-item">
            <div class="info-label">DNI / CE</div>
            <div class="info-value">${claim.documento}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Teléfono</div>
            <div class="info-value">${claim.telefono}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Correo electrónico</div>
            <div class="info-value">${claim.email}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Domicilio</div>
            <div class="info-value">${claim.domicilio || "—"}</div>
          </div>
          ${claim.tutor ? `
          <div class="info-item full-width">
            <div class="info-label">Padre / Madre o Tutor (si es menor de edad)</div>
            <div class="info-value">${claim.tutor}</div>
          </div>
          ` : ""}
        </div>
        
        <div class="section-title">2. Identificación del bien contratado</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Tipo de bien</div>
            <div class="info-value">${claim.tipo}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Monto reclamado</div>
            <div class="info-value">${montoFormat}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Descripción del producto o servicio</div>
            <div class="description-block">${claim.descripcion || "—"}</div>
          </div>
        </div>
        
        <div class="section-title">3. Detalle de la reclamación</div>
        <div class="info-grid">
          <div class="info-item full-width">
            <div class="info-label">Tipo de acción</div>
            <div class="info-value">${claim.motivo}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Detalle del reclamo o queja</div>
            <div class="description-block">${claim.detalle}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Pedido concreto del consumidor</div>
            <div class="description-block">${claim.pedido}</div>
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
        <title>Hoja de Reclamacion N° ${String(claim.numero).padStart(6, "0")}</title>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD0] flex-shrink-0">
          <div>
            <p className="font-display text-lg text-[#2C2420]">
              Hoja de Reclamación N° {String(claim.numero).padStart(6, "0")}
            </p>
            <p className="font-body text-xs text-[#8A7A6E] mt-0.5">
              Registrado el {formatFechaHora(claim.fecha)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A7A6E] hover:text-[#2C2420] transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Identificación del consumidor */}
          <section>
            <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-3 border-b border-[#E8DDD0] pb-1">
              1. Identificación del consumidor
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              <div className="col-span-2">
                <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">Nombre completo</p>
                <p className="font-body text-sm text-[#2C2420] font-medium">{claim.nombre}</p>
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">DNI / CE</p>
                <p className="font-body text-sm text-[#2C2420]">{claim.documento}</p>
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">Teléfono</p>
                <p className="font-body text-sm text-[#2C2420]">{claim.telefono}</p>
              </div>
              <div className="col-span-2">
                <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">Correo electrónico</p>
                <p className="font-body text-sm text-[#2C2420]">{claim.email}</p>
              </div>
              <div className="col-span-2">
                <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">Domicilio</p>
                <p className="font-body text-sm text-[#2C2420]">{claim.domicilio || "—"}</p>
              </div>
              {claim.tutor && (
                <div className="col-span-2">
                  <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">Tutor / Apoderado</p>
                  <p className="font-body text-sm text-[#2C2420]">{claim.tutor}</p>
                </div>
              )}
            </div>
          </section>

          {/* Identificación del bien */}
          <section>
            <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-3 border-b border-[#E8DDD0] pb-1">
              2. Identificación del bien contratado
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              <div>
                <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">Tipo de bien</p>
                <p className="font-body text-sm text-[#2C2420]">{claim.tipo}</p>
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">Monto reclamado</p>
                <p className="font-body text-sm text-[#2C2420] font-medium">
                  {claim.monto ? `S/. ${claim.monto.toFixed(2)}` : "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">Descripción del bien</p>
                <p className="font-body text-sm text-[#2C2420] bg-[#FDFAF6] border border-[#E8DDD0] p-3 whitespace-pre-wrap mt-1">
                  {claim.descripcion || "—"}
                </p>
              </div>
            </div>
          </section>

          {/* Detalle de la reclamación */}
          <section>
            <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-3 border-b border-[#E8DDD0] pb-1">
              3. Detalle de la reclamación y pedido
            </p>
            <div className="space-y-3">
              <div>
                <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">Acción ejecutada</p>
                <p className="font-body text-sm text-[#2C2420] font-medium">{claim.motivo}</p>
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">Detalle del Reclamo o Queja</p>
                <p className="font-body text-sm text-[#2C2420] bg-[#FDFAF6] border border-[#E8DDD0] p-3 whitespace-pre-wrap mt-1">
                  {claim.detalle}
                </p>
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-wider text-[#8A7A6E]">Pedido concreto del Consumidor</p>
                <p className="font-body text-sm text-[#2C2420] bg-[#FDFAF6] border border-[#E8DDD0] p-3 whitespace-pre-wrap mt-1">
                  {claim.pedido}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8DDD0] flex-shrink-0 flex justify-between items-center bg-[#FDFAF6]">
          <button
            onClick={printPDF}
            className="h-10 px-5 bg-[#C4956A] text-white hover:bg-[#C4956A]/90 font-body text-[11px] tracking-widest uppercase flex items-center gap-2 font-medium transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir / PDF (Ambas Copias)
          </button>
          <button
            onClick={onClose}
            className="h-10 px-6 border border-[#E8DDD0] font-body text-[11px] tracking-widest uppercase text-[#8A7A6E] hover:text-[#2C2420] hover:border-[#C4956A] transition-colors bg-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Página Principal ---

function ReclamacionesPage() {
  const [claims, setClaims] = useState<Reclamacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detalle, setDetalle] = useState<Reclamacion | null>(null);

  const cargarClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("reclamaciones")
        .select("*")
        .order("fecha", { ascending: false });
      if (err) throw new Error(err.message);
      setClaims(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar reclamaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarClaims();
  }, [cargarClaims]);

  const filtrados = claims.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.documento.includes(term) ||
      String(c.numero).includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Titulo */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-[#2C2420]">Libro de Reclamaciones</h1>
            <p className="font-body text-sm text-[#8A7A6E] mt-1">
              Gestiona y visualiza las quejas o reclamos presentados por tus clientes ({claims.length} en total)
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o N° de hoja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 border border-[#E8DDD0] bg-white font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors"
            />
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7A6E] pointer-events-none"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 font-body text-sm text-red-700">
            Error al cargar: {error}
            <button onClick={cargarClaims} className="ml-3 underline">
              Reintentar
            </button>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white border border-[#E8DDD0] overflow-x-auto shadow-sm">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[#E8DDD0] bg-[#F5EFE6]">
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  N. Hoja
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Documento
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Motivo / Acción
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Ver
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center font-body text-sm text-[#8A7A6E]"
                  >
                    {search ? "No se encontraron reclamos con esos filtros." : "Aún no hay reclamaciones registradas."}
                  </td>
                </tr>
              ) : (
                filtrados.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#E8DDD0] hover:bg-[#FDFAF6] transition-colors"
                  >
                    <td className="px-4 py-3 font-body text-sm text-[#2C2420] font-medium">
                      {String(c.numero).padStart(6, "0")}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#8A7A6E]">
                      {new Date(c.fecha).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#2C2420] font-medium">
                      {c.nombre}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#8A7A6E]">
                      {c.documento}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#8A7A6E]">
                      {c.tipo}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-[10px] font-body tracking-wider uppercase border ${
                          c.motivo === "Reclamo"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {c.motivo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetalle(c)}
                        className="text-[#8A7A6E] hover:text-[#C4956A] transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle */}
      {detalle && (
        <DetalleModal claim={detalle} onClose={() => setDetalle(null)} />
      )}
    </div>
  );
}
