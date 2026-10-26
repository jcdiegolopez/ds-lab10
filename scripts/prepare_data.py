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

    # En la vía aérea el mejor LSTM por validación es LSTM-B; algunas copias del Lab 2 solo tienen
    # predicciones_lstm-b.csv (mismos valores), así que se usa como respaldo.
    aerea = lab02 / "resultados_via_aerea" / "predicciones_mejor_lstm_via_aerea.csv"
    if not aerea.exists():
        aerea = lab02 / "resultados_via_aerea" / "predicciones_lstm-b.csv"
    lstm = pd.concat(
        [
            leer_csv(lab02 / "resultados_lstm" / "predicciones_lstm-b.csv"),
            leer_csv(aerea),
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
        elif r.modelo == "Seasonal naïve":
            # Línea base de V7: repetir el mismo mes del año anterior. No es un modelo del tablero.
            filas.append(
                {
                    "serie": r.region,
                    "modelo": "naive",
                    "nombre": "Seasonal naïve",
                    "configuracion": None,
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


def serie_por_via(lab01: Path, base_xlsx: pd.DataFrame) -> None:
    """Filtro de vía y KPIs: serie mensual total y por vía de ingreso (aérea, terrestre, marítima).

    Los campos *_c son la medida comparable entre años (sin "Guatemala" ni cruceristas).
    """
    base = lab01 / "resultados_laboratorio_1"
    df = leer_csv(base / "series_mensuales_por_via.csv")
    df["fecha"] = pd.to_datetime(df["fecha"]).dt.strftime("%Y-%m-%d")
    # Un mes sin llegadas por una vía viene vacío en el CSV (27 meses de la vía marítima): es 0.
    df[["Aérea", "Terrestre", "Marítima"]] = df[["Aérea", "Terrestre", "Marítima"]].fillna(0)
    df["total"] = df[["Aérea", "Terrestre", "Marítima"]].sum(axis=1)

    # Control: la suma de las tres vías debe coincidir con el total reportado
    tot = leer_csv(base / "series_totales_mensuales.csv")
    tot["fecha"] = pd.to_datetime(tot["fecha"]).dt.strftime("%Y-%m-%d")
    cruce = df.merge(tot[["fecha", "total_reportado"]], on="fecha", validate="one_to_one")
    dif = (cruce["total"] - cruce["total_reportado"]).abs().max()
    print(f"  diferencia máxima entre la suma de vías y el total reportado: {dif:.4f}")

    vias = {"Aérea": "aerea", "Terrestre": "terrestre", "Marítima": "maritima"}
    mensual = base_xlsx.pivot_table(index="fecha", columns="Vía", values="Viajero", aggfunc="sum", fill_value=0)
    comp = base_xlsx[base_xlsx["comparable"]].pivot_table(
        index="fecha", columns="Vía", values="Viajero", aggfunc="sum", fill_value=0
    )
    # Control: la base agregada por mes debe dar lo mismo que el CSV del Lab 1
    control = df.set_index("fecha")[list(vias)]
    print(f"  diferencia máxima entre la base y el CSV del Lab 1: {(mensual[list(vias)] - control).abs().max().max():.4f}")
    comp = comp.reindex(index=df["fecha"], columns=list(vias), fill_value=0)
    for via, campo in vias.items():
        df[f"{campo}_c"] = comp[via].to_numpy()
    df["total_c"] = df[[f"{c}_c" for c in vias.values()]].sum(axis=1)

    filas = [
        {
            "fecha": r["fecha"],
            "total": redondear(r["total"], 0),
            "aerea": redondear(r["Aérea"], 0),
            "terrestre": redondear(r["Terrestre"], 0),
            "maritima": redondear(r["Marítima"], 0),
            "total_c": redondear(r["total_c"], 0),
            "aerea_c": redondear(r["aerea_c"], 0),
            "terrestre_c": redondear(r["terrestre_c"], 0),
            "maritima_c": redondear(r["maritima_c"], 0),
        }
        for r in df.to_dict("records")
    ]
    guardar("serie_por_via.json", filas)


def recuperacion_regiones(lab01: Path, base: pd.DataFrame) -> None:
    """V5: visitantes de 2025 como proporción de los de 2019 en las tres regiones que analizó el Lab 1.

    El Lab 1 usó turistas y excursionistas de "Región dos". Se recalcula desde la base para tener
    también la medida comparable (sin "Guatemala"), y se verifica contra la cifra del Lab 1.
    """
    lab = leer_csv(lab01 / "resultados_laboratorio_1" / "regiones" / "impacto_pandemia_regiones.csv")
    sub = base[base["Tipo de Viajero"].isin(["Turista", "Excursionista"]) & base["Año"].isin([2019, 2025])]
    filas = []
    for r in lab.itertuples():
        region = str(r.region).replace(" Del ", " del ")
        de_region = sub[sub["Región dos"] == r.region]
        rep_ = de_region.groupby("Año")["Viajero"].sum()
        com = de_region[de_region["comparable"]].groupby("Año")["Viajero"].sum()
        print(f"  {region}: 2019 base {rep_.get(2019, 0):,.0f} vs Lab 1 {r.visitantes_2019:,.0f}")
        filas.append(
            {
                "region": region,
                "visitantes_2019": redondear(rep_.get(2019, 0), 0),
                "visitantes_2025": redondear(rep_.get(2025, 0), 0),
                "nivel_2025_vs_2019": redondear(rep_.get(2025, 0) / rep_.get(2019, 0), 4),
                "visitantes_2019_c": redondear(com.get(2019, 0), 0),
                "visitantes_2025_c": redondear(com.get(2025, 0), 0),
                "nivel_2025_vs_2019_c": redondear(com.get(2025, 0) / com.get(2019, 0), 4),
            }
        )
    guardar("recuperacion_regiones.json", filas)


def leer_base(lab01: Path) -> pd.DataFrame:
    """Base de Migración INGUAT/IGM (161,036 registros). Se lee una sola vez."""
    df = pd.read_excel(lab01 / "data" / "data.xlsx")
    df["Frontera"] = df["Frontera"].astype(str).str.replace(r"^\d+\s+", "", regex=True).str.strip()

    # Región: se usa "Región dos" (11 grupos estables en todo el periodo). Se limpian sus valores raros:
    # "Cruceros" es la misma categoría que "Cruceristas", y "0" se reemplaza por la región que tiene
    # ese país en el resto de los registros.
    reg = df["Región dos"].astype(str).replace({"Cruceros": "Cruceristas"})
    validos = df[~reg.isin(["0"])].assign(r=reg).groupby("País")["r"].agg(lambda s: s.mode().iat[0])
    df["region"] = reg.where(reg != "0", df["País"].map(validos)).fillna("Otros Paises Del Mundo")
    # Desde 2023 la fuente agrupa países poco frecuentes en "Resto del Mundo" y lo clasifica como Asia,
    # aunque incluye países de todos los continentes.
    df.loc[df["País"] == "Resto del Mundo", "region"] = "Otros Paises Del Mundo"
    df["País"] = df["País"].replace({"Resto del Mundo": "Resto del mundo"})
    df["region"] = (
        df["region"].str.replace(" Del ", " del ").str.replace("Paises", "países").str.replace("del Mundo", "del mundo")
        .replace({"Cruceristas": "Cruceristas (sin país)"})
    )
    df["País"] = df["País"].astype(str).replace({"Cruceros": "Cruceristas (sin país)", "Cruceristas": "Cruceristas (sin país)"})

    # Desde enero de 2023 la fuente deja de informar dos categorías: "Guatemala" y los cruceristas.
    # La medida comparable las excluye en todos los años para no comparar conjuntos distintos.
    df["comparable"] = ~df["País"].isin(["Guatemala", "Cruceristas (sin país)"])
    df["fecha"] = pd.to_datetime(dict(year=df["Año"], month=df["Mes cod"], day=1)).dt.strftime("%Y-%m-%d")
    ultima = df.loc[~df["comparable"], "fecha"].max()
    print(f"  último mes con las categorías que la fuente dejó de informar: {ultima}")
    return df


def vias_fronteras(base: pd.DataFrame) -> None:
    """V3: viajeros por año, vía y frontera."""
    base = base.assign(viajeros_c=base["Viajero"].where(base["comparable"], 0))
    g = base.groupby(["Año", "Vía", "Frontera"], as_index=False)[["Viajero", "viajeros_c"]].sum()
    filas = [[int(r.Año), r.Vía, r.Frontera, round(float(r.Viajero)), round(float(r.viajeros_c))] for r in g.itertuples()]
    guardar("vias_fronteras.json", {"columnas": ["anio", "via", "frontera", "viajeros", "viajeros_c"], "filas": filas})


def mercados(base: pd.DataFrame) -> None:
    """V4: viajeros por año, vía, región y país de residencia."""
    g = base.groupby(["Año", "Vía", "region", "País"], as_index=False)["Viajero"].sum()
    g = g[g["Viajero"] > 0]
    filas = [[int(r.Año), r.Vía, r.region, r.País, round(float(r.Viajero))] for r in g.itertuples()]
    guardar("mercados.json", {"columnas": ["anio", "via", "region", "pais", "viajeros"], "filas": filas})


def historial_lstm(lab02: Path) -> None:
    """V8: error de entrenamiento y validación por época de LSTM-A y LSTM-B."""
    carpetas = {"Total mensual": "resultados_lstm", "Vía aérea": "resultados_via_aerea"}
    comparaciones = {
        "Total mensual": "comparacion_lstm_total_mensual.csv",
        "Vía aérea": "comparacion_lstm_via_aerea.csv",
    }
    salida = {}
    for serie, carpeta in carpetas.items():
        comp = leer_csv(lab02 / carpeta / comparaciones[serie]).set_index("nombre")
        salida[serie] = {}
        for nombre in ["LSTM-A", "LSTM-B"]:
            h = leer_csv(lab02 / carpeta / f"historial_{nombre.lower()}.csv")
            c = comp.loc[nombre]
            salida[serie][nombre] = {
                "epocas": h["epoch"].astype(int).tolist(),
                "entrenamiento": [round(float(v), 4) for v in h["train_rmse_scaled"]],
                "validacion": [round(float(v), 4) for v in h["validation_rmse_scaled"]],
                "mejor_epoca": int(c["mejor_epoch"]),
                "paciencia": int(c["patience"]),
                "configuracion": f"ventana de {int(c['lookback'])} meses, {int(c['hidden'])} unidades",
                "seleccionado": bool(c["mejor_por_rmse_validacion"]),
            }
    guardar("historial_lstm.json", salida)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lab01", type=Path, default=RAIZ.parent / "DS-LAB01")
    parser.add_argument("--lab02", type=Path, default=RAIZ.parent / "DS-LAB02")
    args = parser.parse_args()

    SALIDA.mkdir(parents=True, exist_ok=True)
    print("Base de Migración (data.xlsx)")
    base = leer_base(args.lab01)
    print("Serie mensual (V1)")
    serie_mensual(args.lab01)
    print("Predicciones de modelos (V6)")
    predicciones(args.lab01, args.lab02)
    print("Métricas de modelos")
    metricas(args.lab01, args.lab02)
    print("Serie por vía (filtro global y KPIs)")
    serie_por_via(args.lab01, base)
    print("Recuperación por región (V5)")
    recuperacion_regiones(args.lab01, base)
    print("Curvas de aprendizaje LSTM (V8)")
    historial_lstm(args.lab02)
    print("Vías, fronteras y mercados (V3, V4)")
    vias_fronteras(base)
    mercados(base)


if __name__ == "__main__":
    main()
