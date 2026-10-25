import V1 from './V1';
import V2 from './V2';
import V5 from './V5';
import V6 from './V6';

// Registro de gráficas: cada una declara en qué sección va. Para sumar una gráfica nueva
// (V3, V4, V7, V8, V9) basta con importarla aquí; el selector de gráficas y las pestañas
// la toman solas.
export const PESTANAS = [
  { id: 'panorama', nombre: 'Panorama', pregunta: 'Qué ha pasado con las llegadas y cuándo se concentran.' },
  { id: 'mercados', nombre: 'Mercados y vías', pregunta: 'De dónde llegan los visitantes y por dónde entran.' },
  { id: 'modelos', nombre: 'Modelos', pregunta: 'Qué tan bien anticiparon los modelos las llegadas.' },
  { id: 'guia', nombre: 'Guía', pregunta: 'Cómo leer el tablero, glosario y limitaciones.' },
];

export const GRAFICAS = [
  { id: 'V1', pestana: 'panorama', nombre: 'Llegadas mensuales', Componente: V1 },
  { id: 'V2', pestana: 'panorama', nombre: 'Estacionalidad', Componente: V2 },
  { id: 'V5', pestana: 'mercados', nombre: 'Recuperación frente a 2019', Componente: V5 },
  { id: 'V6', pestana: 'modelos', nombre: 'Real frente a tres modelos', Componente: V6 },
];
