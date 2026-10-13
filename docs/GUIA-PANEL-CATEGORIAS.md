# Guía del Panel de Administración — Categorías y Productos

Esta guía explica cómo organizar los productos por categorías y subcategorías desde el panel administrativo (`/admin`) tras las mejoras de la **Fase 03**.

---

## 1. ¿Cómo funciona la visibilidad de categorías en la web pública?

- **Las categorías vacías se ocultan solas en la tienda:** Si una categoría o subcategoría tiene **0 productos activos**, no aparecerá en el menú superior, ni en el menú móvil, ni en los filtros de `/catalogo`, ni en las tarjetas de subcategorías. Así ningún cliente verá páginas vacías con el aviso _"— próximamente"_.
- **En el panel `/admin/categorias` siempre verás todas:** Las categorías sin productos activos muestran una etiqueta amarilla:
  > `No se ve en la web: 0 productos`
- **Aparecen automáticamente al agregarles productos:** En cuanto asignes al menos **1 producto activo** a una subcategoría o categoría, la etiqueta amarilla desaparecerá y esa categoría se mostrará automáticamente en la tienda pública.

---

## 2. Selector de categorías agrupado (`Padre › Hija`)

En **`/admin/productos`** (tanto al crear/editar un producto como en el filtro superior de la lista), el selector de categorías ahora está agrupado por categoría principal y muestra la ruta completa:

- **Categorías Principales** (sin subcategorías):
  - `Arreglos Premium`
  - `Ofertas`
  - `Novedades`
- **Categorías con Subcategorías** (ejemplo `Tulipanes`, `Arreglos Florales`, `Nacimientos`):
  - `Tulipanes (Principal)`
  - `Tulipanes › Arreglos`
  - `Tulipanes › Ramos`

De esta forma ya no hay confusión entre `Arreglos Florales › Ramos` y `Tulipanes › Ramos`, ni entre `Arreglos Florales › Cajas` y `Orquídeas › Cajas`.

> **Recomendación:** Cuando una categoría principal tiene subcategorías (por ejemplo `Tulipanes` o `Nacimientos`), asigna cada producto directamente a su **subcategoría específica** (`Tulipanes › Ramos`, `Nacimientos › Niño`, etc.). Los productos asignados a una subcategoría se ven tanto al entrar a la categoría principal como al entrar a la subcategoría.

---

## 3. Tarea 1: Clasificar los productos de «Nacimientos» en «Niño» y «Niña»

Una vez aplicado el cambio de base de datos (`003-nacimientos-padre.sql`):

- **Nacimientos** es una categoría principal del menú con dos subcategorías:
  - `Nacimientos › Niño`
  - `Nacimientos › Niña`
- Los **39 productos** actuales siguen en `Nacimientos (Principal)` para que ninguno deje de verse en la web.
- Mientras `Niño` y `Niña` tengan 0 productos, no aparecen como subcategorías vacías; en cuanto les asignes su primer producto activo, aparecerán automáticamente en el menú y en `/categoria/nacimientos`.

### Pasos en el panel:

1. Entra a **`/admin/productos`**.
2. En el filtro **Cat:** (arriba a la derecha), selecciona **`Nacimientos (Principal)`** (o `Ocasión › Nacimientos` si aún no se corrió el SQL).
3. Para cada uno de los 39 productos:
   - Haz clic en el ícono de **Editar** (lápiz).
   - En el campo **Categoría**, elige:
     - **`Nacimientos › Niño`** si el arreglo es para niño (tonos celestes/azules, peluche o globo de niño).
     - **`Nacimientos › Niña`** si el arreglo es para niña (tonos rosados/lilas, peluche o globo de niña).
     - Si algún arreglo es neutro/unisex y prefieres que solo salga en la vista general de Nacimientos, puedes dejarlo en **`Nacimientos (Principal)`**.
   - Haz clic en **Guardar**.

---

## 4. Tarea 2: Reasignar los 13 productos que están en «Tulipanes (Principal)»

Actualmente hay **13 productos activos** asignados directamente a la categoría padre `Tulipanes (Principal)` en lugar de una subcategoría (y varios de ellos son arreglos de girasoles, lirios o primaverales que quedaron en Tulipanes por error).

### Pasos en el panel:

1. Entra a **`/admin/productos`**.
2. En el filtro **Cat:**, selecciona **`Tulipanes (Principal)`**.
3. Edita cada uno de los 13 productos y cámbiale la categoría según la siguiente tabla:

| #   | Producto                                         | Precio    | Categoría actual      | Categoría sugerida en el selector | ID (referencia)                        |
| --- | ------------------------------------------------ | --------- | --------------------- | --------------------------------- | -------------------------------------- |
| 1   | **Arreglo Alegría Campestre de Girasoles**       | S/ 100.00 | Tulipanes (Principal) | `Primaverales › Girasoles`        | `338d35a8-fe5a-400f-a8e3-f0948f6cbf76` |
| 2   | **Bouquet Resplandor Solar & Follaje**           | S/ 100.00 | Tulipanes (Principal) | `Primaverales › Girasoles`        | `c9227cec-1fef-4efa-b907-952439d3443d` |
| 3   | **Canasta Girasoles Silvestres & Gerberas**      | S/ 100.00 | Tulipanes (Principal) | `Primaverales › Girasoles`        | `d7d6dfcf-5379-4c2b-81fa-a90134be0b49` |
| 4   | **Bouquet Campo Dorado & Follaje**               | S/ 100.00 | Tulipanes (Principal) | `Primaverales (Principal)`        | `8385c1ec-4176-4c32-9636-ec8f38190ba1` |
| 5   | **Bouquet Resplandor Solar & Follaje N° 4**      | S/ 100.00 | Tulipanes (Principal) | `Primaverales › Girasoles`        | `1a462007-5b9e-4f74-a99f-a44ed76c156e` |
| 6   | **Bouquet Luz de Verano & Solidago N° 3**        | S/ 100.00 | Tulipanes (Principal) | `Primaverales (Principal)`        | `6d10b7f9-4b76-4ff5-b320-0a61d9bda15e` |
| 7   | **Bouquet Radiante Prado Dorado N° 9**           | S/ 100.00 | Tulipanes (Principal) | `Primaverales (Principal)`        | `a8f50542-3d27-48e3-afef-1d4db4016597` |
| 8   | **Bouquet Silvestre Girasoles Deluxe N° 6**      | S/ 100.00 | Tulipanes (Principal) | `Primaverales › Girasoles`        | `2ee59e5c-11c0-4083-b4dc-f4922a7b861f` |
| 9   | **Bouquet Serenidad de Lirios Blancos N° 2**     | S/ 100.00 | Tulipanes (Principal) | `Arreglos Florales › Ramos`       | `2e34d317-e64a-4669-b799-1266ffef9ada` |
| 10  | **Bouquet Floral Tulipanes Amarillos Radiantes** | S/ 100.00 | Tulipanes (Principal) | **`Tulipanes › Ramos`**           | `9e222bd5-1cc7-494e-8ab5-79d8470f495a` |
| 11  | **Box Negro Tulipanes Bicolor Fucsia y Naranja** | S/ 100.00 | Tulipanes (Principal) | **`Tulipanes › Arreglos`**        | `ce1813d5-eb8f-47a8-9bca-a456616b2084` |
| 12  | **Box Blanco Tulipanes Fucsia & Follaje Fresco** | S/ 100.00 | Tulipanes (Principal) | **`Tulipanes › Arreglos`**        | `b6d29773-c323-45d5-8fa5-91c5014d2b3a` |
| 13  | **Centro Primaveral**                            | S/ 100.00 | Tulipanes (Principal) | `Primaverales (Principal)`        | `da4237ff-0270-43cd-9774-8cbcde6a95d4` |

_(Nota: Al mover el producto #10 a **`Tulipanes › Ramos`**, la subcategoría `Tulipanes › Ramos` pasará de 0 a 1 producto activo y se activará automáticamente en el menú público)._

---

## 5. ¿Qué pasa si intento crear una categoría con un nombre/slug que ya existe?

Si en **`/admin/categorias`** intentas crear o editar una categoría cuyo `slug` ya está registrado (por ejemplo `ramos`), el panel te mostrará una notificación indicando exactamente dónde está:

- Ejemplo: `Ya existe una categoría con el slug «ramos» (está en: Arreglos Florales › Ramos).`
- Si necesitas crear una subcategoría con el mismo nombre dentro de otra categoría padre (por ejemplo `Ramos` dentro de `Orquídeas`), ponle un **slug compuesto** como `ramos-orquideas` (igual que `ramos-tulipanes`).
