import { useMemo } from 'react';
import Plot from './Plot';
import TarjetaGrafica, { Cargando, SinDatos } from './TarjetaGrafica';
import { useFiltros } from '../state/FiltrosContext';
import { aniosDelPeriodo, textoAnios, useTabla } from '../state/tablas';
import { colores } from '../theme/colors';
import { configBase, formatoNumero, layoutBase } from '../theme/plotlyBase';

// Último año de la base: solo tiene enero a junio.
const ANIO_PARCIAL = 2026;
const VIAS = ['Terrestre', 'Aérea', 'Marítima'];
const COLOR_VIA = { Terrestre: colores.secundario, Aérea: colores.observado, Marítima: colores.contexto };
// Fronteras de una vía: las 4 principales en tonos de azul y el resto agrupado en gris.
const TONOS = [colores.observado, colores.secundario, '#8DB9DC', '#BCD6EA'];
const MAX_FRONTERAS = 4;

const pct = (v) => `${(v * 100).toFixed(1)} %`;

export default function V3() {
  const { filas, error } = useTabla('vias_fronteras.json');
  const { via, setVia, rangoFechas, medida } = useFiltros();
  const enVia = via !== 'Todas';

  const resultado = useMemo(() => {
    if (!filas) return null;
    const minimo = Math.min(...filas.map((f) => f.anio));
    const maximo = Math.max(...filas.map((f) => f.anio));
    const anios = aniosDelPeriodo(rangoFechas, minimo, maximo);
    const enRango = filas.filter((f) => f.anio >= anios[0] && f.anio <= anios[1] && (!enVia || f.via === via));
    const clave = enVia ? 'frontera' : 'via';
    const valor = (f) => (medida === 'comparable' ? f.viajeros_c : f.viajeros);

    // Total del periodo por categoría, para ordenar y para el resumen.
    const totales = new Map();
    for (const f of enRango) totales.set(f[clave], (totales.get(f[clave]) ?? 0) + valor(f));
    const totalPeriodo = [...totales.values()].reduce((s, v) => s + v, 0);
    // Las categorías sin visitantes en el periodo no se dibujan (por ejemplo "Cruceros" en la medida comparable).
    let categorias = enVia
      ? [...totales.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([c]) => c)
      : VIAS.filter((v) => totales.get(v) > 0);
    // Solo hay MAX_FRONTERAS tonos: con más fronteras, el resto se agrupa en "Otras fronteras".
    const agrupadas = enVia && categorias.length > MAX_FRONTERAS;
    const principales = agrupadas ? categorias.slice(0, MAX_FRONTERAS) : categorias;
    if (agrupadas) categorias = [...principales, 'Otras fronteras'];

    const listaAnios = [...new Set(enRango.map((f) => f.anio))].sort((a, b) => a - b);
    const porAnio = new Map(listaAnios.map((a) => [a, new Map()]));
    for (const f of enRango) {
      const cat = !agrupadas || principales.includes(f[clave]) ? f[clave] : 'Otras fronteras';
      const m = porAnio.get(f.anio);
      m.set(cat, (m.get(cat) ?? 0) + valor(f));
    }
    const totalAnio = new Map(listaAnios.map((a) => [a, [...porAnio.get(a).values()].reduce((s, v) => s + v, 0)]));

    const resumen = categorias.map((c) => ({
      nombre: c,
      viajeros: c === 'Otras fronteras'
        ? totalPeriodo - principales.reduce((s, p) => s + totales.get(p), 0)
        : totales.get(c),
    }));
    return { anios, listaAnios, categorias, porAnio, totalAnio, totalPeriodo, resumen };
  }, [filas, rangoFechas, via, enVia, medida]);

  const encabezado = {
    id: 'V3',
    titulo: enVia ? `Por qué fronteras entran los visitantes de la vía ${via.toLowerCase()}` : 'Por qué vía entran los visitantes',
    queMuestra: enVia
      ? `Qué parte de las llegadas por vía ${via.toLowerCase()} entra por cada frontera, año por año.`
      : 'Qué parte de las llegadas de cada año entra por vía terrestre, aérea y marítima.',
    paraQueSirve: 'Ver si el destino depende de una sola puerta de entrada, para priorizar infraestructura y atención en fronteras. '
      + 'Haga clic en una vía (o elíjala en los filtros) para ver sus fronteras; V1 y V4 se filtran con esa vía.',
  };

  if (!resultado) return <TarjetaGrafica {...encabezado}><Cargando error={error} /></TarjetaGrafica>;

  const { anios, listaAnios, categorias, porAnio, totalAnio, totalPeriodo, resumen } = resultado;

  const volver = enVia && (
    <button type="button" className="enlace sin-margen" onClick={() => setVia('Todas')}>
      Volver a todas las vías
    </button>
  );
  // La vía se elige con la barra de filtros o con un clic en la gráfica; aquí solo se ofrece volver.
  const controles = volver || null;

  if (totalPeriodo === 0) {
    return <TarjetaGrafica {...encabezado} controles={controles}><SinDatos /></TarjetaGrafica>;
  }

  const etiquetaAnio = (a) => (a === ANIO_PARCIAL ? `${a}*` : `${a}`);
  const x = listaAnios.map(etiquetaAnio);
  const trazas = categorias.map((c, i) => {
    const valores = listaAnios.map((a) => porAnio.get(a).get(c) ?? 0);
    const color = enVia ? (c === 'Otras fronteras' ? colores.contextoClaro : TONOS[i]) : COLOR_VIA[c];
    return {
      type: 'bar',
      name: c,
      x,
      y: listaAnios.map((a, j) => (totalAnio.get(a) ? valores[j] / totalAnio.get(a) : 0)),
      customdata: valores.map((v, j) => [c, formatoNumero.format(v), listaAnios[j] === ANIO_PARCIAL ? ' (enero a junio)' : '']),
      marker: { color, line: { color: colores.tarjeta, width: 1 } },
      hovertemplate: '<b>%{customdata[0]}</b>, %{x}%{customdata[2]}<br>%{y:.1%} de las llegadas<br>%{customdata[1]} visitantes<extra></extra>',
    };
  });

  const layout = layoutBase({
    height: 420,
    uirevision: `v3-${via}`,
    barmode: 'stack',
    bargap: 0.2,
    margin: { l: 60, r: 20, t: 10, b: 40 },
    showlegend: true,
    legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', traceorder: 'normal', font: { size: 14 } },
    xaxis: { type: 'category', fixedrange: true, tickfont: { size: 13, color: colores.contexto } },
    yaxis: { range: [0, 1], tickformat: '.0%', fixedrange: true, title: { text: 'Participación en las llegadas', font: { size: 13, color: colores.contexto } } },
  });

  const principal = resumen[0];
  const participacion = principal.viajeros / totalPeriodo;
  const lectura = enVia
    ? `En ${textoAnios(anios)}, ${principal.nombre} recibe ${pct(participacion)} de las llegadas por vía ${via.toLowerCase()}.`
    : `En ${textoAnios(anios)}, ${resumen.map((r) => `${r.nombre.toLowerCase()} ${pct(r.viajeros / totalPeriodo)}`).join(', ')}.`;

  return (
    <TarjetaGrafica
      {...encabezado}
      controles={controles}
      nota={`Las barras usan años completos del periodo elegido. *${ANIO_PARCIAL} solo incluye enero a junio. `
        + 'La participación muestra cómo se reparten las llegadas, no su volumen: un año con menos visitantes puede tener el mismo reparto. '
        + (medida === 'comparable'
          ? 'Medida comparable: sin las categorías “Guatemala” y cruceristas en ningún año. Por eso la vía marítima vale cero entre 2017 y 2022: la fuente registró a todos sus pasajeros como cruceristas.'
          : 'Medida reportada: la vía marítima casi desaparece desde 2023 porque la fuente dejó de informar a los cruceristas.')}
    >
      <p className="lectura">{lectura}</p>
      <Plot
        data={trazas}
        layout={layout}
        config={{ ...configBase, displayModeBar: false }}
        style={{ width: '100%', cursor: enVia ? 'default' : 'pointer' }}
        onClick={(e) => {
          const nombre = e.points?.[0]?.data?.name;
          if (!enVia && VIAS.includes(nombre)) setVia(nombre);
        }}
      />
    </TarjetaGrafica>
  );
}
