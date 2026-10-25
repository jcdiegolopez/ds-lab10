import { useEffect, useState } from 'react';
import { GRAFICAS, PESTANAS } from './charts/registro';
import BarraFiltros from './components/BarraFiltros';
import Guia from './components/Guia';
import Indicadores from './components/Indicadores';
import Pestanas from './components/Pestanas';
import SelectorGraficas from './components/SelectorGraficas';
import { useFiltros } from './state/FiltrosContext';

// La sección activa vive en la dirección (#panorama, #mercados, #modelos, #guia):
// así se puede compartir un enlace directo a una sección y el botón "atrás" funciona.
const ids = PESTANAS.map((p) => p.id);
const leerHash = () => {
  const h = window.location.hash.replace('#', '');
  return ids.includes(h) ? h : ids[0];
};

export default function App() {
  const [activa, setActiva] = useState(leerHash);
  const { graficasOcultas } = useFiltros();

  useEffect(() => {
    const alCambiar = () => setActiva(leerHash());
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const cambiar = (id) => {
    window.location.hash = id;
    setActiva(id);
  };

  const pestana = PESTANAS.find((p) => p.id === activa);
  const graficasDeLaSeccion = GRAFICAS.filter((g) => g.pestana === activa);
  const visibles = graficasDeLaSeccion.filter((g) => !graficasOcultas.includes(g.id));
  const esGuia = activa === 'guia';

  return (
    <div className="app">
      <header className="encabezado">
        <p className="supra">Observatorio de turismo sostenible</p>
        <h1>Llegadas de visitantes a Guatemala</h1>
        <p className="bajada">
          Tablero para directivos del sector turístico. Datos de INGUAT / IGM, enero 2009 – junio 2026.
        </p>
      </header>

      <Pestanas activa={activa} onCambiar={cambiar} />

      <main id={`panel-${activa}`} role="tabpanel" aria-labelledby={`pestana-${activa}`} tabIndex={-1}>
        <p className="pregunta-seccion">{pestana.pregunta}</p>

        {esGuia ? (
          <Guia />
        ) : (
          <>
            {activa === 'panorama' && <Indicadores />}
            {(activa === 'panorama') && <BarraFiltros />}
            <SelectorGraficas graficas={graficasDeLaSeccion} />

            {graficasDeLaSeccion.length === 0 && (
              <div className="sin-datos" role="status">Esta sección todavía no tiene gráficas.</div>
            )}
            {graficasDeLaSeccion.length > 0 && visibles.length === 0 && (
              <div className="sin-datos" role="status">
                No hay gráficas seleccionadas. Marque al menos una en &ldquo;¿Qué gráficas quiere ver?&rdquo;.
              </div>
            )}
            {visibles.map(({ id, Componente }) => <Componente key={id} />)}
          </>
        )}
      </main>

      <footer className="pie">
        Fuente: INGUAT / IGM. Modelos de los Laboratorios 1 y 2 (CC3066 – Data Science, UVG).
      </footer>
    </div>
  );
}
