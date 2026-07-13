import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, ShoppingBag, FolderTree, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard | Admin Floreria Miraflores" }],
  }),
  component: DashboardPage,
});

// --- Tipos ---

interface Stats {
  totalProductos: number;
  pedidosPendientes: number;
  totalCategorias: number;
}

interface PedidoReciente {
  id: string;
  numero: string | null;
  nombre_cliente: string | null;
  total: number | null;
  estado: string;
  created_at: string;
}

// --- Helpers ---

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pagado: "bg-blue-100 text-blue-700",
  en_preparacion: "bg-purple-100 text-purple-700",
  en_camino: "bg-indigo-100 text-indigo-700",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Recibido",
  pagado: "Pagado",
  en_preparacion: "En preparación",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Skeleton ---

function StatSkeleton() {
  return (
    <div className="bg-white border border-[#E8DDD0] p-6 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-[#F5EFE6] mb-4" />
      <div className="h-8 w-16 bg-[#F5EFE6] rounded mb-2" />
      <div className="h-3 w-28 bg-[#F5EFE6] rounded" />
    </div>
  );
}

// --- Pagina ---

function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recientes, setRecientes] = useState<PedidoReciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [productosRes, pedidosRes, categoriasRes, recientesRes] = await Promise.all([
        supabase.from("productos").select("id", { count: "exact", head: true }).eq("activo", true),
        supabase
          .from("pedidos")
          .select("id", { count: "exact", head: true })
          .eq("estado", "pendiente"),
        supabase.from("categorias").select("id", { count: "exact", head: true }).eq("activo", true),
        supabase
          .from("pedidos")
          .select("id, numero, nombre_cliente, total, estado, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setStats({
        totalProductos: productosRes.count ?? 0,
        pedidosPendientes: pedidosRes.count ?? 0,
        totalCategorias: categoriasRes.count ?? 0,
      });
      setRecientes((recientesRes.data ?? []) as PedidoReciente[]);
      setLoading(false);
    }

    load();
  }, []);

  const statCards = stats
    ? [
        {
          label: "Productos activos",
          value: stats.totalProductos,
          icon: Package,
          color: "bg-[#F5EFE6] text-[#C4956A]",
          link: "/admin/productos",
        },
        {
          label: "Pedidos recibidos (por atender)",
          value: stats.pedidosPendientes,
          icon: ShoppingBag,
          color:
            stats.pedidosPendientes > 0
              ? "bg-amber-50 text-amber-600"
              : "bg-[#F5EFE6] text-[#8A7A6E]",
          link: "/admin/pedidos",
        },
        {
          label: "Categorias activas",
          value: stats.totalCategorias,
          icon: FolderTree,
          color: "bg-[#F5EFE6] text-[#8A7A6E]",
          link: "/admin/categorias",
        },
      ]
    : [];

  return (
    <div className="p-4 sm:p-8 md:p-10">
      {/* Encabezado */}
      <div className="mb-10">
        <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-1">Panel</p>
        <h1 className="font-display text-3xl md:text-4xl text-[#2C2420]">Dashboard</h1>
      </div>

      {/* Cards de metricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
        {loading
          ? [1, 2, 3].map((n) => <StatSkeleton key={n} />)
          : statCards.map(({ label, value, icon: Icon, color, link }) => (
              <Link
                key={label}
                to={link}
                className="bg-white border border-[#E8DDD0] p-6 hover:border-[#C4956A] transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <ArrowRight
                    className="h-4 w-4 text-[#E8DDD0] group-hover:text-[#C4956A] transition-colors"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="font-display text-4xl text-[#2C2420] mb-1">{value}</p>
                <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]">
                  {label}
                </p>
              </Link>
            ))}
      </div>

      {/* Pedidos recientes */}
      <div className="bg-white border border-[#E8DDD0]">
        <div className="px-6 py-5 border-b border-[#E8DDD0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#C4956A]" strokeWidth={1.5} />
            <h2 className="font-display text-xl text-[#2C2420]">Pedidos recientes</h2>
          </div>
          <Link
            to="/admin/pedidos"
            className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] hover:text-[#C4956A] transition-colors flex items-center gap-1"
          >
            Ver todos <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-[#E8DDD0]">
            {[1, 2, 3].map((n) => (
              <div key={n} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-24 h-4 bg-[#F5EFE6] rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 bg-[#F5EFE6] rounded" />
                  <div className="h-3 w-24 bg-[#F5EFE6] rounded" />
                </div>
                <div className="w-16 h-4 bg-[#F5EFE6] rounded" />
                <div className="w-20 h-6 bg-[#F5EFE6] rounded-full" />
              </div>
            ))}
          </div>
        ) : recientes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Clock className="h-8 w-8 text-[#E8DDD0] mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-body text-sm text-[#8A7A6E]">Aun no hay pedidos.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8DDD0]">
            {recientes.map((p) => (
              <div key={p.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center justify-between sm:justify-start gap-4 sm:w-28 sm:flex-shrink-0">
                  <p className="font-body text-sm text-[#2C2420] font-medium">
                    {p.numero ?? `#${p.id.slice(0, 8)}`}
                  </p>
                  <span
                    className={`inline-flex sm:hidden px-2 py-0.5 text-[9px] tracking-widest uppercase font-body font-medium rounded-full ${ESTADO_BADGE[p.estado] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {ESTADO_LABEL[p.estado] ?? p.estado}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-[#2C2420] truncate">
                    {p.nombre_cliente ?? "-"}
                  </p>
                  <p className="font-body text-xs text-[#8A7A6E] mt-0.5 sm:mt-0">{formatFecha(p.created_at)}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:flex-shrink-0">
                  <p className="font-body text-sm text-[#2C2420] font-medium">
                    {p.total != null ? `S/ ${Number(p.total).toFixed(2)}` : "-"}
                  </p>
                  <span
                    className={`hidden sm:inline-flex px-2.5 py-1 text-[10px] tracking-widest uppercase font-body font-medium rounded-full ${ESTADO_BADGE[p.estado] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {ESTADO_LABEL[p.estado] ?? p.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
