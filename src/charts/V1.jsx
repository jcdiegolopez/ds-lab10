import { useMemo } from 'react';
import Plot from './Plot';
import TarjetaGrafica, { Cargando, SinDatos } from './TarjetaGrafica';
import { useDatos } from '../state/useDatos';
import { useFiltros } from '../state/FiltrosContext';
import { colores } from '../theme/colors';
import { configBase, etiquetaMes, formatoNumero, layoutBase } from '../theme/plotlyBase';

// Niveles de detalle: cada uno define cómo agrupar y la ventana del promedio móvil (= 1 año).
const NIVELES = {
  anio: { etiqueta: 'Año', ventana: null },
  trimestre: { etiqueta: 'Trimestre', ventana: 4 },
  mes: { etiqueta: 'Mes', ventana: 12 },
};

const PANDEMIA = ['2020-03-01', '2021-12-31'];
const CAMBIO_FUENTE = '2023-01-01';

function agrupar(filas, nivel) {
  if (nivel === 'mes') {
    return filas.map((f) => ({ fecha: f.fecha, valor: f.total, etiqueta: etiquetaMes(f.fecha), meses: 1 }));
  }
  const grupos = new Map();
  for (const f of filas) {
    const [a, m] = f.fecha.split('-').map(Number);
    const clave = nivel === 'anio' ? `${a}` : `${a}-T${Math.ceil(m / 3)}`;
    if (!grupos.has(clave)) {
      // Fecha al centro del periodo para que la barra/punto quede bien ubicado en el eje.
      const mesCentro = nivel === 'anio' ? 7 : (Math.ceil(m / 3) - 1) * 3 + 2;
      grupos.set(clave, {
        fecha: `${a}-${String(mesCentro).padStart(2, '0')}-01`,
        valor: 0,
        meses: 0,
        etiqueta: nivel === 'anio' ? `${a}` : `T${Math.ceil(m / 3)} ${a}`,
      });
    }
    const g = grupos.get(clave);
    g.valor += f.total;
    g.meses += 1;
  }
  return [...grupos.values()];
}

// Último día del mes de la última observación (para que el eje no se corte).
function finDePeriodo(fechaISO) {
  const [a, m] = fechaISO.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
}

function promedioMovil(valores, ventana) {
  return valores.map((_, i) => {
    if (i < ventana - 1) return null;
    let s = 0;
    for (let j = i - ventana + 1; j <= i; j++) s += valores[j];
    return s / ventana;
  });
}

export default function V1() {
  const { datos, error } = useDatos('serie_total_mensual.json');
  const { granularidad, setGranularidad, setRangoFechas } = useFiltros();

  const puntos = useMemo(() => (datos ? agrupar(datos, granularidad) : []), [datos, granularidad]);

  if (!datos) return <TarjetaGrafica id="V1" titulo="Llegadas de visitantes"><Cargando error={error} /></TarjetaGrafica>;

  const { ventana } = NIVELES[granularidad];
  const x = puntos.map((p) => p.fecha);
  const y = puntos.map((p) => p.valor);
  const incompleto = puntos.map((p) => (granularidad !== 'mes' && p.meses < (granularidad === 'anio' ? 12 : 3) ? ' (periodo incompleto)' : ''));

  const trazas = [
    {
      type: granularidad === 'anio' ? 'bar' : 'scatter',
      mode: 'lines',
      name: 'Llegadas',
      x,
      y,
      customdata: puntos.map((p, i) => [p.etiqueta, incompleto[i]]),
      line: { color: colores.contexto, width: 1.5 },
      marker: { color: colores.observado },
      hovertemplate: '<b>%{customdata[0]}</b>%{customdata[1]}<br>Llegadas: %{y:,.0f}<extra></extra>',
    },
  ];

  if (ventana) {
    const pm = promedioMovil(y, ventana);
    trazas.push({
      type: 'scatter',
      mode: 'lines',
      name: 'Promedio móvil',
      x,
      y: pm,
      customdata: puntos.map((p) => p.etiqueta),
      line: { color: colores.observado, width: 3 },
      hovertemplate: `Promedio de los últimos ${ventana} ${granularidad === 'mes' ? 'meses' : 'trimestres'}: %{y:,.0f}<extra></extra>`,
    });
  }

  const ultimo = ventana ? trazas[1].y.at(-1) : null;
  const RANGO_COMPLETO = [datos[0].fecha, finDePeriodo(datos.at(-1).fecha)];

  const layout = layoutBase({
    height: 460,
    uirevision: granularidad, // el zoom se reinicia solo al cambiar el nivel de detalle
    margin: { l: 70, r: 140, t: 30, b: 40 },
    hovermode: 'x unified',
    bargap: 0.25,
    xaxis: {
      type: 'date',
      // Rango fijo a los datos: si no, las etiquetas del final estiran el eje.
      range: [RANGO_COMPLETO[0], RANGO_COMPLETO[1]],
      autorange: false,
      rangeslider: { visible: true, thickness: 0.08, bgcolor: colores.tarjetaOscura, range: RANGO_COMPLETO, autorange: false },
      rangeselector: {
        x: 0,
        y: 1.08,
        bgcolor: colores.tarjetaOscura,
        activecolor: colores.secundario,
        font: { size: 13 },
        buttons: [
          { count: 3, label: '3 años', step: 'year', stepmode: 'backward' },
          { count: 5, label: '5 años', step: 'year', stepmode: 'backward' },
          { count: 10, label: '10 años', step: 'year', stepmode: 'backward' },
          { step: 'all', label: 'Todo' },
        ],
      },
    },
    yaxis: { title: { text: 'Llegadas', font: { size: 13, color: colores.contexto } }, rangemode: 'tozero', fixedrange: false },
    shapes: [
      {
        type: 'rect', xref: 'x', yref: 'paper', x0: PANDEMIA[0], x1: PANDEMIA[1], y0: 0, y1: 1,
        fillcolor: colores.tarjetaOscura, opacity: 0.8, line: { width: 0 }, layer: 'below',
      },
      {
        type: 'line', xref: 'x', yref: 'paper', x0: CAMBIO_FUENTE, x1: CAMBIO_FUENTE, y0: 0, y1: 1,
        line: { color: colores.contexto, width: 1.5, dash: 'dot' },
      },
    ],
    annotations: [
      {
        x: '2021-01-15', xref: 'x', y: 0.98, yref: 'paper', text: 'Pandemia', showarrow: false,
        font: { size: 13, color: colores.contexto }, xanchor: 'center', yanchor: 'top',
      },
      {
        x: CAMBIO_FUENTE, xref: 'x', y: 0.98, yref: 'paper', text: 'Cambio de clasificación<br>de la fuente',
        showarrow: false, font: { size: 12, color: colores.contexto }, xanchor: 'left', yanchor: 'top', xshift: 4, align: 'left',
      },
      ...(ultimo
        ? [{
            x: x.at(-1), y: ultimo, xref: 'x', yref: 'y', text: `<b>Promedio móvil</b><br>${formatoNumero.format(ultimo)}`,
            showarrow: false, xanchor: 'left', xshift: 8, font: { size: 13, color: colores.observado }, align: 'left',
          }]
        : []),
    ],
  });

  const controles = (
    <div className="grupo-botones" role="group" aria-label="Nivel de detalle">
      <span className="control-etiqueta">Nivel de detalle:</span>
      {Object.entries(NIVELES).map(([clave, { etiqueta }]) => (
        <button
          key={clave}
          type="button"
          className={granularidad === clave ? 'activo' : ''}
          aria-pressed={granularidad === clave}
          onClick={() => setGranularidad(clave)}
        >
          {etiqueta}
        </button>
      ))}
    </div>
  );

  return (
    <TarjetaGrafica
      id="V1"
      titulo="Llegadas de visitantes, enero 2009 – junio 2026"
      queMuestra="Las llegadas totales (gris) y su promedio móvil de un año (azul), que suaviza la estacionalidad."
      paraQueSirve="Dimensionar la caída de la pandemia y cuánto se ha recuperado el sector. Use el selector de rango o arrastre sobre la gráfica para acercarse."
      controles={controles}
      nota="La franja sombreada marca la pandemia (2020–2021). 2026 solo incluye enero a junio. Fuente: INGUAT / IGM."
    >
      {puntos.length === 0 ? (
        <SinDatos />
      ) : (
        <Plot
          data={trazas}
          layout={layout}
          config={configBase}
         
          style={{ width: '100%' }}
          onRelayout={(e) => {
            if (e['xaxis.range[0]']) setRangoFechas([e['xaxis.range[0]'], e['xaxis.range[1]']]);
            else if (e['xaxis.range']) setRangoFechas(e['xaxis.range']);
            else if (e['xaxis.autorange']) setRangoFechas(null);
          }}
        />
      )}
    </TarjetaGrafica>
  );
}
