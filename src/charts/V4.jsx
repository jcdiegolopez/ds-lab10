import { useMemo, useState } from 'react';
import Plot from './Plot';
import TarjetaGrafica, { Cargando, SinDatos } from './TarjetaGrafica';
import { ANIO_CAMBIO_FUENTE, useFiltros } from '../state/FiltrosContext';
import { aniosDelPeriodo, textoAnios, useTabla } from '../state/tablas';
import { colores } from '../theme/colors';
import { configBase, formatoNumero, layoutBase } from '../theme/plotlyBase';

const NIVELES = {
  region: { etiqueta: 'Región', campo: 'region', plural: 'regiones' },
  pais: { etiqueta: 'País', campo: 'pais', plural: 'países' },
};
const TOP = 10;
const ANIO_CAMBIO = ANIO_CAMBIO_FUENTE; // desde aquí la fuente agrupa países y deja de informar "Guatemala" y cruceristas
const NO_COMPARABLES = ['Guatemala', 'Cruceristas (sin país)'];
const ANIO_PARCIAL = 2026;
// Categorías que no son un mercado concreto: se dibujan en gris.
const esAgrupado = (n) => /^(Otros|Resto|Cruceristas)/.test(n);

const compacto = (v) => (v >= 999500 ? `${(v / 1e6).toFixed(1)} M` : v >= 1e3 ? `${Math.round(v / 1e3)} mil` : formatoNumero.format(v));

export default function V4() {
  const { filas, error } = useTabla('mercados.json');
  const { via, rangoFechas, medida } = useFiltros();
  const [nivel, setNivel] = useState('region');

  const resultado = useMemo(() => {
    if (!filas) return null;
    const minimo = Math.min(...filas.map((f) => f.anio));
    const maximo = Math.max(...filas.map((f) => f.anio));
    const anios = aniosDelPeriodo(rangoFechas, minimo, maximo);
    const { campo } = NIVELES[nivel];
    const totales = new Map();
    let total = 0;
    for (const f of filas) {
      if (f.anio < anios[0] || f.anio > anios[1] || (via !== 'Todas' && f.via !== via)) continue;
      if (medida === 'comparable' && NO_COMPARABLES.includes(f.pais)) continue;
      totales.set(f[campo], (totales.get(f[campo]) ?? 0) + f.viajeros);
      total += f.viajeros;
    }
    const ranking = [...totales.entries()]
      .map(([nombre, viajeros]) => ({ nombre, viajeros }))
      .sort((a, b) => b.viajeros - a.viajeros);
    return { anios, ranking, total };
  }, [filas, rangoFechas, via, nivel, medida]);

  const ambito = via === 'Todas' ? '' : ` por vía ${via.toLowerCase()}`;
  const encabezado = {
    id: 'V4',
    titulo: `De dónde vienen los visitantes${ambito}`,
    queMuestra: `Los ${TOP} mercados (${NIVELES[nivel].plural}) con más llegadas en el periodo elegido. Cada barra indica cuántos visitantes y qué parte del total representan.`,
    paraQueSirve: 'Ver de cuántos mercados depende el destino y orientar la promoción. Cambie entre región y país para bajar de nivel; la vía elegida en V3 también filtra esta gráfica.',
  };

  const controles = (
    <div className="grupo-botones" role="group" aria-label="Nivel de detalle">
      <span className="control-etiqueta">Nivel de detalle:</span>
      {Object.entries(NIVELES).map(([clave, { etiqueta }]) => (
        <button
          key={clave}
          type="button"
          className={nivel === clave ? 'activo' : ''}
          aria-pressed={nivel === clave}
          onClick={() => setNivel(clave)}
        >
          {etiqueta}
        </button>
      ))}
    </div>
  );

  if (!resultado) return <TarjetaGrafica {...encabezado}><Cargando error={error} /></TarjetaGrafica>;
  const { anios, ranking, total } = resultado;
  if (total === 0) return <TarjetaGrafica {...encabezado} controles={controles}><SinDatos /></TarjetaGrafica>;

  // En un gráfico horizontal el primero va abajo: se invierte para que el mayor quede arriba.
  const top = ranking.slice(0, TOP).reverse();
  const participacion = (v) => v / total;
  // En pantallas angostas la etiqueta de cada barra se reduce al porcentaje para que no se corte.
  const angosto = window.innerWidth < 640;
  const trazas = [{
    type: 'bar',
    orientation: 'h',
    y: top.map((r) => r.nombre),
    x: top.map((r) => r.viajeros),
    marker: { color: top.map((r) => (esAgrupado(r.nombre) ? colores.contexto : colores.observado)) },
    text: top.map((r) => (angosto ? '' : `${compacto(r.viajeros)} · `) + `${(participacion(r.viajeros) * 100).toFixed(1)} %`),
    textposition: 'outside',
    cliponaxis: false,
    textfont: { size: 13, color: colores.tinta },
    hoverinfo: 'text',
    hovertext: top.map((r) => `<b>${r.nombre}</b><br>${formatoNumero.format(r.viajeros)} visitantes<br>${(participacion(r.viajeros) * 100).toFixed(1)} % del total`),
  }];

  const maxX = Math.max(...top.map((r) => r.viajeros)) * (angosto ? 1.3 : 1.28);
  const layout = layoutBase({
    height: 90 + top.length * 34,
    uirevision: `v4-${nivel}`,
    margin: { l: 10, r: 20, t: 10, b: 40 }, // el eje y se ajusta solo al nombre más largo (automargin)
    bargap: 0.3,
    xaxis: { range: [0, maxX], fixedrange: true, tickformat: '~s', title: { text: 'Visitantes en el periodo', font: { size: 13, color: colores.contexto } } },
    yaxis: { fixedrange: true, tickfont: { size: 13, color: colores.tinta }, tickformat: '', automargin: true },
  });

  const top3 = ranking.slice(0, 3).reduce((s, r) => s + r.viajeros, 0) / total;
  const cruzaCambio = anios[0] < ANIO_CAMBIO && anios[1] >= ANIO_CAMBIO;

  return (
    <TarjetaGrafica
      {...encabezado}
      controles={controles}
      nota={`Periodo: ${textoAnios(anios)}${anios[1] === ANIO_PARCIAL ? ` (${ANIO_PARCIAL} solo de enero a junio)` : ''}. `
        + 'En gris, categorías que agrupan varios orígenes y no son un mercado concreto. Fuente: INGUAT / IGM.'}
    >
      <p className="lectura">
        {nivel === 'region' ? 'Las tres primeras regiones' : 'Los tres primeros países'} suman {(top3 * 100).toFixed(0)} % de las llegadas{ambito} en {textoAnios(anios)}.
      </p>
      {cruzaCambio && (
        <div className="aviso-fijo" role="note">
          El periodo cruza el cambio de clasificación de {ANIO_CAMBIO}: desde ese año la fuente agrupa los países poco frecuentes
          (por ejemplo, &ldquo;Otros países de Europa&rdquo;)
          {medida === 'comparable'
            ? '. Las categorías “Guatemala” y cruceristas ya están excluidas en todos los años.'
            : ' y deja de informar las categorías “Guatemala” y cruceristas. Compare años de antes y después con cuidado.'}
        </div>
      )}
      <Plot data={trazas} layout={layout} config={{ ...configBase, displayModeBar: false }} style={{ width: '100%' }} />
    </TarjetaGrafica>
  );
}
