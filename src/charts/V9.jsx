import { useState } from 'react';
import Plot from './Plot';
import TarjetaGrafica, { Cargando, SinDatos } from './TarjetaGrafica';
import { useDatos } from '../state/useDatos';
import { useFiltros } from '../state/FiltrosContext';
import { NOMBRE_SERIE, ORDEN_MODELOS } from '../state/modelos';
import { colores, estiloModelos } from '../theme/colors';
import { configBase, etiquetaMes, formatoNumero, layoutBase } from '../theme/plotlyBase';

const MENOS = '−';
const conSigno = (v) => `${v >= 0 ? '+' : MENOS}${formatoNumero.format(Math.abs(v))}`;

export default function V9() {
  const { datos, error } = useDatos('predicciones_modelos.json');
  const { serieModelo, mesSeleccionado, setMesSeleccionado } = useFiltros();
  const [modelo, setModelo] = useState('lstm');
  const nombre = estiloModelos[modelo].nombre;

  const encabezado = {
    id: 'V9',
    titulo: 'En qué meses falló cada modelo',
    queMuestra: 'El error de cada mes: llegadas reales menos lo pronosticado. Hacia arriba, llegaron más visitantes de los previstos; hacia abajo, menos.',
    paraQueSirve: 'Ver cuándo falla un modelo, no solo cuánto. El mes elegido en V6 se resalta en naranja; también puede hacer clic aquí.',
  };

  const controles = (
    <div className="grupo-botones" role="group" aria-label="Modelo">
      <span className="control-etiqueta">Modelo:</span>
      {ORDEN_MODELOS.map((m) => (
        <button
          key={m}
          type="button"
          className={modelo === m ? 'activo' : ''}
          aria-pressed={modelo === m}
          onClick={() => setModelo(m)}
        >
          {estiloModelos[m].nombre}
        </button>
      ))}
    </div>
  );

  if (!datos) return <TarjetaGrafica {...encabezado}><Cargando error={error} /></TarjetaGrafica>;
  const filas = (datos[serieModelo] ?? []).filter((f) => f[modelo] != null);
  if (filas.length === 0) return <TarjetaGrafica {...encabezado} controles={controles}><SinDatos mensaje="No hay predicciones de este modelo para la serie elegida." /></TarjetaGrafica>;

  const x = filas.map((f) => f.fecha);
  const errores = filas.map((f) => f.real - f[modelo]);
  const elegido = mesSeleccionado && x.includes(mesSeleccionado) ? mesSeleccionado : null;

  const trazas = [{
    type: 'bar',
    x,
    y: errores,
    marker: { color: x.map((f) => (f === elegido ? colores.atencion : colores.contexto)) },
    customdata: filas.map((f, i) => [etiquetaMes(f.fecha), formatoNumero.format(f.real), formatoNumero.format(f[modelo]), conSigno(errores[i])]),
    hovertemplate: `<b>%{customdata[0]}</b><br>Real: %{customdata[1]}<br>${nombre}: %{customdata[2]}<br>Error: %{customdata[3]}<extra></extra>`,
  }];

  const maxAbs = Math.max(...errores.map(Math.abs)) * 1.3; // espacio para las etiquetas de arriba y abajo
  const layout = layoutBase({
    height: 380,
    uirevision: `v9-${serieModelo}`,
    margin: { l: 70, r: 20, t: 20, b: 45 },
    bargap: 0.15,
    xaxis: { type: 'date', tickformat: '%b %Y', dtick: 'M6', fixedrange: true },
    yaxis: { range: [-maxAbs, maxAbs], fixedrange: true, zeroline: true, zerolinecolor: colores.tinta, zerolinewidth: 1.5, title: { text: 'Real − pronosticado', font: { size: 13, color: colores.contexto } } },
    annotations: [
      { xref: 'paper', x: 0, xanchor: 'left', yref: 'paper', y: 1, yanchor: 'top', showarrow: false, text: 'Llegaron más de lo previsto', font: { size: 13, color: colores.contexto } },
      { xref: 'paper', x: 0, xanchor: 'left', yref: 'paper', y: 0, yanchor: 'bottom', showarrow: false, text: 'Llegaron menos de lo previsto', font: { size: 13, color: colores.contexto } },
    ],
  });

  const subestimados = errores.filter((e) => e > 0).length;
  const iPeor = errores.reduce((m, e, i) => (Math.abs(e) > Math.abs(errores[m]) ? i : m), 0);
  const fila = elegido && filas.find((f) => f.fecha === elegido);

  return (
    <TarjetaGrafica
      {...encabezado}
      controles={controles}
      nota={`Serie: ${NOMBRE_SERIE[serieModelo]}. Un error de +10,000 significa que llegaron 10,000 visitantes más de los que el modelo esperaba. Desde enero de 2023 el dato real se mide sin las categorías “Guatemala” y cruceristas, que la fuente dejó de informar: parte del error de esos meses viene de ese cambio y no del modelo.`}
    >
      <p className="lectura">
        {nombre} se quedó corto en {subestimados} de {filas.length} meses. Su mayor error fue en {etiquetaMes(x[iPeor])} ({conSigno(errores[iPeor])} visitantes).
      </p>
      <Plot
        data={trazas}
        layout={layout}
        config={{ ...configBase, displayModeBar: false }}
        style={{ width: '100%', cursor: 'pointer' }}
        onClick={(e) => {
          const fecha = e.points?.[0]?.x;
          if (fecha) setMesSeleccionado(String(fecha).slice(0, 10));
        }}
      />
      {fila && (
        <div className="detalle-mes">
          <strong>{etiquetaMes(fila.fecha)}</strong> · Real {formatoNumero.format(fila.real)} · {nombre} {formatoNumero.format(fila[modelo])} · error {conSigno(fila.real - fila[modelo])}
          <button type="button" className="enlace" onClick={() => setMesSeleccionado(null)}>Quitar selección</button>
        </div>
      )}
    </TarjetaGrafica>
  );
}
