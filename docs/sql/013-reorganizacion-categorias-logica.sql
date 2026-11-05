-- ============================================================================
-- SQL 013: Reorganización Lógica de Categorías y Subcategorías
-- Proyecto: Florería Miraflores
-- Fecha: 2026-11-04
-- Objetivo:
--   1. Retirar "Centros de mesa" y "Floreros" de la categoría "Ocasión" y
--      conectarlas adecuadamente como subcategorías de "Arreglos Florales".
--   2. Promover "Ramos" (61 productos) y "Arreglos Premium" (54 productos)
--      a categorías Padre principales en la barra de navegación para máxima
--      conversión comercial.
--   3. Desactivar categorías vacías obsoletas que generan ruido en el panel admin.
--   4. Calibrar el orden numérico de las categorías principales para un
--      recorrido de compra armónico y equilibrado.
-- ============================================================================

BEGIN;

-- 1. Mover "Centros de mesa" (53a62cb8) bajo "Arreglos Florales" (bf0b8e45)
UPDATE categorias
SET parent_id = 'bf0b8e45-756a-4ddb-81f6-0079b80b052a',
    orden = 4
WHERE id = '53a62cb8-c9df-41ef-b2ce-1284126ce22d';

-- 2. Mover "Floreros" (c65ccce3) bajo "Arreglos Florales" (bf0b8e45)
UPDATE categorias
SET parent_id = 'bf0b8e45-756a-4ddb-81f6-0079b80b052a',
    orden = 5
WHERE id = 'c65ccce3-7783-43b2-9bbd-05eb8a48e550';

-- 3. Promover "Ramos" (c98bd545) a Categoría Padre principal (parent_id = NULL)
UPDATE categorias
SET parent_id = NULL,
    orden = 3
WHERE id = 'c98bd545-af26-4ff0-a5b3-08ffef4fa9cf';

-- 4. Promover "Arreglos Premium" (a7a4a6c0) a Categoría Padre principal (parent_id = NULL)
UPDATE categorias
SET parent_id = NULL,
    orden = 4
WHERE id = 'a7a4a6c0-784a-4415-818a-5921f04e57a7';

-- 5. Calibrar orden de las Categorías Padre para una navegación balanceada
-- 1: Ocasión
UPDATE categorias SET orden = 1 WHERE id = '7d02d578-f32c-4b3d-82c6-6194ee0e2a82';
-- 2: Arreglos Florales
UPDATE categorias SET orden = 2 WHERE id = 'bf0b8e45-756a-4ddb-81f6-0079b80b052a';
-- 3: Ramos (promovida arriba con orden 3)
-- 4: Arreglos Premium (promovida arriba con orden 4)
-- 5: Nacimientos
UPDATE categorias SET orden = 5 WHERE id = '2b240ece-fd0e-4771-82da-40fab2dd1945';
-- 6: Tulipanes
UPDATE categorias SET orden = 6 WHERE id = 'a7511a7c-a64b-427b-bc19-82da00ce63cc';
-- 7: Primaverales
UPDATE categorias SET orden = 7 WHERE id = '4acfcfea-15a6-44c8-a0cc-500f420648cf';
-- 8: Condolencias
UPDATE categorias SET orden = 8 WHERE id = '99ef0939-f5c5-4d0b-9aeb-41040869b7d4';
-- 9: Complementos
UPDATE categorias SET orden = 9 WHERE id = 'c9b7c3a1-050b-46e5-b91c-7c94aabdc178';
-- 10: Corporativos
UPDATE categorias SET orden = 10 WHERE id = '7709a36a-fe12-4d5b-9038-33b66d3952ef';

-- 6. Desactivar categorías vacías huérfanas (0 productos) para evitar confusión en el admin
UPDATE categorias
SET activo = false
WHERE id IN (
  'ad64e679-5efc-41c7-bc0b-3f5fedb44d29', -- Centro de Mesa vacío duplicado
  '7d64b58f-b280-47be-ae99-e4104d868c41', -- Box con Chocolates (0 productos)
  'dc8c0325-67ca-42ac-91c6-76a5aee2250f', -- Mantos en condolencias (0 productos)
  '091e027b-edb7-48ec-b239-15027eee2f15', -- Flores Amarillas (0 productos)
  '1e64bfa4-a0c6-4a5a-915b-80be9279be57', -- Orquideas Fiesta Prom (0 productos)
  '0e100bb6-7c3f-40bf-b93e-22fcce497359'  -- Navidad (0 productos)
);

COMMIT;
