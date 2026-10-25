import Plot from './Plot';
import TarjetaGrafica, { Cargando, SinDatos } from './TarjetaGrafica';
import { useDatos } from '../state/useDatos';
import { colores } from '../theme/colors';
import { configBase, formatoNumero, layoutBase } from '../theme/plotlyBase';

export default function V5() {
  const { datos, error } = useDatos('recuperacion_regiones.json');

  const encabezado = {
    id: 'V5',
    titulo: 'Recuperación frente a 2019, por región',
    queMuestra: 'Los visitantes de 2025 como porcentaje de los de 2019 en cada región. La línea punteada es el nivel de 2019 (100 %).',
    paraQueSirve: 'Ver qué mercados ya superaron el nivel previo a la pandemia y cuáles siguen rezagados, para orientar la promoción.',
  };

  if (!datos) return <TarjetaGrafica {...encabezado}><Cargando error={error} /></TarjetaGrafica>;
  if (datos.length === 0) return <TarjetaGrafica {...encabezado}><SinDatos mensaje="No hay datos de recuperación por región." /></TarjetaGrafica>;

  // De mayor a menor recuperación; en un gráfico horizontal el primero va abajo, por eso se invierte.
  const filas = [...datos].sort((a, b) => b.nivel_2025_vs_2019 - a.nivel_2025_vs_2019).reverse();
  const pct = (f) => f.nivel_2025_vs_2019 * 100;

  const trazas = [
    {
      type: 'bar',
      orientation: 'h',
      y: filas.map((f) => f.region),
      x: filas.map(pct),
      // Naranja = rezago ("mire aquí"); azul = ya superó 2019.
      marker: { color: filas.map((f) => (f.nivel_2025_vs_2019 >= 1 ? colores.observado : colores.atencion)) },
      text: filas.map((f) => `${pct(f).toFixed(0)} %`),
      textposition: 'outside',
      cliponaxis: false,
      textfont: { size: 14, color: colores.tinta },
      hoverinfo: 'text',
      hovertext: filas.map(
        (f) => `<b>${f.region}</b><br>2019: ${formatoNumero.format(f.visitantes_2019)} visitantes<br>`
          + `2025: ${formatoNumero.format(f.visitantes_2025)} visitantes<br>`
          + `${pct(f).toFixed(0)} % del nivel de 2019`,
      ),
    },
  ];

  const maxX = Math.max(120, Math.ceil(Math.max(...filas.map(pct)) / 10) * 10 + 20);
  const layout = layoutBase({
    height: 300,
    uirevision: 'v5',
    margin: { l: 150, r: 60, t: 30, b: 50 },
    bargap: 0.35,
    xaxis: {
      range: [0, maxX], fixedrange: true, ticksuffix: ' %', tickformat: 'd',
      title: { text: 'Visitantes de 2025 como % de 2019', font: { size: 13, color: colores.contexto } },
    },
    yaxis: { fixedrange: true, tickfont: { size: 14, color: colores.tinta }, tickformat: '' },
    shapes: [{
      type: 'line', xref: 'x', x0: 100, x1: 100, yref: 'paper', y0: 0, y1: 1,
      line: { color: colores.contexto, width: 1.5, dash: 'dot' },
    }],
    annotations: [{
      xref: 'x', x: 100, xanchor: 'left', yref: 'paper', y: 1.02, yanchor: 'bottom', showarrow: false,
      text: 'Nivel de 2019', font: { size: 12, color: colores.contexto }, xshift: 4,
    }],
  });

  return (
    <TarjetaGrafica
      {...encabezado}
      nota="Solo incluye las tres regiones que analizó el Laboratorio 1 (turistas y excursionistas). 2025 es un año completo. No se conocen las causas de la diferencia entre regiones: la gráfica muestra qué ocurrió, no por qué."
    >
      <Plot data={trazas} layout={layout} config={{ ...configBase, displayModeBar: false }} style={{ width: '100%' }} />
    </TarjetaGrafica>
  );
}
