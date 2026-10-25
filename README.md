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
| 2 Mercados y vías | De dónde llegan los visitantes y por dónde entran | V5 |
| 3 Modelos | Qué tan bien anticiparon los modelos las llegadas | V6 |
| 4 Guía | Cómo leer el tablero, glosario, limitaciones y fuentes | — |

En Panorama hay filtros de **vía de ingreso** y de **periodo**. El periodo es el mismo estado que el zoom de V1, y V2 recalcula la estacionalidad con él.
Cada sección tiene un selector "¿Qué gráficas quiere ver?".

## Datos

Los archivos que lee el navegador ya están en `public/data/`:

| Archivo | Contenido | Origen |
|---|---|---|
| `serie_total_mensual.json` | Llegadas totales por mes, ene 2009 – jun 2026 | `DS-LAB01/resultados_laboratorio_1/series_totales_mensuales.csv` |
| `serie_por_via.json` | Llegadas por mes: total y por vía aérea, terrestre y marítima. Alimenta V1, V2 y los indicadores | `DS-LAB01/resultados_laboratorio_1/series_mensuales_por_via.csv` |
| `recuperacion_regiones.json` | Visitantes de 2019 y 2025 por región (V5) | `DS-LAB01/resultados_laboratorio_1/regiones/impacto_pandemia_regiones.csv` |
| `predicciones_modelos.json` | Real, Holt-Winters, SARIMA/ARIMA y LSTM-B por mes (abr 2021 – jun 2026), para Total y Vía aérea | `DS-LAB01/.../series_total_y_aerea/predicciones_prueba.csv` + `DS-LAB02/resultados_lstm/predicciones_lstm-b.csv` + `DS-LAB02/resultados_via_aerea/predicciones_mejor_lstm_via_aerea.csv` |
| `metricas_modelos.json` | MAE y RMSE de cada modelo en el periodo de prueba | `comparacion_modelos.csv` (Lab 1) y `comparacion_lstm_*.csv` (Lab 2) |

Para regenerarlos (requiere `pandas` y los repositorios de los Labs 1 y 2 al lado de este):

```bash
python scripts/prepare_data.py --lab01 ../DS-LAB01 --lab02 ../DS-LAB02
```

El script no recalcula ningún modelo; solo lee los resultados exportados, une las predicciones por fecha y serie,
y verifica que el valor real coincida entre ambos laboratorios.

**Nota sobre las métricas:** el RMSE de Holt-Winters para el total se toma del Lab 1 (≈ 205.6 mil, periodo de prueba
abr 2021 – jun 2026). La cifra de `DS-LAB02/resultados_catch22_total/comparacion_total_catch22.csv` (≈ 328 mil) no se usa.

## Visualizaciones disponibles

- **V1 – Llegadas mensuales:** dato mensual y promedio móvil de un año, franja de pandemia, marca del cambio de
  clasificación de la fuente, zoom, selector de rango y nivel de detalle Año / Trimestre / Mes. Responde al filtro de vía.
- **V2 – Estacionalidad:** índice de cada mes frente a un mes típico (100). Sin selección usa 2009–2019; si se elige un
  periodo en V1 o en los selectores de año, se recalcula con ese periodo.
- **V5 – Recuperación frente a 2019:** visitantes de 2025 como porcentaje de 2019 en las tres regiones que analizó el Lab 1.
- **V6 – Real frente a tres modelos:** Holt-Winters, SARIMA/ARIMA y LSTM-B contra el dato real; selector de serie
  (Total / Vía aérea), casillas para mostrar u ocultar modelos, clic en un mes para ver el error de cada modelo.

## Estructura

```
public/data/      datos ya preparados
scripts/          prepare_data.py
src/state/        filtros compartidos entre gráficas, carga de datos y cálculos simples (resumen.js)
src/theme/        colores, tipografía y layout base de Plotly
src/charts/       una gráfica por archivo (V1.jsx, V2.jsx, V5.jsx, V6.jsx, …) y registro.js
src/components/   pestañas, filtros, selector de gráficas, indicadores y guía
```

## Agregar una gráfica nueva

1. Crear `src/charts/Vn.jsx` con `TarjetaGrafica` como contenedor (título, "qué muestra", "para qué sirve").
2. Importarla en `src/charts/registro.js` y agregarla a `GRAFICAS` indicando su sección.

El selector de gráficas y las pestañas la toman automáticamente. El estado compartido (vía, periodo, mes seleccionado)
está en `src/state/FiltrosContext.jsx`.
