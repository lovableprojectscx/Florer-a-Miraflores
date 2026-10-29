import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Zap, Minus, Plus, MapPin } from "lucide-react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { ProductGrid } from "@/components/ProductGrid";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { useCartStore } from "@/store/cart";
import { getTagBadgeInfo } from "@/lib/tag-utils";
import fallbackImg from "@/assets/product-box-romantico.webp";
import type { ProductoRow, CategoriaRow, TagRow, ConfigRow } from "@/types/database";

export interface ProductDetailViewProps {
  product: ProductoRow;
  relacionados: ProductoRow[];
  categorias: CategoriaRow[];
  config: ConfigRow | null;
  subcat?: CategoriaRow | null;
  parentCat?: CategoriaRow | null;
  tags?: TagRow[];
}

export function ProductDetailView({
  product,
  relacionados,
  categorias,
  config,
  subcat,
  parentCat,
  tags,
}: ProductDetailViewProps) {
  const navigate = useNavigate();
  const { agregarItem, abrirCarrito } = useCartStore();

  const [cantidad, setCantidad] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const firstTag = product.tags?.[0];
  const badgeInfo = getTagBadgeInfo(tags, firstTag);
  const label = badgeInfo?.label ?? null;
  const color = badgeInfo?.color ?? null;
  const fallbackClass = "bg-[#2C2420] text-white";
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

      <main className="max-w-[1536px] mx-auto px-5 md:px-12 lg:px-16 py-8 md:py-14">
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
          <span className="text-[#2C2420] font-normal">{product.nombre}</span>
        </nav>

        {/* Layout principal con galería sticky en Desktop */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
          {/* Imágenes (Sticky 55%) */}
          <div className="w-full lg:w-[55%] flex flex-col gap-3 lg:sticky lg:top-8">
            <div className="relative overflow-hidden bg-[#FAF8F5] rounded-2xl border border-[#E8DDD0]/50 aspect-square">
              {label && (
                <span
                  className={`absolute top-4 left-4 z-10 px-3 py-1.5 text-[10px] tracking-widest uppercase font-body font-medium rounded-sm shadow-xs ${color ? "text-white" : fallbackClass}`}
                  style={color ? { backgroundColor: color } : undefined}
                >
                  {label}
                </span>
              )}
              {imagenes[activeImg] && (
                <ResponsiveImage
                  url={imagenes[activeImg]}
                  fallbackUrl={imagenes[activeImg] || fallbackImg}
                  anchoMiniatura={960}
                  originalWidth={1600}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  alt={product.nombre}
                  fetchPriority="high"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              )}
            </div>
            {imagenes.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {imagenes.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                    className={`w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                      activeImg === i
                        ? "border-[#2C2420] shadow-sm"
                        : "border-[#E8DDD0]/70 hover:border-[#2C2420]/50 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <ResponsiveImage
                      url={img}
                      fallbackUrl={img || fallbackImg}
                      anchoMiniatura={480}
                      alt={`${product.nombre} vista ${i + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info del producto (45%) */}
          <div className="w-full lg:w-[45%] flex flex-col pt-2">
            {label && (
              <span
                className={`lg:hidden self-start mb-3 px-3 py-1 text-[10px] tracking-widest uppercase font-body font-medium rounded-sm ${color ? "text-white" : fallbackClass}`}
                style={color ? { backgroundColor: color } : undefined}
              >
                {label}
              </span>
            )}

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#2C2420] font-normal leading-tight">
              {product.nombre}
            </h1>
            <p className="mt-3 font-body text-2xl sm:text-3xl font-semibold text-[#2C2420]">
              S/. {product.precio.toFixed(2)}{" "}
              <span className="text-sm font-normal text-[#8A7A6E]">PEN</span>
            </p>

            <div className="my-6 border-t border-[#E8DDD0]/80" />

            {product.descripcion && (
              <div className="prose text-[#2C2420]/80 font-body font-light text-sm sm:text-base leading-relaxed">
                <p>{product.descripcion}</p>
              </div>
            )}

            {/* Selector de cantidad */}
            <div className="mt-8">
              <p className="font-body text-xs tracking-[0.16em] uppercase text-[#8A7A6E] mb-3 font-medium">
                Cantidad
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCantidad((q) => Math.max(1, q - 1))}
                  aria-label="Reducir cantidad"
                  className="w-10 h-10 flex items-center justify-center border border-[#E8DDD0] text-[#2C2420] hover:bg-[#FAF8F5] transition-colors rounded-lg cursor-pointer"
                >
                  <Minus className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <span className="font-body text-base font-medium w-8 text-center text-[#2C2420]">
                  {cantidad}
                </span>
                <button
                  onClick={() => setCantidad((q) => q + 1)}
                  aria-label="Aumentar cantidad"
                  className="w-10 h-10 flex items-center justify-center border border-[#E8DDD0] text-[#2C2420] hover:bg-[#FAF8F5] transition-colors rounded-lg cursor-pointer"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={handleAgregar}
                className="flex items-center justify-center gap-2 w-full h-14 bg-[#2C2420] hover:bg-[#1A1A1A] text-white text-[11px] sm:text-xs tracking-widest uppercase font-body font-medium rounded-md shadow-sm transition-all duration-300 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                Agregar al carrito
              </button>
              <button
                onClick={handleComprarAhora}
                className="flex items-center justify-center gap-2 w-full h-14 border border-[#2C2420] text-[#2C2420] hover:bg-[#FAF8F5] text-[11px] sm:text-xs tracking-widest uppercase font-body font-medium rounded-md transition-all duration-300 cursor-pointer"
              >
                <Zap className="h-4 w-4" strokeWidth={1.5} />
                Comprar ahora
              </button>
            </div>

            {/* Tarjeta informativa de delivery */}
            <div className="mt-8 p-5 bg-[#FAF8F5] border border-[#E8DDD0]/80 rounded-xl flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-white border border-[#E8DDD0] flex items-center justify-center shrink-0 shadow-xs">
                <MapPin className="h-4 w-4 text-[#2C2420]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-body font-medium text-xs sm:text-sm text-[#2C2420]">
                  Delivery el mismo día en Lima y Callao
                </p>
                <p className="font-body font-light text-xs text-[#8A7A6E] mt-0.5 leading-relaxed">
                  Miraflores, San Isidro, Surco, Barranco, Lince y más distritos. Elige tu fecha y
                  rango horario en el checkout.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Productos relacionados */}
        {relacionados.length > 0 && (
          <section className="mt-20 md:mt-28 border-t border-[#E8DDD0] pt-14">
            <div className="mb-10">
              <p className="font-body text-xs tracking-[0.2em] uppercase text-[#8A7A6E] mb-2 font-normal">
                — También te puede interesar
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-[#2C2420] font-normal">
                Arreglos relacionados
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
