# PROMPT 06-D — Orden en celular (feedback de Sofía: "en responsive se ve medio desordenado")

Rama `fase-06d-mobile` desde master actualizado. Reglas del 00 vigentes.

0. Auditoría primero: capturas de página completa del home, /catalogo, una categoría, un producto y checkout a 360, 390 y 414 px, desde la web real, en docs/evidencias/fase-06d/antes/. Lista todo lo que se vea desalineado, cortado, superpuesto o con huecos.

1. Bento de Colecciones en móvil (<640px): nada de tarjetas huérfanas.
   Regla: la 1ª ocupa todo el ancho; el resto va en 2 columnas con la MISMA altura; si lo que queda es impar, la 2ª también va a todo el ancho para que el resto quede par.
   Con 6 colecciones: Corporativos (ancho), Graduación (ancho), luego grilla 2x2.
   Test E2E a 390: ninguna fila con hueco vacío; todas las tarjetas chicas miden igual.

2. Banner para celular:
   - SQL 009 (mostrar y esperar aprobación): columna imagen_mobile_url text en banners.
   - Admin de banners: segundo campo de subida "Imagen para celular (1080 x 1350, 4:5)", opcional.
   - Hero: con <picture>, si hay imagen_mobile_url se usa en <768px con aspect 4:5; si no la hay, se mantiene la de escritorio en 8:3 como hoy.
   - Guía corta en docs para Sofía: medidas y margen de seguridad de 100 px.

3. Nombres de producto en tarjetas: 2 líneas en móvil (line-clamp-2) con altura reservada para que todas las tarjetas queden alineadas.

4. WhatsApp flotante: que no tape contenido (más chico en móvil o con margen inferior); el botón de compartir de las tarjetas no debe quedar debajo.

5. Arregla lo que encuentres en la auditoría (paso 0). Si algo implica decisión de diseño, pregúntalo (en el reporte, sección "Decisiones pendientes").

Cierre: capturas "después" a 360/390/414 de las mismas páginas (desde el código final), verify + E2E guardados en archivo, merge, push, y captura de la web real DESPUÉS del deploy (revisa tú la captura antes de describirla).
