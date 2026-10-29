import { readFileSync, writeFileSync } from "node:fs";

const prods = JSON.parse(readFileSync("scripts/data/diagnostico_todos_productos.json", "utf-8"));

// Mapeo manual de productos truncados o corruptos conocidos
const manualFixes = {
  // Truncados mid-word
  "6446fa60-2c87-4b8a-ba09-e16e2b844292": "Centro Floral Salvia & Rosas Fucsia",
  "5fcacc69-1912-4275-8994-e21ad1f3fd3f": "Box Dorado con Rosas Amarillas & Peluche",
  "464044d1-fbb1-4ebf-a639-808d4b248ebc": "Bouquet de Globos Chrome Oro Rosa",
  "54858646-a672-40a3-8554-e2069bb02f5f": "Arreglo Solar Radiante de Girasoles",
  "05066935-ceb0-4932-8493-c4ab997c2c3f": "Bouquet de Globos Happy Birthday Rose Gold",
  "2e5cf95b-f5d4-44c4-9d9d-cf8994091aee": "Arreglo Silvestre de Girasoles",
  "3e6714a7-d388-49cd-868e-60406898cc7d": "Arreglo Graduación con Peluche Huggy",
  "8fce1731-1580-445a-9c84-c966be43ae12": "Ramo Fantasía Alegre",
};

function cleanTitle(original, id) {
  if (manualFixes[id]) {
    return manualFixes[id];
  }

  let title = original.trim();

  // 1. Quitar prefijo de lote (ej. "Lote 4 Sofía - ", "Lote 4 - ")
  title = title.replace(/^Lote\s*\d+\s*(Sofía|Sofia)?\s*[-–—:]\s*/i, "");

  // 2. Quitar sufijo con # y Pack (ej. " #002 - Pack 5", " - Pack 5")
  title = title.replace(/\s*[-–—:]?\s*#\d+\s*[-–—:]\s*Pack\s*\d+\s*$/i, "");
  title = title.replace(/\s*[-–—:]\s*Pack\s*\d+\s*$/i, "");
  title = title.replace(/\s+Pack\s*\d+\s*$/i, "");

  // 3. Quitar sufijo de identificador de foto/lote con # (ej. " #083", " #001")
  title = title.replace(/\s*#\d+\s*$/, "");

  // 4. Normalizar espacios múltiples
  title = title.replace(/\s+/g, " ").trim();

  return title;
}

const audit = [];

for (const p of prods) {
  const cleaned = cleanTitle(p.nombre, p.id);
  if (cleaned !== p.nombre) {
    audit.push({
      id: p.id,
      original: p.nombre,
      limpio: cleaned,
      precio: p.precio,
      categoria_id: p.categoria_id,
      created_at: p.created_at,
    });
  }
}

console.log(`Total productos auditados: ${prods.length}`);
console.log(`Total productos que serán actualizados: ${audit.length}`);

writeFileSync(
  "scripts/data/auditoria_cambios_titulos.json",
  JSON.stringify(audit, null, 2),
  "utf-8",
);
console.log("Guardado en scripts/data/auditoria_cambios_titulos.json");

// Muestra de los primeros 25 y últimos 25
console.log("\n--- PRIMEROS 15 CAMBIOS ---");
audit.slice(0, 15).forEach((a) => {
  console.log(`"${a.original}"  ==>  "${a.limpio}"`);
});

console.log("\n--- ÚLTIMOS 15 CAMBIOS ---");
audit.slice(-15).forEach((a) => {
  console.log(`"${a.original}"  ==>  "${a.limpio}"`);
});
