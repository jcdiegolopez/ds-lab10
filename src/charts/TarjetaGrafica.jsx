// Contenedor común: título + "Qué muestra" + "Para qué sirve" + controles + gráfica.
export default function TarjetaGrafica({ id, titulo, queMuestra, paraQueSirve, controles, nota, children }) {
  return (
    <section className="tarjeta" id={id}>
      <header className="tarjeta-encabezado">
        <h2>
          <span className="tarjeta-id">{id}</span> {titulo}
        </h2>
        <p><strong>Qué muestra:</strong> {queMuestra}</p>
        <p><strong>Para qué sirve:</strong> {paraQueSirve}</p>
      </header>
      {controles && <div className="controles">{controles}</div>}
      {children}
      {nota && <p className="nota">{nota}</p>}
    </section>
  );
}

export function SinDatos({ mensaje }) {
  return (
    <div className="sin-datos" role="status">
      {mensaje ?? 'No hay datos para esta selección. Pruebe ampliar el rango o cambiar la vía.'}
    </div>
  );
}

export function Cargando({ error }) {
  return <div className="sin-datos">{error ? `Error: ${error}` : 'Cargando datos…'}</div>;
}
