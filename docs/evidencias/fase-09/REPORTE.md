# Reporte — Fase 09: Blog Administrable para SEO

**Rama:** `fase-09-blog`  
**Fecha:** 14 de Octubre de 2026  
**Estado:** ✅ MIGRACIÓN 008 APLICADA Y VERIFICADA — CORRECCIONES COMPLETADAS

---

### Qué hice

1. **Migración SQL 008 Aplicada y Verificada (`docs/sql/008-blog.sql`)**:
   - Ajustada la función trigger `set_blog_posts_updated_at` con `LANGUAGE plpgsql SET search_path = public` para máxima seguridad contra secuestro de search_path.
   - Idempotencia total: bloque condicional `DO $$` para el trigger y policies, evitando cláusulas destructivas.
   - Creación de tabla `public.blog_posts`:
     - `id uuid pk default gen_random_uuid()`
     - `titulo text not null`
     - `slug text unique not null`
     - `resumen text` (usado también como meta description si no hay otra)
     - `contenido text not null` (Markdown)
     - `imagen_portada_url text`
     - `autor text default 'Florería Miraflores'`
     - `categoria_relacionada_id uuid references public.categorias(id) on delete set null`
     - `publicado boolean default false`
     - `fecha_publicacion timestamptz`
     - `meta_title text`, `meta_description text`
     - `created_at timestamptz default now()`, `updated_at timestamptz default now()`
   - Índices para acelerar búsquedas: `idx_blog_posts_slug`, `idx_blog_posts_publicado_fecha` y `idx_blog_posts_categoria`.
   - Políticas RLS activadas:
     - **Lectura pública (`SELECT`)**: `(publicado = true AND fecha_publicacion <= now()) OR is_admin()` (los visitantes anónimos solo leen artículos publicados vigentes; los administradores ven borradores y programados).
     - **Escritura (`INSERT, UPDATE, DELETE`)**: exclusiva para administradores autenticados mediante `is_admin()`.
   - Bucket público en Supabase Storage: `blog` con policies de subida, actualización y eliminación exclusivas para `is_admin()`.
   - Bloque de reversa (`ROLLBACK`) documentado y comentado.
   - **Aplicación:** Ejecutado mediante la herramienta MCP `apply_migration` en el proyecto `sdrkiomeesoctsxeidmu` de Supabase.

2. **Tipado TypeScript Estricto (`src/types/database.ts`)**:
   - Modelados tipos `BlogPostRow`, `BlogPostInsert`, `BlogPostUpdate` y registrados en `Database['public']['Tables']['blog_posts']`.

3. **Módulo de Lógica Pura y Utilidades (`src/lib/blog-utils.ts`)**:
   - `slugifyBlog`: conversión limpia y estricta para URLs (`á, é, í, ó, ú, ñ` -> `a, e, i, o, u, n`, eliminación de caracteres no alfanuméricos).
   - `isBlogPostVisible`: regla pura de visibilidad (`publicado === true` y `fecha_publicacion <= now`).
   - `getBlogPostStatus`: cálculo de estado ("borrador" | "programado" | "publicado").
   - `formatBlogDate`: formateo en español (`14 de octubre de 2026`).
   - `calculateReadingTime`: estimación de minutos de lectura (~200 palabras por minuto, mínimo 1 min).
   - `validarBlogPostForm`: validación estricta sin dependencias externas (título 3-200 caracteres, slug kebab-case, contenido Markdown >= 10 caracteres, resumen máx 300 caracteres).
   - `generateBlogPostingSchema`: generación de JSON-LD Schema.org estructurado con tipo `BlogPosting`.

4. **Correcciones de Código Solicitadas por el Revisor**:
   - **Escapado de JSON-LD (`src/routes/blog.$slug.tsx`)**: Inyección estructurada escapando los caracteres `<` como `\u003c` (`JSON.stringify(jsonLd).replace(/</g, "\\u003c")`) para prevenir inyecciones y cierres prematuros de etiquetas `<script>`.
   - **Código de Producción Puro (`src/lib/queries.ts`)**: Eliminado por completo el mock `"articulo-seguridad-xss"`. En producción no existe ningún dato falso ni condicionales dev-only.
   - **Pruebas de Seguridad XSS en Test Unitario (`tests/unit/blog-markdown.test.tsx`)**: Se implementó una suite unitaria dedicada con Vitest + JSDOM que renderiza `ReactMarkdown` con etiquetas `<script>` maliciosas y manejadores `<img onerror>`, comprobando que:
     - No se renderiza ningún elemento `<script>` en el DOM.
     - `window.__xss_executed` y `window.__xss_img_executed` permanecen `undefined`.
     - El escapado JSON-LD neutraliza etiquetas `</script>` en la serialización.
   - **Ajuste de E2E (`tests/e2e/blog.spec.ts`)**: Se eliminó la dependencia del mock eliminado y se prueba directamente con el artículo real publicado en base de datos (`/blog/guia-cuidado-flores-frescas`), verificando renderizado de encabezados, maquetación, y ausencia de scroll horizontal.

5. **Páginas Públicas**:
   - `/blog` (`src/routes/blog.tsx`):
     - Encabezado editorial compacto con ruta y eyebrow jerárquico.
     - Grilla responsive con tarjetas 16:9, portada optimizada, fecha, tiempo de lectura, título y resumen.
     - Paginación incremental en lotes de 12 reusando el hook `useVerMas`.
     - Estado vacío digno (`data-testid="blog-empty-state"`).
     - Metadatos `<title>` y Open Graph configurados.
   - `/blog/$slug` (`src/routes/blog.$slug.tsx`):
     - Contenedor de lectura óptima (~760px).
     - Metadatos: fecha, autor y tiempo de lectura.
     - Imagen de portada 16:9 y extracto destacado.
     - **Renderizado Markdown seguro con `react-markdown` sin `rehype-raw`**: sin HTML crudo.
     - Bloque "Te puede gustar" al final con hasta 4 arreglos activos de la categoría asociada y botón de enlace hacia dicha categoría.
     - Respuesta 404 limpia si el artículo no existe o es borrador.
     - Inyección estructurada de JSON-LD `BlogPosting` con escapado anti-XSS.

6. **Panel de Administración `/admin/blog` (`src/routes/admin/blog.tsx` & `src/routes/admin.tsx`)**:
   - Enlace "Blog" incorporado con icono `BookOpen` en el sidebar administrativo.
   - Tabla interactiva con badges de estado: Borrador (gris), Publicado (verde) y Programado (ámbar).
   - Buscador por título o slug y filtros rápidos por estado (Todos, Publicados, Borradores, Programados).
   - Acciones por fila: ver artículo público, publicar/despublicar inmediato, editar y eliminar.
   - Modal de edición avanzado:
     - Título con auto-slug dinámico y botón de regeneración manual.
     - Resumen con contador interactivo de caracteres (aviso al superar 160 caracteres).
     - Subida de portada optimizada con miniaturas WebP a bucket `blog` vía `subirImagenConMiniaturas`.
     - Editor Markdown con pestañas **"Escribir"** y **"Vista previa"**.
     - Barra de herramientas rápida: Negrita, Cursiva, H2, H3, Lista, Cita y Enlace.
     - Botón "Insertar imagen" para subir fotos al bucket `blog` e insertarlas en la posición del cursor.
     - Selector agrupado "Padre › Hija" para la categoría relacionada.
     - Selector de fecha/hora de publicación (`datetime-local`).
     - Metadatos SEO opcionales (`meta_title` y `meta_description`).
   - Modal de confirmación propio para eliminación (sin `window.confirm`).

7. **Enlaces y Navegación**:
   - Enlace a "Blog" en `src/components/Footer.tsx` bajo la columna "Sobre Nosotros".
   - Menú de navegación principal del Header **intacto**.
   - `scripts/generate-sitemap.mjs` actualizado para incluir `/blog` y consultar dinámicamente artículos de blog publicados con su fecha `lastmod`.

---

### Verificación de Base de Datos DESPUÉS de Aplicar SQL 008

#### 1. Estructura de la tabla `public.blog_posts`
**Consulta:**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'blog_posts'
ORDER BY ordinal_position;
```
**Salida cruda:**
```json
[
  {"column_name":"id","data_type":"uuid","is_nullable":"NO","column_default":"gen_random_uuid()"},
  {"column_name":"titulo","data_type":"text","is_nullable":"NO","column_default":null},
  {"column_name":"slug","data_type":"text","is_nullable":"NO","column_default":null},
  {"column_name":"resumen","data_type":"text","is_nullable":"YES","column_default":null},
  {"column_name":"contenido","data_type":"text","is_nullable":"NO","column_default":null},
  {"column_name":"imagen_portada_url","data_type":"text","is_nullable":"YES","column_default":null},
  {"column_name":"autor","data_type":"text","is_nullable":"YES","column_default":"'Florería Miraflores'::text"},
  {"column_name":"categoria_relacionada_id","data_type":"uuid","is_nullable":"YES","column_default":null},
  {"column_name":"publicado","data_type":"boolean","is_nullable":"NO","column_default":"false"},
  {"column_name":"fecha_publicacion","data_type":"timestamp with time zone","is_nullable":"YES","column_default":null},
  {"column_name":"meta_title","data_type":"text","is_nullable":"YES","column_default":null},
  {"column_name":"meta_description","data_type":"text","is_nullable":"YES","column_default":null},
  {"column_name":"created_at","data_type":"timestamp with time zone","is_nullable":"NO","column_default":"now()"},
  {"column_name":"updated_at","data_type":"timestamp with time zone","is_nullable":"NO","column_default":"now()"}
]
```

#### 2. Estado de Row Level Security
**Consulta:**
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts';
```
**Salida cruda:**
```json
[{"tablename":"blog_posts","rowsecurity":true}]
```

#### 3. Políticas RLS en `blog_posts`
**Consulta:**
```sql
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'blog_posts';
```
**Salida cruda:**
```json
[
  {
    "policyname":"Public Read blog_posts",
    "permissive":"PERMISSIVE",
    "roles":"{public}",
    "cmd":"SELECT",
    "qual":"(((publicado = true) AND (fecha_publicacion <= now())) OR is_admin())",
    "with_check":null
  },
  {
    "policyname":"Admin Write blog_posts",
    "permissive":"PERMISSIVE",
    "roles":"{authenticated}",
    "cmd":"ALL",
    "qual":"is_admin()",
    "with_check":"is_admin()"
  }
]
```

#### 4. Bucket de Almacenamiento en Supabase Storage
**Consulta:**
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'blog';
```
**Salida cruda:**
```json
[{"id":"blog","name":"blog","public":true}]
```

---

### Declaración de Archivos Descartados

- **No se descartó ningún archivo con `git checkout --`, `git restore`, `git clean` ni `Remove-Item`.**
- Todos los cambios de código, pruebas y documentación se mantuvieron intactos y versionados de manera limpia.

---

### Evidencias Técnicas

1. **Verificación Completa (`npm run verify`)**:
   - Archivo guardado en: [`docs/evidencias/fase-09/verify.txt`](file:///docs/evidencias/fase-09/verify.txt)
   - **ESLint**: 0 errores.
   - **TypeScript (`tsc --noEmit`)**: 0 errores.
   - **Vitest**: 13 suites pasando al 100%, 126 pruebas unitarias exitosas (incluyendo la suite de seguridad Markdown XSS en `tests/unit/blog-markdown.test.tsx`).
   - **Build**: Compilaciones de cliente y SSR exitosas.

2. **Tests E2E de Playwright (`tests/e2e/blog.spec.ts`)**:
   - Archivo guardado en: [`docs/evidencias/fase-09/e2e.txt`](file:///docs/evidencias/fase-09/e2e.txt)
   - 10 pruebas del blog pasando al 100% (2 pruebas de escritura CRUD omitidas controladamente bajo `E2E_ALLOW_WRITES=1`).
   - Verificaciones automáticas de `/blog`, navegación de footer, 404 de artículos inexistentes, detalle de artículo publicado real y navegación administrativa a `/admin/blog` con apertura del editor.

3. **Capturas de Pantalla Generadas en `docs/evidencias/fase-09/`**:
   - [`docs/evidencias/fase-09/blog-listado-1440.png`](file:///docs/evidencias/fase-09/blog-listado-1440.png): Listado editorial `/blog` en escritorio (1440px).
   - [`docs/evidencias/fase-09/blog-listado-390.png`](file:///docs/evidencias/fase-09/blog-listado-390.png): Listado editorial `/blog` en móvil (390px).
   - [`docs/evidencias/fase-09/blog-articulo-1440.png`](file:///docs/evidencias/fase-09/blog-articulo-1440.png): Detalle de artículo en escritorio (1440px).
   - [`docs/evidencias/fase-09/blog-articulo-390.png`](file:///docs/evidencias/fase-09/blog-articulo-390.png): Detalle de artículo en móvil (390px).
   - [`docs/evidencias/fase-09/admin-blog-desktop-1440.png`](file:///docs/evidencias/fase-09/admin-blog-desktop-1440.png): Panel de administración de artículos en escritorio (1440px).
   - [`docs/evidencias/fase-09/admin-blog-mobile-390.png`](file:///docs/evidencias/fase-09/admin-blog-mobile-390.png): Panel de administración de artículos en móvil (390px).
   - [`docs/evidencias/fase-09/admin-blog-editor-1440.png`](file:///docs/evidencias/fase-09/admin-blog-editor-1440.png): Editor con pestañas Escribir / Vista previa (1440px).
   - [`docs/evidencias/fase-09/admin-blog-editor-390.png`](file:///docs/evidencias/fase-09/admin-blog-editor-390.png): Editor en móvil (390px).
