// scripts/load-test.mjs
// Script de prueba de carga y concurrencia para Florería Miraflores
// Ejecuta simulación de tráfico pico con múltiples usuarios concurrentes.

import { performance } from "node:perf_hooks";

const TARGET_URL = process.env.TARGET_URL || "https://florer-a-miraflores.vercel.app";
const CONCURRENCY = Number(process.env.CONCURRENCY) || 50; // Usuarios simultáneos
const TOTAL_REQUESTS = Number(process.env.TOTAL_REQUESTS) || 250; // Solicitudes totales

const PATHS = [
  "/",
  "/catalogo",
  "/categoria/tulipanes",
  "/recuerdos",
  "/nosotros",
];

console.log("==================================================================");
console.log("🚀 INICIANDO PRUEBA DE CARGA & CONCURRENCIA — FLORERÍA MIRAFLORES");
console.log(`🎯 URL Objetivo: ${TARGET_URL}`);
console.log(`👥 Usuarios Concurrentes (VUs): ${CONCURRENCY}`);
console.log(`📦 Solicitudes Totales: ${TOTAL_REQUESTS}`);
console.log("==================================================================\n");

const latencies = [];
const statusCounts = {};
let completed = 0;
let failed = 0;

async function sendRequest(id, path) {
  const url = `${TARGET_URL}${path}`;
  const start = performance.now();
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FloreriaMiraflores-QA-LoadTester/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const duration = performance.now() - start;
    latencies.push(duration);
    statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
    completed++;
  } catch (err) {
    const duration = performance.now() - start;
    latencies.push(duration);
    failed++;
    statusCounts["ERROR"] = (statusCounts["ERROR"] || 0) + 1;
  }
}

// Worker pool para manejar concurrencia exacta
async function runWorker(iterator) {
  for (const item of iterator) {
    const path = PATHS[item % PATHS.length];
    await sendRequest(item, path);
  }
}

function* requestGenerator(total) {
  for (let i = 0; i < total; i++) {
    yield i;
  }
}

const startTime = performance.now();
const generator = requestGenerator(TOTAL_REQUESTS);
const workers = Array.from({ length: CONCURRENCY }, () => runWorker(generator));

await Promise.all(workers);
const totalTimeMs = performance.now() - startTime;
const totalTimeSec = totalTimeMs / 1000;

// Cálculo de Percentiles
latencies.sort((a, b) => a - b);
const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
const p90 = latencies[Math.floor(latencies.length * 0.9)] || 0;
const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
const rps = (completed + failed) / totalTimeSec;

console.log("\n==================================================================");
console.log("📊 RESULTADOS OFICIALES DE LA AUDITORÍA DE CARGA");
console.log("==================================================================");
console.log(`⏱️  Tiempo Total de Prueba: ${totalTimeSec.toFixed(2)} segundos`);
console.log(`⚡ Solicitudes por Segundo (RPS): ${rps.toFixed(2)} req/s`);
console.log(`✅ Solicitudes Exitosas: ${completed}`);
console.log(`❌ Solicitudes Fallidas: ${failed}`);
console.log("\n📈 DISTRIBUCIÓN DE LATENCIA:");
console.log(`   Promedio (Avg):  ${avg.toFixed(1)} ms`);
console.log(`   Mediana (P50):   ${p50.toFixed(1)} ms`);
console.log(`   P90:             ${p90.toFixed(1)} ms`);
console.log(`   P95:             ${p95.toFixed(1)} ms`);
console.log(`   P99:             ${p99.toFixed(1)} ms`);
console.log(`   Mínima:          ${latencies[0]?.toFixed(1) || 0} ms`);
console.log(`   Máxima:          ${latencies[latencies.length - 1]?.toFixed(1) || 0} ms`);

console.log("\n📋 CÓDIGOS DE ESTADO HTTP:");
for (const [status, count] of Object.entries(statusCounts)) {
  console.log(`   [${status}]: ${count} respuestas`);
}

const slaPassed = failed === 0 && p95 < 1500;
console.log("\n==================================================================");
if (slaPassed) {
  console.log("🏆 VEREDICTO DE CARGA: APROBADO (SLA CUMPLIDO ✅)");
  console.log("   El servidor y la CDN resistieron la concurrencia con 0% errores.");
} else {
  console.log("⚠️ VEREDICTO DE CARGA: REQUIERE REVISIÓN");
}
console.log("==================================================================");
