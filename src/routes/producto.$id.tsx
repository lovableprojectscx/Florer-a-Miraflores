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
import { slugify, extractIdFromSlug, stripMarkdown, safeJsonLd } from "@/lib/utils";

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
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const desc = stripMarkdown(loaderData.product.descripcion) || loaderData.product.nombre;
    const title = `${loaderData.product.nombre} | Florería Miraflores`;
    const img = loaderData.product.imagenes?.[0] ?? "https://floreriamiraflores.com/Logo.webp";

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: img },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
    };
  },
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
  const { product, subcat, parentCat } = data;
  const canonicalUrl = `https://floreriamiraflores.com/producto/${slugify(product.nombre)}-${product.id}`;

  const breadcrumbItems: Array<{ "@type": string; position: number; name: string; item: string }> =
    [{ "@type": "ListItem", position: 1, name: "Inicio", item: "https://floreriamiraflores.com/" }];
  if (parentCat && subcat) {
    breadcrumbItems.push(
      {
        "@type": "ListItem",
        position: 2,
        name: parentCat.nombre,
        item: `https://floreriamiraflores.com/categoria/${parentCat.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: subcat.nombre,
        item: `https://floreriamiraflores.com/categoria/${parentCat.slug}/${subcat.slug}`,
      },
      { "@type": "ListItem", position: 4, name: product.nombre, item: canonicalUrl },
    );
  } else if (subcat) {
    breadcrumbItems.push(
      {
        "@type": "ListItem",
        position: 2,
        name: subcat.nombre,
        item: `https://floreriamiraflores.com/categoria/${subcat.slug}`,
      },
      { "@type": "ListItem", position: 3, name: product.nombre, item: canonicalUrl },
    );
  } else {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: product.nombre,
      item: canonicalUrl,
    });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nombre,
    image: product.imagenes && product.imagenes.length > 0 ? product.imagenes : undefined,
    description: stripMarkdown(product.descripcion) || product.nombre,
    sku: product.id,
    category: subcat?.nombre ?? "Flores y Regalos",
    offers: {
      "@type": "Offer",
      priceCurrency: "PEN",
      price: Number(product.precio).toFixed(2),
      availability:
        product.activo !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: canonicalUrl,
      seller: {
        "@type": "Florist",
        name: "Florería Miraflores",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />
      <ProductDetailView {...data} />
    </>
  );
}
