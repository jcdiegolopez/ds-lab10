import { MEDIDAS, useFiltros, VIAS } from '../state/FiltrosContext';
import { useSerieMensual } from '../state/useSerieMensual';

// Filtros globales de Panorama y Mercados: la vía afecta a V1–V4 y el periodo a V1–V4 (V3 y V4 por años completos).
// El periodo es el mismo estado que el zoom de V1, así que ambos se mantienen sincronizados.
export default function BarraFiltros() {
  const { via, setVia, medida, setMedida, rangoFechas, setRangoFechas } = useFiltros();
  const { limites } = useSerieMensual();
  if (!limites) return null;

  const primero = Number(limites[0].slice(0, 4));
  const ultimo = Number(limites[1].slice(0, 4));
  const anios = Array.from({ length: ultimo - primero + 1 }, (_, i) => primero + i);

  const desde = rangoFechas ? Number(rangoFechas[0].slice(0, 4)) : primero;
  const hasta = rangoFechas ? Number(rangoFechas[1].slice(0, 4)) : ultimo;

  // Los límites del último año se ajustan a los datos (2026 solo llega a junio).
  const fijar = (a, b) => {
    const ini = `${a}-01-01`;
    const fin = `${b}-12-31`;
    const nuevo = [ini < limites[0] ? limites[0] : ini, fin > limites[1] ? limites[1] : fin];
    setRangoFechas(a === primero && b === ultimo ? null : nuevo);
  };

  return (
    <section className="filtros" aria-label="Filtros globales">
      <div className="filtro">
        <span className="control-etiqueta" id="et-via">Vía de ingreso:</span>
        <div className="grupo-botones" role="group" aria-labelledby="et-via">
          {VIAS.map((v) => (
            <button
              key={v.clave}
              type="button"
              className={via === v.clave ? 'activo' : ''}
              aria-pressed={via === v.clave}
              onClick={() => setVia(v.clave)}
            >
              {v.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="filtro">
        <span className="control-etiqueta" id="et-medida">Medida:</span>
        <div className="grupo-botones" role="group" aria-labelledby="et-medida">
          {MEDIDAS.map((m) => (
            <button
              key={m.clave}
              type="button"
              className={medida === m.clave ? 'activo' : ''}
              aria-pressed={medida === m.clave}
              onClick={() => setMedida(m.clave)}
            >
              {m.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="filtro">
        <span className="control-etiqueta">Periodo:</span>
        <label className="selector">
          <span>Desde</span>
          <select value={desde} onChange={(e) => fijar(Number(e.target.value), Math.max(Number(e.target.value), hasta))}>
            {anios.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="selector">
          <span>Hasta</span>
          <select value={hasta} onChange={(e) => fijar(Math.min(desde, Number(e.target.value)), Number(e.target.value))}>
            {anios.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <button type="button" className="enlace" onClick={() => setRangoFechas(null)} disabled={!rangoFechas}>
          Todo el periodo
        </button>
      </div>
      <p className="filtro-ayuda">
        {medida === 'comparable'
          ? 'Desde 2023 la fuente dejó de informar las categorías “Guatemala” y cruceristas. La medida comparable las quita de todos los años para que 2019 y 2025 midan lo mismo.'
          : 'Cifras tal como las publica la fuente. Desde 2023 no incluyen las categorías “Guatemala” ni cruceristas, así que no se comparan con años anteriores.'}
      </p>
    </section>
  );
}
