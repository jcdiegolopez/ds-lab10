import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Estado compartido entre gráficas. Es la única fuente de verdad de los filtros:
//  - via: filtro global de vía de ingreso (lo cambian la barra de filtros y, más adelante, V3).
//  - rangoFechas: periodo que se está viendo en V1 (zoom, selector de rango o los selectores de año).
//    V2 lo usa para recalcular la estacionalidad.
//  - mesSeleccionado: clic en V6 (lo usará V9 para resaltar el error de ese mes).
const FiltrosContext = createContext(null);

export const VIAS = [
  { clave: 'Todas', etiqueta: 'Todas', campo: 'total' },
  { clave: 'Aérea', etiqueta: 'Aérea', campo: 'aerea' },
  { clave: 'Terrestre', etiqueta: 'Terrestre', campo: 'terrestre' },
  { clave: 'Marítima', etiqueta: 'Marítima', campo: 'maritima' },
];

export function FiltrosProvider({ children }) {
  const [via, setVia] = useState('Todas'); // 'Todas' | 'Aérea' | 'Terrestre' | 'Marítima'
  const [rangoFechas, setRangoFechas] = useState(null); // [inicio, fin] en 'YYYY-MM-DD'; null = todo el periodo
  const [granularidad, setGranularidad] = useState('mes'); // 'anio' | 'trimestre' | 'mes'
  const [serieModelo, setSerieModelo] = useState('Total mensual'); // 'Total mensual' | 'Vía aérea'
  const [modelosVisibles, setModelosVisibles] = useState({ hw: true, sarima: true, lstm: true });
  const [mesSeleccionado, setMesSeleccionado] = useState(null); // clic en V6 → resalta V9
  const [graficasOcultas, setGraficasOcultas] = useState([]); // ids de gráficas que el usuario ocultó

  const alternarGrafica = useCallback((id) => {
    setGraficasOcultas((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }, []);

  const valor = useMemo(
    () => ({
      via, setVia,
      rangoFechas, setRangoFechas,
      granularidad, setGranularidad,
      serieModelo, setSerieModelo,
      modelosVisibles, setModelosVisibles,
      mesSeleccionado, setMesSeleccionado,
      graficasOcultas, alternarGrafica,
    }),
    [via, rangoFechas, granularidad, serieModelo, modelosVisibles, mesSeleccionado, graficasOcultas, alternarGrafica],
  );

  return <FiltrosContext.Provider value={valor}>{children}</FiltrosContext.Provider>;
}

export function useFiltros() {
  const ctx = useContext(FiltrosContext);
  if (!ctx) throw new Error('useFiltros debe usarse dentro de <FiltrosProvider>');
  return ctx;
}
