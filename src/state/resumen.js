// Cálculos simples sobre la serie mensual. Todo se deriva de los datos; no hay cifras escritas a mano.

const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
export const nombreMes = (i) => MESES_LARGO[i];

// Totales por año, con el número de meses que tiene cada uno.
export function totalesAnuales(filas) {
  const m = new Map();
  for (const f of filas) {
    const a = Number(f.fecha.slice(0, 4));
    const g = m.get(a) ?? { anio: a, total: 0, meses: 0 };
    g.total += f.total;
    g.meses += 1;
    m.set(a, g);
  }
  return [...m.values()].sort((x, y) => x.anio - y.anio);
}

// Suma de los meses de enero a `hastaMes` de un año.
function acumuladoAnio(filas, anio, hastaMes) {
  return filas
    .filter((f) => Number(f.fecha.slice(0, 4)) === anio && Number(f.fecha.slice(5, 7)) <= hastaMes)
    .reduce((s, f) => s + f.total, 0);
}

const variacion = (nuevo, base) => (base > 0 ? nuevo / base - 1 : null);

// Indicadores de las tarjetas de la sección Panorama.
export function indicadores(filas) {
  const anios = totalesAnuales(filas);
  const completos = anios.filter((a) => a.meses === 12);
  const record = completos.reduce((mejor, a) => (!mejor || a.total > mejor.total ? a : mejor), null);
  const porAnio = Object.fromEntries(anios.map((a) => [a.anio, a]));
  const ultimo = filas.at(-1);
  const anioUlt = Number(ultimo.fecha.slice(0, 4));
  const mesUlt = Number(ultimo.fecha.slice(5, 7));

  return {
    record,
    caida2020: porAnio[2019] && porAnio[2020] ? variacion(porAnio[2020].total, porAnio[2019].total) : null,
    // Sin visitantes en 2019 no hay base (pasa en la vía marítima con la medida comparable).
    nivel2025: porAnio[2019]?.total > 0 && porAnio[2025] && porAnio[2025].meses === 12
      ? porAnio[2025].total / porAnio[2019].total
      : null,
    parcial: {
      anio: anioUlt,
      hastaMes: mesUlt,
      cambio: variacion(acumuladoAnio(filas, anioUlt, mesUlt), acumuladoAnio(filas, anioUlt - 1, mesUlt)),
    },
  };
}

// Índice estacional: promedio de cada mes ÷ promedio general × 100 (100 = un mes típico).
// Devuelve null si el periodo no cubre los 12 meses del año.
export function indiceEstacional(filas, [inicio, fin]) {
  const enRango = filas.filter((f) => f.fecha >= inicio && f.fecha <= fin);
  const sumas = Array(12).fill(0);
  const cuentas = Array(12).fill(0);
  for (const f of enRango) {
    const i = Number(f.fecha.slice(5, 7)) - 1;
    sumas[i] += f.total;
    cuentas[i] += 1;
  }
  if (cuentas.some((c) => c === 0)) return null;
  const promedioGeneral = enRango.reduce((s, f) => s + f.total, 0) / enRango.length;
  if (!(promedioGeneral > 0)) return null;
  return {
    indices: sumas.map((s, i) => (s / cuentas[i] / promedioGeneral) * 100),
    meses: enRango.length,
  };
}
