# Prompt Maestro de Fotos — Florería Miraflores

Guía para convertir fotos normales de los arreglos (tomadas con celular) en **imágenes de catálogo profesionales**, usando la IA de imagen de Google (Gemini / "Nano Banana" en la app de Google o en Google AI Studio).

**Regla de oro:** la IA **NO cambia las flores** (mismas flores, mismos colores, misma forma del arreglo). Solo reemplaza/limpia el fondo, mejora la luz y quita distracciones (manos, cables, desorden).

---

## Cómo usarlo (paso a paso)

1. Toma la foto del arreglo siguiendo la "Parte A".
2. Abre Gemini (app o AI Studio), sube la foto.
3. Pega **el Prompt Maestro** (Parte B), eligiendo un fondo de la "Parte C".
4. Si algo sale raro, ajusta con las correcciones de la "Parte E".
5. Descarga en alta calidad. Repite con el **mismo fondo** para todo el catálogo (consistencia).

---

## PARTE A — Cómo tomar la foto de origen

Cuanto mejor la foto de entrada, mejor el resultado. No hace falta estudio, solo:

- **Luz natural difusa**: cerca de una ventana, sin sol directo. Evita flash.
- **Fondo lo más limpio posible**: una pared clara o una tela lisa detrás. (La IA igual lo reemplaza, pero ayuda.)
- **Arreglo centrado y completo**: que entre todo el arreglo con algo de aire alrededor.
- **Enfoque nítido** en las flores. Toma 2–3 ángulos (frontal y ligeramente elevado).
- **Sin manos ni objetos** en la toma si puedes; si no, la IA los quita.
- **Cámara a la altura del arreglo**, no desde arriba mirando al piso.

---

## PARTE B — EL PROMPT MAESTRO (copiar y pegar)

> Reemplaza `{TIPO}` por el arreglo (ej: "ramo de tulipanes", "box de rosas rojas", "corona fúnebre") y `{FONDO}` por una opción de la Parte C.

```
Eres un retocador de fotografía de producto de alta gama para una florería premium.
Toma la imagen del {TIPO} que te doy y colócala en un fondo profesional de estudio.

PRESERVA EXACTAMENTE (no inventes ni modifiques):
- Las mismas flores, la misma cantidad, los mismos colores y tonalidades reales.
- La forma, el volumen y la composición exacta del arreglo.
- El florero, la caja o el envoltorio tal cual son en la foto original.
- Las proporciones reales del producto.

CAMBIA SOLO EL ENTORNO:
- Reemplaza el fondo por: {FONDO}
- Ilumina con luz suave y difusa de estudio, sombras delicadas y naturales debajo del arreglo.
- Coloca el arreglo sobre una superficie elegante coherente con el fondo.
- Aspecto editorial, premium, femenino y elegante. Estética de boutique floral de lujo.
- Colores del ambiente cálidos y sofisticados, que resalten las flores sin competir con ellas.

LIMPIA Y CORRIGE:
- Elimina manos, dedos, siluetas de personas, brazos o cualquier parte del cuerpo.
- Elimina cables, tomacorrientes, desorden, objetos ajenos y fondos de casa.
- Elimina textos, marcas de agua, logos o etiquetas que no sean del producto.
- Corrige el balance de blancos para que los colores de las flores se vean fieles y vivos.

CALIDAD:
- Alta resolución, nitidez de catálogo, sin ruido ni artefactos.
- Enfoque total en el arreglo; fondo con una suavidad sutil (poca profundidad de campo).

NO HAGAS:
- No cambies el tipo, color ni número de flores.
- No agregues flores, hojas ni elementos que no estén en la foto original.
- No estilices las flores de forma irreal ni las conviertas en ilustración.
- Mantén el resultado 100% fotográfico y realista.

Formato de salida: imagen cuadrada 1:1, arreglo centrado con aire alrededor.
```

---

## PARTE C — Biblioteca de fondos (elige uno, on-brand)

Todos van con la línea *"premium, femenino, elegante"*. Los primeros dos son los más seguros para catálogo.

1. **Estudio marfil minimalista** *(recomendado para catálogo)*
   `un fondo liso color marfil / blanco cálido, superficie del mismo tono, estilo estudio limpio y minimalista`

2. **Rosa empolvado suave** *(match con la identidad actual del sitio)*
   `un fondo degradado en rosa empolvado muy suave (#C4848A desaturado) con superficie clara, luz cálida`

3. **Champagne / crema con textura de tela** *(match con la paleta de la propuesta original)*
   `un fondo color champagne cremoso con una tela de lino sutilmente texturizada, elegante y cálido`

4. **Mármol claro premium**
   `una superficie de mármol blanco con vetas grises muy suaves y un fondo claro difuminado`

5. **Seda drapeada beige**
   `un fondo de seda beige drapeada con pliegues suaves, iluminación cálida de boutique`

6. **Madera clara + pared neutra**
   `una mesa de madera clara natural frente a una pared en tono arena neutro, estilo hogar elegante`

7. **Editorial oscuro (para arreglos claros / premium)**
   `un fondo carbón profundo y elegante con luz focal suave sobre el arreglo, estilo editorial de lujo`

8. **Escena de fecha especial** *(para campañas: San Valentín, Día de la Madre)*
   `un fondo cálido con bokeh dorado suave desenfocado, ambiente romántico y sofisticado, sin objetos definidos`

> Para **defunción/coronas**: usa el fondo 1 o 4 (marfil o mármol), luz sobria, nada romántico.

---

## PARTE D — Variantes por canal

Cambia solo la última línea del prompt:

- **Web (catálogo):** `Formato de salida: imagen cuadrada 1:1, arreglo centrado con aire alrededor.`
- **Instagram feed:** `Formato de salida: vertical 4:5, arreglo centrado.`
- **Reels / TikTok / Stories:** `Formato de salida: vertical 9:16, arreglo en el centro, más aire arriba y abajo.`

Mantén **el mismo fondo** en todo el catálogo web para que se vea como una colección coherente. Para redes puedes variar más.

---

## PARTE E — Correcciones rápidas (si sale mal)

Pégale a la IA una de estas sobre el resultado:

- Cambió las flores → `Mantén EXACTAMENTE las flores y colores de mi foto original, solo cambia el fondo.`
- Quedó una mano/dedo → `Quita por completo la mano y cualquier dedo o brazo de la imagen, rellena con el fondo.`
- Colores lavados → `Aumenta la fidelidad y saturación natural de las flores, que se vean vivas y reales.`
- Se ve artificial → `Hazlo 100% fotográfico y realista, como foto de producto profesional, no ilustración.`
- Sombra dura → `Suaviza la sombra bajo el arreglo, luz difusa de estudio.`
- Recortó el arreglo → `Muestra el arreglo completo con aire alrededor, no lo recortes.`

---

## PARTE F — Consistencia del catálogo (importante)

Para que la web se vea profesional y unificada:

1. Elige **un solo fondo** (ej. el #1 marfil) y úsalo en TODOS los productos del catálogo.
2. Mismo formato (1:1) y mismo encuadre (arreglo centrado, mismo aire).
3. Misma dirección de luz.
4. Sube siempre en alta resolución al panel (el sistema no comprime — es una ventaja de la web frente a Shopify/WordPress).

Así cada producto se ve distinto pero la colección se ve como una sola marca.

---

## Nota de marca

Los fondos 2 (rosa) y 3 (champagne) corresponden a las dos direcciones de identidad que están sin cerrar (ver `brand/README.md`). Cuando Sofía y marketing definan la paleta oficial, se fija ese fondo como estándar del catálogo.
