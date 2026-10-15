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

## PARTE C — Biblioteca de fondos

El secreto para que se vea caro (como Lima Floral) NO es un fondo liso: es una **escena de boutique con el fondo desenfocado** (bokeh) y el arreglo nítido adelante. Por eso casi todos estos llevan **poca profundidad de campo**.

> 💡 Para cualquier fondo con escena, agrega siempre al prompt: _"profundidad de campo baja: arreglo totalmente nítido en primer plano, fondo suavemente desenfocado (bokeh). El fondo NO debe tener flores sueltas reconocibles que se confundan con el producto."_

### Fondos tipo AMBIENTE (con bokeh — los que se ven premium) ⭐

1. **Boutique de lujo desenfocada** _(el look Lima Floral — recomendado)_
   `una elegante boutique floral de fondo totalmente desenfocado: floreros claros, luz cálida y pared con paneles en tonos crema y rosa suave, todo fuera de foco (bokeh). El arreglo nítido en primer plano sobre una superficie de mármol blanco. Poca profundidad de campo.`

2. **Mármol con ventana luminosa detrás**
   `superficie de mármol blanco nítida en primer plano y, detrás, una ventana amplia con luz natural difusa y una sala clara desenfocada. Bokeh suave, aire luminoso y sofisticado.`

3. **Atelier floral cálido**
   `un rincón de taller floral de alta gama al fondo (estantería con jarrones y flores fuera de foco, tonos tierra y crema), desenfocado; el arreglo nítido adelante sobre mesa de piedra clara. Luz cálida de boutique.`

4. **Seda / cortina drapeada con bokeh dorado**
   `fondo de seda o cortina clara drapeada, suavemente desenfocada, con destellos dorados (bokeh). Superficie elegante en primer plano. Ambiente romántico y premium.`

5. **Jardín / terraza suave** _(ideal primaverales, girasoles, tulipanes)_
   `al fondo un jardín o terraza elegante muy desenfocado, con verde y luz natural cálida en bokeh; el arreglo nítido sobre una mesa clara. Fresco y luminoso.`

6. **Editorial oscuro con haz de luz** _(para arreglos claros / premium)_
   `fondo carbón profundo y elegante, desenfocado, con un haz de luz focal suave sobre el arreglo. Dramático, de lujo, estilo revista.`

### Fondos LISOS (base, para máxima consistencia de catálogo)

7. **Estudio marfil minimalista** `fondo liso marfil / blanco cálido, superficie del mismo tono, estudio limpio.`
8. **Rosa empolvado suave** `fondo degradado rosa empolvado muy suave (#C4848A desaturado), superficie clara, luz cálida.`
9. **Mármol claro premium** `superficie de mármol blanco con vetas grises muy suaves y fondo claro difuminado.`

> Para **defunción/coronas**: usa 7 o 9 (marfil o mármol), luz sobria, sin bokeh romántico.

### Cómo variar SIN perder coherencia (clave)

No uses 8 fondos distintos al azar (se ve desordenado). La fórmula pro:

- Elige **UNA escena base** para casi todo el catálogo (recomiendo la #1, boutique desenfocada). Da el look caro y uniforme de Lima Floral.
- Permite **1–2 variantes** por tipo de producto: premium/cajas → #1 o #6; clásicos → #2 o #9; primaverales → #5; fechas especiales → #4.
- Mantén siempre la **misma temperatura de luz** (cálida) y el **mismo encuadre**. Así cada foto respira distinto pero la colección se ve de una sola marca.

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
