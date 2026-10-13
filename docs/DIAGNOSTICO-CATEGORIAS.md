# Diagnóstico de Categorías — Fase 02 (Solo Lectura)

> **Rama:** `fase-02-diagnostico-categorias`
> **Scripts de diagnóstico:** [`scripts/diagnostico-categorias.mjs`](../scripts/diagnostico-categorias.mjs) (ejecutado con `anon key` en modo solo `SELECT`) y [`docs/sql/diagnostico-categorias.sql`](./sql/diagnostico-categorias.sql) (listo para ejecutar en el SQL Editor de Supabase).
> **Integridad de producción:** Cero escrituras realizadas en la base de datos.

---

## 1. Resumen de hallazgos en la base de datos (vista `anon`)

Ejecución real de `node scripts/diagnostico-categorias.mjs`:

- **Categorías activas visibles para `anon`:** `29` (`10` categorías padre y `19` subcategorías).
- **Productos activos visibles para `anon`:** `402`.
- **Categorías huérfanas (`parent_id` inexistente en vista `anon`):** `0`. _(Pendiente confirmar con [`docs/sql/diagnostico-categorias.sql`](./sql/diagnostico-categorias.sql) si existe alguna hija apuntando a un padre inactivo)._

### 1.1 Árbol completo de categorías activas y conteo de productos activos

| Jerarquía | Nombre                | Slug                 | ID                                     | Orden | Productos directos | Productos en hijas |
| --------- | --------------------- | -------------------- | -------------------------------------- | :---: | :----------------: | :----------------: |
| **PADRE** | **Ocasión**           | `ocasion`            | `7d02d578-f32c-4b3d-82c6-6194ee0e2a82` |   1   |         1          |        134         |
| ↳ SUB     | Amor / Aniversario    | `amor-aniversario`   | `2978fbd0-defa-4a07-94db-8dfc1070ab94` |   0   |         29         |         —          |
| ↳ SUB     | Cumpleaños            | `cumpleanos`         | `52eba7b8-c70e-42dd-a7ea-c5ed80a360f6` |   0   |         40         |         —          |
| ↳ SUB     | Graduación            | `graduacion`         | `dd8eb966-4ba2-4085-b909-6da4fc58c9ce` |   0   |         4          |         —          |
| ↳ SUB     | **Nacimientos**       | `nacimientos`        | `2b240ece-fd0e-4771-82da-40fab2dd1945` |   0   |       **39**       |         —          |
| ↳ SUB     | Para Él               | `para-el`            | `7d3faa5a-2094-4237-a2cd-7d46d8666450` |   0   |         22         |         —          |
| **PADRE** | **Arreglos Florales** | `arreglos-florales`  | `bf0b8e45-756a-4ddb-81f6-0079b80b052a` |   2   |         0          |         71         |
| ↳ SUB     | Box con Chocolates    | `box-chocolates`     | `7d64b58f-b280-47be-ae99-e4104d868c41` |   0   |       **0**        |         —          |
| ↳ SUB     | Box Luxury            | `box-luxury`         | `ea7f7eeb-50e3-4656-b0f5-5672c182b559` |   0   |         2          |         —          |
| ↳ SUB     | Inauguración          | `inauguracion`       | `9a4ec235-9fa8-42f2-9620-8de63e256b35` |   0   |       **0**        |         —          |
| ↳ SUB     | **Ramos**             | `ramos`              | `c98bd545-af26-4ff0-a5b3-08ffef4fa9cf` |   0   |       **55**       |         —          |
| ↳ SUB     | Orquídeas             | `orquideas`          | `50c4251e-d651-40e7-a8b4-b77c0119156c` |   3   |         14         |         —          |
| **PADRE** | **Arreglos Premium**  | `arreglos-premium`   | `a7a4a6c0-784a-4415-818a-5921f04e57a7` |   3   |         51         |         0          |
| **PADRE** | **Tulipanes**         | `tulipanes`          | `a7511a7c-a64b-427b-bc19-82da00ce63cc` |   4   |       **13**       |         24         |
| ↳ SUB     | **Arreglos**          | `tulipanes-arreglos` | `667e9006-5ac9-45e9-9ebf-13701f55f98e` |   0   |       **0**        |         —          |
| ↳ SUB     | Floreros              | `tulipanes-floreros` | `170ec60a-9726-465f-9384-a945eddc4b94` |   0   |         3          |         —          |
| ↳ SUB     | **Ramos**             | `tulipanes-ramos`    | `1036ab86-e9b0-4f2a-9aeb-ce658d1231ef` |   0   |       **21**       |         —          |
| **PADRE** | **Primaverales**      | `primaverales`       | `4acfcfea-15a6-44c8-a0cc-500f420648cf` |   5   |         17         |         27         |
| ↳ SUB     | Girasoles             | `girasoles`          | `1415a57d-ebde-4353-8a9f-98d1cb14ce79` |   0   |         27         |         —          |
| **PADRE** | **Defunción**         | `defuncion`          | `99ef0939-f5c5-4d0b-9aeb-41040869b7d4` |   6   |       **0**        |       **0**        |
| ↳ SUB     | Coronas Fúnebres      | `coronas-funebres`   | `e3f73ae6-9cbd-49f1-b9a8-b81244131fd5` |   0   |       **0**        |         —          |
| ↳ SUB     | Cruces                | `cruces`             | `4c777708-89be-43b6-86c8-3b22e533d1d5` |   0   |       **0**        |         —          |
| ↳ SUB     | Lágrima con Pedestal  | `lagrima-pedestal`   | `581afa16-236f-47aa-b3aa-d0054ada8081` |   0   |       **0**        |         —          |
| ↳ SUB     | Lágrimas              | `lagrimas`           | `3044ac75-5545-4d0f-a636-e5b97248def4` |   0   |       **0**        |         —          |
| ↳ SUB     | Mantos                | `mantos`             | `dc8c0325-67ca-42ac-91c6-76a5aee2250f` |   0   |       **0**        |         —          |
| **PADRE** | **Novedades**         | `novedades`          | `f8202a90-06f6-4284-9053-16cad544164c` |   7   |         27         |         0          |
| **PADRE** | **Ofertas**           | `ofertas`            | `8829a451-ba4d-41f8-9d59-cd303eb72721` |   8   |         37         |         0          |
| **PADRE** | **Corporativos**      | `corporativo`        | `7709a36a-fe12-4d5b-9038-33b66d3952ef` |   9   |       **0**        |       **0**        |
| **PADRE** | **Más vendido**       | `mas-vendido`        | `0e3a02bd-ac58-4dfb-954d-bae3b1b97cb9` |  10   |       **0**        |       **0**        |

---

## 2. Diagnóstico por cada reclamo de la clienta

### Reclamo 1: _"Nacimientos no se refleja en la web (y no le deja subirla)"_

#### A. Causas confirmadas (con evidencia en BD y código)

1. **`Nacimientos` YA EXISTE en la base de datos y está activa:**
   - **Evidencia del script:** `nombre="Nacimientos" | slug="nacimientos" | id=2b240ece-fd0e-4771-82da-40fab2dd1945 | activo=true | parent=Ocasión (ocasion) | prods_directos=39`.
2. **Por qué "no le deja subirla" en `/admin/categorias`:**
   - **Evidencia en código ([`src/routes/admin/categorias.tsx`](../src/routes/admin/categorias.tsx), líneas 48–57, 145–147 y 474–499):**
     Cuando la clienta abre **"Nueva categoría"** y escribe `"Nacimientos"`, `generateSlug` genera automáticamente `slug = "nacimientos"`. Al pulsar **Guardar**, `supabase.from("categorias").insert(...)` falla por el constraint `UNIQUE` de `slug` (porque `nacimientos` ya existe bajo `Ocasión`).
   - El bloque `catch` ejecuta en la línea `495`:
     ```ts
     alert("Error al guardar la categoría. Revisa si el slug ya existe.");
     ```
     _(Deducción verificada en código sin escribir en la BD de producción)._
3. **Por qué la clienta percibe que "no se refleja en la web":**
   - **No aparece en la barra principal del menú (`Header.tsx`):** En [`src/components/Header.tsx`](../src/components/Header.tsx) (líneas `36` y `167`), la barra de navegación superior solo renderiza `padres = categorias.filter((c) => !c.parent_id)`. Como `Nacimientos` es hija de `Ocasión`, solo se ve al pasar el mouse o expandir **`Ocasión` → `Nacimientos`** (`/categoria/ocasion/nacimientos`).
   - **La URL directa `/categoria/nacimientos` no es su ruta canónica en el menú:** aunque [`getCategoriaPorSlug("nacimientos")`](../src/lib/queries.ts) no filtra `parent_id IS NULL`, ningún enlace del Header apunta a `/categoria/nacimientos`, sino a `/categoria/ocasion/nacimientos`.
   - **En `/catalogo`, no aparece en el primer filtro "Categoría":** En [`src/routes/catalogo.tsx`](../src/routes/catalogo.tsx) (línea `29`), el `<select>` de **Categoría** solo lista `padres = categorias.filter((c) => !c.parent_id)`. `Nacimientos` aparece en el segundo `<select>` ("Ocasión" o "Subcategoría" al elegir `Ocasión`).
   - **Impacto del commit `fa7eaf6` en `getColecciones()` (`src/lib/queries.ts`, líneas 344 y 372–379):** El commit `fa7eaf6` quitó `"nacimientos"` del arreglo `targetSlugs` y de `preferredOrder`. Actualmente en la tabla `colecciones_home` hay 6 filas activas (`Corporativos`, `Graduación`, `Novedades`, `Nacimientos`, `Defunción`, `Más vendido`), donde `Nacimientos` está en la posición `4` (`orden=8`), precedida por categorías con `0` productos (`Corporativos`) y seguida por `Defunción` (`0` productos) y `Más vendido` (`0` productos).

#### B. Clasificación

- ⚙️ **Config del panel / arquitectura de jerarquía** (ubicación de `Nacimientos` como hija de `Ocasión` vs. categoría padre) + 🧑‍💻 **Código** (validación y mensajes claros en `/admin/categorias` en lugar de `alert()` genérico).

#### C. Opciones de arreglo

| Opción | Descripción                                                                                                                                                                                                                                                      | Esfuerzo |                              Riesgo                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | :--------------------------------------------------------------: |
| **1A** | Mantener `Nacimientos` bajo `Ocasión`, mejorar UX en `/admin/categorias` (validar slug duplicado antes de insertar e indicar con `toast` en qué categoría padre ya existe ese slug) y limpiar `colecciones_home` para destacar colecciones con productos reales. |  **S**   |                               Bajo                               |
| **1B** | Promover `Nacimientos` a categoría **Padre** (`parent_id = null`) para que aparezca directamente en la barra principal del `Header` y en el filtro principal de `/catalogo`.                                                                                     |  **S**   | Bajo (agranda la barra de navegación superior de 10 a 11 ítems). |

---

### Reclamo 2: _"Quiere dividir Nacimientos en Niño y Niña"_

#### A. Causas confirmadas (con evidencia en BD y código)

1. **El sistema solo soporta 2 niveles de jerarquía (Padre → Subcategoría):**
   - **En `/admin/categorias` ([`src/routes/admin/categorias.tsx`](../src/routes/admin/categorias.tsx), línea `451` y `270–274`):** El selector `Dependencia (Jerarquía)` solo lista `parentCategories = categorias.filter((c) => !c.parent_id)`. Como `Nacimientos` tiene `parent_id = 7d02d578-...` (es hija de `Ocasión`), **`Nacimientos` no aparece como opción de padre** cuando la clienta intenta crear las subcategorías `"Niño"` y `"Niña"`.
   - **En el enrutador (`src/routes/`):** Solo existen las rutas [`/categoria/$slug`](../src/routes/categoria.$slug.tsx) y [`/categoria/$slug/$sub`](../src/routes/categoria.$slug.$sub.tsx). No existe un tercer nivel `/categoria/$slug/$sub/$sub2`.
   - **En `Header.tsx` y `catalogo.tsx`:** Tanto el dropdown del menú (`hijasMap[c.id]`) como el filtro de subcategorías en `/catalogo` consultan únicamente un nivel de hijas directas (`c.parent_id === padre.id`).

#### B. Clasificación

- ⚙️ **Config del panel / estructura de datos** (si se resuelve en 2 niveles: opciones D1-A o D1-B) o 🧑‍💻 **Código + 🗄️ BD** (si se implementara un 3er nivel: opción D1-C).

#### C. Opciones de arreglo (Decisiones D1)

| Opción   | Descripción                                                                                                                                                                                                                                                                                                                                       | Esfuerzo |        Riesgo         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | :-------------------: |
| **D1-A** | Crear dos subcategorías planas bajo **Ocasión**: `"Nacimiento Niño"` (`nacimiento-nino`) y `"Nacimiento Niña"` (`nacimiento-nina`) (o mantener `"Nacimientos"` y agregar ambas). Cero cambios de arquitectura.                                                                                                                                    |  **S**   |       Muy bajo        |
| **D1-B** | Convertir **Nacimientos** en categoría **Padre** (`parent_id = null`, visible en la barra principal del menú) y crear debajo sus 2 subcategorías hijas: **Niño** (`/categoria/nacimientos/nino`) y **Niña** (`/categoria/nacimientos/nina`). En `/categoria/nacimientos` se verán las 2 tarjetas (`Niño` y `Niña`) + los 39 productos combinados. |  **S**   |         Bajo          |
| **D1-C** | Soportar un **tercer nivel** de categorías (`Ocasión › Nacimientos › Niño / Niña`): requiere nueva ruta `/categoria/$slug/$sub/$sub2`, cambios en `getCategoriaPorSlug`, sub-dropdown de 3 niveles en `Header.tsx`, 3er `<select>` en `/catalogo` y árbol de 3 niveles en `/admin/categorias` y `/admin/productos`.                               |  **L**   | Alto (no recomendado) |

---

### Reclamo 3: _"Tulipanes no se refleja en Ramos y Arreglos"_

#### A. Causas confirmadas (con evidencia en BD y código)

El script [`scripts/diagnostico-categorias.mjs`](../scripts/diagnostico-categorias.mjs) reveló **tres problemas combinados**:

1. **La subcategoría `Tulipanes › Arreglos` (`slug="tulipanes-arreglos"`) tiene `0` productos asignados, mientras que `[PADRE] Tulipanes` tiene `13` productos asignados directamente al padre:**
   - **Evidencia del script:**
     - `Tulipanes` (Padre, `id=a7511a7c-a64b-427b-bc19-82da00ce63cc`): **`13` productos directos** (entre ellos `"Box Negro Tulipanes Bicolor Fucsia y Naranja"`, `"Box Blanco Tulipanes Fucsia & Follaje Fresco"`, `"Bouquet Floral Tulipanes Amarillos Radiantes"`).
     - `Tulipanes › Arreglos` (`id=667e9006-5ac9-45e9-9ebf-13701f55f98e`): **`0` productos directos**.
     - `Tulipanes › Floreros` (`id=170ec60a-9726-465f-9384-a945eddc4b94`): **`3` productos directos**.
     - `Tulipanes › Ramos` (`id=1036ab86-e9b0-4f2a-9aeb-ce658d1231ef`): **`21` productos directos**.
   - **Consecuencia en la web:** Cuando un cliente entra desde el menú a **Tulipanes → Arreglos** (`/categoria/tulipanes/tulipanes-arreglos`), la página muestra **"— próximamente / Pronto cargaremos los arreglos de esta subcategoría"** porque los boxes/arreglos de tulipanes fueron guardados en la categoría padre `Tulipanes` (`a7511a7c-...`) y no en la subcategoría `Tulipanes › Arreglos` (`667e9006-...`). De igual modo, `"Bouquet Floral Tulipanes Amarillos Radiantes"` está en el padre `Tulipanes` y no aparece al entrar a **Tulipanes → Ramos** (`/categoria/tulipanes/tulipanes-ramos`).
2. **El `<select>` de categoría en `/admin/productos` es una lista plana sin nombre del padre y tiene nombres duplicados/ambiguos:**
   - **Evidencia en código ([`src/routes/admin/productos.tsx`](../src/routes/admin/productos.tsx), líneas `313–324` y filtro en líneas `1162–1174`):**
     ```tsx
     {
       categorias.map((cat) => (
         <option key={cat.id} value={cat.id}>
           {cat.nombre}
         </option>
       ));
     }
     ```
   - **Evidencia del script:** En ese `<select>` plano existen **dos opciones idénticas llamadas `"Ramos"`**:
     1. `Arreglos Florales › Ramos` (`id=c98bd545-af26-4ff0-a5b3-08ffef4fa9cf`, 55 productos)
     2. `Tulipanes › Ramos` (`id=1036ab86-e9b0-4f2a-9aeb-ce658d1231ef`, 21 productos)
        Y la subcategoría `Tulipanes › Arreglos` aparece simplemente como `"Arreglos"`, sin indicar que pertenece a `Tulipanes`. Además, los datos muestran productos de girasoles/rosas asignados por error a `Tulipanes` o `Tulipanes › Ramos` debido a esta ambigüedad en el selector.
3. **Un producto solo puede tener una única categoría (`productos.categoria_id`):**
   - Si la clienta espera que un ramo de tulipanes aparezca simultáneamente en **Tulipanes › Ramos** (`/categoria/tulipanes/tulipanes-ramos`) **y** en **Arreglos Florales › Ramos** (`/categoria/arreglos-florales/ramos`), hoy el modelo de datos (`productos.categoria_id uuid`) solo permite asociar el producto a una de las dos.

#### B. Clasificación

- 🧑‍💻 **Código** (agrupar el `<select>` de `/admin/productos` con `<optgroup>` y formato `Padre › Subcategoría`, igual que ya se hizo en `/admin/colecciones-home`) + ⚙️ **Config / Datos** (reasignar los productos de tulipanes a `Tulipanes › Arreglos` y `Tulipanes › Ramos`) + opcionalmente 🗄️ **Cambio de BD** si se requiere pertenencia múltiple (D2-B).

#### C. Opciones de arreglo (Decisiones D2)

| Opción   | Descripción                                                                                                                                                                                                                                                                                                                                                                               | Esfuerzo |                                     Riesgo                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | :----------------------------------------------------------------------------: |
| **D2-A** | Mantener 1 categoría por producto (`categoria_id`), corregir el `<select>` de `/admin/productos` con `<optgroup>` (`Padre › Subcategoría`) para eliminar la confusión entre los dos `"Ramos"` y `"Arreglos"`, y reasignar los productos de tulipanes entre `Tulipanes › Ramos` y `Tulipanes › Arreglos`.                                                                                  |  **S**   |                                    Muy bajo                                    |
| **D2-B** | Permitir **categorías adicionales** por producto (agregar columna `categorias_extra uuid[] DEFAULT '{}'` en `productos` o tabla puente, actualizar formulario de `/admin/productos` y queries `getProductosPorCategoria` / `getProductosPorCategorias` / filtro de `/catalogo`) para que un producto pueda aparecer en `Tulipanes › Ramos` **y** en `Arreglos Florales › Ramos` a la vez. |  **M**   | Medio (requiere migración SQL en producción y actualizar queries de catálogo). |

---

## 3. Hipótesis pendientes de confirmar con `docs/sql/diagnostico-categorias.sql`

Dado que la `anon key` solo devuelve filas donde la policy RLS de lectura se cumple (`activo = true`), al correr [`docs/sql/diagnostico-categorias.sql`](./sql/diagnostico-categorias.sql) en el SQL Editor de Supabase se confirmará:

1. Si existen filas **inactivas** (`activo = false`) en `categorias` (por ejemplo, intentos previos de crear subcategorías o slugs duplicados ocultos para `anon`).
2. Si existen productos **inactivos** (`activo = false`) o sin `categoria_id` (`IS NULL`) asignados a `Tulipanes › Arreglos` o `Nacimientos`.
3. La definición exacta de las policies RLS (`pg_policies`) de `categorias` y `productos` (incluyendo la verificación formal de la policy de `DELETE` para `anon` anotada en Fase 01).

---

## 4. Decisiones que necesito de Jack (antes de pasar a Fase 03)

1. **Ejecutar [`docs/sql/diagnostico-categorias.sql`](./sql/diagnostico-categorias.sql)** en el SQL Editor de Supabase y compartir el resultado si aparece alguna categoría inactiva relevante.
2. **Decisión D1 · Niño / Niña (Reclamos 1 y 2):**
   - **Opción A:** Mantener `Nacimientos` bajo `Ocasión` y crear dos subcategorías planas bajo `Ocasión`: **"Nacimiento Niño"** y **"Nacimiento Niña"** (cero cambios de estructura en el menú principal).
   - **Opción B (Recomendada si la clienta quiere ver "Nacimientos" en la barra principal con desplegable):** Pasar **Nacimientos** a categoría **Padre** (`parent_id = null`) y crear debajo las subcategorías **Niño** y **Niña** (`/categoria/nacimientos/nino` y `/categoria/nacimientos/nina`).
   - **Opción C:** Soportar un 3er nivel de categorías (`Ocasión › Nacimientos › Niño / Niña`). _(No recomendado por complejidad en rutas, menú y filtros)._
3. **Decisión D2 · Tulipanes en Ramos y Arreglos (Reclamo 3):**
   - **Opción A:** Cada producto pertenece a una sola subcategoría; corregimos el selector de `/admin/productos` para que muestre `Padre › Subcategoría` (diferenciando `Tulipanes › Ramos`, `Tulipanes › Arreglos` y `Arreglos Florales › Ramos`) y se reasignan los productos mal ubicados.
   - **Opción B:** Además de corregir el selector en `/admin/productos`, agregar soporte para **categorías adicionales** (`categorias_extra uuid[]`) para que un mismo arreglo/ramo de tulipanes pueda mostrarse tanto en `Tulipanes › Ramos/Arreglos` como en `Arreglos Florales › Ramos`.
