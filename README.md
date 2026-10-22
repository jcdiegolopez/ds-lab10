# Laboratorio 10 – Tablero de turismo (Guatemala)

Tablero interactivo para directivos del sector turístico, construido con **React + Vite + Plotly.js**.
Los datos son históricos y los modelos ya están calculados (Labs 1 y 2), así que el sitio es estático.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrir la dirección que muestra Vite (por defecto http://localhost:5173).

## Datos

Los archivos que lee el navegador ya están en `public/data/`:

| Archivo | Contenido | Origen |
|---|---|---|
| `serie_total_mensual.json` | Llegadas totales por mes, ene 2009 – jun 2026 | `DS-LAB01/resultados_laboratorio_1/series_totales_mensuales.csv` |
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
  clasificación de la fuente, zoom, selector de rango y nivel de detalle Año / Trimestre / Mes.
- **V6 – Real frente a tres modelos:** Holt-Winters, SARIMA/ARIMA y LSTM-B contra el dato real; selector de serie
  (Total / Vía aérea), casillas para mostrar u ocultar modelos, clic en un mes para ver el error de cada modelo.

## Estructura

```
public/data/      datos ya preparados
scripts/          prepare_data.py
src/state/        filtros compartidos entre gráficas y carga de datos
src/theme/        colores, tipografía y layout base de Plotly
src/charts/       una gráfica por archivo (V1.jsx, V6.jsx, …)
```
