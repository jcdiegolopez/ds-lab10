import { useSerieMensual } from '../state/useSerieMensual';
import { useFiltros } from '../state/FiltrosContext';
import { indicadores } from '../state/resumen';
import { Cargando } from '../charts/TarjetaGrafica';

const MENOS = '−'; // signo menos tipográfico
const pct = (v, decimales = 0) => (v == null ? '—' : `${(v * 100).toFixed(decimales)} %`);
const pctConSigno = (v) => (v == null ? '—' : `${v >= 0 ? '+' : MENOS}${Math.abs(v * 100).toFixed(1)} %`);
const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Tarjetas con una cifra. Se calculan con la serie de la vía elegida en el filtro global.
export default function Indicadores() {
  const { datos, error } = useSerieMensual();
  const { via } = useFiltros();
  if (!datos) return <Cargando error={error} />;

  const k = indicadores(datos);
  const ambito = via === 'Todas' ? 'todas las vías' : `vía ${via.toLowerCase()}`;
  const parcial = k.parcial;
  const rangoParcial = parcial.hastaMes === 1 ? NOMBRES_MES[0] : `enero a ${NOMBRES_MES[parcial.hastaMes - 1]}`;

  const tarjetas = [
    {
      titulo: 'Año récord',
      cifra: k.record ? `${(k.record.total / 1e6).toFixed(1)} M` : '—',
      detalle: k.record ? `Visitantes en ${k.record.anio} (${ambito})` : 'Sin datos',
    },
    {
      titulo: 'Golpe de la pandemia',
      cifra: pctConSigno(k.caida2020).replace('.0', ''),
      detalle: 'Cambio de 2020 frente a 2019',
      atencion: true,
    },
    {
      titulo: 'Recuperación',
      cifra: pct(k.nivel2025),
      detalle: 'Nivel de 2025 respecto de 2019',
    },
    {
      titulo: `${parcial.anio} frente a ${parcial.anio - 1}`,
      cifra: pctConSigno(parcial.cambio),
      detalle: `Visitantes de ${rangoParcial}`,
    },
  ];

  return (
    <section className="indicadores" aria-label="Indicadores clave">
      {tarjetas.map((t) => (
        <div key={t.titulo} className={`kpi${t.atencion ? ' kpi-atencion' : ''}`}>
          <p className="kpi-titulo">{t.titulo}</p>
          <p className="kpi-cifra">{t.cifra}</p>
          <p className="kpi-detalle">{t.detalle}</p>
        </div>
      ))}
    </section>
  );
}
