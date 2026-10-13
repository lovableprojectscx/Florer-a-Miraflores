# Seguridad y Control de Acceso (RLS) — Florería Miraflores

Este documento detalla el modelo de seguridad Row-Level Security (RLS) de la base de datos y Storage en Supabase (`sdrkiomeesoctsxeidmu`), el endurecimiento aplicado en la **Fase 03-B** ([`docs/sql/005-admin-rls.sql`](./sql/005-admin-rls.sql)) y el procedimiento operativo para gestionar administradores.

---

## 1. Problema Detectado (Antes de Fase 03-B)

En la configuración inicial de RLS:
- Las 10 tablas de catálogo y configuración (`banners`, `categorias`, `colecciones_home`, `config`, `distritos`, `faqs`, `ocasiones_home`, `popup`, `productos`, `tags`) tenían políticas de escritura (`FOR ALL`) con condición `auth.uid() IS NOT NULL` (o `auth.role() = 'authenticated'`).
- La tabla `pedidos` permitía `SELECT`, `UPDATE` y `DELETE` a cualquier sesión con `auth.uid() IS NOT NULL`.
- La tabla `reclamaciones` tenía la política `"Allow admin select/update to reclamaciones"` (`FOR ALL TO authenticated`) con `USING (true)` y `WITH CHECK (true)`.
- Los 4 buckets de `storage.objects` (`banners`, `categorias`, `productos`, `popup`) permitían `INSERT` y `DELETE` a cualquier usuario con rol `authenticated` sin verificar identidad.

**Riesgo:** Cualquier usuario autenticado en `auth.users` (no solo el administrador autorizado) tenía permisos totales de lectura y escritura sobre el catálogo, imágenes, pedidos y reclamaciones.

---

## 2. Solución Implementada (`docs/sql/005-admin-rls.sql`)

1. **Tabla `public.admins`:**
   - Columnas: `user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`, `email text`, `created_at timestamptz NOT NULL DEFAULT now()`.
   - Tiene **RLS activado** y **cero políticas públicas**: ni `anon` ni `authenticated` pueden leer ni modificar directamente la tabla `public.admins` desde la API REST.
2. **Función `public.is_admin()`:**
   - Definida con `SECURITY DEFINER`, `SET search_path = public` y `STABLE`.
   - Evalúa `EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())`.
   - Solo devuelve `true` si la sesión autenticada pertenece a un `user_id` registrado en `public.admins`.
3. **Políticas endurecidas con `public.is_admin()`:**
   - **Catálogo y contenido (`banners`, `categorias`, `colecciones_home`, `config`, `distritos`, `faqs`, `ocasiones_home`, `popup`, `productos`, `tags`):**
     - Lectura pública (`"Public Read <tabla>"` y `"tags_lectura_publica"`): sin cambios (`true`).
     - Escritura administrativa (`"Admin Write <tabla>"` y `"tags_escritura_admin"`, `FOR ALL TO authenticated`): exige `USING (public.is_admin())` y `WITH CHECK (public.is_admin())`.
   - **`pedidos`:**
     - Inserción pública (`insert_public` para checkout sin cuenta): sin cambios (`FOR INSERT TO anon, authenticated WITH CHECK (true)`).
     - `admin_select`, `admin_update` y `admin_delete`: exigen `public.is_admin()`.
   - **`reclamaciones`:**
     - Inserción pública (`Allow anon insert to reclamaciones` para el Libro de Reclamaciones): sin cambios (`FOR INSERT TO public WITH CHECK (true)`).
     - `Allow admin select/update to reclamaciones` (`FOR ALL TO authenticated`): exige `USING (public.is_admin())` y `WITH CHECK (public.is_admin())`.
   - **Storage (`storage.objects` en buckets `banners`, `categorias`, `productos`, `popup`):**
     - Lectura pública de imágenes (`lectura publica de <bucket>`): sin cambios.
     - Políticas de `INSERT` (`admin puede subir ...`), `UPDATE` (`admin puede actualizar ...`) y `DELETE` (`admin puede eliminar ...`): exigen `bucket_id = '<bucket>' AND public.is_admin()`.
4. **Guardas de seguridad antes del `COMMIT`:**
   - **Guarda 1:** Aborta toda la transacción si `public.admins` está vacía (por ejemplo, si no se reemplazó el placeholder del email antes de ejecutar).
   - **Guarda 2:** Recorre `pg_policies` y aborta toda la transacción listando las policies infractoras si queda cualquier policy de escritura (o lectura en `pedidos`/`reclamaciones`) cuya `qual` o `with_check` aplicable no contenga `is_admin()`, permitiendo únicamente las dos excepciones `pedidos.insert_public` y `"Allow anon insert to reclamaciones"`.

---

## 3. Cómo Agregar o Quitar un Administrador

Toda gestión de administradores se realiza desde el **SQL Editor** del Dashboard de Supabase (que ejecuta con rol `postgres`).

### 3.1. Listar los administradores actuales
```sql
SELECT user_id, email, created_at
FROM public.admins
ORDER BY created_at ASC;
```

### 3.2. Agregar un nuevo administrador
1. Crear primero el usuario en **Supabase Dashboard → Authentication → Users → Add user** (si aún no existe en `auth.users`).
2. Ejecutar en el **SQL Editor**:
```sql
INSERT INTO public.admins (user_id, email)
SELECT id, email
FROM auth.users
WHERE lower(email) = lower('nuevo-admin@floreriamiraflores.pe')
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email;
```

### 3.3. Quitar un administrador
Ejecutar en el **SQL Editor**:
```sql
DELETE FROM public.admins
WHERE lower(email) = lower('ex-admin@floreriamiraflores.pe');
```
*(Si además se elimina el usuario desde **Authentication → Users**, la cláusula `ON DELETE CASCADE` borrará automáticamente su fila en `public.admins`).*

---

## 4. Recordatorio Crítico de Configuración en Supabase Auth

En el Dashboard de Supabase (**Authentication → Providers → Email** / **User Signups**):
- **Mantener SIEMPRE DESACTIVADA la opción `"Allow new users to sign up"`** (registro público deshabilitado).
- Los clientes de Florería Miraflores compran sin crear cuenta (invitados).
- Aunque `public.is_admin()` impide que un usuario recién registrado acceda o modifique datos administrativos, mantener desactivado el registro público evita la creación no autorizada de cuentas en `auth.users`.

---

## 5. Verificación Automatizada de Seguridad

- **`npm run test:rls` (`tests/rls/rls.test.ts`):**
  - Verifica que `anon` puede leer las tablas públicas y que no puede insertar, actualizar ni eliminar en `productos` ni `categorias` (exigiendo código `42501` en `INSERT`).
  - Verifica que `anon` no puede leer, actualizar ni eliminar en `pedidos` ni `reclamaciones`.
  - **Nota sobre `INSERT` público en `pedidos` y `reclamaciones`:** No se ejecuta un `INSERT` real con `anon` durante `npm run test:rls` porque la base de datos es producción y las políticas `insert_public` / `Allow anon insert to reclamaciones` están diseñadas para aceptar la inserción, lo que crearía pedidos o reclamos falsos reales que `anon` no puede borrar. Dichas políticas se certifican mediante inspección de `pg_policies` y mediante tests E2E con interceptación de red (`tests/e2e/checkout.spec.ts`).
- **`npm run test:e2e` (`tests/e2e/admin.spec.ts`):**
  - Verifica que `/admin` sin sesión redirige a `/admin-login`.
  - Cuando se configuran `E2E_ADMIN_EMAIL` y `E2E_ADMIN_PASSWORD` en `.env.e2e.local`, inicia sesión con el administrador y recorre las 12 secciones del panel en modo solo lectura verificando que ninguna quede bloqueada antes ni después de aplicar `005-admin-rls.sql`.
