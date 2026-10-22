import { createContext, useContext, useMemo, useState } from 'react';

// Estado compartido entre gráficas (se usará para los enlaces V1→V2, V3→V1/V4, V6→V9).
const FiltrosContext = createContext(null);

export function FiltrosProvider({ children }) {
  const [rangoFechas, setRangoFechas] = useState(null); // [inicio, fin] del zoom de V1
  const [granularidad, setGranularidad] = useState('mes'); // 'anio' | 'trimestre' | 'mes'
  const [serieModelo, setSerieModelo] = useState('Total mensual'); // 'Total mensual' | 'Vía aérea'
  const [modelosVisibles, setModelosVisibles] = useState({ hw: true, sarima: true, lstm: true });
  const [mesSeleccionado, setMesSeleccionado] = useState(null); // clic en V6 → resalta V9

  const valor = useMemo(
    () => ({
      rangoFechas, setRangoFechas,
      granularidad, setGranularidad,
      serieModelo, setSerieModelo,
      modelosVisibles, setModelosVisibles,
      mesSeleccionado, setMesSeleccionado,
    }),
    [rangoFechas, granularidad, serieModelo, modelosVisibles, mesSeleccionado],
  );

  return <FiltrosContext.Provider value={valor}>{children}</FiltrosContext.Provider>;
}

export function useFiltros() {
  const ctx = useContext(FiltrosContext);
  if (!ctx) throw new Error('useFiltros debe usarse dentro de <FiltrosProvider>');
  return ctx;
}
