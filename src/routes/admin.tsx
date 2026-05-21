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
  Tag,
  MapPin,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
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
  { to: "/admin/tags", label: "Tags", icon: Tag },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/reclamaciones", label: "Reclamaciones", icon: HelpCircle },
  { to: "/admin/config", label: "Configuracion", icon: Settings },
] as const;

// Layout

function AdminLayout() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FDFAF6]">
      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-[#2C2420] text-white flex items-center justify-between px-4 border-b border-white/10 z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <span className="font-display italic font-bold text-xl text-white">Miraflores</span>
          <span className="text-[8px] tracking-widest uppercase font-body font-light text-white/50 bg-white/15 px-1.5 py-0.5 rounded ml-1">
            admin
          </span>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#2C2420] flex flex-col z-50 transform transition-transform duration-300 md:relative md:translate-x-0 md:z-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } flex-shrink-0 min-h-screen`}
      >
        {/* Logo */}
        <div className="px-6 py-7 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="font-display italic font-bold text-2xl text-white">Miraflores</span>
            <p className="mt-1 text-[9px] tracking-widest uppercase font-body font-light text-white/50">
              panel admin
            </p>
          </div>
          {/* Close button only on mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
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
                  onClick={() => setIsMobileMenuOpen(false)}
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
      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
