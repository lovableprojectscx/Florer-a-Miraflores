# Guía del Panel de Administración — Blog Editorial

Esta guía está dirigida a **Sofía**, a la encargada del atelier o al equipo de marketing digital de **Florería Miraflores** para redactar, editar, enriquecer con imágenes y publicar artículos en el blog oficial sin necesidad de tocar código.

---

## 1. Acceso al Blog

1. Ingresa al panel de administración en `/admin-login` con tus credenciales.
2. En el menú lateral izquierdo, haz clic en **Blog** (icono de libro abierto).
3. Verás la lista de artículos con su estado:
   - 🟢 **Publicado:** El artículo está visible en la web pública (`/blog/{slug}`).
   - 🟡 **Programado:** Está marcado para publicarse en una fecha/hora futura.
   - ⚪ **Borrador:** Solo visible dentro del panel administrativo.

---

## 2. Crear un Nuevo Artículo

Haz clic en el botón superior derecho **"+ Nuevo artículo"**. Se abrirá el editor en pantalla.

### 2.1. Título y Slug (URL)

- **Título:** Escribe el título del artículo de forma atractiva y natural (ej. _Significado de los colores de las rosas_, _Qué flores regalar en un aniversario_).
- **Slug (URL):** Se genera automáticamente en minúsculas y sin acentos a partir del título (ej. `/blog/significado-de-los-colores-de-las-rosas`).
  - Puedes personalizarlo si lo deseas, o hacer clic en **"Regenerar"** para actualizarlo desde el título.

### 2.2. Resumen (Bajada editorial)

- Escribe una breve introducción (1 a 2 párrafos, máx ~160 caracteres).
- Este texto aparece en la tarjeta de `/blog` y también es utilizado por **Google** como la descripción en los resultados de búsqueda.

### 2.3. Imagen de Portada

- Haz clic en el recuadro punteado para subir una fotografía (JPG, PNG o WebP).
- **Aspecto recomendado:** 16:9 (horizontal, ej. 1200x675 px).
- El sistema optimiza la imagen automáticamente y genera miniaturas ligeras para que cargue ultra rápido en celulares.

---

## 3. Redactar el Contenido (Markdown)

El editor cuenta con dos pestañas: **"Escribir"** y **"Vista previa"**.

### 3.1. Barra de Herramientas de Formato

En la pestaña **Escribir**, puedes usar los botones rápidos:

- **B (Negrita):** Envuelve el texto seleccionado en `**negrita**`.
- _I (Cursiva):_ Envuelve el texto en `*cursiva*`.
- **H2 (Subtítulo principal):** Crea un subtítulo grande (`## Cuidados Esenciales`).
- **H3 (Sección secundaria):** Crea una sección menor (`### El agua y la temperatura`).
- **Lista:** Inserta viñetas con guiones (`- Agua fría`).
- **Cita:** Inserta un bloque destacado (`> Un detalle inolvidable`).
- **Enlace:** Agrega un enlace hacia otra página (`[Ver Ramos](/catalogo)`).

### 3.2. Insertar Imágenes dentro del Contenido

1. Haz clic en el texto en el lugar exacto donde quieres que aparezca la fotografía.
2. Presiona el botón **"Insertar imagen"** (arriba a la derecha del editor).
3. Selecciona la foto desde tu computadora.
4. El sistema la optimizará, la subirá a la nube y pegará el código en tu artículo:
   ```markdown
   ![Rosas rojas bouquet](https://.../imagen.webp)
   ```
5. En el artículo público se mostrará centrada, con bordes redondeados y carga diferida inteligente (`lazy loading`).

### 3.3. Pestaña "Vista Previa"

En cualquier momento puedes cambiar a **"Vista previa"** para revisar exactamente cómo verán el artículo los clientes en la web.

---

## 4. Recomendar Productos Reales

Bajo el contenido encontrarás el selector **"Categoría relacionada"**:

- Selecciona la categoría cuyos productos deseas recomendar (ej. _Ocasión › Aniversario_, _Tulipanes_ o _Arreglos florales_).
- Al final del artículo se mostrarán automáticamente hasta **4 arreglos activos** de esa colección junto a un botón para ver el catálogo completo de dicha categoría.
- Esto convierte a cada artículo en un canal de venta directa.

---

## 5. Publicación y Programación

- **Publicar artículo (Interruptor):**
  - **Desactivado:** Se guarda como **Borrador**. Nadie en internet puede verlo.
  - **Activado:** Se vuelve público según la fecha indicada.
- **Fecha de publicación:**
  - Si seleccionas la fecha/hora actual, el artículo se publica inmediatamente.
  - Si seleccionas una fecha **futura** (ej. próximo lunes a las 09:00 am), el artículo quedará en estado **Programado** y se publicará solo cuando llegue el momento.

---

## 6. Metadatos SEO Opcionales (Google)

Si deseas un control más específico para posicionamiento web, despliega la sección **"+ Metadatos SEO Opcionales"**:

- **Meta Title:** Título personalizado para la pestaña del navegador y la cabecera en Google (ej. _Guía de Flores para Aniversario en Lima | Florería Miraflores_).
- **Meta Description:** Descripción exacta que mostrará el buscador si no deseas usar el resumen estándar.

---

## 7. Consejos de Buenas Prácticas

1. **Longitud:** Los artículos recomendados para buen posicionamiento en Google suelen tener entre 400 y 1,000 palabras.
2. **Estructura clara:** Usa subtítulos (H2 y H3) para separar los temas y facilitar la lectura en celulares.
3. **Imágenes reales:** Usa fotos de los arreglos preparados en el taller para transmitir confianza y autenticidad.
4. **Enlaces internos:** Puedes incluir enlaces hacia páginas clave (ej. `[revisa nuestras coronas fúnebres](/categoria/condolencias)` o `[nuestro catálogo completo](/catalogo)`).
