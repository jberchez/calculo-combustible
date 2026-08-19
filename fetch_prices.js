// fetch_prices.js
// Descarga el listado oficial de precios de carburantes del Ministerio para la
// Transición Ecológica y genera un JSON pequeño con las medias nacionales por
// tipo de combustible. Pensado para ejecutarse a diario desde GitHub Actions.
// Requiere Node 18+ (usa fetch nativo).

const fs = require("fs");

const MINETUR_URL =
  "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/";

function parseNumEs(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function promedio(valores) {
  const limpio = valores.filter((v) => v !== null && v > 0.2 && v < 4);
  if (!limpio.length) return null;
  const suma = limpio.reduce((a, b) => a + b, 0);
  return Math.round((suma / limpio.length) * 1000) / 1000;
}

async function main() {
  const res = await fetch(MINETUR_URL, {
    headers: { "User-Agent": "javier-berchez-calculadora/1.0 (uso personal)" },
  });
  if (!res.ok) throw new Error("Error al descargar precios: HTTP " + res.status);

  const data = await res.json();
  const lista = data.ListaEESSPrecio || [];
  if (!lista.length) throw new Error("El Ministerio no ha devuelto estaciones");

  const salida = {
    actualizado: new Date().toISOString(),
    fecha_fuente: data.Fecha || null,
    num_estaciones: lista.length,
    gasolina95: promedio(lista.map((e) => parseNumEs(e["Precio Gasolina 95 E5"]))),
    gasolina98: promedio(lista.map((e) => parseNumEs(e["Precio Gasolina 98 E5"]))),
    gasoleoA: promedio(lista.map((e) => parseNumEs(e["Precio Gasoleo A"]))),
    gasoleoPremium: promedio(lista.map((e) => parseNumEs(e["Precio Gasoleo Premium"]))),
    biodiesel: promedio(lista.map((e) => parseNumEs(e["Precio Biodiesel"]))),
    glp: promedio(lista.map((e) => parseNumEs(e["Precio Gases licuados del petróleo"]))),
  };

  fs.writeFileSync("precios-carburantes.json", JSON.stringify(salida, null, 2), "utf-8");
  console.log("precios-carburantes.json generado:", salida);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
