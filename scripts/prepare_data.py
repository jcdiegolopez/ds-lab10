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


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lab01", type=Path, default=RAIZ.parent / "DS-LAB01")
    parser.add_argument("--lab02", type=Path, default=RAIZ.parent / "DS-LAB02")
    args = parser.parse_args()

    SALIDA.mkdir(parents=True, exist_ok=True)
    print("Serie mensual (V1)")
    serie_mensual(args.lab01)


if __name__ == "__main__":
    main()
