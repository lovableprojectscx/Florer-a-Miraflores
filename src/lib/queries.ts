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
  FaqRow,
  DistritoRow,
  OcasionHomeRow,
  ColeccionConCategoria,
  PedidoInsert,
  PedidoRow,
  PedidoProducto,
} from "@/types/database";

// ─── Helper interno ───────────────────────────────────────────────────────────

function throwOnError<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(`[Supabase] ${error.message}`);
  if (data === null) throw new Error("[Supabase] La consulta no devolvió datos");
  return data;
}

// ─── Categorías ───────────────────────────────────────────────────────────────

/**
 * Devuelve todas las categorías activas ordenadas por `orden`.
 * Incluye tanto padres como hijas (parent_id puede ser null o un id).
 */
export async function getCategorias(): Promise<CategoriaRow[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  return throwOnError(data, error);
}

/**
 * Devuelve una categoría por su slug, con sus subcategorías hijas anidadas.
 * Útil para la página /categoria/:slug.
 */
export async function getCategoriaPorSlug(slug: string): Promise<CategoriaConHijas | null> {
  // 1. Obtener la categoría padre
  const { data: cat, error: catError } = await supabase
    .from("categorias")
    .select("*")
    .eq("slug", slug)
    .eq("activo", true)
    .maybeSingle();

  if (catError) throw new Error(`[Supabase] ${catError.message}`);
  if (!cat) return null;

  // 2. Obtener sus hijas
  const { data: hijas, error: hijasError } = await supabase
    .from("categorias")
    .select("*")
    .eq("parent_id", cat.id)
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (hijasError) throw new Error(`[Supabase] ${hijasError.message}`);

  return { ...cat, hijas: hijas ?? [] };
}

// ─── Productos ────────────────────────────────────────────────────────────────

/**
 * Devuelve todos los productos activos de una categoría (por su UUID),
 * ordenados por `orden`.
 */
export async function getProductosPorCategoria(categoriaId: string): Promise<ProductoRow[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("categoria_id", categoriaId)
    .eq("activo", true)
    .order("orden", { ascending: true });

  return throwOnError(data, error);
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
      id:           local.id,
      nombre:       local.nombre,
      precio:       local.precio,
      descripcion:  local.descripcion,
      imagenes:     local.imagenes,
      categoria_id: local.categoria_id,
      tags:         local.tags,
      activo:       local.activo,
      orden:        0,
      created_at:   new Date().toISOString(),
    } satisfies ProductoRow;
  }

  // UUID válido → consultar Supabase
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("id", id)
    .eq("activo", true)
    .maybeSingle();

  if (error) throw new Error(`[Supabase] ${error.message}`);
  return data;
}

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * Devuelve la fila única de configuración global.
 * La tabla `config` siempre tiene exactamente 1 fila (upsert).
 */
export async function getConfig(): Promise<ConfigRow | null> {
  const { data, error } = await supabase
    .from("config")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`[Supabase] ${error.message}`);
  return data;
}

// ─── Banners ──────────────────────────────────────────────────────────────────

/**
 * Devuelve los banners activos ordenados por `orden` ascendente.
 */
export async function getBanners(): Promise<BannerRow[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  return throwOnError(data, error);
}

// ─── Popup ────────────────────────────────────────────────────────────────────

/**
 * Devuelve la fila única del popup.
 * Retorna null si no existe o si está inactivo.
 */
export async function getPopup(): Promise<PopupRow | null> {
  const hoy = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const { data, error } = await supabase
    .from("popup")
    .select("*")
    .eq("activo", true)
    .or(`fecha_expiracion.is.null,fecha_expiracion.gte.${hoy}`)
    .maybeSingle();

  if (error) throw new Error(`[Supabase] ${error.message}`);
  return data;
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────

/**
 * Devuelve todas las FAQs activas ordenadas por `orden`.
 */
export async function getFaqs(): Promise<FaqRow[]> {
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  return throwOnError(data, error);
}

// ─── Distritos ────────────────────────────────────────────────────────────────

/**
 * Devuelve todos los distritos activos.
 * Se usan en el checkout para mostrar opciones y calcular el delivery.
 */
export async function getDistritos(): Promise<DistritoRow[]> {
  const { data, error } = await supabase
    .from("distritos")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  return throwOnError(data, error);
}

// ─── Ocasiones home ───────────────────────────────────────────────────────────

/**
 * Devuelve las ocasiones del home activas ordenadas por `orden`.
 */
export async function getOcasiones(): Promise<OcasionHomeRow[]> {
  const { data, error } = await supabase
    .from("ocasiones_home")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  return throwOnError(data, error);
}

// ─── Colecciones home ─────────────────────────────────────────────────────────

/**
 * Devuelve las colecciones del home activas, con join a la tabla categorias.
 * Útil para renderizar el CategoryShowcase con nombre, slug e imagen real.
 */
export async function getColecciones(): Promise<ColeccionConCategoria[]> {
  const { data, error } = await supabase
    .from("colecciones_home")
    .select(`
      *,
      categoria:categorias (
        id,
        nombre,
        slug,
        imagen_url
      )
    `)
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) throw new Error(`[Supabase] ${error.message}`);

  // Supabase devuelve el join anidado — casteamos al tipo esperado
  return (data ?? []) as ColeccionConCategoria[];
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export interface CrearPedidoInput {
  nombre_cliente: string;
  telefono:       string;
  email:          string;
  distrito_id:    string;
  direccion:      string;
  referencia?:    string;
  fecha_entrega:  string;
  hora_entrega:   string;
  notas?:         string;
  productos:      PedidoProducto[];
  subtotal:       number;
  delivery:       number;
  total:          number;
}

/**
 * Inserta un nuevo pedido en la BD.
 * Genera el número de pedido en el formato FM-XXXXXX.
 * Retorna el número de pedido generado.
 *
 * RLS: INSERT público — no requiere sesión.
 */
export async function crearPedido(input: CrearPedidoInput): Promise<string> {
  // Generar número de pedido
  const numero = `FM-${Math.floor(100000 + Math.random() * 900000)}`;

  // fecha_entrega debe llegar como "YYYY-MM-DD" desde el input[type=date] — no transformar.
  // distrito_id debe ser UUID válido — viene del select cargado desde getDistritos().

  const { error } = await supabase
    .from("pedidos")
    .insert({
      numero,
      nombre_cliente: input.nombre_cliente,
      telefono:       input.telefono,
      email:          input.email,
      distrito_id:    input.distrito_id,
      direccion:      input.direccion,
      referencia:     input.referencia ?? null,
      fecha_entrega:  input.fecha_entrega,
      hora_entrega:   input.hora_entrega,
      notas:          input.notas ?? null,
      productos:      input.productos,
      subtotal:       input.subtotal,
      delivery:       input.delivery,
      total:          input.total,
      estado:         "pendiente" as const,
    });

  if (error) throw new Error(`[Supabase] ${error.message}`);
  return numero;
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
