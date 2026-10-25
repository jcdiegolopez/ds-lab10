import { useFiltros } from '../state/FiltrosContext';

// "¿Qué gráficas quiere ver?": el usuario elige cuáles de la sección se muestran.
export default function SelectorGraficas({ graficas }) {
  const { graficasOcultas, alternarGrafica } = useFiltros();
  if (graficas.length < 2) return null; // con una sola gráfica no hay nada que elegir

  return (
    <fieldset className="casillas selector-graficas">
      <legend className="control-etiqueta">¿Qué gráficas quiere ver?</legend>
      {graficas.map((g) => (
        <label key={g.id}>
          <input
            type="checkbox"
            checked={!graficasOcultas.includes(g.id)}
            onChange={() => alternarGrafica(g.id)}
          />
          <span><strong>{g.id}</strong> {g.nombre}</span>
        </label>
      ))}
    </fieldset>
  );
}
