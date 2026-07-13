import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, X, Loader2, ImageOff, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { PedidoRow, EstadoPedido, PedidoProducto } from "@/types/database";

export const Route = createFileRoute("/admin/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos | Admin Floreria Miraflores" }] }),
  component: PedidosPage,
});

// --- Constantes ---

// Flujo del pedido: Recibido -> En preparacion -> En camino -> Entregado
const ESTADOS: { value: EstadoPedido | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Recibido" },
  { value: "pagado", label: "Pagado" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "en_camino", label: "En camino" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

const ESTADO_BADGE: Record<EstadoPedido, string> = {
  pendiente: "bg-amber-100 text-amber-700 border-amber-200",
  pagado: "bg-green-100 text-green-700 border-green-200",
  en_preparacion: "bg-purple-100 text-purple-700 border-purple-200",
  en_camino: "bg-blue-100 text-blue-700 border-blue-200",
  entregado: "bg-gray-100 text-gray-600 border-gray-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
};

const ESTADO_LABEL: Record<EstadoPedido, string> = {
  pendiente: "Recibido",
  pagado: "Pagado",
  en_preparacion: "En preparación",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const HORA_LABEL: Record<string, string> = {
  manana: "Manana 9-12",
  tarde: "Tarde 12-17",
  noche: "Noche 17-21",
  "Manana 9-12": "Manana 9-12",
  "Tarde 12-17": "Tarde 12-17",
  "Noche 17-21": "Noche 17-21",
};

// --- Helpers ---

function formatFecha(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

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

// --- Skeleton ---

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((n) => (
        <tr key={n} className="border-b border-[#E8DDD0] animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 w-24 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-36 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-20 bg-[#F5EFE6] rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-20 bg-[#F5EFE6] rounded-full" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-12 bg-[#F5EFE6] rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}

// --- Badge de estado ---

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  return (
    <span
      className={`inline-flex px-2.5 py-1 text-[10px] tracking-widest uppercase font-body font-medium border ${ESTADO_BADGE[estado]}`}
    >
      {ESTADO_LABEL[estado]}
    </span>
  );
}

// --- Modal de detalle ---

interface DetalleModalProps {
  pedido: PedidoRow;
  onClose: () => void;
  onUpdate: (id: string, estado: EstadoPedido) => Promise<void>;
}

function DetalleModal({ pedido, onClose, onUpdate }: DetalleModalProps) {
  const [estado, setEstado] = useState<EstadoPedido>(pedido.estado);
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);

  function handleEstadoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setEstado(e.target.value as EstadoPedido);
    setChanged(e.target.value !== pedido.estado);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(pedido.id, estado);
      setChanged(false);
    } finally {
      setSaving(false);
    }
  }

  const productos = (pedido.productos ?? []) as PedidoProducto[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD0] flex-shrink-0">
          <div>
            <p className="font-display text-lg text-[#2C2420]">
              Pedido {pedido.numero ?? `#${pedido.id.slice(0, 8)}`}
            </p>
            <p className="font-body text-xs text-[#8A7A6E] mt-0.5">
              Recibido el {formatFechaHora(pedido.created_at)}
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
          {/* Datos del cliente */}
          <section>
            <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-3">
              Cliente
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <p className="font-body text-xs text-[#8A7A6E]">Nombre</p>
                <p className="font-body text-sm text-[#2C2420]">{pedido.nombre_cliente ?? "-"}</p>
              </div>
              <div>
                <p className="font-body text-xs text-[#8A7A6E]">Telefono</p>
                <p className="font-body text-sm text-[#2C2420]">{pedido.telefono ?? "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="font-body text-xs text-[#8A7A6E]">Email</p>
                <p className="font-body text-sm text-[#2C2420]">{pedido.email ?? "-"}</p>
              </div>
            </div>
          </section>

          {/* Datos de entrega */}
          <section>
            <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-3">
              Entrega
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <p className="font-body text-xs text-[#8A7A6E]">Fecha</p>
                <p className="font-body text-sm text-[#2C2420]">
                  {formatFecha(pedido.fecha_entrega)}
                </p>
              </div>
              <div>
                <p className="font-body text-xs text-[#8A7A6E]">Hora</p>
                <p className="font-body text-sm text-[#2C2420]">
                  {pedido.hora_entrega
                    ? (HORA_LABEL[pedido.hora_entrega] ?? pedido.hora_entrega)
                    : "-"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="font-body text-xs text-[#8A7A6E]">Direccion</p>
                <p className="font-body text-sm text-[#2C2420]">{pedido.direccion ?? "-"}</p>
              </div>
              {pedido.referencia && (
                <div className="col-span-2">
                  <p className="font-body text-xs text-[#8A7A6E]">Referencia</p>
                  <p className="font-body text-sm text-[#2C2420]">{pedido.referencia}</p>
                </div>
              )}
              {pedido.notas && (
                <div className="col-span-2">
                  <p className="font-body text-xs text-[#8A7A6E]">Notas</p>
                  <p className="font-body text-sm text-[#2C2420]">{pedido.notas}</p>
                </div>
              )}
            </div>
          </section>

          {/* Productos */}
          <section>
            <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-3">
              Productos
            </p>
            <div className="border border-[#E8DDD0] divide-y divide-[#E8DDD0]">
              {productos.length === 0 ? (
                <p className="font-body text-sm text-[#8A7A6E] px-4 py-3">
                  Sin productos registrados
                </p>
              ) : (
                productos.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3">
                    {p.imagen ? (
                      <img
                        src={p.imagen}
                        alt={p.nombre}
                        className="h-12 w-12 object-cover flex-shrink-0 bg-[#F5EFE6]"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-[#F5EFE6] flex items-center justify-center flex-shrink-0">
                        <ImageOff className="h-5 w-5 text-[#C4956A]" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-[#2C2420] truncate">{p.nombre}</p>
                      <p className="font-body text-xs text-[#8A7A6E]">
                        Cantidad: x{p.cantidad} &bull; S/ {Number(p.precio).toFixed(2)} c/u
                      </p>
                    </div>
                    <p className="font-body text-sm text-[#2C2420] flex-shrink-0 font-medium">
                      S/ {(p.precio * p.cantidad).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Totales */}
          <section>
            <div className="border border-[#E8DDD0] divide-y divide-[#E8DDD0]">
              <div className="flex justify-between px-4 py-2.5">
                <p className="font-body text-sm text-[#8A7A6E]">Subtotal</p>
                <p className="font-body text-sm text-[#2C2420]">
                  S/ {pedido.subtotal != null ? Number(pedido.subtotal).toFixed(2) : "-"}
                </p>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <p className="font-body text-sm text-[#8A7A6E]">Delivery</p>
                <p className="font-body text-sm text-[#2C2420]">
                  S/ {pedido.delivery != null ? Number(pedido.delivery).toFixed(2) : "-"}
                </p>
              </div>
              <div className="flex justify-between px-4 py-2.5 bg-[#FDFAF6]">
                <p className="font-body text-sm font-medium text-[#2C2420]">Total pagado</p>
                <p className="font-body text-sm font-semibold text-[#2C2420]">
                  S/ {pedido.total != null ? Number(pedido.total).toFixed(2) : "-"}
                </p>
              </div>
            </div>
          </section>

          {/* Cambiar estado */}
          <section className="bg-[#FDFAF6] border border-[#E8DDD0] p-4">
            <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-3">
              Cambiar estado del pedido
            </p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <select
                  value={estado}
                  onChange={handleEstadoChange}
                  className="w-full h-11 pl-3 pr-8 bg-white border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors appearance-none"
                >
                  {ESTADOS.filter((e) => e.value !== "todos").map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7A6E] pointer-events-none"
                  strokeWidth={1.5}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={!changed || saving}
                className="h-11 px-6 bg-[#2C2420] hover:bg-[#2C2420]/80 disabled:opacity-40 text-white font-body text-[11px] tracking-widest uppercase transition-colors flex items-center gap-2 flex-shrink-0 font-medium"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar cambio
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8DDD0] flex-shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="h-10 px-6 border border-[#E8DDD0] font-body text-[11px] tracking-widest uppercase text-[#8A7A6E] hover:text-[#2C2420] hover:border-[#C4956A] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Pagina principal ---

function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<EstadoPedido | "todos">("todos");
  const [detalle, setDetalle] = useState<PedidoRow | null>(null);

  const cargarPedidos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw new Error(err.message);
      setPedidos(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  async function handleUpdate(id: string, estado: EstadoPedido) {
    const { error: err } = await supabase.from("pedidos").update({ estado }).eq("id", id);
    if (err) throw new Error(err.message);
    // Actualizar local
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
    setDetalle((prev) => (prev?.id === id ? { ...prev, estado } : prev));
  }

  const filtrados = filtro === "todos" ? pedidos : pedidos.filter((p) => p.estado === filtro);

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Titulo */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-[#2C2420]">Pedidos</h1>
          <p className="font-body text-sm text-[#8A7A6E] mt-1">
            {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} en total
          </p>
        </div>

        {/* Filtros por estado */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ESTADOS.map((e) => {
            const count =
              e.value === "todos"
                ? pedidos.length
                : pedidos.filter((p) => p.estado === e.value).length;
            return (
              <button
                key={e.value}
                onClick={() => setFiltro(e.value)}
                className={`h-9 px-4 font-body text-[11px] tracking-widest uppercase border transition-colors ${
                  filtro === e.value
                    ? "bg-[#2C2420] text-white border-[#2C2420]"
                    : "bg-white text-[#8A7A6E] border-[#E8DDD0] hover:border-[#C4956A] hover:text-[#2C2420]"
                }`}
              >
                {e.label}
                <span
                  className={`ml-2 text-[10px] ${filtro === e.value ? "text-white/70" : "text-[#C4956A]"}`}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 font-body text-sm text-red-700">
            Error al cargar pedidos: {error}
            <button onClick={cargarPedidos} className="ml-3 underline">
              Reintentar
            </button>
          </div>
        )}

        {/* Tabla (Escritorio) */}
        <div className="hidden md:block bg-white border border-[#E8DDD0] overflow-x-auto">
          <table className="w-full border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-[#E8DDD0] bg-[#F5EFE6]">
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  N. Pedido
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Telefono
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Entrega
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Total
                </th>
                <th className="px-4 py-3 text-left font-body text-[10px] tracking-widest uppercase text-[#8A7A6E]">
                  Estado
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
                    {filtro === "todos"
                      ? "Aun no hay pedidos."
                      : `No hay pedidos con estado "${ESTADO_LABEL[filtro as EstadoPedido]}".`}
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#E8DDD0] hover:bg-[#FDFAF6] transition-colors"
                  >
                    <td className="px-4 py-3 font-body text-sm text-[#2C2420] font-medium">
                      {p.numero ?? `#${p.id.slice(0, 8)}`}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#2C2420]">
                      {p.nombre_cliente ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#8A7A6E]">
                      {p.telefono ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#8A7A6E]">
                      {formatFecha(p.fecha_entrega)}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#2C2420] font-medium">
                      {p.total != null ? `S/ ${Number(p.total).toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={p.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetalle(p)}
                        className="text-[#8A7A6E] hover:text-[#C4956A] transition-colors"
                        title="Ver detalle"
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

        {/* Vista Móvil (Tarjetas) */}
        <div className="md:hidden space-y-4">
          {loading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-[#E8DDD0] p-4 rounded-lg animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-[#F5EFE6] rounded w-24" />
                  <div className="h-5 bg-[#F5EFE6] rounded-full w-16" />
                </div>
                <div className="h-4 bg-[#F5EFE6] rounded w-1/2" />
                <div className="h-4 bg-[#F5EFE6] rounded w-1/3" />
              </div>
            ))
          ) : filtrados.length === 0 ? (
            <div className="bg-white border border-[#E8DDD0] p-8 text-center font-body text-sm text-[#8A7A6E] rounded-lg">
              {filtro === "todos"
                ? "Aun no hay pedidos."
                : `No hay pedidos con estado "${ESTADO_LABEL[filtro as EstadoPedido]}".`}
            </div>
          ) : (
            filtrados.map((p) => (
              <div key={p.id} className="bg-white border border-[#E8DDD0] p-4 rounded-lg flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-[#2C2420] font-semibold">
                    {p.numero ?? `#${p.id.slice(0, 8)}`}
                  </span>
                  <EstadoBadge estado={p.estado} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-body border-t border-[#F5EFE6] pt-3">
                  <div>
                    <span className="text-[#8A7A6E] block mb-0.5">Cliente:</span>
                    <span className="text-[#2C2420] font-medium block truncate">{p.nombre_cliente ?? "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#8A7A6E] block mb-0.5">Teléfono:</span>
                    <span className="text-[#2C2420] block">{p.telefono ?? "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#8A7A6E] block mb-0.5">Entrega:</span>
                    <span className="text-[#2C2420] block">{formatFecha(p.fecha_entrega)}</span>
                  </div>
                  <div>
                    <span className="text-[#8A7A6E] block mb-0.5">Total:</span>
                    <span className="text-[#2C2420] font-semibold block">
                      {p.total != null ? `S/ ${Number(p.total).toFixed(2)}` : "-"}
                    </span>
                  </div>
                </div>
                <div className="border-t border-[#F5EFE6] pt-2.5 flex justify-end">
                  <button
                    onClick={() => setDetalle(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E8DDD0] hover:border-[#C4956A] font-body text-xs text-[#8A7A6E] hover:text-[#C4956A] transition-colors rounded w-full justify-center"
                  >
                    <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Ver detalle
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de detalle */}
      {detalle && (
        <DetalleModal pedido={detalle} onClose={() => setDetalle(null)} onUpdate={handleUpdate} />
      )}
    </div>
  );
}
