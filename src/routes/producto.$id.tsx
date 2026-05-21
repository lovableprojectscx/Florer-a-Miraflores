import { useState } from "react";
import { createFileRoute, Link, redirect, useNavigate, notFound } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Zap, MapPin } from "lucide-react";

import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { ProductGrid } from "@/components/ProductGrid";
import fallbackImg from "@/assets/product-box-romantico.webp";

import {
  getProductoPorId,
  getProductosPorCategoria,
  getCategorias,
  getConfig,
} from "@/lib/queries";
import { useCartStore } from "@/store/cart";
import type { CategoriaRow, ProductoRow, TagRow } from "@/types/database";
import { supabase } from "@/lib/supabase";

// ─── Badge helper ─────────────────────────────────────────────────────────────

const BADGE_MAP: Record<string, { label: string; className: string }> = {
  novedad: { label: "NUEVO", className: "bg-[#2C2420] text-white" },
  edicion_limitada: { label: "EDICIÓN LIMITADA", className: "bg-[#2C2420] text-white" },
  oferta: { label: "OFERTA", className: "bg-[#C4956A] text-white" },
  mas_vendido: { label: "MÁS VENDIDO", className: "bg-[#8A7A6E] text-white" },
};

// ─── Loader ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/producto/$id")({
  loader: async ({ params }) => {
    const [product, categorias, config, tags] = await Promise.all([
      getProductoPorId(params.id),
      getCategorias(),
      getConfig().catch(() => null),
      supabase
        .from("tags")
        .select("*")
        .then(({ data }: { data: any }) => (data ?? []) as TagRow[]),
    ]);

    if (!product) throw redirect({ to: "/" });

    // Productos relacionados — misma categoría, excluir el actual
    let relacionados: ProductoRow[] = [];
    if (product.categoria_id) {
      try {
        const todos = await getProductosPorCategoria(product.categoria_id);
        relacionados = todos.filter((p) => p.id !== product.id).slice(0, 4);
      } catch {
        relacionados = [];
      }
    }

    // Breadcrumb: encontrar categoría padre y subcategoría
    const subcat = product.categoria_id
      ? categorias.find((c: CategoriaRow) => c.id === product.categoria_id)
      : null;
    const parentCat = subcat?.parent_id
      ? categorias.find((c: CategoriaRow) => c.id === subcat.parent_id)
      : null;

    return { product, relacionados, categorias, config, subcat, parentCat, tags };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.nombre} | Florería Miraflores` },
          {
            name: "description",
            content: loaderData.product.descripcion ?? loaderData.product.nombre,
          },
          { property: "og:title", content: `${loaderData.product.nombre} | Florería Miraflores` },
          { property: "og:image", content: loaderData.product.imagenes?.[0] ?? "" },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="font-display text-4xl mb-4 text-[#2C2420]">Producto no encontrado</h1>
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
  component: ProductPage,
});

// ─── Página ───────────────────────────────────────────────────────────────────

function ProductPage() {
  const { product, relacionados, categorias, config, subcat, parentCat, tags } = Route.useLoaderData();
  const navigate = useNavigate();
  const { agregarItem, abrirCarrito } = useCartStore();

  const [cantidad, setCantidad] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const firstTag = product.tags?.[0];
  const tagObj = tags?.find((t: TagRow) => t.clave === firstTag);
  const label = tagObj ? tagObj.nombre.toUpperCase() : (firstTag ? (BADGE_MAP[firstTag]?.label ?? firstTag.toUpperCase()) : null);
  const color = tagObj ? tagObj.color_badge : null;
  const fallbackClass = firstTag ? (BADGE_MAP[firstTag]?.className ?? "bg-[#2C2420] text-white") : "";
  const imagenes = product.imagenes ?? [];

  const handleAgregar = () => {
    agregarItem({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      imagen: imagenes[0] ?? "",
      cantidad,
    });
    abrirCarrito();
  };

  const handleComprarAhora = () => {
    agregarItem({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      imagen: imagenes[0] ?? "",
      cantidad,
    });
    navigate({ to: "/checkout" });
  };

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <AnnouncementBar config={config} />
      <Header categorias={categorias} config={config} />

      <main className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 py-8 md:py-14">
        {/* Breadcrumb */}
        <nav className="text-[11px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-8 flex flex-wrap items-center gap-1.5">
          <Link to="/" className="hover:text-[#2C2420] transition-colors">
            Inicio
          </Link>
          {parentCat && (
            <>
              <span>/</span>
              <Link
                to="/categoria/$slug"
                params={{ slug: parentCat.slug }}
                className="hover:text-[#2C2420] transition-colors"
              >
                {parentCat.nombre}
              </Link>
            </>
          )}
          {subcat && parentCat && (
            <>
              <span>/</span>
              <Link
                to="/categoria/$slug/$sub"
                params={{ slug: parentCat.slug, sub: subcat.slug }}
                className="hover:text-[#2C2420] transition-colors"
              >
                {subcat.nombre}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-[#2C2420]">{product.nombre}</span>
        </nav>

        {/* Layout principal */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* Imágenes (60%) */}
          <div className="w-full lg:w-[60%] flex flex-col gap-3">
            <div
              className="relative overflow-hidden bg-[#F5EFE6] rounded-xl"
              style={{ aspectRatio: "4/5" }}
            >
              {label && (
                <span
                  className={`absolute top-4 left-4 z-10 px-3 py-1 text-[10px] tracking-widest uppercase font-body font-medium ${color ? "text-white" : fallbackClass}`}
                  style={color ? { backgroundColor: color } : undefined}
                >
                  {label}
                </span>
              )}
              {imagenes[activeImg] && (
                <img
                  src={imagenes[activeImg]}
                  alt={product.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackImg;
                  }}
                />
              )}
            </div>
            {imagenes.length > 1 && (
              <div className="flex gap-3">
                {imagenes.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                    className={`w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      activeImg === i
                        ? "border-[#C4956A]"
                        : "border-transparent hover:border-[#E8DDD0]"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.nombre} vista ${i + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = fallbackImg;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info (40%) */}
          <div className="w-full lg:w-[40%] flex flex-col">
            {label && (
              <span
                className={`lg:hidden self-start mb-3 px-3 py-1 text-[10px] tracking-widest uppercase font-body font-medium ${color ? "text-white" : fallbackClass}`}
                style={color ? { backgroundColor: color } : undefined}
              >
                {label}
              </span>
            )}

            <h1 className="font-display italic text-4xl md:text-5xl text-[#2C2420] leading-tight">
              {product.nombre}
            </h1>
            <p className="mt-4 font-body text-2xl font-light text-[#C4956A]">
              S/ {product.precio.toFixed(2)}
            </p>

            <div className="my-6 border-t border-[#E8DDD0]" />

            {product.descripcion && (
              <p className="font-body font-light text-[#2C2420]/80 leading-relaxed">
                {product.descripcion}
              </p>
            )}

            {/* Selector cantidad */}
            <div className="mt-8">
              <p className="font-body text-xs tracking-widest uppercase text-[#8A7A6E] mb-3">
                Cantidad
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCantidad((q) => Math.max(1, q - 1))}
                  aria-label="Reducir cantidad"
                  className="w-10 h-10 flex items-center justify-center border border-[#E8DDD0] text-[#8A7A6E] hover:border-[#C4956A] hover:text-[#C4956A] transition-colors rounded-lg"
                >
                  <Minus className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <span className="font-body text-lg w-8 text-center text-[#2C2420]">{cantidad}</span>
                <button
                  onClick={() => setCantidad((q) => q + 1)}
                  aria-label="Aumentar cantidad"
                  className="w-10 h-10 flex items-center justify-center border border-[#E8DDD0] text-[#8A7A6E] hover:border-[#C4956A] hover:text-[#C4956A] transition-colors rounded-lg"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={handleAgregar}
                className="flex items-center justify-center gap-2 w-full h-14 bg-[#2C2420] text-white text-[12px] tracking-widest uppercase font-body font-medium hover:bg-[#2C2420]/80 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                Agregar al carrito
              </button>
              <button
                onClick={handleComprarAhora}
                className="flex items-center justify-center gap-2 w-full h-14 border border-[#C4956A] text-[#C4956A] text-[12px] tracking-widest uppercase font-body font-medium hover:bg-[#C4956A] hover:text-white transition-colors"
              >
                <Zap className="h-4 w-4" strokeWidth={1.5} />
                Comprar ahora
              </button>
            </div>

            {/* Nota delivery */}
            <div className="mt-6 flex items-start gap-2 p-4 bg-[#F5EFE6] rounded-xl">
              <MapPin className="h-4 w-4 text-[#C4956A] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <p className="font-body text-xs text-[#8A7A6E] leading-relaxed">
                Delivery disponible en{" "}
                <span className="text-[#2C2420]">
                  Miraflores, Surco, Barranco, Lince y San Isidro
                </span>
                . Coordina tu hora de entrega en el checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Productos relacionados */}
        {relacionados.length > 0 && (
          <section className="mt-20 md:mt-28 border-t border-[#E8DDD0] pt-14">
            <div className="mb-10">
              <p className="font-display italic text-[#C4956A] text-base mb-1">
                — también te puede gustar
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-[#2C2420]">
                Productos relacionados
              </h2>
            </div>
            <ProductGrid products={relacionados} />
          </section>
        )}
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />
    </div>
  );
}
