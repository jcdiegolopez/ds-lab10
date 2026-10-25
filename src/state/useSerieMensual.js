import { useMemo } from 'react';
import { useDatos } from './useDatos';
import { useFiltros, VIAS } from './FiltrosContext';

// Último día del mes de una fecha 'YYYY-MM-DD' (para que el eje no se corte en el último mes).
export function finDePeriodo(fechaISO) {
  const [a, m] = fechaISO.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
}

// Serie mensual de llegadas según la vía elegida en el filtro global.
// Devuelve [{ fecha: 'YYYY-MM-DD', total }] y los límites del periodo disponible.
export function useSerieMensual() {
  const { datos, error } = useDatos('serie_por_via.json');
  const { via } = useFiltros();

  const filas = useMemo(() => {
    if (!datos) return null;
    const campo = VIAS.find((v) => v.clave === via)?.campo ?? 'total';
    return datos.map((d) => ({ fecha: d.fecha, total: d[campo] }));
  }, [datos, via]);

  const limites = useMemo(
    () => (filas ? [filas[0].fecha, finDePeriodo(filas.at(-1).fecha)] : null),
    [filas],
  );

  return { datos: filas, limites, error };
}
