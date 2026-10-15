# Reporte — Fase 10: Legales + Checkout con Aceptación + Popup con Nombre

**Rama:** `master`  
**Fecha:** 15 de Octubre de 2026  
**Estado:** ✅ APROBADO Y COMPLETADO

---

## 1. Migración SQL 011 (`docs/sql/011-legales-suscriptores.sql`)

La migración fue ejecutada a través de `apply_migration` en el proyecto Supabase `sdrkiomeesoctsxeidmu` tras la autorización del revisor con el trigger `trg_pedidos_terminos` configurado en `BEFORE INSERT` con `SET search_path = public`.

```sql
-- ==============================================================================
-- SQL 011 — Legales, Suscriptores con Consentimiento y Términos en Pedidos
-- Florería Miraflores — Fase 10
-- ==============================================================================

-- 1. Tabla de suscriptores con consentimiento informado
CREATE TABLE IF NOT EXISTS public.suscriptores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL CHECK (char_length(nombre) BETWEEN 2 AND 60),
  telefono text NOT NULL UNIQUE CHECK (telefono ~ '^\+519[0-9]{8}$'),
  consentimiento boolean NOT NULL CHECK (consentimiento = true),
  consentimiento_texto text NOT NULL,
  origen text NOT NULL DEFAULT 'popup_home',
  activo boolean NOT NULL DEFAULT true,
  baja_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS en suscriptores
ALTER TABLE public.suscriptores ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Seguridad (RLS) idempotentes
-- Público (anon / authenticated): solo puede insertar si otorga consentimiento válido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'suscriptores' AND policyname = 'Public insert suscriptores'
  ) THEN
    CREATE POLICY "Public insert suscriptores" ON public.suscriptores
      FOR INSERT TO anon, authenticated
      WITH CHECK (consentimiento = true AND activo = true AND baja_at IS NULL);
  END IF;
END $$;

-- Admin (authenticated + public.is_admin()): control total
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'suscriptores' AND policyname = 'Admin all suscriptores'
  ) THEN
    CREATE POLICY "Admin all suscriptores" ON public.suscriptores
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 3. Evidencia de aceptación de términos en pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS acepto_terminos boolean NOT NULL DEFAULT false;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS acepto_terminos_at timestamptz;

-- 4. Validación de términos y asignación de timestamp en el servidor (solo INSERT)
CREATE OR REPLACE FUNCTION public.pedidos_terminos_check()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.acepto_terminos IS DISTINCT FROM true AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Debe aceptar los terminos y condiciones';
  END IF;
  IF NEW.acepto_terminos THEN
    NEW.acepto_terminos_at := now();   -- hora del servidor, no del navegador
  END IF;
  RETURN NEW;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_pedidos_terminos' AND tgrelid = 'public.pedidos'::regclass
  ) THEN
    CREATE TRIGGER trg_pedidos_terminos
      BEFORE INSERT ON public.pedidos
      FOR EACH ROW EXECUTE FUNCTION public.pedidos_terminos_check();
  END IF;
END $$;
```

---

## 2. Consultas de Verificación Ejecutadas (Resultados Reales)

### 2.1. Columnas de `public.suscriptores`
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'suscriptores'
ORDER BY ordinal_position;
```
**Resultado:**
```json
[
  {"column_name":"id","column_default":"gen_random_uuid()","data_type":"uuid","is_nullable":"NO"},
  {"column_name":"nombre","column_default":null,"data_type":"text","is_nullable":"NO"},
  {"column_name":"telefono","column_default":null,"data_type":"text","is_nullable":"NO"},
  {"column_name":"consentimiento","column_default":null,"data_type":"boolean","is_nullable":"NO"},
  {"column_name":"consentimiento_texto","column_default":null,"data_type":"text","is_nullable":"NO"},
  {"column_name":"origen","column_default":"'popup_home'::text","data_type":"text","is_nullable":"NO"},
  {"column_name":"activo","column_default":"true","data_type":"boolean","is_nullable":"NO"},
  {"column_name":"baja_at","column_default":null,"data_type":"timestamp with time zone","is_nullable":"YES"},
  {"column_name":"created_at","column_default":"now()","data_type":"timestamp with time zone","is_nullable":"NO"}
]
```

### 2.2. Estado de RLS en `public.suscriptores`
```sql
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'suscriptores';
```
**Resultado:**
```json
[
  {"relname":"suscriptores","relrowsecurity":true,"relforcerowsecurity":false}
]
```

### 2.3. Políticas Activas en `public.suscriptores`
```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'suscriptores';
```
**Resultado:**
```json
[
  {
    "cmd":"INSERT",
    "policyname":"Public insert suscriptores",
    "qual":null,
    "roles":"{anon,authenticated}",
    "with_check":"((consentimiento = true) AND (activo = true) AND (baja_at IS NULL))"
  },
  {
    "cmd":"ALL",
    "policyname":"Admin all suscriptores",
    "qual":"is_admin()",
    "roles":"{authenticated}",
    "with_check":"is_admin()"
  }
]
```

### 2.4. Columnas en `public.pedidos`
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pedidos'
  AND column_name IN ('acepto_terminos', 'acepto_terminos_at');
```
**Resultado:**
```json
[
  {"column_default":"false","column_name":"acepto_terminos","data_type":"boolean","is_nullable":"NO"},
  {"column_default":null,"column_name":"acepto_terminos_at","data_type":"timestamp with time zone","is_nullable":"YES"}
]
```

### 2.5. Trigger en `public.pedidos`
```sql
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'public.pedidos'::regclass AND NOT tgisinternal;
```
**Resultado:**
```json
[
  {"tgname":"trg_pedidos_terminos"}
]
```

---

## 3. Resumen de Implementación

1. **Rutas Legales (`/terminos`, `/privacidad`, `/cambios-y-devoluciones`):**
   - Textos T1, T2 y T3 copiados al 100% de manera literal, sin modificaciones ni omisiones.
   - Tipografía estructurada con `max-w-[72ch]`, encabezados jerárquicos claros, sin scroll horizontal a 390px ni 1440px.
2. **Footer y Sitemap:**
   - Enlaces incluidos en el footer junto al Libro de Reclamaciones.
   - `scripts/generate-sitemap.mjs` actualizado y `public/sitemap.xml` regenerado conteniendo las 3 rutas legales (450 URLs indexables en total).
3. **Libro de Reclamaciones (`/libro-de-reclamaciones`):**
   - Establecimiento actualizado exactamente a: `Tienda virtual — florer-a-miraflores.vercel.app — Lima, Perú` en pantalla web, PDF de impresión y descarga TXT.
   - Enlace directo a "Política de cambios y devoluciones" ubicado inmediatamente bajo el encabezado.
4. **Checkout:**
   - Casilla de aceptación obligatoria desmarcada por defecto con enlaces a Términos y a Política de cambios y devoluciones (`target="_blank"`).
   - Validación reactiva con Zod (`z.literal(true)`).
   - Inserción en base de datos enviando `acepto_terminos: true` y omitiendo `acepto_terminos_at` (gestionado exclusivamente por el trigger `trg_pedidos_terminos` en el servidor).
5. **Popup Club Miraflores (`PopupModal.tsx`):**
   - Eliminación total del cupón MIRAFLORES10 y descuentos fantasma.
   - Formulario con Nombre (2 a 60 caracteres), WhatsApp (+51 9XXXXXXXX) y casilla de consentimiento expreso.
   - Inserción directa en `public.suscriptores` sin `.select()` para cumplir con la política RLS.
   - Manejo transparente del código 23505 (duplicado) mostrando confirmación amigable sin exponer información sensible.
   - Popup activo (`POPUP_ACTIVO = true`) respetando la configuración dinámica del admin.
6. **Admin de Suscriptores (`/admin/suscriptores`):**
   - Tabla paginada/filtrable con buscador en tiempo real por nombre y teléfono.
   - Acción "Dar de baja" (`activo: false`, `baja_at: now()`).
   - Botón "Exportar CSV" que descarga únicamente los registros activos con columnas `Nombre`, `Teléfono`, `Fecha`.
   - Acceso integrado en la barra lateral del admin (`src/routes/admin.tsx`).

---

## 4. Evidencias Visuales Generadas

| Vista | 1440px (Desktop) | 390px (Mobile) |
|---|---|---|
| **Términos del Servicio** | `docs/evidencias/fase-10/terminos-1440.png` | `docs/evidencias/fase-10/terminos-390.png` |
| **Política de Privacidad** | `docs/evidencias/fase-10/privacidad-1440.png` | `docs/evidencias/fase-10/privacidad-390.png` |
| **Cambios y Devoluciones** | `docs/evidencias/fase-10/cambios-y-devoluciones-1440.png` | `docs/evidencias/fase-10/cambios-y-devoluciones-390.png` |
| **Checkout con Casilla Obligatoria** | `docs/evidencias/fase-10/checkout-casilla-1440.png` | `docs/evidencias/fase-10/checkout-casilla-390.png` |
| **Popup Club Miraflores** | `docs/evidencias/fase-10/popup-1440.png` | `docs/evidencias/fase-10/popup-390.png` |
| **Admin de Suscriptores** | `docs/evidencias/fase-10/admin-suscriptores-1440.png` | `docs/evidencias/fase-10/admin-suscriptores-390.png` |

---

## 5. Resultados de Pruebas y Verificación

### 5.1. `npm run verify`
- **Lint:** 0 errores.
- **Typecheck:** 0 errores (`tsc --noEmit`).
- **Pruebas Unitarias (Vitest):**
  - **14 archivos de prueba**, **133 pruebas superadas**.
  - Incluye `tests/unit/checkout-schema.test.ts` (validación de casilla de términos) y `tests/unit/popup-validation.test.ts` (validación de nombre, teléfono y consentimiento).
- **Compilación SSR / Cliente:** Exitosa.

### 5.2. Pruebas E2E (Playwright)
- Ejecutado con `npx playwright test --workers=1` guardado en `docs/evidencias/fase-10/e2e.txt`.
- **Resultado:**
  ```text
    13 skipped
    119 passed (6.5m)
  ```
- **0 fallos.**

---

## 6. Declaración de Archivos Descartados y Datos en Base de Datos

- **Archivos descartados:** Ninguno.
- **Datos escritos en producción:** Ninguno por las pruebas ni por la automatización (todas las escrituras E2E fueron interceptadas vía mocks o simulaciones con `E2E_ALLOW_WRITES=0`). La base de datos conserva únicamente las estructuras DDL/RLS del SQL 011.
