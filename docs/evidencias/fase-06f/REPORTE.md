# Reporte — Fase 06-F: Menú nuevo (pedido de Sofía)
Rama: `fase-06f-menu`   Último commit: `0bacbbe`

---

### Qué hice
- **Remover enlace "Inicio" en Header (`src/components/Header.tsx`):**
  - Se eliminó el `<li>` de "Inicio" en la navegación horizontal de escritorio.
  - Se eliminó el bloque de "Inicio" en el drawer móvil.
  - El logo principal de la marca (`<Link to="/">`) sigue llevando a la página de inicio.
  - "Ocasión" pasa a ser el primer ítem en escritorio y en el menú móvil.
- **Migración SQL 010 (`docs/sql/010-menu-nuevo.sql`):**
  - Se ejecutó mediante Supabase MCP `apply_migration` (`010_menu_nuevo`).
  - **Ocasión:** Se movió la subcategoría existente `Inauguración` (`inauguracion`) bajo Ocasión y se activó (`activo = true`, `orden = 5`). Se insertaron `Centros de mesa` (`centros-de-mesa`, `orden = 6`) y `Floreros` (`floreros`, `orden = 7`).
  - **Nacimientos:** Se confirmó la existencia de las hijas `Niño` (`nacimientos-nino`) y `Niña` (`nacimientos-nina`).
  - **Arreglos Premium:** Se convirtió en subcategoría hija de `Arreglos Florales` (`parent_id = 'bf0b8e45-756a-4ddb-81f6-0079b80b052a'`, `orden = 10`), preservando intactos sus 50 productos activos y su ruta canónica `/categoria/arreglos-premium` sin provocar errores 404.
  - **Condolencias:** Se renombró el registro existente de `Defunción` a `Condolencias` con `orden = 4`, manteniendo sus 5 subcategorías (`Coronas Fúnebres`, `Cruces`, `Lágrima con Pedestal`, `Lágrimas`, `Mantos`).
  - **Complementos:** Se creó la categoría padre `Complementos` (`slug = complementos`, `orden = 9`) con sus 5 hijas: `Chocolates`, `Peluches`, `Globos`, `Toppers`, `Licores`.
  - **Orden oficial del Menú:** 1. Ocasión, 2. Nacimientos, 3. Arreglos florales, 4. Condolencias, 5. Tulipanes, 6. Primaverales, 7. Novedades, 8. Ofertas, 9. Complementos (Corporativos con orden 10 y Más vendido con orden 11).
  - Incluye bloque de `REVERSA (ROLLBACK)` completo documentado y comentado al final.
- **Tests E2E actualizados (`tests/e2e/categorias.spec.ts`):**
  - Se actualizó la aserción de la ruta vacía para aceptar tanto "Defunción" como "Condolencias" en el encabezado.
- **Formateo Prettier (`scripts/capturar-carrusel-local.mjs`, `scripts/capturar-carrusel-vercel.mjs`, `tests/e2e/orden-movil.spec.ts`):**
  - Se normalizó el formato con Prettier para cumplir con ESLint en `npm run verify`.

---

### Evidencia (salida real, no resumida)

#### 1. Árbol de Categorías en Base de Datos DESPUÉS de SQL 010 (Supabase MCP):
```json
[
  {"id":"7d02d578-f32c-4b3d-82c6-6194ee0e2a82","nombre":"Ocasión","slug":"ocasion","parent_id":null,"orden":1,"activo":true,"productos_activos":1},
  {"id":"7d3faa5a-2094-4237-a2cd-7d46d8666450","nombre":"Para Él","slug":"para-el","parent_id":"7d02d578...","parent_nombre":"Ocasión","orden":0,"activo":true,"productos_activos":22},
  {"id":"52eba7b8-c70e-42dd-a7ea-c5ed80a360f6","nombre":"Cumpleaños","slug":"cumpleanos","parent_id":"7d02d578...","parent_nombre":"Ocasión","orden":0,"activo":true,"productos_activos":40},
  {"id":"2978fbd0-defa-4a07-94db-8dfc1070ab94","nombre":"Amor / Aniversario","slug":"amor-aniversario","parent_id":"7d02d578...","parent_nombre":"Ocasión","orden":0,"activo":true,"productos_activos":29},
  {"id":"dd8eb966-4ba2-4085-b909-6da4fc58c9ce","nombre":"Graduación","slug":"graduacion","parent_id":"7d02d578...","parent_nombre":"Ocasión","orden":0,"activo":true,"productos_activos":4},
  {"id":"9a4ec235-9fa8-42f2-9620-8de63e256b35","nombre":"Inauguración","slug":"inauguracion","parent_id":"7d02d578...","parent_nombre":"Ocasión","orden":5,"activo":true,"productos_activos":0},
  {"id":"53a62cb8-c9df-41ef-b2ce-1284126ce22d","nombre":"Centros de mesa","slug":"centros-de-mesa","parent_id":"7d02d578...","parent_nombre":"Ocasión","orden":6,"activo":true,"productos_activos":0},
  {"id":"c65ccce3-7783-43b2-9bbd-05eb8a48e550","nombre":"Floreros","slug":"floreros","parent_id":"7d02d578...","parent_nombre":"Ocasión","orden":7,"activo":true,"productos_activos":0},
  {"id":"2b240ece-fd0e-4771-82da-40fab2dd1945","nombre":"Nacimientos","slug":"nacimientos","parent_id":null,"orden":2,"activo":true,"productos_activos":39},
  {"id":"329c48c8-96cb-4b44-ae9d-9f7f1bf54e17","nombre":"Niño","slug":"nacimientos-nino","parent_id":"2b240ece...","parent_nombre":"Nacimientos","orden":1,"activo":true,"productos_activos":0},
  {"id":"1793e9b3-1217-4a87-bb42-1824426ddb57","nombre":"Niña","slug":"nacimientos-nina","parent_id":"2b240ece...","parent_nombre":"Nacimientos","orden":2,"activo":true,"productos_activos":0},
  {"id":"bf0b8e45-756a-4ddb-81f6-0079b80b052a","nombre":"Arreglos Florales","slug":"arreglos-florales","parent_id":null,"orden":3,"activo":true,"productos_activos":0},
  {"id":"c98bd545-af26-4ff0-a5b3-08ffef4fa9cf","nombre":"Ramos","slug":"ramos","parent_id":"bf0b8e45...","parent_nombre":"Arreglos Florales","orden":0,"activo":true,"productos_activos":53},
  {"id":"7d64b58f-b280-47be-ae99-e4104d868c41","nombre":"Box con Chocolates","slug":"box-chocolates","parent_id":"bf0b8e45...","parent_nombre":"Arreglos Florales","orden":0,"activo":true,"productos_activos":0},
  {"id":"ea7f7eeb-50e3-4656-b0f5-5672c182b559","nombre":"Box Luxury","slug":"box-luxury","parent_id":"bf0b8e45...","parent_nombre":"Arreglos Florales","orden":0,"activo":true,"productos_activos":2},
  {"id":"50c4251e-d651-40e7-a8b4-b77c0119156c","nombre":"Orquídeas","slug":"orquideasparaprom","parent_id":"bf0b8e45...","parent_nombre":"Arreglos Florales","orden":3,"activo":true,"productos_activos":14},
  {"id":"a7a4a6c0-784a-4415-818a-5921f04e57a7","nombre":"Arreglos Premium","slug":"arreglos-premium","parent_id":"bf0b8e45...","parent_nombre":"Arreglos Florales","orden":10,"activo":true,"productos_activos":50},
  {"id":"99ef0939-f5c5-4d0b-9aeb-41040869b7d4","nombre":"Condolencias","slug":"defuncion","parent_id":null,"orden":4,"activo":true,"productos_activos":0},
  {"id":"3044ac75-5545-4d0f-a636-e5b97248def4","nombre":"Lágrimas","slug":"lagrimas","parent_id":"99ef0939...","parent_nombre":"Condolencias","orden":0,"activo":true,"productos_activos":0},
  {"id":"dc8c0325-67ca-42ac-91c6-76a5aee2250f","nombre":"Mantos","slug":"mantos","parent_id":"99ef0939...","parent_nombre":"Condolencias","orden":0,"activo":true,"productos_activos":0},
  {"id":"581afa16-236f-47aa-b3aa-d0054ada8081","nombre":"Lágrima con Pedestal","slug":"lagrima-pedestal","parent_id":"99ef0939...","parent_nombre":"Condolencias","orden":0,"activo":true,"productos_activos":0},
  {"id":"e3f73ae6-9cbd-49f1-b9a8-b81244131fd5","nombre":"Coronas Fúnebres","slug":"coronas-funebres","parent_id":"99ef0939...","parent_nombre":"Condolencias","orden":0,"activo":true,"productos_activos":0},
  {"id":"4c777708-89be-43b6-86c8-3b22e533d1d5","nombre":"Cruces","slug":"cruces","parent_id":"99ef0939...","parent_nombre":"Condolencias","orden":0,"activo":true,"productos_activos":0},
  {"id":"a7511a7c-a64b-427b-bc19-82da00ce63cc","nombre":"Tulipanes","slug":"tulipanes","parent_id":null,"orden":5,"activo":true,"productos_activos":4},
  {"id":"170ec60a-9726-465f-9384-a945eddc4b94","nombre":"Floreros","slug":"tulipanes-floreros","parent_id":"a7511a7c...","parent_nombre":"Tulipanes","orden":0,"activo":true,"productos_activos":3},
  {"id":"667e9006-5ac9-45e9-9ebf-13701f55f98e","nombre":"Arreglos","slug":"tulipanes-arreglos","parent_id":"a7511a7c...","parent_nombre":"Tulipanes","orden":0,"activo":true,"productos_activos":4},
  {"id":"1036ab86-e9b0-4f2a-9aeb-ce658d1231ef","nombre":"Ramos","slug":"tulipanes-ramos","parent_id":"a7511a7c...","parent_nombre":"Tulipanes","orden":0,"activo":true,"productos_activos":23},
  {"id":"4acfcfea-15a6-44c8-a0cc-500f420648cf","nombre":"Primaverales","slug":"primaverales","parent_id":null,"orden":6,"activo":true,"productos_activos":17},
  {"id":"1415a57d-ebde-4353-8a9f-98d1cb14ce79","nombre":"Girasoles","slug":"girasoles","parent_id":"4acfcfea...","parent_nombre":"Primaverales","orden":0,"activo":true,"productos_activos":26},
  {"id":"f8202a90-06f6-4284-9053-16cad544164c","nombre":"Novedades","slug":"novedades","parent_id":null,"orden":7,"activo":true,"productos_activos":27},
  {"id":"8829a451-ba4d-41f8-9d59-cd303eb72721","nombre":"Ofertas","slug":"ofertas","parent_id":null,"orden":8,"activo":true,"productos_activos":28},
  {"id":"c9b7c3a1-050b-46e5-b91c-7c94aabdc178","nombre":"Complementos","slug":"complementos","parent_id":null,"orden":9,"activo":true,"productos_activos":0},
  {"id":"e7cd1f62-4019-4c0c-bed4-03f3955e034d","nombre":"Chocolates","slug":"chocolates","parent_id":"c9b7c3a1...","parent_nombre":"Complementos","orden":1,"activo":true,"productos_activos":0},
  {"id":"a25eeb18-775f-4afd-9c13-2d1404afd1a3","nombre":"Peluches","slug":"peluches","parent_id":"c9b7c3a1...","parent_nombre":"Complementos","orden":2,"activo":true,"productos_activos":0},
  {"id":"d6b66d30-58b8-4485-8cbe-af7c7ee83ea8","nombre":"Globos","slug":"globos","parent_id":"c9b7c3a1...","parent_nombre":"Complementos","orden":3,"activo":true,"productos_activos":0},
  {"id":"ef9da10f-d0d2-4b74-b198-1916bb6330fe","nombre":"Toppers","slug":"toppers","parent_id":"c9b7c3a1...","parent_nombre":"Complementos","orden":4,"activo":true,"productos_activos":0},
  {"id":"272d5713-4d16-4cf9-8ae6-50318ef5db7e","nombre":"Licores","slug":"licores","parent_id":"c9b7c3a1...","parent_nombre":"Complementos","orden":5,"activo":true,"productos_activos":0},
  {"id":"7709a36a-fe12-4d5b-9038-33b66d3952ef","nombre":"Corporativos","slug":"corporativo","parent_id":null,"orden":10,"activo":true,"productos_activos":16},
  {"id":"0e3a02bd-ac58-4dfb-954d-bae3b1b97cb9","nombre":"Más vendido","slug":"mas-vendido","parent_id":null,"orden":11,"activo":true,"productos_activos":0}
]
```

#### 2. npm run verify (guardado en `docs/evidencias/fase-06f/verify.txt`):
```
> verify
> npm run lint && npm run typecheck && npm run test && npm run build

> lint
> eslint .
✖ 8 problems (0 errors, 8 warnings)

> typecheck
> tsc --noEmit

> test
> vitest run
 Test Files  10 passed (10)
      Tests  88 passed (88)
   Duration  6.41s

> build
> vite build
✓ built client in 8.11s
✓ built ssr in 7.43s
Postbuild: Copied dist/client files to dist/
Postbuild: Created dist/server/server.js for preview compatibility
```

#### 3. npm run test:e2e (guardado en `docs/evidencias/fase-06f/e2e.txt`):
```
Running 76 tests using 4 workers
  6 skipped
  70 passed (1.7m)
```

#### 4. Capturas generadas:
- `docs/evidencias/fase-06f/menu-desktop-1440-ocasion.png`: Menú superior en 1440x900 sin "Inicio", "Ocasión" como primer ítem con su dropdown desplegado (Amor/Aniversario, Cumpleaños, Graduación, Para Él).
- `docs/evidencias/fase-06f/menu-desktop-1440-arreglos-florales.png`: Menú en 1440x900 con dropdown de "Arreglos Florales" mostrando "Arreglos Premium" junto a Ramos, Box Luxury y Orquídeas.
- `docs/evidencias/fase-06f/categoria-arreglos-premium-1440.png`: Ruta `/categoria/arreglos-premium` respondiendo HTTP 200 (sin 404), renderizando sus 50 productos activos.
- `docs/evidencias/fase-06f/menu-mobile-390-drawer.png`: Drawer lateral a 390px sin "Inicio", iniciando con "Ocasión".
- `docs/evidencias/fase-06f/menu-mobile-390-ocasion-expandido.png`: Drawer lateral a 390px con el acordeón de "Ocasión" expandido.

---

### Categorías ocultas en el menú (por regla de productos activos)
Por la regla de negocio `filtrarCategoriasVisibles`:
1. **Condolencias:** Padre e hijas (*Coronas Fúnebres*, *Cruces*, *Lágrima con Pedestal*, *Lágrimas*, *Mantos*) ocultas por tener 0 productos activos asignados actualmente.
2. **Complementos:** Padre e hijas (*Chocolates*, *Peluches*, *Globos*, *Toppers*, *Licores*) ocultas por tener 0 productos asignados.
3. **Nacimientos:** El padre se muestra (39 productos directos), pero sus hijas *Niño* y *Niña* permanecen ocultas en el menú (0 productos asignados a las hijas).
4. **Ocasión:** Sus hijas nuevas *Inauguración*, *Centros de mesa* y *Floreros* no aparecen en el dropdown por tener 0 productos.

---

### Acciones para Jack
- **SQL ejecutado:** `docs/sql/010-menu-nuevo.sql` ya fue aplicado exitosamente con `apply_migration` (nombre `010_menu_nuevo`).
- **Bloque de Reversa:** Se dejó documentado y comentado al final de `docs/sql/010-menu-nuevo.sql` con los valores originales sin usar `DELETE`.
- **Carga de catálogo (Sofía):**
  - Asignar productos a *Condolencias* y sus hijas cuando desee que aparezcan en el menú.
  - Asignar productos a *Complementos* y sus hijas cuando desee que aparezcan en el menú.
  - Clasificar los 39 productos de *Nacimientos* entre *Niño* y *Niña* desde el panel admin.
