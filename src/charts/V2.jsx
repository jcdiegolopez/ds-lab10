import { useMemo } from 'react';
import Plot from './Plot';
import TarjetaGrafica, { Cargando, SinDatos } from './TarjetaGrafica';
import { useSerieMensual } from '../state/useSerieMensual';
import { useFiltros } from '../state/FiltrosContext';
import { indiceEstacional, nombreMes } from '../state/resumen';
import { colores } from '../theme/colors';
import { configBase, layoutBase } from '../theme/plotlyBase';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
// Sin selección en V1 se usa el periodo anterior a la pandemia, que no distorsiona los meses.
const PERIODO_BASE = ['2009-01-01', '2019-12-31'];

const anio = (f) => f.slice(0, 4);
const mesAnio = (f) => `${MESES_CORTO[Number(f.slice(5, 7)) - 1].toLowerCase()} ${anio(f)}`;

export default function V2() {
  const { datos, error } = useSerieMensual();
  const { rangoFechas, via } = useFiltros();

  const periodo = rangoFechas ?? PERIODO_BASE;
  const resultado = useMemo(() => (datos ? indiceEstacional(datos, periodo) : null), [datos, periodo]);

  if (!datos) return <TarjetaGrafica id="V2" titulo="Estacionalidad"><Cargando error={error} /></TarjetaGrafica>;

  const encabezado = {
    id: 'V2',
    titulo: 'Qué meses concentran la demanda',
    queMuestra: 'Cuánto se aleja cada mes del mes típico (100). Más de 100 es un mes con más visitantes de lo habitual; menos de 100, con menos.',
    paraQueSirve: 'Planificar promociones, personal y capacidad a lo largo del año. Cambie el periodo en V1 y esta gráfica se recalcula.',
  };

  if (!resultado) {
    return (
      <TarjetaGrafica {...encabezado}>
        <SinDatos mensaje="El periodo elegido en V1 es menor a un año completo, y no alcanza para comparar los 12 meses. Amplíelo para ver la estacionalidad." />
      </TarjetaGrafica>
    );
  }

  const { indices, meses } = resultado;
  const iMax = indices.indexOf(Math.max(...indices));
  const iMin = indices.indexOf(Math.min(...indices));
  const colorBarra = (v, i) => (i === iMax ? colores.atencion : v >= 100 ? colores.observado : colores.contextoClaro);

  const trazas = [
    {
      type: 'bar',
      x: MESES_CORTO,
      y: indices.map((v) => v - 100), // la barra parte de 100 (mes típico)
      base: 100,
      marker: { color: indices.map(colorBarra) },
      text: indices.map((v) => v.toFixed(0)),
      textposition: 'outside',
      cliponaxis: false,
      textfont: { size: 13, color: colores.tinta },
      hoverinfo: 'text',
      hovertext: indices.map(
        (v, i) => `<b>${nombreMes(i)}</b><br>Índice: ${v.toFixed(0)}<br>${Math.abs(v - 100).toFixed(0)} % ${v >= 100 ? 'más' : 'menos'} que un mes típico`,
      ),
    },
  ];

  const minY = Math.min(70, Math.floor(Math.min(...indices) / 10) * 10 - 10);
  const maxY = Math.ceil(Math.max(...indices) / 10) * 10 + 15;

  const layout = layoutBase({
    height: 380,
    uirevision: 'v2',
    margin: { l: 60, r: 30, t: 30, b: 50 },
    bargap: 0.3,
    xaxis: { fixedrange: true, tickfont: { size: 14, color: colores.tinta } },
    yaxis: { range: [minY, maxY], fixedrange: true, tickformat: 'd', title: { text: 'Índice (100 = mes típico)', font: { size: 13, color: colores.contexto } } },
    shapes: [{
      type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: 100, y1: 100,
      line: { color: colores.contexto, width: 1.5, dash: 'dot' },
    }],
    annotations: [{
      xref: 'paper', x: 0, xanchor: 'left', yref: 'y', y: 100, yanchor: 'top', showarrow: false, xshift: 4, yshift: -2,
      text: 'Mes típico = 100', font: { size: 13, color: colores.contexto },
    }],
  });

  const base = rangoFechas ? 'el periodo elegido en V1' : 'el periodo anterior a la pandemia (2009–2019), porque 2020–2021 distorsionan los meses';
  return (
    <TarjetaGrafica
      {...encabezado}
      nota={`Calculado con ${base}: de ${mesAnio(periodo[0])} a ${mesAnio(periodo[1])} (${meses} meses${via === 'Todas' ? '' : `, vía ${via.toLowerCase()}`}). `
        + `El mes de mayor demanda es ${nombreMes(iMax)} (${indices[iMax].toFixed(0)}) y el de menor, ${nombreMes(iMin)} (${indices[iMin].toFixed(0)}). `
        + 'Los picos y valles pueden coincidir con feriados y vacaciones, pero esta gráfica no permite afirmar que sean la causa.'}
    >
      <Plot data={trazas} layout={layout} config={{ ...configBase, displayModeBar: false }} style={{ width: '100%' }} />
    </TarjetaGrafica>
  );
}
