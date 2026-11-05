-- ============================================================================
-- SQL 014: Calibración de Menús de Sofía (Ocasión, Condolencias, Complementos)
--          y Sección Orquídeas / Globos en Tags del Home
-- Proyecto: Florería Miraflores
-- Fecha: 2026-11-04
-- ============================================================================

BEGIN;

-- 1. OCASIÓN: Orden exacto solicitado por Sofía en WhatsApp
-- 1: Amor, 2: Cumpleaños, 3: Floreros, 4: Mejórate pronto, luego el resto
UPDATE categorias SET orden = 1 WHERE id = '2978fbd0-defa-4a07-94db-8dfc1070ab94'; -- Amor / Aniversario
UPDATE categorias SET orden = 2 WHERE id = '52eba7b8-c70e-42dd-a7ea-c5ed80a360f6'; -- Cumpleaños
UPDATE categorias SET parent_id = '7d02d578-f32c-4b3d-82c6-6194ee0e2a82', orden = 3 WHERE id = 'c65ccce3-7783-43b2-9bbd-05eb8a48e550'; -- Floreros
UPDATE categorias SET orden = 4 WHERE id = 'dace9661-0e12-469e-9fe0-4bd26560d865'; -- Mejorate Pronto
UPDATE categorias SET orden = 5 WHERE id = '7d3faa5a-2094-4237-a2cd-7d46d8666450'; -- Para Él
UPDATE categorias SET orden = 6 WHERE id = 'dd8eb966-4ba2-4085-b909-6da4fc58c9ce'; -- Graduación
UPDATE categorias SET orden = 7 WHERE id = '9a4ec235-9fa8-42f2-9620-8de63e256b35'; -- Inauguración/ Aniversario

-- 2. CONDOLENCIAS: Orden exacto solicitado por Sofía en WhatsApp
-- 1: Lágrimas, 2: Lágrima con pedestal, 3: Coronas, 4: Cruces
UPDATE categorias SET orden = 1 WHERE id = '3044ac75-5545-4d0f-a636-e5b97248def4'; -- Lágrimas
UPDATE categorias SET orden = 2 WHERE id = '581afa16-236f-47aa-b3aa-d0054ada8081'; -- Lágrima con Pedestal
UPDATE categorias SET orden = 3 WHERE id = 'e3f73ae6-9cbd-49f1-b9a8-b81244131fd5'; -- Coronas Fúnebres
UPDATE categorias SET orden = 4 WHERE id = '4c777708-89be-43b6-86c8-3b22e533d1d5'; -- Cruces

-- 3. COMPLEMENTOS: Los 6 elementos en el orden solicitado por Sofía
UPDATE categorias SET orden = 1, activo = true WHERE id = 'd6b66d30-58b8-4485-8cbe-af7c7ee83ea8'; -- Globos
UPDATE categorias SET orden = 2, activo = true WHERE id = 'a25eeb18-775f-4afd-9c13-2d1404afd1a3'; -- Peluches
UPDATE categorias SET orden = 3, activo = true WHERE id = 'e7cd1f62-4019-4c0c-bed4-03f3955e034d'; -- Chocolates
UPDATE categorias SET nombre = 'Vinos', slug = 'vinos', orden = 4, activo = true WHERE id = '272d5713-4d16-4cf9-8ae6-50318ef5db7e'; -- Vinos (antes Licores)

-- Insertar "Globos con helio" bajo Complementos si no existe
INSERT INTO categorias (nombre, slug, parent_id, orden, activo)
VALUES ('Globos con helio', 'globos-con-helio', 'c9b7c3a1-050b-46e5-b91c-7c94aabdc178', 5, true)
ON CONFLICT (slug) DO UPDATE SET
  nombre = 'Globos con helio',
  parent_id = 'c9b7c3a1-050b-46e5-b91c-7c94aabdc178',
  orden = 5,
  activo = true;

UPDATE categorias SET orden = 6, activo = true WHERE id = 'ef9da10f-d0d2-4b74-b198-1916bb6330fe'; -- Toppers

-- 4. TAGS DEL HOME: Posicionar Orquídeas después de Ofertas Especiales y Globos abajo
UPDATE tags SET orden = 5 WHERE clave = 'oferta';

INSERT INTO tags (clave, nombre, descripcion, orden, activo, mostrar_en_home, color_badge)
VALUES (
  'orquideas',
  'Orquídeas',
  'Elegancia y distinción floral con las orquídeas más exclusivas de la temporada.',
  6,
  true,
  true,
  '#5C4033'
)
ON CONFLICT (clave) DO UPDATE SET
  nombre = 'Orquídeas',
  descripcion = 'Elegancia y distinción floral con las orquídeas más exclusivas de la temporada.',
  orden = 6,
  activo = true,
  mostrar_en_home = true;

UPDATE tags SET orden = 7 WHERE clave = 'globos_para_enamorar';

COMMIT;
