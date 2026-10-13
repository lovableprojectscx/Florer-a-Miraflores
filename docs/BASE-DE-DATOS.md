# Informe de Configuración de Base de Datos — Florería Miraflores

Este documento detalla la estructura, políticas de seguridad y datos iniciales (seed) que se configuraron en el proyecto de Supabase para la plataforma de e-commerce "Florería Miraflores". Todo el trabajo se realizó siguiendo estrictamente las especificaciones del archivo [CLAUDE.md](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/CLAUDE.md).

---

## 1. Detalles del Proyecto

- **Nombre del Proyecto:** `Floreria-pasarela-pagos`
- **Plataforma:** Supabase (PostgreSQL 17.6)
- **Región:** Sudamérica (sa-east-1)
- **Identificador (Ref):** `sdrkiomeesoctsxeidmu`
- **Estado:** `ACTIVE_HEALTHY`

---

## 2. Extensiones PostgreSQL Activas

El proyecto cuenta con las siguientes extensiones instaladas y operativas en la base de datos:

| Nombre               | Versión |   Esquema    | Descripción                                                           |
| :------------------- | :-----: | :----------: | :-------------------------------------------------------------------- |
| `plpgsql`            |  `1.0`  | `pg_catalog` | Lenguaje de procedimientos estructurado PL/pgSQL                      |
| `pgcrypto`           |  `1.3`  | `extensions` | Funciones criptográficas (hashing, cifrado)                           |
| `uuid-ossp`          |  `1.1`  | `extensions` | Algoritmos de generación de identificadores únicos universales (UUID) |
| `pg_stat_statements` | `1.11`  | `extensions` | Seguimiento de estadísticas de sentencias SQL                         |
| `supabase_vault`     | `0.3.1` |   `vault`    | Extensión de almacenamiento seguro (Vault) de Supabase                |

---

## 3. Estructura de Tablas (DDL)

Se crearon las 10 tablas requeridas en el esquema `public`, utilizando `uuid` con generación automática (`gen_random_uuid()`) como llaves primarias.

| Tabla              | Descripción y Campos Principales                                                                                                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config`           | **1 fila única**. Campos: `whatsapp`, `correo`, `horario`, `logo_url`, `anuncio_barra`, `instagram_url`, `tiktok_url`, `facebook_url`, `libro_reclamaciones_activo`.                                                                                                                         |
| `banners`          | Imágenes para el slider principal. Campos: `imagen_url`, `titulo`, `subtexto`, `cta_texto`, `cta_link`, `orden`, `activo`.                                                                                                                                                                   |
| `popup`            | Popup promocional. Campos: `imagen_url`, `texto`, `activo`, `fecha_expiracion`.                                                                                                                                                                                                              |
| `categorias`       | Sistema jerárquico de categorías. Campos: `nombre`, `slug` (único), `imagen_url`, `parent_id` (relación a misma tabla), `orden`, `activo`.                                                                                                                                                   |
| `productos`        | Catálogo de productos. Campos: `nombre`, `precio`, `descripcion`, `imagenes` (array de URLs), `categoria_id`, `tags` (array), `activo`, `orden`.                                                                                                                                             |
| `ocasiones_home`   | Accesos rápidos por ocasión en el Home. Campos: `nombre`, `icono`, `categoria_id`, `orden`, `activo`.                                                                                                                                                                                        |
| `colecciones_home` | Colecciones destacadas en el Home. Campos: `categoria_id`, `imagen_custom_url`, `orden`, `activo`.                                                                                                                                                                                           |
| `faqs`             | Preguntas frecuentes. Campos: `pregunta`, `respuesta`, `orden`, `activo`.                                                                                                                                                                                                                    |
| `distritos`        | Zonas de cobertura y costos de delivery. Campos: `nombre`, `precio_delivery`, `activo`.                                                                                                                                                                                                      |
| `pedidos`          | Órdenes de los clientes. Campos: `numero` (único), `nombre_cliente`, `telefono`, `email`, `distrito_id`, `direccion`, `referencia`, `fecha_entrega`, `hora_entrega`, `productos` (jsonb), desglose de precios (subtotal, delivery, total), `estado`, `izi_transaction_id` (Izipay), `notas`. |
| `suscriptores`     | Leads capturados vía popup y listón lateral. Campos: `id`, `telefono`, `origen`, `created_at`.                                                                                                                                                                                              |

### Relaciones (Claves Foráneas)

1. `categorias.parent_id` ➔ `categorias.id` (Auto-relación)
2. `productos.categoria_id` ➔ `categorias.id`
3. `ocasiones_home.categoria_id` ➔ `categorias.id`
4. `colecciones_home.categoria_id` ➔ `categorias.id`
5. `pedidos.distrito_id` ➔ `distritos.id`

---

## 4. Políticas de Seguridad (RLS - Row Level Security)

Se habilitó RLS (`ENABLE ROW LEVEL SECURITY`) de manera global en las tablas para prevenir modificaciones no autorizadas por parte del cliente.

### 4.1. Permisos para Clientes (Público / Anónimos)

- **Lectura (SELECT):** Acceso libre a las tablas `config`, `banners`, `popup`, `categorias`, `productos`, `ocasiones_home`, `colecciones_home`, `faqs`, y `distritos`.
- **Escritura (INSERT):** Permiso exclusivo para insertar nuevas filas en las tablas `pedidos` y `suscriptores` (con `CHECK (true)`).
- **Prohibido:** El público no puede consultar (`SELECT`), modificar (`UPDATE`) ni borrar (`DELETE`) el listado de pedidos realizados ni de suscriptores. Tampoco pueden modificar los productos ni configuraciones.

### 4.2. Permisos para Administrador (`public.is_admin()`)

- Originalmente las políticas de escritura comprobaban `auth.uid() IS NOT NULL`. En la **Fase 03-B** (`docs/sql/005-admin-rls.sql`), se endureció la autorización mediante la tabla `public.admins` y la función `public.is_admin()` (`SECURITY DEFINER`, `SET search_path = public`, `STABLE`), de modo que **solo los usuarios registrados en `public.admins`** tienen permisos de escritura sobre el catálogo, lectura/edición de `pedidos` y `reclamaciones`, y subida/borrado en `storage.objects`. Ver detalle completo en [docs/SEGURIDAD.md](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/docs/SEGURIDAD.md).
- Específicamente en la tabla `pedidos`, las políticas están divididas de la siguiente manera para evitar conflictos con la pasarela de pagos:
  - **`insert_public`**: Permite `INSERT` para `anon` y `authenticated` con `WITH CHECK (true)`.
  - **`admin_select`**: Permite `SELECT` solo para administradores (`USING (public.is_admin())`).
  - **`admin_update`**: Permite `UPDATE` solo para administradores (`USING/WITH CHECK (public.is_admin())`).
  - **`admin_delete`**: Permite `DELETE` solo para administradores (`USING (public.is_admin())`).

> [!IMPORTANT]
> Se han separado las políticas de administración de la tabla `pedidos` en consultas individuales por comando (`SELECT`, `UPDATE`, `DELETE`) en lugar de usar una política única `FOR ALL`. Esto asegura que las peticiones de compras anónimas realizadas por la pasarela de pagos puedan insertar nuevos registros sin ser bloqueadas por las restricciones de lectura del administrador.

---

## 5. Datos Iniciales Insertados (Seed)

### 5.1. Configuración General (`config`)

Se insertó una única fila con la información operativa del negocio:

- **ID:** `eec25c49-29ae-4057-9f37-8d387c44196e`
- **WhatsApp:** `+51 999 600 482`
- **Correo:** `pedidos@floreriamiraflores.com`
- **Horario:** `9am a 9pm todos los días`
- **Instagram:** `https://www.instagram.com/floreriamirafloreslima`
- **TikTok:** `https://www.tiktok.com/@floreriamirafloreslima`
- **Facebook:** `pendiente`
- **Anuncio Barra:** `"DELIVERY TODO LIMA Y CALLAO"`
- **Libro de Reclamaciones Activo:** `false`

### 5.2. Zonas de Reparto (`distritos`)

Se agregaron 5 distritos iniciales, todos con el costo base de `S/ 10.00`:

1. Miraflores
2. Surco
3. Barranco
4. Lince
5. San Isidro

### 5.3. Categorías (`categorias`)

Se insertaron 26 categorías, asegurando el enlace relacional (`parent_id`) utilizando el `slug` para ubicar al padre.

**Categorías Padre (Nivel 1):**

- Ocasión (`ocasion`)
- Arreglos Florales (`arreglos-florales`)
- Arreglos Premium (`arreglos-premium`) - _Sin hijas directas_
- Tulipanes (`tulipanes`)
- Primaverales (`primaverales`)
- Defunción (`defuncion`)
- Ofertas (`ofertas`) - _Sin hijas directas_

**Subcategorías (Nivel 2):**

- _Dentro de Ocasión:_ Amor / Aniversario, Cumpleaños, Graduación, Nacimientos, Para Él.
- _Dentro de Arreglos Florales:_ Box Luxury, Box con Chocolates, Inauguración, Ramos, Bonsais.
- _Dentro de Tulipanes:_ Arreglos, Ramos, Floreros.
- _Dentro de Primaverales:_ Girasoles.
- _Dentro de Defunción:_ Coronas Fúnebres, Cruces, Lágrima con Pedestal, Lágrimas, Mantos.

---

## 6. Resumen de Flujos de Datos Relacionados a la Pasarela de Pagos (Izipay)

El flujo del e-commerce opera integrando el frontend en Vite con la base de datos a través del registro en la tabla `pedidos`:

1. El usuario selecciona productos (guardándose temporalmente en el carrito local).
2. Procede al checkout, ingresando su dirección y seleccionando su distrito (clave foránea con `distritos` para sumarse al total).
3. Al proceder al pago, se genera una llamada al SDK de la pasarela **Izipay**.
4. Izipay procesa la transacción de forma segura y devuelve un `transactionId`.
5. Si el pago es exitoso, se ejecuta la inserción del registro en la tabla `pedidos` guardando el `izi_transaction_id` devuelto por la pasarela de pagos y cambiando el `estado` de `pendiente` a `pagado` (o según corresponda a la lógica del webhook).
6. Dado que la tabla `pedidos` tiene RLS activado:
   - Los clientes pueden insertar pedidos y sus identificadores de transacción.
   - El administrador, desde su panel de gestión privado, puede filtrar, actualizar el estado de entrega o descargar los reportes de ventas autenticándose en el backend.

---

## 7. Pedidos Registrados (Pruebas Exitosas)

Se han registrado con éxito los primeros **2 pedidos** de prueba en la tabla `pedidos`, lo que valida la correcta inserción por parte de clientes anónimos y el correcto funcionamiento de las políticas RLS:

1. **Pedido `FM-TEST01`**:
   - **Cliente:** Test Cliente
   - **Teléfono:** 999999999
   - **Dirección:** Av. Test 123 (Lince)
   - **Producto:** Velvet Box (Cant: 1, Precio: S/ 220.00)
   - **Desglose:** Subtotal: S/ 220.00, Delivery: S/ 10.00, Total: S/ 230.00
   - **Estado:** Pendiente
   - **Fecha/Hora de Creación:** 2026-05-19 19:40:20 (UTC)

2. **Pedido `FM-752968`**:
   - **Cliente:** tes
   - **Teléfono:** 925176478
   - **Dirección:** test test (Lince)
   - **Producto:** Velvet Box (Cant: 1, Precio: S/ 220.00)
   - **Desglose:** Subtotal: S/ 220.00, Delivery: S/ 10.00, Total: S/ 230.00
   - **Estado:** Pendiente
   - **Fecha/Hora de Creación:** 2026-05-19 19:43:27 (UTC)

---

## 8. Auditoría de Políticas RLS (`pg_policies`) y Scripts SQL de Fase 03

### 8.1. Políticas RLS verificadas en producción (`categorias` y `productos`)

Consultadas directamente sobre `pg_policies` en el proyecto `sdrkiomeesoctsxeidmu`:

| Tabla | Policy | Comando (`cmd`) | Roles | `USING` (`qual`) | `WITH CHECK` |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `categorias` | `Public Read categorias` | `SELECT` | `{public}` | `true` | `null` |
| `categorias` | `Admin Write categorias` | `ALL` | `{public}` | `(auth.uid() IS NOT NULL)` | `null` |
| `productos` | `Public Read productos` | `SELECT` | `{public}` | `true` | `null` |
| `productos` | `Admin Write productos` | `ALL` | `{public}` | `(auth.uid() IS NOT NULL)` | `null` |

- **Certificación de `DELETE` para `anon`:** No existe ninguna policy `DELETE` permisiva para usuarios no autenticados (`auth.uid() IS NULL`); únicamente sesiones autenticadas (`auth.uid() IS NOT NULL`) pueden ejecutar `INSERT`, `UPDATE` o `DELETE` sobre `categorias` y `productos`.

### 8.2. Constraints verificados en `public.categorias`

- `categorias_pkey`: `PRIMARY KEY (id)`
- `categorias_slug_key`: `UNIQUE (slug)` (global a toda la tabla; las subcategorías con nombre repetido usan slug compuesto como `ramos-tulipanes`, `nacimientos-nino`, `nacimientos-nina`)
- `categorias_parent_id_fkey`: `FOREIGN KEY (parent_id) REFERENCES categorias(id)`

### 8.3. Scripts SQL de Fase 03 (`docs/sql/`)

- [`docs/sql/003-nacimientos-padre.sql`](./sql/003-nacimientos-padre.sql): Promueve `"Nacimientos"` (`slug = 'nacimientos'`) a categoría principal (`parent_id = NULL`, `orden = 2`) e inserta de forma idempotente las subcategorías `"Niño"` (`slug = 'nacimientos-nino'`) y `"Niña"` (`slug = 'nacimientos-nina'`). Incluye consulta `SELECT` de verificación y bloque de rollback comentado.
- [`docs/sql/004-tulipanes-reasignacion.sql`](./sql/004-tulipanes-reasignacion.sql): Script completamente comentado con los 13 `UPDATE` individuales para reasignar los productos que estaban en `"Tulipanes"` padre hacia sus subcategorías (`Tulipanes › Ramos`, `Tulipanes › Arreglos`, `Primaverales › Girasoles`, etc.).

---

## 9. Estados de Pedidos y Restricciones (Fase 05)

### 9.1. Estados Válidos de Pedidos
El ciclo operativo del pedido comprende 6 estados:
1. `pendiente`: Recibido (estado por defecto al crearse la orden).
2. `en_preparacion`: En preparación (el arreglo floral está siendo confeccionado en taller).
3. `en_camino`: En camino (el repartidor está en ruta de entrega).
4. `entregado`: Entregado (el pedido fue recibido en destino).
5. `pagado`: Pagado (estado auxiliar para registro de confirmación de pago).
6. `cancelado`: Cancelado (estado auxiliar si el cliente desiste o hay incidencia).

### 9.2. Auditoría de Constraints en `public.pedidos`
Mediante consulta MCP a `pg_constraint`:
- `pedidos_pkey`: `PRIMARY KEY (id)`
- `pedidos_numero_key`: `UNIQUE (numero)`
- `pedidos_distrito_id_fkey`: `FOREIGN KEY (distrito_id) REFERENCES distritos(id)`

**Conclusión:** La base de datos en producción no cuenta con un constraint `CHECK` que restrinja los valores admisibles en `pedidos.estado`. El tipo de dato es `text DEFAULT 'pendiente'::text`, por lo que el estado `'en_preparacion'` es aceptado sin rechazo a nivel motor.

### 9.3. Scripts Disponibles (`docs/sql/`)
- [`docs/sql/verificar-estado-pedidos.sql`](./sql/verificar-estado-pedidos.sql): Consulta de sólo lectura (`SELECT`) de constraints, estados agrupados y políticas RLS activas en `pedidos`.
- [`docs/sql/006-estado-en-preparacion.sql`](./sql/006-estado-en-preparacion.sql): Script idempotente con guarda y rollback que formaliza el `CHECK (estado IN ('pendiente', 'en_preparacion', 'en_camino', 'entregado', 'pagado', 'cancelado'))`. Queda preparado para su aplicación únicamente si Jack y el revisor deciden restringirlo a nivel DDL.


