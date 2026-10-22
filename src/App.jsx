import V1 from './charts/V1';
import V6 from './charts/V6';

// Estructura mínima para el avance. Las pestañas, filtros globales y el resto
// de gráficas (V2–V5, V7–V9) se agregan en la siguiente iteración.
export default function App() {
  return (
    <div className="app">
      <header className="encabezado">
        <p className="supra">Observatorio de turismo sostenible</p>
        <h1>Llegadas de visitantes a Guatemala</h1>
        <p className="bajada">
          Tablero para directivos del sector turístico. Datos de INGUAT / IGM, enero 2009 – junio 2026.
        </p>
      </header>

      <main>
        <h2 className="seccion">Panorama</h2>
        <V1 />
        <h2 className="seccion">Modelos</h2>
        <V6 />
      </main>

      <footer className="pie">
        Fuente: INGUAT / IGM. Modelos de los Laboratorios 1 y 2 (CC3066 – Data Science, UVG).
      </footer>
    </div>
  );
}
