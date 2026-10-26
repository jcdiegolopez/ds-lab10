import Plot from './Plot';
import TarjetaGrafica, { Cargando, SinDatos } from './TarjetaGrafica';
import { useDatos } from '../state/useDatos';
import { useFiltros } from '../state/FiltrosContext';
import { colores } from '../theme/colors';
import { configBase, formatoNumero, layoutBase } from '../theme/plotlyBase';

export default function V5() {
  const { datos, error } = useDatos('recuperacion_regiones.json');
  const { medida } = useFiltros();
  const sufijo = medida === 'comparable' ? '_c' : '';

  const encabezado = {
    id: 'V5',
    titulo: 'Recuperación frente a 2019, por región',
    queMuestra: 'Los visitantes de 2025 como porcentaje de los de 2019 en cada región. La línea punteada es el nivel de 2019 (100 %).',
    paraQueSirve: 'Ver qué mercados ya superaron el nivel previo a la pandemia y cuáles siguen rezagados, para orientar la promoción.',
  };

  if (!datos) return <TarjetaGrafica {...encabezado}><Cargando error={error} /></TarjetaGrafica>;
  if (datos.length === 0) return <TarjetaGrafica {...encabezado}><SinDatos mensaje="No hay datos de recuperación por región." /></TarjetaGrafica>;

  // De mayor a menor recuperación; en un gráfico horizontal el primero va abajo, por eso se invierte.
  // Cifras de la medida elegida en los filtros (comparable o como las reporta la fuente).
  const filas = datos
    .map((d) => ({
      region: d.region,
      v2019: d[`visitantes_2019${sufijo}`],
      v2025: d[`visitantes_2025${sufijo}`],
      nivel: d[`nivel_2025_vs_2019${sufijo}`],
    }))
    .sort((a, b) => b.nivel - a.nivel)
    .reverse();
  const pct = (f) => f.nivel * 100;

  const trazas = [
    {
      type: 'bar',
      orientation: 'h',
      y: filas.map((f) => f.region),
      x: filas.map(pct),
      // Naranja = rezago ("mire aquí"); azul = ya superó 2019.
      marker: { color: filas.map((f) => (f.nivel >= 1 ? colores.observado : colores.atencion)) },
      text: filas.map((f) => `${pct(f).toFixed(0)} %`),
      textposition: 'outside',
      cliponaxis: false,
      textfont: { size: 14, color: colores.tinta },
      hoverinfo: 'text',
      hovertext: filas.map(
        (f) => `<b>${f.region}</b><br>2019: ${formatoNumero.format(f.v2019)} visitantes<br>`
          + `2025: ${formatoNumero.format(f.v2025)} visitantes<br>`
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
      text: 'Nivel de 2019', font: { size: 13, color: colores.contexto }, xshift: 4,
    }],
  });

  return (
    <TarjetaGrafica
      {...encabezado}
      nota={'Solo incluye las tres regiones que analizó el Laboratorio 1 (turistas y excursionistas). 2025 es un año completo. '
        + (medida === 'comparable'
          ? 'Medida comparable: América del Centro no incluye en 2019 la categoría “Guatemala”, que la fuente dejó de informar en 2023. '
          : 'Medida reportada: el 2019 de América del Centro incluye la categoría “Guatemala” y 2025 no, así que su recuperación aparece más baja de lo que es. ')
        + 'Esta gráfica compara siempre 2019 con 2025 y no cambia con la vía ni con el periodo; sí con la medida. '
        + 'No se conocen las causas de la diferencia entre regiones: la gráfica muestra qué ocurrió, no por qué.'}
    >
      <Plot data={trazas} layout={layout} config={{ ...configBase, displayModeBar: false }} style={{ width: '100%' }} />
    </TarjetaGrafica>
  );
}
