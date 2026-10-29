import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ProductDetailView } from "@/components/ProductDetailView";
import {
  getProductoPorId,
  getProductosPorCategoria,
  getCategorias,
  getConfig,
  getTags,
} from "@/lib/queries";
import type { CategoriaRow, ProductoRow } from "@/types/database";
import { slugify, extractIdFromSlug } from "@/lib/utils";

// ─── Loader & Route ────────────────────────────────────────────────────────────

export const Route = createFileRoute("/producto/$id")({
  loader: async ({ params }) => {
    const realId = extractIdFromSlug(params.id);
    const [product, categorias, config, tags] = await Promise.all([
      getProductoPorId(realId),
      getCategorias(),
      getConfig().catch(() => null),
      getTags().catch(() => []),
    ]);

    if (!product) throw redirect({ to: "/" });

    // Redirección canónica si el parámetro no coincide con el slug del producto + ID
    const canonicalId = `${slugify(product.nombre)}-${product.id}`;
    if (params.id !== canonicalId) {
      throw redirect({
        to: "/producto/$id",
        params: { id: canonicalId },
        replace: true,
      });
    }

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
      <p className="text-[#8A7A6E]">{error instanceof Error ? error.message : String(error)}</p>
    </div>
  ),
  component: ProductPage,
});

// ─── Página ───────────────────────────────────────────────────────────────────

function ProductPage() {
  const data = Route.useLoaderData();
  return <ProductDetailView {...data} />;
}
