import { PESTANAS } from '../charts/registro';

// Pestañas accesibles: flechas izquierda/derecha cambian de sección.
export default function Pestanas({ activa, onCambiar }) {
  const mover = (e, i) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const sig = (i + (e.key === 'ArrowRight' ? 1 : PESTANAS.length - 1)) % PESTANAS.length;
    onCambiar(PESTANAS[sig].id);
    document.getElementById(`pestana-${PESTANAS[sig].id}`)?.focus();
  };

  return (
    <nav aria-label="Secciones del tablero">
      <div className="pestanas" role="tablist">
        {PESTANAS.map((p, i) => (
          <button
            key={p.id}
            id={`pestana-${p.id}`}
            role="tab"
            type="button"
            aria-selected={activa === p.id}
            aria-controls={`panel-${p.id}`}
            tabIndex={activa === p.id ? 0 : -1}
            className={activa === p.id ? 'activa' : ''}
            onClick={() => onCambiar(p.id)}
            onKeyDown={(e) => mover(e, i)}
          >
            <span className="pestana-num">{i + 1}</span> {p.nombre}
          </button>
        ))}
      </div>
    </nav>
  );
}
