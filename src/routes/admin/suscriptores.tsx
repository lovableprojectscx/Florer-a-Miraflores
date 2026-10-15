import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Search, Download, UserX, Loader2, CheckCircle2 } from "lucide-react";
import { getAdminSuscriptores, darDeBajaSuscriptor } from "@/lib/queries";
import type { SuscriptorRow } from "@/types/database";

export const Route = createFileRoute("/admin/suscriptores")({
  head: () => ({ meta: [{ title: "Suscriptores | Admin Florería Miraflores" }] }),
  component: SuscriptoresAdminPage,
});

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SuscriptoresAdminPage() {
  const [suscriptores, setSuscriptores] = useState<SuscriptorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [bajaIdEnProceso, setBajaIdEnProceso] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminSuscriptores();
      setSuscriptores(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al cargar suscriptores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleDarDeBaja = async (s: SuscriptorRow) => {
    const confirmar = window.confirm(
      `¿Confirmas dar de baja a "${s.nombre}" (${s.telefono})? Dejará de recibir mensajes y se registrará la fecha de baja.`,
    );
    if (!confirmar) return;

    try {
      setBajaIdEnProceso(s.id);
      await darDeBajaSuscriptor(s.id);
      await cargarDatos();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al dar de baja");
    } finally {
      setBajaIdEnProceso(null);
    }
  };

  const exportarCSV = () => {
    const activos = suscriptores.filter((s) => s.activo);
    if (activos.length === 0) {
      alert("No hay suscriptores activos para exportar.");
      return;
    }

    const headers = ["Nombre", "Teléfono", "Fecha"];
    const rows = activos.map((s) => [
      `"${s.nombre.replace(/"/g, '""')}"`,
      `"${s.telefono}"`,
      `"${new Date(s.created_at).toLocaleDateString("es-PE")}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const hoy = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `suscriptores_activos_${hoy}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filtrados = suscriptores.filter((s) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return s.nombre.toLowerCase().includes(q) || s.telefono.includes(q);
  });

  const totalActivos = suscriptores.filter((s) => s.activo).length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DDD0] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-[#2C2420]" strokeWidth={1.5} />
            <h1 className="font-display text-2xl md:text-3xl text-[#2C2420]">Suscriptores Club</h1>
          </div>
          <p className="mt-1 text-xs md:text-sm font-body text-[#8A7A6E]">
            Gestión de usuarios registrados en el Club Florería Miraflores para WhatsApp.
          </p>
        </div>

        <button
          onClick={exportarCSV}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2C2420] text-white hover:bg-[#1A1513] text-xs font-body uppercase tracking-wider rounded-md transition-colors shadow-xs cursor-pointer"
        >
          <Download className="h-4 w-4" />
          Exportar CSV ({totalActivos} activos)
        </button>
      </div>

      {/* Métricas rápidas & Buscador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-white border border-[#E8DDD0] rounded-md text-xs font-body text-[#2C2420]">
            Total: <strong>{suscriptores.length}</strong>
          </span>
          <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-body">
            Activos: <strong>{totalActivos}</strong>
          </span>
          <span className="px-3 py-1 bg-neutral-100 border border-neutral-300 text-neutral-700 rounded-md text-xs font-body">
            Bajas: <strong>{suscriptores.length - totalActivos}</strong>
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7A6E]" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-white border border-[#E8DDD0] rounded-md font-body text-xs text-[#2C2420] placeholder:text-[#8A7A6E]/60 focus:outline-none focus:border-[#2C2420]"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-body">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-[#E8DDD0] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm font-body">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E8DDD0] text-[11px] font-medium text-[#8A7A6E] uppercase tracking-wider">
                <th className="px-4 py-3.5">Nombre</th>
                <th className="px-4 py-3.5">Teléfono WhatsApp</th>
                <th className="px-4 py-3.5">Fecha Registro</th>
                <th className="px-4 py-3.5">Origen</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DDD0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#8A7A6E]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#2C2420]" />
                    Cargando suscriptores...
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#8A7A6E]">
                    {busqueda
                      ? "No se encontraron suscriptores con esa búsqueda."
                      : "Aún no hay suscriptores registrados."}
                  </td>
                </tr>
              ) : (
                filtrados.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#2C2420]">{s.nombre}</td>
                    <td className="px-4 py-3 text-[#2C2420] font-mono">{s.telefono}</td>
                    <td className="px-4 py-3 text-[#8A7A6E]">{formatFecha(s.created_at)}</td>
                    <td className="px-4 py-3 text-[#8A7A6E]">
                      <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E8DDD0] text-[10px]">
                        {s.origen}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.activo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex flex-col text-[11px] font-medium text-neutral-500">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-300 w-fit">
                            <UserX className="h-3 w-3" />
                            De baja
                          </span>
                          {s.baja_at && (
                            <span className="text-[10px] text-neutral-400 mt-0.5">
                              {formatFecha(s.baja_at)}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.activo ? (
                        <button
                          onClick={() => handleDarDeBaja(s)}
                          disabled={bajaIdEnProceso === s.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-red-300 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {bajaIdEnProceso === s.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserX className="h-3.5 w-3.5" />
                          )}
                          Dar de baja
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">Baja procesada</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
