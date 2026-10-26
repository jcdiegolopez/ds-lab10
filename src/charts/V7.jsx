import { useState } from 'react';
import Plot from './Plot';
import TarjetaGrafica, { Cargando, SinDatos } from './TarjetaGrafica';
import { useDatos } from '../state/useDatos';
import { useFiltros } from '../state/FiltrosContext';
import { NOMBRE_SERIE, ORDEN_MODELOS } from '../state/modelos';
import { colores, estiloModelos } from '../theme/colors';
import { configBase, formatoNumero, layoutBase } from '../theme/plotlyBase';

const METRICAS = {
  rmse: { etiqueta: 'RMSE', explicacion: 'castiga más los errores grandes' },
  mae: { etiqueta: 'MAE', explicacion: 'error promedio por mes, en visitantes' },
};

export default function V7() {
  const { datos, error } = useDatos('metricas_modelos.json');
  const { serieModelo } = useFiltros();
  const [metrica, setMetrica] = useState('rmse');
  const { etiqueta, explicacion } = METRICAS[metrica];

  const encabezado = {
    id: 'V7',
    titulo: 'Cuánto se equivoca cada modelo',
    queMuestra: `El error promedio de cada modelo en los 63 meses de prueba (${etiqueta}: ${explicacion}). Barra más corta = modelo más acertado.`,
    paraQueSirve: 'Elegir qué modelo respalda la planificación. La línea punteada es la referencia mínima: repetir lo que pasó el mismo mes del año anterior.',
  };

  const controles = (
    <div className="grupo-botones" role="group" aria-label="Métrica de error">
      <span className="control-etiqueta">Métrica:</span>
      {Object.entries(METRICAS).map(([clave, m]) => (
        <button
          key={clave}
          type="button"
          className={metrica === clave ? 'activo' : ''}
          aria-pressed={metrica === clave}
          onClick={() => setMetrica(clave)}
        >
          {m.etiqueta}
        </button>
      ))}
    </div>
  );

  if (!datos) return <TarjetaGrafica {...encabezado}><Cargando error={error} /></TarjetaGrafica>;

  const deSerie = Object.fromEntries(datos.filter((m) => m.serie === serieModelo).map((m) => [m.modelo, m]));
  const modelos = ORDEN_MODELOS.filter((m) => deSerie[m]).sort((a, b) => deSerie[b][metrica] - deSerie[a][metrica]);
  if (modelos.length === 0) return <TarjetaGrafica {...encabezado} controles={controles}><SinDatos mensaje="No hay métricas para esta serie." /></TarjetaGrafica>;

  const base = deSerie.naive?.[metrica];
  const mejor = modelos.at(-1); // el último dibujado (arriba) es el de menor error
  const trazas = [{
    type: 'bar',
    orientation: 'h',
    y: modelos.map((m) => estiloModelos[m].nombre),
    x: modelos.map((m) => deSerie[m][metrica]),
    marker: { color: modelos.map((m) => estiloModelos[m].color) },
    text: modelos.map((m) => formatoNumero.format(deSerie[m][metrica])),
    textposition: 'outside',
    cliponaxis: false,
    textfont: { size: 14, color: colores.tinta },
    hoverinfo: 'text',
    hovertext: modelos.map((m) => {
      const d = deSerie[m];
      const frente = base ? `<br>${((1 - d[metrica] / base) * 100).toFixed(0)} % menos error que la referencia` : '';
      return `<b>${d.nombre}</b>${d.configuracion ? ` (${d.configuracion})` : ''}<br>${etiqueta}: ${formatoNumero.format(d[metrica])} visitantes${frente}<br>Fuente: ${d.fuente}`;
    }),
  }];

  const maxX = Math.max(base ?? 0, ...modelos.map((m) => deSerie[m][metrica])) * 1.15;
  const layout = layoutBase({
    height: 280,
    uirevision: `v7-${serieModelo}-${metrica}`,
    margin: { l: 130, r: 30, t: 36, b: 50 },
    bargap: 0.35,
    xaxis: { range: [0, maxX], fixedrange: true, tickformat: '~s', title: { text: `${etiqueta} (visitantes por mes)`, font: { size: 13, color: colores.contexto } } },
    yaxis: { fixedrange: true, tickfont: { size: 14, color: colores.tinta }, tickformat: '' },
    shapes: base ? [{
      type: 'line', xref: 'x', x0: base, x1: base, yref: 'paper', y0: 0, y1: 1,
      line: { color: colores.contexto, width: 1.5, dash: 'dot' },
    }] : [],
    annotations: base ? [{
      xref: 'x', x: base, yref: 'paper', y: 1, yanchor: 'bottom', xanchor: 'right', showarrow: false, xshift: -4,
      text: `Referencia: repetir el año anterior (${formatoNumero.format(base)})`, font: { size: 13, color: colores.contexto },
    }] : [],
  });

  const dMejor = deSerie[mejor];
  const mejora = base ? ` Eso es ${((1 - dMejor[metrica] / base) * 100).toFixed(0)} % menos error que la referencia.` : '';

  return (
    <TarjetaGrafica
      {...encabezado}
      controles={controles}
      nota={`Serie: ${NOMBRE_SERIE[serieModelo]}. Holt-Winters y SARIMA/ARIMA vienen del Laboratorio 1 y LSTM-B del Laboratorio 2, medidos en el mismo periodo de prueba. `
        + 'La referencia (seasonal naïve) no es un modelo del tablero; sirve para saber si un modelo aporta algo.'}
    >
      <p className="lectura">
        Para {NOMBRE_SERIE[serieModelo]}, {dMejor.nombre} es el más acertado: su {etiqueta} es de {formatoNumero.format(dMejor[metrica])} visitantes por mes.{mejora}
      </p>
      <Plot data={trazas} layout={layout} config={{ ...configBase, displayModeBar: false }} style={{ width: '100%' }} />
    </TarjetaGrafica>
  );
}
