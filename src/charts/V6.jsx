import Plot from './Plot';
import TarjetaGrafica, { Cargando, SinDatos } from './TarjetaGrafica';
import { useDatos } from '../state/useDatos';
import { useFiltros } from '../state/FiltrosContext';
import { colores, estiloModelos } from '../theme/colors';
import { configBase, etiquetaMes, formatoNumero, layoutBase } from '../theme/plotlyBase';

const SERIES = [
  { clave: 'Total mensual', etiqueta: 'Total' },
  { clave: 'Vía aérea', etiqueta: 'Vía aérea' },
];
const ORDEN_MODELOS = ['hw', 'sarima', 'lstm'];

export default function V6() {
  const pred = useDatos('predicciones_modelos.json');
  const met = useDatos('metricas_modelos.json');
  const {
    serieModelo, setSerieModelo,
    modelosVisibles, setModelosVisibles,
    mesSeleccionado, setMesSeleccionado,
  } = useFiltros();

  if (!pred.datos || !met.datos) {
    return (
      <TarjetaGrafica id="V6" titulo="Real frente a tres modelos">
        <Cargando error={pred.error || met.error} />
      </TarjetaGrafica>
    );
  }

  const filas = pred.datos[serieModelo] ?? [];
  const metricas = Object.fromEntries(
    met.datos.filter((m) => m.serie === serieModelo).map((m) => [m.modelo, m]),
  );
  const x = filas.map((f) => f.fecha);
  const etiquetas = filas.map((f) => etiquetaMes(f.fecha));
  const activos = ORDEN_MODELOS.filter((m) => modelosVisibles[m]);

  const trazas = [
    {
      type: 'scatter',
      mode: 'lines',
      name: 'Real',
      x,
      y: filas.map((f) => f.real),
      customdata: etiquetas,
      line: { color: colores.observado, width: 3.5 },
      hovertemplate: '<b>%{customdata}</b><br>Real: %{y:,.0f}<extra></extra>',
    },
    ...activos.map((m) => ({
      type: 'scatter',
      mode: 'lines',
      name: estiloModelos[m].nombre,
      x,
      y: filas.map((f) => f[m]),
      line: { color: estiloModelos[m].color, width: 2.5, dash: estiloModelos[m].dash },
      hovertemplate: `${estiloModelos[m].nombre}: %{y:,.0f}<extra></extra>`,
    })),
  ];

  // Etiquetas directas al final de cada línea, separadas para que no se encimen.
  const finales = [
    { texto: 'Real', y: filas.at(-1)?.real, color: colores.observado },
    ...activos.map((m) => ({ texto: estiloModelos[m].nombre, y: filas.at(-1)?.[m], color: estiloModelos[m].color })),
  ].sort((a, b) => b.y - a.y);
  const rango = Math.max(...filas.flatMap((f) => [f.real, ...activos.map((m) => f[m])])) || 1;
  const minSep = rango * 0.06;
  for (let i = 1; i < finales.length; i++) {
    if (finales[i - 1].y - finales[i].y < minSep) finales[i].yEtiqueta = (finales[i - 1].yEtiqueta ?? finales[i - 1].y) - minSep;
  }

  const shapes = mesSeleccionado && x.includes(mesSeleccionado)
    ? [{
        type: 'line', xref: 'x', yref: 'paper', x0: mesSeleccionado, x1: mesSeleccionado, y0: 0, y1: 1,
        line: { color: colores.atencion, width: 2 },
      }]
    : [];

  const layout = layoutBase({
    height: 440,
    uirevision: serieModelo,
    margin: { l: 70, r: 130, t: 20, b: 45 },
    hovermode: 'x unified',
    // Rango fijo a los datos: si no, las etiquetas directas estiran el eje.
    xaxis: { type: 'date', tickformat: '%b %Y', dtick: 'M6', range: [x[0], x.at(-1)], autorange: false },
    yaxis: { title: { text: 'Llegadas', font: { size: 13, color: colores.contexto } }, rangemode: 'tozero' },
    shapes,
    annotations: finales.map((f) => ({
      x: x.at(-1), y: f.yEtiqueta ?? f.y, xref: 'x', yref: 'y', text: `<b>${f.texto}</b>`,
      showarrow: false, xanchor: 'left', xshift: 8, font: { size: 13, color: f.color },
    })),
  });

  const alternarModelo = (m) => setModelosVisibles((prev) => ({ ...prev, [m]: !prev[m] }));

  const controles = (
    <>
      <div className="grupo-botones" role="group" aria-label="Serie">
        <span className="control-etiqueta">Serie:</span>
        {SERIES.map((s) => (
          <button
            key={s.clave}
            type="button"
            className={serieModelo === s.clave ? 'activo' : ''}
            aria-pressed={serieModelo === s.clave}
            onClick={() => { setSerieModelo(s.clave); setMesSeleccionado(null); }}
          >
            {s.etiqueta}
          </button>
        ))}
      </div>
      <fieldset className="casillas">
        <legend className="control-etiqueta">Modelos:</legend>
        {ORDEN_MODELOS.map((m) => (
          <label key={m}>
            <input type="checkbox" checked={modelosVisibles[m]} onChange={() => alternarModelo(m)} />
            <span className={`muestra-linea muestra-${m}`} aria-hidden="true" />
            {estiloModelos[m].nombre}
          </label>
        ))}
      </fieldset>
    </>
  );

  const seleccion = mesSeleccionado && filas.find((f) => f.fecha === mesSeleccionado);

  return (
    <TarjetaGrafica
      id="V6"
      titulo="Real frente a tres modelos, abril 2021 – junio 2026"
      queMuestra="Las llegadas reales (azul sólido) y lo que anticipó cada modelo (líneas punteadas) en los 63 meses de prueba."
      paraQueSirve="Decidir cuánta confianza dar a una proyección. Haga clic en un mes para ver el error de cada modelo."
      controles={controles}
      nota="Los modelos se entrenaron con datos hasta marzo de 2021; por eso no anticiparon el rebote pospandemia. Son predicciones retrospectivas, no un pronóstico a futuro."
    >
      <div className="aviso-fijo">
        Entrenamiento: enero 2009 – marzo 2021 · Prueba: abril 2021 – junio 2026
      </div>
      {filas.length === 0 ? (
        <SinDatos />
      ) : (
        <Plot
          data={trazas}
          layout={layout}
          config={configBase}
         
          style={{ width: '100%' }}
          onClick={(e) => {
            const fecha = e.points?.[0]?.x;
            if (fecha) setMesSeleccionado(String(fecha).slice(0, 10));
          }}
        />
      )}
      {seleccion && (
        <div className="detalle-mes">
          <strong>{etiquetaMes(seleccion.fecha)}</strong> · Real {formatoNumero.format(seleccion.real)}
          {activos.map((m) => (
            <span key={m}>
              {' · '}{estiloModelos[m].nombre}: error {formatoNumero.format(seleccion.real - seleccion[m])}
            </span>
          ))}
          <button type="button" className="enlace" onClick={() => setMesSeleccionado(null)}>Quitar selección</button>
        </div>
      )}
      <table className="tabla-metricas">
        <caption>Error promedio en el periodo de prueba (menor es mejor)</caption>
        <thead>
          <tr><th scope="col">Modelo</th><th scope="col">RMSE</th><th scope="col">MAE</th></tr>
        </thead>
        <tbody>
          {ORDEN_MODELOS.map((m) => metricas[m] && (
            <tr key={m} className={modelosVisibles[m] ? '' : 'apagado'}>
              <th scope="row">{metricas[m].nombre}{metricas[m].configuracion ? ` (${metricas[m].configuracion})` : ''}</th>
              <td>{formatoNumero.format(metricas[m].rmse)}</td>
              <td>{formatoNumero.format(metricas[m].mae)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TarjetaGrafica>
  );
}
