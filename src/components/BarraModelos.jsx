import { useFiltros } from '../state/FiltrosContext';
import { SERIES } from '../state/modelos';

// Filtro de la sección Modelos: la serie elegida aplica a V6, V7, V8 y V9 a la vez.
export default function BarraModelos() {
  const { serieModelo, setSerieModelo, setMesSeleccionado } = useFiltros();

  return (
    <section className="filtros" aria-label="Filtro de la sección Modelos">
      <div className="filtro">
        <span className="control-etiqueta" id="et-serie">Serie:</span>
        <div className="grupo-botones" role="group" aria-labelledby="et-serie">
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
      </div>
      <p className="filtro-ayuda">
        Entrenamiento: enero 2009 – marzo 2021 · Prueba: abril 2021 – junio 2026. La serie elegida aplica a todas las gráficas de esta sección.
      </p>
    </section>
  );
}
