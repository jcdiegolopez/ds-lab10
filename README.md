# Laboratorio 10 – Tablero de turismo (Guatemala)

Tablero interactivo para directivos del sector turístico, construido con **React + Vite + Plotly.js**.
Los datos son históricos y los modelos ya están calculados (Labs 1 y 2), así que el sitio es estático.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrir la dirección que muestra Vite (por defecto http://localhost:5173).

Para generar la versión estática que se publica (por ejemplo en Vercel): `npm run build` deja el sitio en `dist/`.

## Secciones

El tablero tiene cuatro secciones, que se pueden abrir directamente con la dirección (`#panorama`, `#mercados`, `#modelos`, `#guia`):

| Sección | Qué responde | Gráficas |
|---|---|---|
| 1 Panorama | Qué ha pasado con las llegadas y cuándo se concentran | V1, V2 e indicadores |
| 2 Mercados y vías | De dónde llegan los visitantes y por dónde entran | V3, V4, V5 |
| 3 Modelos | Qué tan bien anticiparon los modelos las llegadas | V6, V7, V8, V9 y tabla comparativa |
| 4 Guía | Cómo leer el tablero, glosario, limitaciones y fuentes | — |

En Panorama y en Mercados hay filtros de **vía de ingreso**, **medida** (comparable o reportada) y **periodo**. El periodo es el mismo estado que el zoom de V1;
V2 recalcula la estacionalidad con él y V3 y V4 lo usan por años completos. En Modelos, el selector de **serie**
(Total / Vía aérea) aplica a V6–V9.

**Gráficas enlazadas:**

1. V3 → V1 y V4: un clic en una vía baja a sus fronteras y filtra V1 y V4 con esa vía.
2. V1 → V2: el periodo elegido en V1 recalcula la estacionalidad.
3. V6 ↔ V9: un clic en un mes de V6 lo resalta en V9 (y al revés).
Cada sección tiene un selector "¿Qué gráficas quiere ver?".

## Datos

Los archivos que lee el navegador ya están en `public/data/`:

| Archivo | Contenido | Origen |
|---|---|---|
| `serie_total_mensual.json` | Llegadas totales por mes, ene 2009 – jun 2026 | `DS-LAB01/resultados_laboratorio_1/series_totales_mensuales.csv` |
| `serie_por_via.json` | Llegadas por mes: total y por vía aérea, terrestre y marítima. Alimenta V1, V2 y los indicadores | `DS-LAB01/resultados_laboratorio_1/series_mensuales_por_via.csv` |
| `recuperacion_regiones.json` | Visitantes de 2019 y 2025 por región (V5) | `DS-LAB01/resultados_laboratorio_1/regiones/impacto_pandemia_regiones.csv` |
| `predicciones_modelos.json` | Real, Holt-Winters, SARIMA/ARIMA y LSTM-B por mes (abr 2021 – jun 2026), para Total y Vía aérea | `DS-LAB01/.../series_total_y_aerea/predicciones_prueba.csv` + `DS-LAB02/resultados_lstm/predicciones_lstm-b.csv` + `DS-LAB02/resultados_via_aerea/predicciones_mejor_lstm_via_aerea.csv` |
| `metricas_modelos.json` | MAE y RMSE de cada modelo en el periodo de prueba, más la referencia seasonal naïve | `comparacion_modelos.csv` (Lab 1) y `comparacion_lstm_*.csv` (Lab 2) |
| `historial_lstm.json` | Error de entrenamiento y validación por época de LSTM-A y LSTM-B (V8) | `DS-LAB02/resultados_*/historial_lstm-*.csv` |
| `vias_fronteras.json` | Viajeros por año, vía y frontera (V3) | `DS-LAB01/data/data.xlsx` |
| `mercados.json` | Viajeros por año, vía, región y país (V4) | `DS-LAB01/data/data.xlsx` |

Para regenerarlos (requiere `pandas`, `openpyxl` y los repositorios de los Labs 1 y 2 al lado de este):

```bash
python scripts/prepare_data.py --lab01 ../DS-LAB01 --lab02 ../DS-LAB02
```

El script no recalcula ningún modelo; solo lee los resultados exportados, une las predicciones por fecha y serie,
y verifica que el valor real coincida entre ambos laboratorios.

**Medida comparable (cambio de la fuente en 2023):** desde enero de 2023 la Base de Migración deja de informar las
categorías "Guatemala" (≈ 1.8 millones de llegadas en 2019) y cruceristas, y agrupa los países poco frecuentes. Si se
comparan años de antes y después sin ajustar, 2025 parece estar en 77 % de 2019, cuando con los mismos grupos está en
130 %. Por eso el tablero usa por defecto la **medida comparable**, que excluye esas dos categorías en todos los años
(campos `*_c` de `serie_por_via.json`, `vias_fronteras.json` y `recuperacion_regiones.json`). El filtro "Medida" permite
ver las cifras tal como las reporta la fuente. Los modelos (V6–V9) no cambian: se evaluaron con la serie reportada.

**Nota sobre las métricas:** el RMSE de Holt-Winters para el total se toma del Lab 1 (≈ 205.6 mil, periodo de prueba
abr 2021 – jun 2026). La cifra de `DS-LAB02/resultados_catch22_total/comparacion_total_catch22.csv` (≈ 328 mil) no se usa.

## Visualizaciones disponibles

- **V1 – Llegadas mensuales:** dato mensual y promedio móvil de un año, franja de pandemia, marca del cambio de
  clasificación de la fuente, zoom, selector de rango y nivel de detalle Año / Trimestre / Mes. Responde al filtro de vía.
- **V2 – Estacionalidad:** índice de cada mes frente a un mes típico (100). Sin selección usa 2009–2019; si se elige un
  periodo en V1 o en los selectores de año, se recalcula con ese periodo.
- **V3 – Vías y fronteras:** participación de cada vía por año; clic en una vía para ver sus fronteras (las 4 principales y
  "otras"). Cambia el filtro global de vía.
- **V4 – Ranking de mercados:** los 10 mercados con más llegadas en el periodo y la vía elegidos; alterna Región ⇄ País.
  Avisa cuando el periodo cruza el cambio de clasificación de 2023.
- **V5 – Recuperación frente a 2019:** visitantes de 2025 como porcentaje de 2019 en las tres regiones que analizó el Lab 1.
- **V6 – Real frente a tres modelos:** Holt-Winters, SARIMA/ARIMA y LSTM-B contra el dato real; selector de serie
  (Total / Vía aérea), casillas para mostrar u ocultar modelos, clic en un mes para ver el error de cada modelo.
- **V7 – Error por modelo:** RMSE o MAE de cada modelo frente a la referencia de repetir el año anterior.
- **V8 – Aprendizaje del LSTM:** error por época con datos de aprendizaje y con meses no vistos; marca la época que se
  conservó. Alterna LSTM-A / LSTM-B.
- **V9 – Error por mes:** real menos pronosticado para el modelo elegido; resalta el mes seleccionado en V6.

## Estructura

```
public/data/      datos ya preparados
scripts/          prepare_data.py
src/state/        filtros compartidos entre gráficas, carga de datos y cálculos simples (resumen.js)
src/theme/        colores, tipografía y layout base de Plotly
src/charts/       una gráfica por archivo (V1.jsx … V9.jsx) y registro.js
src/components/   pestañas, filtros, selector de gráficas, indicadores y guía
```

## Agregar una gráfica nueva

1. Crear `src/charts/Vn.jsx` con `TarjetaGrafica` como contenedor (título, "qué muestra", "para qué sirve").
2. Importarla en `src/charts/registro.js` y agregarla a `GRAFICAS` indicando su sección.

El selector de gráficas y las pestañas la toman automáticamente. El estado compartido (vía, periodo, mes seleccionado)
está en `src/state/FiltrosContext.jsx`.
