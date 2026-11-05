# Informe Técnico de Incidencias y Soluciones

**Proyecto:** Florería Miraflores  
**Fecha:** 30 de Septiembre, 2026  
**Módulos afectados:** Tags de Productos, Ficha de Producto, Catálogo, Panel de Administración (`/admin/productos`)

---

## 1. Incidencia 1: El color del tag "Globos para enamorar" se muestra negro en la web

### Descripción del síntoma

Al acceder a la ficha de productos con globos (por ejemplo, _Bouquet Celebración & Corazones Deluxe_), la insignia superior izquierda de la foto mostraba:

- **Texto:** `FLORES_Y_GLOBOS_PARA_SORPRENDER` (clave cruda en mayúsculas).
- **Color de fondo:** Negro (`#2C2420`).
- **Comportamiento anómalo:** Por más que se cambiaba el color del tag _Globos para enamorar_ en el panel administrativo (`/admin/tags`), la tienda seguía mostrando el tag negro.

### Causa raíz identificada

1. En la base de datos, la tabla `tags` contenía el registro:
   - `clave`: `"globos_para_enamorar"`
   - `nombre`: `"Globos para enamorar"`
   - `color_badge`: `"#eb0089"` (Fucsia/Rosa vivo)
2. Sin embargo, los productos previamente importados en la tabla `productos` tenían guardado en su array de tags la clave histórica:
   - `tags`: `["flores_y_globos_para_sorprender"]`
3. Al renderizar la insignia en el frontend (`producto.$id.tsx`, `ProductGrid.tsx`, etc.), el código buscaba:
   ```ts
   const tagObj = tags.find((t) => t.clave === firstTag);
   ```
   Al no coincidir `"flores_y_globos_para_sorprender"` con `"globos_para_enamorar"`, la función devolvía `undefined`.
4. El sistema aplicaba el fallback por defecto:
   - Nombre: `firstTag.toUpperCase()` (`FLORES_Y_GLOBOS_PARA_SORPRENDER`)
   - Color: `bg-[#2C2420] text-white` (Negro).

### Solución implementada

1. **Módulo de resolución de alias (`src/lib/tag-utils.ts`):**
   - Se creó `findTagByClave()` y `getTagBadgeInfo()` que resuelven alias bidireccionales de forma automática.
   - Cualquier variación histórica (`flores_y_globos_para_sorprender`, `globos`, `balon`) se vincula de inmediato a la configuración activa de `globos_para_enamorar`.
2. **Actualización visual en componentes:**
   - Actualizado en `producto.$id.tsx` (detalle), `ProductGrid.tsx` (catálogo) y `admin/productos.tsx` (tabla de administración y tarjetas móviles).
   - Ahora muestra: **`GLOBOS PARA ENAMORAR`** con el color dinámico asignado en el admin (`#eb0089` o el que se configure).
3. **Auto-migración en Supabase:**
   - Al ingresar al panel `/admin/productos`, el sistema ejecuta una verificación autenticada en segundo plano para actualizar de forma permanente cualquier producto con clave antigua en la base de datos hacia `globos_para_enamorar`.

---

## 2. Incidencia 2: Sensación de producto borrado al editar en el Administrador

### Descripción del síntoma

Al editar un producto en `/admin/productos` (por ejemplo, renombrar un borrador como `Borrador - 8`), una vez guardados los cambios, el usuario sentía que el producto se había borrado, aunque luego lo encontraba ubicado más abajo o al final de la lista (_"salió atrás"_).

### Causa raíz identificada

1. El listado de productos en `/admin/productos` se ordenaba por defecto exclusivamente por **`nombre ASC` (orden alfabético ascendente)**.
2. Los borradores recién subidos o productos no nombrados comenzaban con la letra **`B`** (`Borrador...`), situándose en los primeros lugares de la lista.
3. Al editarlos y asignarles nombres reales como `Ramillete...`, `Box Luxury...` o `Velvet Box...`, el sistema reordenaba la tabla alfabéticamente:
   - El producto cambiaba de posición de forma instantánea, desplazándose decenas de filas hacia abajo.
   - Al cerrarse el modal de edición, el scroll permanecía en la cabecera, haciendo creer al administrador que el producto había desaparecido.

### Solución implementada

1. **Selector de ordenamiento enriquecido:**
   - Se añadió en la barra de filtros un selector de orden con la opción por defecto o seleccionable:
     - **"Más recientes primero" (`created_at DESC`)**
     - "Nombre (A - Z)" / "Nombre (Z - A)"
     - "Precio: Menor a Mayor" / "Precio: Mayor a Menor"
2. **Banner flotante de confirmación:**
   - Al guardar exitosamente una creación o edición, aparece un aviso verde destacado:
     `✓ Producto "[Nombre del Producto]" actualizado correctamente.`
3. **Resalte visual y desplazamiento automático (Auto-scroll):**
   - La fila del producto editado (`id="prod-row-[id]"`) se resalta durante 6 segundos con fondo dorado/ámbar suave y borde iluminado (`bg-amber-50 ring-2 ring-amber-400`).
   - La pantalla realiza un `scrollIntoView({ behavior: "smooth", block: "center" })` automático hasta la posición exacta del producto editado, garantizando que el usuario nunca lo pierda de vista.

---

## 3. Incidencia 3: Fecha mínima de entrega con desfase horario UTC vs Lima (Fase 05)

### Descripción del síntoma

Al realizar compras nocturnas en `/checkout` a partir de las 7:00 p. m. (19:00), el calendario del selector de fecha marcaba como fecha mínima **pasado mañana**, impidiendo que los clientes seleccionaran la entrega para el día siguiente ("mañana").

### Causa raíz identificada

1. La función `getFechaMinima()` en `src/lib/checkout-schema.ts` realizaba:
   ```ts
   const d = new Date();
   d.setDate(d.getDate() + 1);
   return d.toISOString().split("T")[0];
   ```
2. Lima se encuentra en zona horaria UTC−5. A las 19:00 (7:00 p. m.) en Lima, el reloj UTC ya marca las 00:00 del día siguiente.
3. Al llamar a `.toISOString()`, se convertía la fecha al huso horario UTC en lugar del calendario local de Lima. Si a eso se le sumaba 1 día adicional, el resultado saltaba 2 días en el futuro con respecto a la fecha real en Perú. Además, en SSR (servidores en UTC como Vercel) y en clientes en distintas zonas horarias se producían discrepancias de validación.

### Solución implementada

1. Cálculo explícito en la zona horaria `America/Lima` con `Intl.DateTimeFormat`:
   ```ts
   export function getFechaMinima(baseDate: Date = new Date()): string {
     const formatter = new Intl.DateTimeFormat("en-CA", {
       timeZone: "America/Lima",
       year: "numeric",
       month: "2-digit",
       day: "2-digit",
     });
     const [yearStr, monthStr, dayStr] = formatter.format(baseDate).split("-");
     const tomorrowUtc = new Date(
       Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr) + 1),
     );
     return tomorrowUtc.toISOString().split("T")[0];
   }
   ```
2. Se utiliza la misma función tanto para el atributo `min` del input como en la regla `.refine()` de validación con Zod.
3. Se certificó mediante tests unitarios con `vi.setSystemTime` para las 10:00, 18:59, 19:00, 23:59 y el 31 de diciembre a las 21:00 en Lima, así como test E2E con reloj fijado en Playwright (`page.clock.setFixedTime`).

---

## 4. Incidencia 4: Riesgo de fallo en checkout por colisión de número de pedido (Fase 05)

### Descripción del síntoma

Si un cliente realizaba un pedido y la generación aleatoria de número de pedido coincidía con un número ya existente en la base de datos, el cliente recibía un error inesperado al intentar pagar y el pedido no se registraba.

### Causa raíz identificada

1. La tabla `pedidos` tiene una restricción `UNIQUE (numero)`.
2. `crearPedido()` en `src/lib/queries.ts` generaba `FM-` + 6 dígitos aleatorios y ejecutaba un único `insert`.
3. Ante una colisión de clave única (código de error de PostgreSQL `23505`), la función lanzaba una excepción no controlada hacia la interfaz del checkout sin reintentar.

### Solución implementada

1. Se implementó un bucle de reintento automático de hasta 3 intentos en `crearPedido`:
   - Si ocurre error con código `23505`, se genera un nuevo número aleatorio y se reintenta la inserción.
   - Cualquier otro código de error (como restricciones de validación o RLS) falla de inmediato sin reintentar.
   - Si tras 3 intentos consecutivos se mantiene la colisión, se lanza un mensaje legible al cliente indicándole la alternativa de comunicarse vía WhatsApp (`+51 999 600 482`) para coordinar su orden directamente.
2. Certificado mediante suite unitaria completa con mock de Supabase (`tests/unit/queries.test.ts`).

---

## 5. Incidencia 5: Falsa percepción de fallo al guardar cambios en la categoría "Amor"

### Descripción del síntoma

El cliente y la administradora (Sofía) reportaron que al editar la descripción y el precio de un producto en la categoría "Amor" (específicamente el arreglo *"Adriana"*, cambiado a S/ 10.00), los cambios "no se guardaban" y en la tienda seguía viéndose la información por defecto, mientras que en otras categorías (Floreros, Girasoles, Mejórate) los cambios se reflejaban de inmediato.

### Causa raíz identificada

1. **Los datos SÍ se guardaban en la base de datos:** La auditoría de logs HTTP de Supabase confirmó que la petición `PATCH` a `productos?id=eq.f5afe2d5-9115-491d-ad85-190bd79d8920` respondió con estado `200 OK` y el nuevo precio (S/ 10.00). Los datos nunca se perdieron.
2. **Disparidad de ordenamiento entre Admin y Tienda:**
   - En el panel `/admin/productos`, la tabla se ordenaba alfabéticamente por `nombre ASC`. Dado que empieza con "A", el producto *"Adriana"* figuraba en la **posición #1**.
   - En la tienda pública (`/categoria/ocasion/amor-aniversario`), la grilla se ordena por `orden ASC` con paginación por lotes de 24 productos ("Ver más").
   - La categoría *"Amor / Aniversario"* alberga **121 productos**. *"Adriana"* tenía `orden: 417`, situándose en el **puesto #50 (página 3)**.
   - En cambio, las otras categorías probadas por Sofía tenían menos de 24 productos (Floreros: 4, Girasoles: 4, Mejórate: 13, Para Él: 19). En ellas, la totalidad de productos cabe en una sola pantalla sin paginación, por lo que cualquier edición se apreciaba al instante.
3. **Confusión de URL y slug inexistente:**
   - La categoría canónica en la base de datos es *"Amor / Aniversario"* con slug `amor-aniversario` bajo la categoría padre `ocasion`. Si el usuario ingresaba directamente a `/categoria/amor`, el sistema respondía 404 por falta de mapeo de alias.
4. **Caché CDN de Vercel:**
   - El CDN público de Vercel mantenía una caché de 120 segundos sin bypass para usuarios con sesión administrativa iniciada.

### Solución implementada

1. **Priorización inmediata en BD:** Se actualizó `orden = 0` para *"Adriana"*, garantizando que encabece la categoría en la tienda pública.
2. **Control de posición y botón #1 en el Administrador:**
   - Se añadió el campo `orden` editable en `ProductoForm` junto con el botón de acción rápida *"★ Destacar al inicio (#1)"*.
   - Se agregó el ordenamiento *"Orden en tienda (Como lo ve el cliente)"* en el listado del panel administrativo.
   - Al guardar, el aviso de éxito incluye el enlace de validación directa `[Ver en tienda en vivo →]` con parámetro `preview=1`.
3. **Normalización y alias de categorías (`src/lib/categorias-utils.ts`):** Mapeo de `amor`, `aniversario` y `san-valentin` hacia `amor-aniversario`, y redirección HTTP automática de rutas padre hacia `/categoria/:padre/:sub`.
4. **Bypass de Caché CDN para Administradores (`api/index.js`):** Peticiones con cookies `sb-*` reciben `Cache-Control: private, no-cache, no-store`, asegurando vista en tiempo real para administradores. Reducción del TTL público a 15 segundos.
5. **Blindaje de sesión:** Validación `ensureAdminSession()` e invalidación de caché en `admin/categorias.tsx`.
6. **Certificación:** Suite de 195 pruebas unitarias (`vitest run`), verificación de tipos y compilación sin errores.
