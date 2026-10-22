"""Prepara los datos del tablero a partir de los resultados de los Labs 1 y 2.

Lee los CSV ya exportados (no recalcula ningún modelo) y escribe archivos
JSON pequeños en public/data/, que es lo que lee el navegador.

Uso:
    python scripts/prepare_data.py --lab01 ../DS-LAB01 --lab02 ../DS-LAB02
"""

import argparse
import json
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[1]
SALIDA = RAIZ / "public" / "data"

SERIES = ["Total mensual", "Vía aérea"]
MODELOS_LAB1 = {
    "Holt-Winters": "hw",
    "ARIMA/SARIMA seleccionado": "sarima",
}


def leer_csv(ruta: Path) -> pd.DataFrame:
    # utf-8-sig quita el BOM que traen los CSV exportados desde los notebooks
    return pd.read_csv(ruta, encoding="utf-8-sig")


def guardar(nombre: str, datos) -> None:
    ruta = SALIDA / nombre
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  -> {ruta.relative_to(RAIZ)} ({ruta.stat().st_size / 1024:.1f} KB)")


def redondear(x, nd=1):
    return None if pd.isna(x) else round(float(x), nd)


def serie_mensual(lab01: Path) -> None:
    """V1: serie total mensual de llegadas (ene 2009 – jun 2026)."""
    df = leer_csv(lab01 / "resultados_laboratorio_1" / "series_totales_mensuales.csv")
    df["fecha"] = pd.to_datetime(df["fecha"]).dt.strftime("%Y-%m-%d")
    filas = [
        {"fecha": r.fecha, "total": redondear(r.total_reportado, 0)}
        for r in df.itertuples()
    ]
    guardar("serie_total_mensual.json", filas)


def predicciones(lab01: Path, lab02: Path) -> None:
    """V6: real contra Holt-Winters, SARIMA/ARIMA y LSTM-B (periodo de prueba)."""
    base = lab01 / "resultados_laboratorio_1" / "series_total_y_aerea"
    p1 = leer_csv(base / "predicciones_prueba.csv")
    p1["fecha"] = pd.to_datetime(p1["fecha"])

    lstm = pd.concat(
        [
            leer_csv(lab02 / "resultados_lstm" / "predicciones_lstm-b.csv"),
            leer_csv(lab02 / "resultados_via_aerea" / "predicciones_mejor_lstm_via_aerea.csv"),
        ],
        ignore_index=True,
    )
    lstm["fecha"] = pd.to_datetime(lstm["fecha"])
    lstm = lstm.rename(columns={"serie": "region", "real": "real_lstm", "prediccion_lstm": "lstm"})

    unido = p1.merge(
        lstm[["fecha", "region", "real_lstm", "lstm", "configuracion"]],
        on=["fecha", "region"],
        how="left",
        validate="one_to_one",
    )

    # Control: el valor real debe ser el mismo en ambos labs
    dif = (unido["real"] - unido["real_lstm"]).abs().max()
    print(f"  diferencia máxima del valor real entre Lab 1 y Lab 2: {dif:.4f}")
    faltan = unido["lstm"].isna().sum()
    if faltan:
        print(f"  AVISO: {faltan} meses sin predicción LSTM")

    salida = {}
    for serie in SERIES:
        sub = unido[unido["region"] == serie].sort_values("fecha")
        salida[serie] = [
            {
                "fecha": r["fecha"].strftime("%Y-%m-%d"),
                "real": redondear(r["real"]),
                "hw": redondear(r["Holt-Winters"]),
                "sarima": redondear(r["ARIMA/SARIMA seleccionado"]),
                "lstm": redondear(r["lstm"]),
            }
            for _, r in sub.iterrows()
        ]
        print(f"  {serie}: {len(salida[serie])} meses de prueba")
    guardar("predicciones_modelos.json", salida)


def metricas(lab01: Path, lab02: Path) -> None:
    """MAE y RMSE en el periodo de prueba (abr 2021 – jun 2026).

    Holt-Winters y SARIMA/ARIMA se toman del Lab 1 (comparacion_modelos.csv).
    La cifra de Holt-Winters de DS-LAB02/resultados_catch22_total no se usa.
    """
    m1 = leer_csv(lab01 / "resultados_laboratorio_1" / "series_total_y_aerea" / "comparacion_modelos.csv")
    filas = []
    for r in m1.itertuples():
        if r.modelo in MODELOS_LAB1:
            filas.append(
                {
                    "serie": r.region,
                    "modelo": MODELOS_LAB1[r.modelo],
                    "nombre": "SARIMA/ARIMA" if r.modelo.startswith("ARIMA") else r.modelo,
                    "configuracion": None if pd.isna(r.configuracion) else r.configuracion,
                    "mae": redondear(r.MAE),
                    "rmse": redondear(r.RMSE),
                    "fuente": "Lab 1",
                }
            )
    for ruta in [
        lab02 / "resultados_lstm" / "comparacion_lstm_total_mensual.csv",
        lab02 / "resultados_via_aerea" / "comparacion_lstm_via_aerea.csv",
    ]:
        m2 = leer_csv(ruta)
        r = m2[m2["nombre"] == "LSTM-B"].iloc[0]
        filas.append(
            {
                "serie": r["serie"],
                "modelo": "lstm",
                "nombre": "LSTM-B",
                "configuracion": f"lookback {r['lookback']}, {r['hidden']} unidades",
                "mae": redondear(r["mae_prueba"]),
                "rmse": redondear(r["rmse_prueba"]),
                "fuente": "Lab 2",
            }
        )
    guardar("metricas_modelos.json", filas)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lab01", type=Path, default=RAIZ.parent / "DS-LAB01")
    parser.add_argument("--lab02", type=Path, default=RAIZ.parent / "DS-LAB02")
    args = parser.parse_args()

    SALIDA.mkdir(parents=True, exist_ok=True)
    print("Serie mensual (V1)")
    serie_mensual(args.lab01)
    print("Predicciones de modelos (V6)")
    predicciones(args.lab01, args.lab02)
    print("Métricas de modelos")
    metricas(args.lab01, args.lab02)


if __name__ == "__main__":
    main()
