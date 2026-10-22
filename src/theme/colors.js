// Paleta del Lab 9. Cada color tiene un único significado en toda la app.
export const colores = {
  fondo: '#FAF8F4',
  tarjeta: '#FFFFFF',
  tarjetaOscura: '#F1EDE4',
  tinta: '#1B2430',
  titulo: '#16365A',
  observado: '#1F4E79', // dato real
  secundario: '#4A90C2', // series secundarias / SARIMA (solo gráficos)
  atencion: '#D9661F', // "mire aquí" / Holt-Winters (solo gráficos)
  atencionTexto: '#A84B12',
  quetzal: '#2E7D4F', // acento institucional / LSTM
  contexto: '#6B7280', // referencias y ejes
  rejilla: '#E5E0D6',
};

// Estilo de cada modelo: color + tipo de línea + etiqueta (no solo color).
export const estiloModelos = {
  hw: { nombre: 'Holt-Winters', color: colores.atencion, dash: 'dash' },
  sarima: { nombre: 'SARIMA/ARIMA', color: colores.secundario, dash: 'dot' },
  lstm: { nombre: 'LSTM-B', color: colores.quetzal, dash: 'dashdot' },
};

export const fuentes = {
  texto: 'Montserrat, system-ui, sans-serif',
  titular: '"Bowlby One", Montserrat, sans-serif',
};
