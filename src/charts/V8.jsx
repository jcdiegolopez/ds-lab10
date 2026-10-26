import { useState } from 'react';
import Plot from './Plot';
import TarjetaGrafica, { Cargando, SinDatos } from './TarjetaGrafica';
import { useDatos } from '../state/useDatos';
import { useFiltros } from '../state/FiltrosContext';
import { NOMBRE_SERIE } from '../state/modelos';
import { colores } from '../theme/colors';
import { configBase, esAngosto, layoutBase } from '../theme/plotlyBase';

const VARIANTES = ['LSTM-A', 'LSTM-B'];

export default function V8() {
  const { datos, error } = useDatos('historial_lstm.json');
  const { serieModelo } = useFiltros();
  const [variante, setVariante] = useState('LSTM-B');

  const encabezado = {
    id: 'V8',
    titulo: 'Cómo aprendió la red neuronal (LSTM)',
    queMuestra: 'El error de la red en cada vuelta de entrenamiento (época): con los datos que usó para aprender (gris) y con meses que no vio (verde).',
    paraQueSirve: 'Saber si el LSTM aprendió patrones útiles o solo memorizó. Si el error con meses no vistos deja de bajar, seguir entrenando no ayuda.',
  };

  const controles = (
    <div className="grupo-botones" role="group" aria-label="Variante del modelo">
      <span className="control-etiqueta">Variante:</span>
      {VARIANTES.map((v) => (
        <button
          key={v}
          type="button"
          className={variante === v ? 'activo' : ''}
          aria-pressed={variante === v}
          onClick={() => setVariante(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );

  if (!datos) return <TarjetaGrafica {...encabezado}><Cargando error={error} /></TarjetaGrafica>;
  const h = datos[serieModelo]?.[variante];
  if (!h) return <TarjetaGrafica {...encabezado} controles={controles}><SinDatos mensaje="No hay historial de entrenamiento para esta serie." /></TarjetaGrafica>;

  const { epocas, entrenamiento, validacion, mejor_epoca: mejor, configuracion, seleccionado } = h;
  const ultima = epocas.at(-1);
  const valMejor = validacion[epocas.indexOf(mejor)];

  const trazas = [
    {
      type: 'scatter', mode: 'lines+markers', name: 'Datos de aprendizaje', x: epocas, y: entrenamiento,
      line: { color: colores.contexto, width: 2 }, marker: { size: 5 },
      hovertemplate: 'Época %{x}<br>Error con datos de aprendizaje: %{y:.3f}<extra></extra>',
    },
    {
      type: 'scatter', mode: 'lines+markers', name: 'Meses no vistos', x: epocas, y: validacion,
      line: { color: colores.quetzal, width: 3 }, marker: { size: 6 },
      hovertemplate: 'Época %{x}<br>Error con meses no vistos: %{y:.3f}<extra></extra>',
    },
  ];

  const angosto = esAngosto();
  const maxY = Math.max(...entrenamiento, ...validacion) * 1.15;
  const layout = layoutBase({
    height: 380,
    uirevision: `v8-${serieModelo}-${variante}`,
    margin: { l: 70, r: angosto ? 16 : 170, t: angosto ? 60 : 30, b: 50 },
    showlegend: angosto,
    legend: { orientation: 'h', x: 0, y: 1.12, yanchor: 'bottom', font: { size: 13 } },
    hovermode: 'x unified',
    xaxis: { range: [0.5, ultima + 0.5], dtick: angosto ? 4 : 2, fixedrange: true, title: { text: 'Época de entrenamiento', font: { size: 13, color: colores.contexto } } },
    yaxis: { range: [0, maxY], tickformat: '.2f', fixedrange: true, title: { text: 'Error (escala 0 a 1)', font: { size: 13, color: colores.contexto } } },
    shapes: [
      // Épocas después de la mejor: el entrenamiento siguió sin mejorar hasta agotar la paciencia.
      {
        type: 'rect', xref: 'x', yref: 'paper', x0: mejor, x1: ultima + 0.5, y0: 0, y1: 1,
        fillcolor: colores.tarjetaOscura, opacity: 0.8, line: { width: 0 }, layer: 'below',
      },
      {
        type: 'line', xref: 'x', yref: 'paper', x0: mejor, x1: mejor, y0: 0, y1: 1,
        line: { color: colores.atencion, width: 2 },
      },
    ],
    annotations: [
      {
        x: mejor, xref: 'x', y: 1, yref: 'paper', yanchor: 'bottom', xanchor: 'left', xshift: 4, showarrow: false,
        text: `<b>Época ${mejor}: la que se conservó</b>`, font: { size: 13, color: colores.atencionTexto },
      },
      {
        x: (mejor + ultima) / 2 + 0.25, xref: 'x', y: 0.06, yref: 'paper', showarrow: false,
        text: 'Sin mejora: se detuvo', font: { size: 13, color: colores.contexto },
      },
      // Etiquetas directas al final de cada línea (solo en pantallas anchas).
      ...(angosto ? [] : [{
        x: ultima, y: entrenamiento.at(-1), xref: 'x', yref: 'y', xanchor: 'left', xshift: 10, showarrow: false,
        text: '<b>Datos de aprendizaje</b>', font: { size: 13, color: colores.contexto },
      },
      {
        x: ultima, y: validacion.at(-1), xref: 'x', yref: 'y', xanchor: 'left', xshift: 10, showarrow: false,
        text: '<b>Meses no vistos</b>', font: { size: 13, color: colores.quetzal },
      }]),
    ],
  });

  return (
    <TarjetaGrafica
      {...encabezado}
      controles={controles}
      nota={`${variante} (${configuracion}), serie: ${NOMBRE_SERIE[serieModelo]}. `
        + `${seleccionado ? 'Es la variante elegida por tener menor error con meses no vistos.' : 'No fue la variante elegida: LSTM-B tuvo menor error con meses no vistos.'} `
        + 'El error está en una escala de 0 a 1 que usa la red internamente; para el error en visitantes, vea V7. Los meses no vistos son mayo 2019 – marzo 2021.'}
    >
      <p className="lectura">
        El mejor resultado llegó en la época {mejor} (error {valMejor.toFixed(3)}). Después, la red siguió {ultima - mejor} épocas
        sin mejorar con meses no vistos, y el entrenamiento se detuvo para no memorizar.
      </p>
      <Plot data={trazas} layout={layout} config={{ ...configBase, displayModeBar: false }} style={{ width: '100%' }} />
    </TarjetaGrafica>
  );
}
