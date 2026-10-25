// Sección "Guía": cómo leer el tablero, glosario, limitaciones y fuentes.
// Todo el texto está pensado para quien no conoce los procedimientos estadísticos.

const GLOSARIO = [
  ['Promedio móvil', 'El promedio de los últimos 12 meses. Suaviza las subidas y bajadas de temporada para ver la tendencia de fondo.'],
  ['Índice estacional', 'Compara cada mes con un mes típico, que vale 100. Un diciembre de 135 significa que ese mes trae un 35 % más de visitantes que un mes típico.'],
  ['Periodo de prueba', 'Los 63 meses (abril de 2021 a junio de 2026) que los modelos no vieron al aprender. Sirven para medir qué tan bien pronostican.'],
  ['Holt-Winters', 'Modelo que proyecta con la tendencia y la estacionalidad recientes: asume que el futuro se parece al pasado reciente.'],
  ['SARIMA / ARIMA', 'Modelo clásico de series de tiempo que aprovecha la relación de cada mes con los meses anteriores.'],
  ['LSTM', 'Red neuronal que aprende patrones de la serie. Es más flexible, pero es más difícil explicar por qué predice lo que predice.'],
  ['MAE', 'Cuántos visitantes por mes se equivoca el modelo, en promedio. Se lee directamente en visitantes.'],
  ['RMSE', 'Parecido al MAE, pero castiga más los errores grandes. Un RMSE bajo significa pocos errores graves.'],
  ['Error de un mes', 'Valor real menos valor pronosticado. Si es positivo, llegaron más visitantes de los que el modelo esperaba.'],
];

const LIMITACIONES = [
  'En 2022 la fuente cambió de clasificación. Las comparaciones de recuperación se hacen contra 2019, antes del cambio.',
  '2026 solo tiene datos de enero a junio. Un año incompleto no se compara con un año completo.',
  'Los modelos se entrenaron con datos hasta marzo de 2021, durante la pandemia. Por eso no anticiparon el rebote posterior: esa es una limitación del entrenamiento, no una predicción de que el sector no se recuperaría.',
  'Las predicciones son retrospectivas: se comparan con meses que ya ocurrieron. El tablero no proyecta el futuro.',
  'El modelo LSTM solo existe para el total y la vía aérea. La comparación de los tres modelos se limita a esas dos series.',
  'Los datos miden llegadas de visitantes. No miden gasto, ocupación ni impacto ambiental o social, así que el tablero no permite hablar de esos temas.',
  'El tablero muestra qué ocurrió, no por qué. Dos cosas que cambian a la vez no prueban que una cause la otra.',
];

export default function Guia() {
  return (
    <div className="guia">
      <section className="tarjeta">
        <h2>Cómo leer los colores y las líneas</h2>
        <p>Los colores significan lo mismo en todo el tablero.</p>
        <ul className="leyenda">
          <li><span className="muestra muestra-observado" /> <strong>Azul y línea sólida:</strong> dato observado, lo que efectivamente ocurrió.</li>
          <li><span className="muestra muestra-estimado" /> <strong>Línea punteada:</strong> estimación de un modelo, no un dato real.</li>
          <li><span className="muestra muestra-atencion" /> <strong>Naranja:</strong> &ldquo;mire aquí&rdquo;. Marca un rezago o el elemento seleccionado. Nunca significa &ldquo;bueno&rdquo;.</li>
          <li><span className="muestra muestra-contexto" /> <strong>Gris:</strong> contexto y referencias, como el nivel de 2019 o el mes típico.</li>
        </ul>
        <p className="nota">Los tres modelos se distinguen además por su tipo de línea y por una etiqueta, no solo por el color.</p>
      </section>

      <section className="tarjeta">
        <h2>Glosario</h2>
        <dl className="glosario">
          {GLOSARIO.map(([termino, definicion]) => (
            <div key={termino}>
              <dt>{termino}</dt>
              <dd>{definicion}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="tarjeta">
        <h2>Limitaciones que conviene tener presentes</h2>
        <ul className="limitaciones">
          {LIMITACIONES.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </section>

      <section className="tarjeta">
        <h2>Fuentes</h2>
        <ul className="limitaciones">
          <li>Instituto Guatemalteco de Turismo (INGUAT) e Instituto Guatemalteco de Migración (IGM). Base de Migración, enero de 2009 a junio de 2026 (161,036 registros).</li>
          <li>Modelos de pronóstico: Laboratorio 1 (Holt-Winters y SARIMA/ARIMA) y Laboratorio 2 (LSTM), CC3066 – Data Science, UVG, 2026. No se calcularon modelos nuevos para este tablero.</li>
        </ul>
      </section>
    </div>
  );
}
