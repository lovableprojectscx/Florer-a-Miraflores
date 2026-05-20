import { useState } from "react";
import { createFileRoute, Link, notFound, Outlet, useMatches } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { ProductGrid } from "@/components/ProductGrid";
import { supabase } from "@/lib/supabase";
import { getCategoriaPorSlug, getCategorias, getConfig } from "@/lib/queries";
import type { CategoriaRow } from "@/types/database";

export const Route = createFileRoute("/categoria/$slug")({
  loader: async ({ params }) => {
    const [cat, categorias, config] = await Promise.all([
      getCategoriaPorSlug(params.slug),
      getCategorias(),
      getConfig().catch(() => null),
    ]);
    if (!cat) throw notFound();

    // Traemos todos los productos pertenecientes al padre o a cualquiera de sus hijas
    const ids = [cat.id, ...cat.hijas.map((h) => h.id)];
    const { data: productos, error } = await supabase
      .from("productos")
      .select("*")
      .in("categoria_id", ids)
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) throw new Error(`[Supabase] ${error.message}`);

    return { cat, categorias, config, productos: productos ?? [] };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.cat.nombre} | Florería Miraflores` },
          {
            name: "description",
            content: `Explora ${loaderData.cat.nombre} en Florería Miraflores. Delivery en Lima.`,
          },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="font-display text-4xl mb-4 text-[#2C2420]">Categoría no encontrada</h1>
      <Link to="/" className="text-[#C4956A] underline">
        Volver al inicio
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="font-display text-3xl mb-2 text-[#2C2420]">Algo salió mal</h1>
      <p className="text-[#8A7A6E]">{error.message}</p>
    </div>
  ),
  component: CategoriaPage,
});

function CategoriaPage() {
  const { cat, categorias, config, productos } = Route.useLoaderData();
  const matches = useMatches();
  const hasChild = matches.some((m) => m.routeId === "/categoria/$slug/$sub");
  if (hasChild) return <Outlet />;

  // Estado para el filtro activo (null = Todos)
  const [activeSubId, setActiveSubId] = useState<string | null>(null);

  const hermanas = categorias.filter((c: CategoriaRow) => !c.parent_id && c.slug !== cat.slug);

  // Filtrado reactivo e instantáneo
  const productosFiltrados = activeSubId
    ? productos.filter((p) => p.categoria_id === activeSubId)
    : productos;

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      {config && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />

      <main className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 py-10 md:py-16">
        {/* Breadcrumb */}
        <nav className="text-[11px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-[#2C2420] transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <span className="text-[#2C2420]">{cat.nombre}</span>
        </nav>

        {/* Encabezado Editorial */}
        <header className="max-w-2xl mb-10 md:mb-14">
          <p className="font-italic-serif text-rose-accent text-base md:text-lg mb-2">
            — colección
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-[#2C2420] leading-tight">
            {cat.nombre}
          </h1>
        </header>

        {/* Filtros premium por subcategorías */}
        {cat.hijas.length > 0 && productos.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2.5 border-b border-[#E8DDD0] pb-8">
            <button
              onClick={() => setActiveSubId(null)}
              className={`px-5 py-2.5 font-body text-[10px] tracking-widest uppercase transition-all duration-200 border ${
                activeSubId === null
                  ? "bg-[#2C2420] border-[#2C2420] text-white"
                  : "bg-white border-[#E8DDD0] text-[#2C2420] hover:border-[#C4956A]"
              }`}
            >
              Todos ({productos.length})
            </button>
            {cat.hijas.map((sub) => {
              const count = productos.filter((p) => p.categoria_id === sub.id).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubId(sub.id)}
                  className={`px-5 py-2.5 font-body text-[10px] tracking-widest uppercase transition-all duration-200 border ${
                    activeSubId === sub.id
                      ? "bg-[#2C2420] border-[#2C2420] text-white"
                      : "bg-white border-[#E8DDD0] text-[#2C2420] hover:border-[#C4956A]"
                  }`}
                >
                  {sub.nombre} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Grilla de productos con filtros */}
        {productosFiltrados.length > 0 ? (
          <section className="transition-opacity duration-300">
            <ProductGrid products={productosFiltrados} />
          </section>
        ) : (
          <section className="border border-[#E8DDD0] p-8 md:p-12 bg-[#F5EFE6]/40 text-center">
            <p className="font-italic-serif text-rose-accent mb-2">— próximamente</p>
            <p className="font-body font-light text-[#2C2420]/75">
              Estamos preparando la colección para esta sección. Mientras tanto, consulta por WhatsApp.
            </p>
            <a
              href={`https://wa.me/${(config?.whatsapp ?? "+51 999 600 482").replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block h-12 px-8 bg-[#2C2420] text-white text-[11px] tracking-widest uppercase font-body font-light leading-[3rem]"
            >
              Consultar por WhatsApp
            </a>
          </section>
        )}

        {/* Categorías hermanas */}
        {hermanas.length > 0 && (
          <section className="mt-16 md:mt-24 border-t border-[#E8DDD0] pt-10">
            <p className="text-[11px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-4">
              Otras colecciones
            </p>
            <div className="flex flex-wrap gap-2">
              {hermanas.map((c: CategoriaRow) => (
                <Link
                  key={c.id}
                  to="/categoria/$slug"
                  params={{ slug: c.slug }}
                  className="px-4 py-2 border border-[#E8DDD0] text-xs tracking-widest uppercase font-body font-light text-[#2C2420] hover:bg-[#2C2420] hover:text-white transition-colors"
                >
                  {c.nombre}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />
    </div>
  );
}
