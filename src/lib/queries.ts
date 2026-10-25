/**
 * Queries de Supabase — capa de acceso a datos.
 *
 * Convenciones:
 * - Todas las funciones son async/await. Sin .then().
 * - Siempre verificar el error de Supabase y lanzar si ocurre.
 * - Nunca exponer el cliente directamente en componentes — solo importar estas funciones.
 */

import { supabase } from "@/lib/supabase";
import { getProduct } from "@/data/catalog";
import type {
  CategoriaRow,
  CategoriaConHijas,
  ProductoRow,
  ConfigRow,
  BannerRow,
  PopupRow,
  DistritoRow,
  OcasionHomeRow,
  ColeccionConCategoria,
  PedidoInsert,
  PedidoRow,
  PedidoProducto,
  TagRow,
  TestimonioRow,
  RecuerdoRow,
  RecuerdoInsert,
  RecuerdoUpdate,
  BlogPostRow,
  BlogPostInsert,
  BlogPostUpdate,
  SuscriptorRow,
} from "@/types/database";
import { resolverClavesTag } from "@/lib/tag-utils";
import { filtrarCategoriasVisibles } from "@/lib/categorias-utils";

// ─── Helper interno ───────────────────────────────────────────────────────────

function throwOnError<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(`[Supabase] ${error.message}`);
  if (data === null) throw new Error("[Supabase] La consulta no devolvió datos");
  return data;
}

// ─── Caché en memoria para evitar egress repetido en tablas estáticas ───────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 60 * 1000; // 60 segundos de vida en memoria

export function clearQueryCache(): void {
  memoryCache.clear();
}

async function withMemoryCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }
  const fresh = await fetcher();
  memoryCache.set(key, { data: fresh, timestamp: now });
  return fresh;
}

// ─── Categorías ───────────────────────────────────────────────────────────────

/**
 * Devuelve todas las categorías activas de la BD sin filtrar las vacías,
 * ordenadas por `orden`.
 */
export async function getTodasCategoriasActivas(): Promise<CategoriaRow[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  return throwOnError(data, error);
}

/**
 * Devuelve los `categoria_id` de todos los productos activos.
 */
export async function getCategoriaIdsConProductosActivos(): Promise<string[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("categoria_id")
    .eq("activo", true);

  const rows = throwOnError(data, error) as { categoria_id: string | null }[];
  return rows.map((r) => r.categoria_id).filter((id): id is string => Boolean(id));
}

/**
 * Devuelve las categorías activas visibles en la web pública ordenadas por `orden`.
 * Oculta automáticamente cualquier categoría padre o subcategoría que no tenga
 * productos activos (directos o en subcategorías hijas activas).
 */
export async function getCategorias(): Promise<CategoriaRow[]> {
  return withMemoryCache("categorias", async () => {
    const [todas, idsConProductos] = await Promise.all([
      getTodasCategoriasActivas(),
      getCategoriaIdsConProductosActivos(),
    ]);

    return filtrarCategoriasVisibles(todas, idsConProductos);
  });
}

/**
 * Devuelve una categoría por su slug, con sus subcategorías hijas anidadas.
 * Útil para la página /categoria/:slug.
 */
export async function getCategoriaPorSlug(slug: string): Promise<CategoriaConHijas | null> {
  return withMemoryCache(`categoria_slug_${slug}`, async () => {
    // 1. Obtener la categoría padre
    const { data: cat, error: catError } = await supabase
      .from("categorias")
      .select("*")
      .eq("slug", slug)
      .eq("activo", true)
      .maybeSingle();

    if (catError) {
      throw new Error(`[Supabase] ${catError.message}`);
    }
    if (!cat) return null;

    // 2. Obtener sus hijas
    const { data: hijas, error: hijasError } = await supabase
      .from("categorias")
      .select("*")
      .eq("parent_id", cat.id)
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (hijasError) {
      throw new Error(`[Supabase] ${hijasError.message}`);
    }

    return { ...cat, hijas: hijas ?? [] };
  });
}

// ─── Productos ────────────────────────────────────────────────────────────────

/**
 * Devuelve todos los productos activos de una categoría (por su UUID),
 * ordenados por `orden`.
 */
export async function getProductosPorCategoria(categoriaId: string): Promise<ProductoRow[]> {
  return withMemoryCache(`productos_cat_${categoriaId}`, async () => {
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, precio, imagenes, tags, categoria_id, activo, orden, created_at")
      .eq("categoria_id", categoriaId)
      .eq("activo", true)
      .order("orden", { ascending: true });

    return throwOnError(data as ProductoRow[], error);
  });
}

/**
 * Devuelve todos los productos activos pertenecientes a un conjunto de IDs de categoría.
 */
export async function getProductosPorCategorias(categoriaIds: string[]): Promise<ProductoRow[]> {
  if (categoriaIds.length === 0) return [];
  const cacheKey = `productos_cats_${categoriaIds.slice().sort().join(",")}`;
  return withMemoryCache(cacheKey, async () => {
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, precio, imagenes, tags, categoria_id, activo, orden, created_at")
      .in("categoria_id", categoriaIds)
      .eq("activo", true)
      .order("orden", { ascending: true });

    return throwOnError(data as ProductoRow[], error);
  });
}

/**
 * Devuelve todos los productos activos ordenados por `orden`.
 * Se usa en /catalogo para el catalogo completo con filtros.
 * Optimizado: omite descripcion en listados masivos para reducir egress de BD (-84%).
 */
export async function getProductosActivos(): Promise<ProductoRow[]> {
  return withMemoryCache("productos_activos", async () => {
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, precio, imagenes, tags, categoria_id, activo, orden, created_at")
      .eq("activo", true)
      .order("orden", { ascending: true });

    return throwOnError(data as ProductoRow[], error);
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Devuelve un producto por su UUID.
 * Si el id no tiene formato UUID (ej: slug hardcodeado de catalog.ts),
 * busca en los datos estáticos como fallback temporal hasta que todos
 * los productos estén cargados en Supabase.
 */
export async function getProductoPorId(id: string): Promise<ProductoRow | null> {
  // Fallback temporal: si no es UUID, buscar en catalog.ts estático
  if (!UUID_REGEX.test(id)) {
    const local = getProduct(id);
    if (!local) return null;
    // Adaptar la forma de Product (catalog.ts) a ProductoRow (Supabase)
    return {
      id: local.id,
      nombre: local.nombre,
      precio: local.precio,
      descripcion: local.descripcion,
      imagenes: local.imagenes,
      categoria_id: local.categoria_id,
      tags: local.tags,
      activo: local.activo,
      orden: 0,
      created_at: new Date().toISOString(),
    } satisfies ProductoRow;
  }

  // UUID válido → consultar Supabase (con caché en memoria)
  return withMemoryCache(`producto_id_${id}`, async () => {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("id", id)
      .eq("activo", true)
      .maybeSingle();

    if (error) throw new Error(`[Supabase] ${error.message}`);
    return data;
  });
}

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * Devuelve la fila única de configuración global.
 * La tabla `config` siempre tiene exactamente 1 fila (upsert).
 */
export async function getConfig(): Promise<ConfigRow | null> {
  return withMemoryCache("config", async () => {
    const { data, error } = await supabase.from("config").select("*").maybeSingle();
    if (error) throw new Error(`[Supabase] ${error.message}`);
    return data;
  });
}

// ─── Banners ──────────────────────────────────────────────────────────────────

/**
 * Devuelve los banners activos ordenados por `orden` ascendente.
 */
export async function getBanners(): Promise<BannerRow[]> {
  return withMemoryCache("banners", async () => {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    return throwOnError(data, error);
  });
}

// ─── Popup ────────────────────────────────────────────────────────────────────

/**
 * Devuelve la fila única del popup.
 * Retorna null si no existe o si está inactivo.
 */
export async function getPopup(): Promise<PopupRow | null> {
  return withMemoryCache("popup", async () => {
    const hoy = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    const { data, error } = await supabase
      .from("popup")
      .select("*")
      .eq("activo", true)
      .or(`fecha_expiracion.is.null,fecha_expiracion.gte.${hoy}`)
      .maybeSingle();

    if (error) throw new Error(`[Supabase] ${error.message}`);
    return data;
  });
}

// ─── Distritos ────────────────────────────────────────────────────────────────

/**
 * Devuelve todos los distritos activos.
 * Se usan en el checkout para mostrar opciones y calcular el delivery.
 */
export async function getDistritos(): Promise<DistritoRow[]> {
  return withMemoryCache("distritos", async () => {
    const { data, error } = await supabase
      .from("distritos")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    return throwOnError(data, error);
  });
}

// ─── Ocasiones home ───────────────────────────────────────────────────────────

/**
 * Devuelve las ocasiones del home activas ordenadas por `orden`.
 */
export async function getOcasiones(): Promise<OcasionHomeRow[]> {
  return withMemoryCache("ocasiones_home", async () => {
    const { data, error } = await supabase
      .from("ocasiones_home")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    return throwOnError(data, error);
  });
}

// ─── Tags del home ─────────────────────────────────────────────────────────────────

/**
 * Devuelve todos los tags (con caché en memoria para evitar peticiones redundantes).
 */
export async function getAllTags(): Promise<TagRow[]> {
  return withMemoryCache("all_tags", async () => {
    const { data, error } = await supabase.from("tags").select("*");
    if (error) throw new Error(`[Supabase] ${error.message}`);
    return (data as TagRow[]) || [];
  });
}

/**
 * Devuelve todos los tags activos que se muestran en el home,
 * ordenados por `orden` ascendente.
 */
export async function getTags(): Promise<TagRow[]> {
  return withMemoryCache("tags_home", async () => {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("activo", true)
      .eq("mostrar_en_home", true)
      .order("orden", { ascending: true });

    return throwOnError(data, error);
  });
}

/**
 * Devuelve hasta `limit` productos activos que contienen la `clave` del tag
 * (o sus variantes históricas) en su array `tags[]`.
 */
export async function getProductosPorTag(clave: string, limit = 5): Promise<ProductoRow[]> {
  return withMemoryCache(`productos_tag_${clave}_${limit}`, async () => {
    const claves = resolverClavesTag(clave);
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, precio, imagenes, tags, categoria_id, activo, orden, created_at")
      .eq("activo", true)
      .overlaps("tags", claves)
      .order("orden", { ascending: true })
      .limit(limit);

    return throwOnError(data as ProductoRow[], error);
  });
}

/**
 * Devuelve un tag por su clave.
 */
export async function getTagPorClave(clave: string): Promise<TagRow | null> {
  const { data, error } = await supabase.from("tags").select("*").eq("clave", clave).maybeSingle();

  if (error) throw new Error(`[Supabase] ${error.message}`);
  return data;
}

/**
 * Devuelve todos los productos activos asociados a un tag específico.
 */
export async function getTodosProductosPorTag(clave: string): Promise<ProductoRow[]> {
  const claves = resolverClavesTag(clave);
  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, precio, imagenes, tags, categoria_id, activo, orden, created_at")
    .eq("activo", true)
    .overlaps("tags", claves)
    .order("orden", { ascending: true });

  return throwOnError(data, error);
}

// ─── Colecciones home ─────────────────────────────────────────────────────────

/**
 * Devuelve las colecciones del home activas, con join a la tabla categorias.
 * Útil para renderizar el CategoryShowcase con nombre, slug e imagen real.
 */
export async function getColecciones(): Promise<ColeccionConCategoria[]> {
  return withMemoryCache("colecciones", async () => {
    // Paso 1: traer colecciones con datos de la categoría y las categorías visibles con productos
    const [{ data, error }, categoriasVisibles] = await Promise.all([
    supabase
      .from("colecciones_home")
      .select(
        `
      *,
      categoria:categorias (
        id,
        nombre,
        slug,
        imagen_url,
        parent_id,
        activo
      )
    `,
      )
      .eq("activo", true)
      .order("orden", { ascending: true }),
    getCategorias(),
  ]);

  if (error) throw new Error(`[Supabase] ${error.message}`);

  // Las colecciones configuradas por Jack deben mostrarse SIEMPRE en su orden,
  // salvo que la categoría esté desactivada (activo = false). Si tiene 0 productos activos,
  // la colección se muestra igual.
  const colecciones = (
    (data ?? []) as (ColeccionConCategoria & { categoria: { activo?: boolean } })[]
  ).filter((c) => {
    const cat = c.categoria as { id?: string; activo?: boolean } | null;
    return Boolean(cat?.id && cat.activo !== false);
  }) as ColeccionConCategoria[];

  // Si hay menos de 6 colecciones en colecciones_home, complementar con categorías destacadas visibles
  if (colecciones.length < 6) {
    const existingCatIds = new Set(
      colecciones.map((c) => (c.categoria as { id?: string })?.id).filter(Boolean),
    );
    const targetSlugs = ["cumpleanos", "ramos", "tulipanes", "girasoles", "arreglos-florales"];
    const extras = categoriasVisibles.filter((c) => targetSlugs.includes(c.slug));

    for (const ext of extras) {
      if (!existingCatIds.has(ext.id) && colecciones.length < 6) {
        existingCatIds.add(ext.id);
        colecciones.push({
          id: `extra-${ext.id}`,
          categoria_id: ext.id,
          imagen_custom_url: null,
          orden: colecciones.length,
          activo: true,
          categoria: {
            id: ext.id,
            nombre: ext.nombre,
            slug: ext.slug,
            imagen_url: ext.imagen_url,
            parent_id: ext.parent_id,
          },
        } as ColeccionConCategoria);
      }
    }
  }

  // Orden equilibrado para el Bento Collage:
  // 0: Hero Bento (Amor / Aniversario)
  // 1: Vertical Bento (Graduación)
  // 2, 3, 4, 5: Cuarteto inferior (Cumpleaños, Ramos, Tulipanes, Ofertas)
  const preferredOrder = [
    "amor-aniversario",
    "graduacion",
    "cumpleanos",
    "ramos",
    "tulipanes",
    "ofertas",
  ];

  colecciones.sort((a, b) => {
    const isExtraA = String(a.id).startsWith("extra-");
    const isExtraB = String(b.id).startsWith("extra-");
    if (!isExtraA && !isExtraB) {
      return (a.orden ?? 0) - (b.orden ?? 0);
    }
    if (!isExtraA && isExtraB) return -1;
    if (isExtraA && !isExtraB) return 1;

    const slugA = (a.categoria as { slug?: string } | undefined)?.slug ?? "";
    const slugB = (b.categoria as { slug?: string } | undefined)?.slug ?? "";
    const idxA = preferredOrder.indexOf(slugA);
    const idxB = preferredOrder.indexOf(slugB);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a.orden ?? 0) - (b.orden ?? 0);
  });

  // Paso 2: recopilar los parent_ids únicos y buscar sus slugs
  const parentIds = [
    ...new Set(
      colecciones
        .map((c) => (c.categoria as { parent_id?: string | null })?.parent_id)
        .filter(Boolean) as string[],
    ),
  ];

  if (parentIds.length === 0) return colecciones;

  const { data: padres } = await supabase.from("categorias").select("id, slug").in("id", parentIds);

  const padreMap: Record<string, string> = {};
  (padres ?? []).forEach((p: { id: string; slug: string }) => {
    padreMap[p.id] = p.slug;
  });

  // Paso 3: inyectar el slug del padre en cada colección
  return colecciones.map((col) => {
    const parentId = (col.categoria as { parent_id?: string | null })?.parent_id;
    if (!parentId || !padreMap[parentId]) return col;
    return {
      ...col,
      categoria: col.categoria ? { ...col.categoria, padre: { slug: padreMap[parentId] } } : null,
    };
  });
  });
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export interface CrearPedidoInput {
  nombre_cliente: string;
  telefono: string;
  email: string;
  distrito_id: string;
  direccion: string;
  referencia?: string;
  fecha_entrega: string;
  hora_entrega: string;
  notas?: string;
  productos: PedidoProducto[];
  subtotal: number;
  delivery: number;
  total: number;
  acepto_terminos: boolean;
}

/**
 * Inserta un nuevo pedido en la BD.
 * Genera el número de pedido en el formato FM-XXXXXX.
 * Retorna el número de pedido generado.
 *
 * RLS: INSERT público — no requiere sesión.
 */
export async function crearPedido(input: CrearPedidoInput): Promise<string> {
  const MAX_INTENTOS = 3;

  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    // Generar número de pedido aleatorio FM-XXXXXX
    const numero = `FM-${Math.floor(100000 + Math.random() * 900000)}`;

    const { error } = await supabase.from("pedidos").insert({
      numero,
      nombre_cliente: input.nombre_cliente,
      telefono: input.telefono,
      email: input.email,
      distrito_id: input.distrito_id,
      direccion: input.direccion,
      referencia: input.referencia ?? null,
      fecha_entrega: input.fecha_entrega,
      hora_entrega: input.hora_entrega,
      notas: input.notas ?? null,
      productos: input.productos,
      subtotal: input.subtotal,
      delivery: input.delivery,
      total: input.total,
      estado: "pendiente" as const,
      acepto_terminos: input.acepto_terminos,
    });

    if (!error) {
      return numero;
    }

    // Si el error NO es colisión de clave única (código PostgreSQL 23505), fallar de inmediato
    if (error.code !== "23505") {
      throw new Error(`[Supabase] ${error.message}`);
    }
  }

  // Si tras 3 intentos seguidos persiste colisión de clave única:
  throw new Error(
    "No pudimos generar un número de pedido único tras 3 intentos. Por favor contáctanos por WhatsApp al +51 999 600 482 para registrar tu pedido directamente.",
  );
}

/**
 * Devuelve los pedidos (solo admin — requiere sesión con rol elevado).
 * Placeholder para la Fase 2 del panel admin.
 */
export async function getPedidos(): Promise<PedidoRow[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  return throwOnError(data, error);
}

// ─── Testimonios ─────────────────────────────────────────────────────────────

/**
 * Devuelve todos los testimonios activos para la página pública /resenas.
 * Ordenados por destacados primero, luego orden ascendente, y finalmente por fecha / creación.
 * Si la tabla aún no existe en la BD (SQL 007 pendiente), devuelve un arreglo vacío sin romper.
 */
export async function getTestimonios(): Promise<TestimonioRow[]> {
  try {
    const { data, error } = await supabase
      .from("testimonios")
      .select("*")
      .eq("activo", true)
      .order("destacado", { ascending: false })
      .order("orden", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        return [];
      }
      throw new Error(`[Supabase] ${error.message}`);
    }

    return data ?? [];
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes("42P01") || err.message.includes("PGRST205"))
    ) {
      return [];
    }
    throw err;
  }
}

/**
 * Devuelve hasta 6 testimonios destacados activos para la franja del Home.
 */
export async function getTestimoniosHome(): Promise<TestimonioRow[]> {
  return withMemoryCache("testimonios_home", async () => {
    try {
      const { data, error } = await supabase
        .from("testimonios")
        .select("*")
        .eq("activo", true)
        .order("destacado", { ascending: false })
        .order("orden", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          return [];
        }
        throw new Error(`[Supabase] ${error.message}`);
      }

      return data ?? [];
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("42P01") || err.message.includes("PGRST205"))
      ) {
        return [];
      }
      throw err;
    }
  });
}

// ─── Mural de Recuerdos ───────────────────────────────────────────────────────

export interface RecuerdoConDetalles {
  recuerdo: RecuerdoRow;
  categoriaRelacionada: CategoriaRow | null;
  distrito: DistritoRow | null;
  productoRelacionado: ProductoRow | null;
  productosRelacionados: ProductoRow[];
}

export interface FiltrosRecuerdos {
  ocasionId?: string;
  distritoId?: string;
}

/**
 * Devuelve la lista de recuerdos públicos para `/recuerdos`
 * (solo publicado = true y fecha_publicacion <= now()),
 * con filtros opcionales por ocasión (categoría) o distrito.
 */
export async function getRecuerdosPublicos(filtros?: FiltrosRecuerdos): Promise<RecuerdoRow[]> {
  try {
    const nowIso = new Date().toISOString();
    let query = supabase
      .from("recuerdos")
      .select("*")
      .eq("publicado", true)
      .lte("fecha_publicacion", nowIso);

    if (filtros?.ocasionId && filtros.ocasionId !== "todas") {
      query = query.eq("categoria_relacionada_id", filtros.ocasionId);
    }

    if (filtros?.distritoId && filtros.distritoId !== "todos") {
      query = query.eq("distrito_id", filtros.distritoId);
    }

    const { data, error } = await query
      .order("destacado", { ascending: false })
      .order("orden", { ascending: true })
      .order("fecha_publicacion", { ascending: false });

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        return [];
      }
      throw new Error(`[Supabase] ${error.message}`);
    }

    return data ?? [];
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes("42P01") || err.message.includes("PGRST205"))
    ) {
      return [];
    }
    throw err;
  }
}

/**
 * Devuelve hasta N recuerdos publicados para la franja del Home.
 * Ordenados estrictamente:
 * 1. destacado DESC (primero destacados)
 * 2. orden ASC
 * 3. fecha_publicacion DESC
 */
export async function getRecuerdosHome(limite = 8): Promise<RecuerdoRow[]> {
  return withMemoryCache(`recuerdos_home_${limite}`, async () => {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("recuerdos")
        .select("*")
        .eq("publicado", true)
        .lte("fecha_publicacion", nowIso)
        .order("destacado", { ascending: false })
        .order("orden", { ascending: true })
        .order("fecha_publicacion", { ascending: false })
        .limit(limite);

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          return [];
        }
        throw new Error(`[Supabase] ${error.message}`);
      }

      return data ?? [];
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("42P01") || err.message.includes("PGRST205"))
      ) {
        return [];
      }
      throw err;
    }
  });
}

/**
 * Obtiene un recuerdo público por su slug con distrito, categoría y producto entregado.
 * Si no está publicado o su fecha es futura, retorna null.
 */
export async function getRecuerdoPorSlug(slug: string): Promise<RecuerdoConDetalles | null> {
  try {
    const { data: recuerdo, error } = await supabase
      .from("recuerdos")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        return null;
      }
      throw new Error(`[Supabase] ${error.message}`);
    }

    if (!recuerdo) return null;

    // Verificar visibilidad pública: publicado y fecha <= now()
    if (!recuerdo.publicado || !recuerdo.fecha_publicacion) {
      return null;
    }
    const fecha = new Date(recuerdo.fecha_publicacion);
    if (isNaN(fecha.getTime()) || fecha.getTime() > Date.now()) {
      return null;
    }

    // Cargar relaciones en paralelo: distrito, categoría, producto exacto y productos relacionados
    const promesas: [
      Promise<{ data: DistritoRow | null }>,
      Promise<{ data: CategoriaRow | null }>,
      Promise<{ data: ProductoRow | null }>,
      Promise<{ data: ProductoRow[] | null }>,
    ] = [
      recuerdo.distrito_id
        ? supabase.from("distritos").select("*").eq("id", recuerdo.distrito_id).maybeSingle()
        : Promise.resolve({ data: null }),
      recuerdo.categoria_relacionada_id
        ? supabase
            .from("categorias")
            .select("*")
            .eq("id", recuerdo.categoria_relacionada_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      recuerdo.producto_id
        ? supabase.from("productos").select("*").eq("id", recuerdo.producto_id).maybeSingle()
        : Promise.resolve({ data: null }),
      recuerdo.categoria_relacionada_id
        ? supabase
            .from("productos")
            .select("*")
            .eq("categoria_id", recuerdo.categoria_relacionada_id)
            .eq("activo", true)
            .limit(4)
        : Promise.resolve({ data: [] }),
    ];

    const [
      { data: distrito },
      { data: categoriaRelacionada },
      { data: productoRelacionado },
      { data: productosRelacionados },
    ] = await Promise.all(promesas);

    return {
      recuerdo,
      categoriaRelacionada: categoriaRelacionada ?? null,
      distrito: distrito ?? null,
      productoRelacionado: productoRelacionado ?? null,
      productosRelacionados: productosRelacionados ?? [],
    };
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes("42P01") || err.message.includes("PGRST205"))
    ) {
      return null;
    }
    throw err;
  }
}

/**
 * Para panel administrativo: devuelve todos los recuerdos (borradores, programados y publicados).
 */
export async function getAdminRecuerdos(): Promise<RecuerdoRow[]> {
  const { data, error } = await supabase
    .from("recuerdos")
    .select("*")
    .order("destacado", { ascending: false })
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

// ─── Compatibilidad Blog (Fase 09) ────────────────────────────────────────────

export interface BlogPostConDetalles {
  post: BlogPostRow;
  categoriaRelacionada: CategoriaRow | null;
  productosRelacionados: ProductoRow[];
}

export async function getBlogPostsPublicos(): Promise<BlogPostRow[]> {
  return getRecuerdosPublicos();
}

export async function getBlogPostPorSlug(slug: string): Promise<BlogPostConDetalles | null> {
  const res = await getRecuerdoPorSlug(slug);
  if (!res) return null;
  return {
    post: res.recuerdo,
    categoriaRelacionada: res.categoriaRelacionada,
    productosRelacionados: res.productosRelacionados,
  };
}

export async function getAdminBlogPosts(): Promise<BlogPostRow[]> {
  return getAdminRecuerdos();
}

// ─── Suscriptores ─────────────────────────────────────────────────────────────

export interface InsertarSuscriptorResult {
  ok: boolean;
  yaRegistrado?: boolean;
  error?: string;
}

/**
 * Inserta un nuevo suscriptor desde el popup o checkout.
 * OJO: RLS público solo permite INSERT, NO permite SELECT de vuelta.
 * Por eso no se encadena `.select()`.
 * Si el teléfono ya existe (error 23505), se reporta como exitoso (yaRegistrado: true).
 */
export async function insertarSuscriptor(input: {
  nombre: string;
  telefono: string;
  consentimiento_texto: string;
  origen?: string;
}): Promise<InsertarSuscriptorResult> {
  const { error } = await supabase.from("suscriptores").insert({
    nombre: input.nombre.trim(),
    telefono: input.telefono.trim(),
    consentimiento: true,
    consentimiento_texto: input.consentimiento_texto,
    origen: input.origen ?? "popup_home",
    activo: true,
  });

  if (!error) {
    return { ok: true };
  }

  // Código 23505: violación de restricción única (teléfono ya registrado)
  if (error.code === "23505") {
    return { ok: true, yaRegistrado: true };
  }

  return { ok: false, error: error.message };
}

/**
 * Obtiene la lista de todos los suscriptores (solo admin).
 */
export async function getAdminSuscriptores(): Promise<SuscriptorRow[]> {
  const { data, error } = await supabase
    .from("suscriptores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Da de baja a un suscriptor cambiando activo = false y baja_at = now().
 */
export async function darDeBajaSuscriptor(id: string): Promise<void> {
  const { error } = await supabase
    .from("suscriptores")
    .update({
      activo: false,
      baja_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}
