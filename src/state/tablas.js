import { useDatos } from './useDatos';

// Algunos archivos vienen por columnas ({ columnas, filas }) para pesar menos.
// Se convierten a objetos una sola vez por archivo.
const convertidas = new WeakMap();

function aObjetos(tabla) {
  if (!convertidas.has(tabla)) {
    const { columnas, filas } = tabla;
    convertidas.set(tabla, filas.map((f) => Object.fromEntries(columnas.map((c, i) => [c, f[i]]))));
  }
  return convertidas.get(tabla);
}

export function useTabla(archivo) {
  const { datos, error } = useDatos(archivo);
  return { filas: datos ? aObjetos(datos) : null, error };
}

// V3 y V4 trabajan por año: el periodo elegido (zoom de V1 o selectores) se lleva a años completos.
export function aniosDelPeriodo(rangoFechas, minimo, maximo) {
  if (!rangoFechas) return [minimo, maximo];
  return [
    Math.max(minimo, Number(rangoFechas[0].slice(0, 4))),
    Math.min(maximo, Number(rangoFechas[1].slice(0, 4))),
  ];
}

// "2019" o "2019–2023"
export const textoAnios = ([a, b]) => (a === b ? `${a}` : `${a}–${b}`);
