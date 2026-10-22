import { useEffect, useState } from 'react';

const cache = new Map();

// Carga un JSON de public/data una sola vez y lo comparte entre componentes.
export function useDatos(archivo) {
  const [estado, setEstado] = useState({ datos: cache.get(archivo) ?? null, error: null });

  useEffect(() => {
    if (cache.has(archivo)) return;
    let activo = true;
    fetch(`${import.meta.env.BASE_URL}data/${archivo}`)
      .then((r) => {
        if (!r.ok) throw new Error(`No se pudo cargar ${archivo} (${r.status})`);
        return r.json();
      })
      .then((d) => {
        cache.set(archivo, d);
        if (activo) setEstado({ datos: d, error: null });
      })
      .catch((e) => activo && setEstado({ datos: null, error: e.message }));
    return () => {
      activo = false;
    };
  }, [archivo]);

  return estado;
}
