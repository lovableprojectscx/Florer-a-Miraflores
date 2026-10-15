# PROMPT 09 — Blog administrable (para SEO)

> Mandar DESPUÉS de que la Fase 07 (reseñas) esté aprobada por el revisor.
> Reglas del 00 vigentes (SQL: mostrar, esperar "SQL 008 aprobado por el revisor", ejecutar por MCP, pegar después).

Rama: `fase-09-blog` desde master actualizado.

## Objetivo

Que Sofía o la encargada publiquen artículos ("Qué flores regalar en un aniversario", "Significado de los colores de las rosas", "Cómo cuidar tus tulipanes") desde el admin, sin tocar código, y que cada artículo lleve a productos y categorías reales.

## 1. Base de datos — `docs/sql/008-blog.sql` (idempotente, con reversa comentada)

Tabla `blog_posts`:

- `id uuid pk`, `titulo text not null`, `slug text unique not null`, `resumen text` (máx ~160 caracteres, se usa también como meta description si no hay otra)
- `contenido text not null` (Markdown)
- `imagen_portada_url text`, `autor text default 'Florería Miraflores'`
- `categoria_relacionada_id uuid references categorias(id) on delete set null` (opcional)
- `publicado bool default false`, `fecha_publicacion timestamptz`
- `meta_title text`, `meta_description text`
- `created_at`, `updated_at` (trigger que actualice updated_at)
  RLS: SELECT público solo `publicado = true AND fecha_publicacion <= now()`; escrituras solo `is_admin()` (copiar la condición de las tablas existentes).
  Bucket `blog` con lectura pública y escritura `is_admin()`, igual que `banners`.

## 2. Páginas públicas

- `/blog`: lista de artículos publicados, más recientes primero, tarjetas con portada (aspect 16:9), título, resumen y fecha. "Ver más" en lotes de 12 (reusar `use-ver-mas`). Estado vacío digno.
- `/blog/$slug`: portada, título, fecha, autor, contenido. Al final, bloque "Te puede gustar" con 4 productos activos de `categoria_relacionada_id` (si tiene) y botón a esa categoría. 404 limpio si el slug no existe o no está publicado.
- Markdown renderizado con `react-markdown` **sin** `rehype-raw` (nada de HTML crudo, nada de `dangerouslySetInnerHTML`). Permitir títulos, negritas, listas, enlaces e imágenes. Enlaces externos con `rel="noopener"`.
- Ancho de lectura cómodo (~700px), tipografía del sitio, imágenes del contenido con `loading="lazy"`.

## 3. Enlaces

- Footer: "Blog". NO tocar el menú principal del header.

## 4. Admin `/admin/blog`

- Lista con estado (Borrador / Publicado / Programado), buscar por título, acciones editar / publicar / despublicar / eliminar (con confirmación en modal propio, nada de `window.confirm`).
- Editor: título (el slug se genera solo, editable, validando que sea único), resumen con contador de caracteres, portada (subida con `subirImagenConMiniaturas`), contenido Markdown con pestañas **Escribir / Vista previa**, botón "Insertar imagen" que sube la foto y pega el Markdown, categoría relacionada (selector "Padre › Hija" como en productos), fecha de publicación, campos SEO opcionales.
- Toasts de error y éxito. Si la tabla no existe: "Falta correr el SQL 008".

## 5. SEO

- `<title>` = meta_title o "Título | Blog Florería Miraflores"; meta description = meta_description o resumen.
- Open Graph (og:title, og:description, og:image = portada).
- JSON-LD `BlogPosting` con datos reales (headline, image, datePublished, dateModified, author).
- `/blog` y cada artículo publicado en el sitemap. Si el sitemap es estático (script), explica cómo se actualiza al publicar y propón la solución más simple (ej. ruta de sitemap dinámica servida por SSR). No la implementes sin decirlo en el reporte.

## 6. Tests

- Vitest: generación de slug (tildes, ñ, espacios, signos → "que-flores-regalar-en-un-aniversario"); validación del formulario; regla de visibilidad (publicado + fecha).
- Playwright: `/blog` y un artículo cargan sin errores en mobile y desktop, sin scroll horizontal; slug inexistente → 404; el Markdown no ejecuta HTML (un `<script>` en el contenido se muestra como texto o se ignora). CRUD de admin solo con `E2E_ALLOW_WRITES=1` con `[E2E]` en el título, y borrarlo al final.
- RLS: anon no puede insertar ni leer borradores.

## 7. Documentación

`docs/BASE-DE-DATOS.md`, `docs/REQUISITOS-FUNCIONALES.md`, `docs/ACTUALIZACIONES.md` y `docs/GUIA-PANEL-BLOG.md` (guía corta: cómo escribir, insertar fotos, enlazar a productos y publicar).

**No publiques artículos de ejemplo en producción.** Jack y Claude preparan los primeros artículos aparte.

## Cierre

verify + E2E guardados en archivo, capturas de `/blog`, un artículo y el editor (390 y 1440), merge a master, push, captura de la web real después de confirmar el deploy.
Reporte con el formato del 00.
