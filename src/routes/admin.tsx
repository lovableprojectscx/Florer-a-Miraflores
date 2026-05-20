import { useState, useEffect } from "react";
import { createFileRoute, Outlet, Link, redirect, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Image,
  Megaphone,
  LayoutGrid,
  Heart,
  HelpCircle,
  MapPin,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// Auth guard — corre ANTES que los loaders de rutas hijas
export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/admin-login" });
  },
  component: AdminLayout,
});

// Sidebar items

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/popup", label: "Popup", icon: Megaphone },
  { to: "/admin/colecciones-home", label: "Colecciones Home", icon: LayoutGrid },
  { to: "/admin/ocasiones", label: "Ocasiones Home", icon: Heart },
  { to: "/admin/distritos", label: "Distritos", icon: MapPin },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/reclamaciones", label: "Reclamaciones", icon: HelpCircle },
  { to: "/admin/config", label: "Configuracion", icon: Settings },
] as const;

// Layout

function AdminLayout() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      setEmail(session?.user?.email ?? "");
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin-login" });
  };

  return (
    <div className="min-h-screen flex bg-[#FDFAF6]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#2C2420] flex flex-col min-h-screen">
        {/* Logo */}
        <div className="px-6 py-7 border-b border-white/10">
          <span className="font-display italic font-bold text-2xl text-white">Miraflores</span>
          <p className="mt-1 text-[9px] tracking-widest uppercase font-body font-light text-white/50">
            panel admin
          </p>
        </div>

        {/* Navegacion */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-0.5 px-3">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeProps={{ className: "bg-white/15 text-white" }}
                  inactiveProps={{ className: "text-white/60 hover:bg-white/10 hover:text-white" }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-light transition-colors w-full"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="h-3 w-3 opacity-40" strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer sidebar */}
        <div className="px-3 py-4 border-t border-white/10">
          {email && (
            <div className="px-3 mb-3">
              <p className="text-[10px] tracking-widest uppercase font-body font-light text-white/40 mb-0.5">
                Sesion activa
              </p>
              <p className="font-body text-xs text-white/70 truncate">{email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white text-sm font-body font-light transition-colors"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
