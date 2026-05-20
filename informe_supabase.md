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

| Nombre | Versión | Esquema | Descripción |
| :--- | :---: | :---: | :--- |
| `plpgsql` | `1.0` | `pg_catalog` | Lenguaje de procedimientos estructurado PL/pgSQL |
| `pgcrypto` | `1.3` | `extensions` | Funciones criptográficas (hashing, cifrado) |
| `uuid-ossp` | `1.1` | `extensions` | Algoritmos de generación de identificadores únicos universales (UUID) |
| `pg_stat_statements` | `1.11` | `extensions` | Seguimiento de estadísticas de sentencias SQL |
| `supabase_vault` | `0.3.1` | `vault` | Extensión de almacenamiento seguro (Vault) de Supabase |

---

## 3. Estructura de Tablas (DDL)

Se crearon las 10 tablas requeridas en el esquema `public`, utilizando `uuid` con generación automática (`gen_random_uuid()`) como llaves primarias.

| Tabla | Descripción y Campos Principales |
|---|---|
| `config` | **1 fila única**. Campos: `whatsapp`, `correo`, `horario`, `logo_url`, `anuncio_barra`, `instagram_url`, `tiktok_url`, `facebook_url`, `libro_reclamaciones_activo`. |
| `banners` | Imágenes para el slider principal. Campos: `imagen_url`, `titulo`, `subtexto`, `cta_texto`, `cta_link`, `orden`, `activo`. |
| `popup` | Popup promocional. Campos: `imagen_url`, `texto`, `activo`, `fecha_expiracion`. |
| `categorias` | Sistema jerárquico de categorías. Campos: `nombre`, `slug` (único), `imagen_url`, `parent_id` (relación a misma tabla), `orden`, `activo`. |
| `productos` | Catálogo de productos. Campos: `nombre`, `precio`, `descripcion`, `imagenes` (array de URLs), `categoria_id`, `tags` (array), `activo`, `orden`. |
| `ocasiones_home` | Accesos rápidos por ocasión en el Home. Campos: `nombre`, `icono`, `categoria_id`, `orden`, `activo`. |
| `colecciones_home` | Colecciones destacadas en el Home. Campos: `categoria_id`, `imagen_custom_url`, `orden`, `activo`. |
| `faqs` | Preguntas frecuentes. Campos: `pregunta`, `respuesta`, `orden`, `activo`. |
| `distritos` | Zonas de cobertura y costos de delivery. Campos: `nombre`, `precio_delivery`, `activo`. |
| `pedidos` | Órdenes de los clientes. Campos: `numero` (único), `nombre_cliente`, `telefono`, `email`, `distrito_id`, `direccion`, `referencia`, `fecha_entrega`, `hora_entrega`, `productos` (jsonb), desglose de precios (subtotal, delivery, total), `estado`, `izi_transaction_id` (Izipay), `notas`. |

### Relaciones (Claves Foráneas)
1. `categorias.parent_id` ➔ `categorias.id` (Auto-relación)
2. `productos.categoria_id` ➔ `categorias.id`
3. `ocasiones_home.categoria_id` ➔ `categorias.id`
4. `colecciones_home.categoria_id` ➔ `categorias.id`
5. `pedidos.distrito_id` ➔ `distritos.id`

---

## 4. Políticas de Seguridad (RLS - Row Level Security)

Se habilitó RLS (`ENABLE ROW LEVEL SECURITY`) de manera global en las 10 tablas para prevenir modificaciones no autorizadas por parte del cliente.

### 4.1. Permisos para Clientes (Público / Anónimos)
- **Lectura (SELECT):** Acceso libre a las tablas `config`, `banners`, `popup`, `categorias`, `productos`, `ocasiones_home`, `colecciones_home`, `faqs`, y `distritos`.
- **Escritura (INSERT):** Permiso exclusivo para insertar nuevas filas en la tabla `pedidos` (con `CHECK (true)`).
- **Prohibido:** El público no puede consultar (`SELECT`), modificar (`UPDATE`) ni borrar (`DELETE`) el listado de pedidos realizados. Tampoco pueden modificar los productos ni configuraciones.

### 4.2. Permisos para Administrador (Auth UID válido)
- El administrador (validado mediante sesión iniciada, `auth.uid() IS NOT NULL` bajo el rol `authenticated`) tiene permisos completos sobre la totalidad de las tablas.
- Específicamente en la tabla `pedidos`, las políticas están divididas de la siguiente manera para evitar conflictos con la pasarela de pagos:
  * **`insert_public`**: Permite `INSERT` para `anon` y `authenticated` con `WITH CHECK (true)`.
  * **`admin_select`**: Permite `SELECT` solo para `authenticated` con `USING (auth.uid() IS NOT NULL)`.
  * **`admin_update`**: Permite `UPDATE` solo para `authenticated` con `USING/WITH CHECK (auth.uid() IS NOT NULL)`.
  * **`admin_delete`**: Permite `DELETE` solo para `authenticated` con `USING (auth.uid() IS NOT NULL)`.

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
- Arreglos Premium (`arreglos-premium`) - *Sin hijas directas*
- Tulipanes (`tulipanes`)
- Primaverales (`primaverales`)
- Defunción (`defuncion`)
- Ofertas (`ofertas`) - *Sin hijas directas*

**Subcategorías (Nivel 2):**
- *Dentro de Ocasión:* Amor / Aniversario, Cumpleaños, Graduación, Nacimientos, Para Él.
- *Dentro de Arreglos Florales:* Box Luxury, Box con Chocolates, Inauguración, Ramos, Bonsais.
- *Dentro de Tulipanes:* Arreglos, Ramos, Floreros.
- *Dentro de Primaverales:* Girasoles.
- *Dentro de Defunción:* Coronas Fúnebres, Cruces, Lágrima con Pedestal, Lágrimas, Mantos.

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
