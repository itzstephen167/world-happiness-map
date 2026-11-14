"""Build data/happiness.csv and data/happiness_history.csv from the official World Happiness Report file.

Source: data/raw/WHR25_Data_Figure_2.1.xlsx, "Data for Figure 2.1 (2011-2024)" from the World Happiness
Report 2025 (https://worldhappiness.report). Each year's ladder score is the report's three-year average
ending in that year, so the 2024 rows are the 2022-2024 averages behind the 2025 ranking.

Run from the project root with plain Python 3 (no packages needed): python3 data/build_happiness.py
"""
import csv
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "raw" / "WHR25_Data_Figure_2.1.xlsx"
LATEST = 2024

# Report names (and the map-style names this CSV used before) -> the names the site shows.
# app.js maps the remaining map shapes whose names differ (e.g. "Macedonia") onto these.
RENAME = {
    "United States": "United States", "United States of America": "United States",
    "Taiwan Province of China": "Taiwan", "Viet Nam": "Vietnam",
    "Bosnia and Herz.": "Bosnia and Herzegovina", "Republic of Korea": "South Korea",
    "Russian Federation": "Russia", "Dominican Rep.": "Dominican Republic",
    "Republic of Moldova": "Moldova", "Hong Kong SAR of China": "Hong Kong",
    "Lao PDR": "Laos", "Turkey": "Türkiye", "Côte d’Ivoire": "Côte d'Ivoire",
    "State of Palestine": "Palestine", "eSwatini": "Eswatini", "Dem. Rep. Congo": "DR Congo",
    "Macedonia": "North Macedonia", "Swaziland": "Eswatini",   # older years' names
}
# Regions come from the existing data/happiness.csv (the report's regional groups).
# Countries that were not in it before get theirs here, following the report's grouping.
NEW_REGIONS = {
    "Belize": "Latin America and Caribbean", "Panama": "Latin America and Caribbean",
    "Trinidad and Tobago": "Latin America and Caribbean", "Comoros": "Sub-Saharan Africa",
    "Gambia": "Sub-Saharan Africa", "Mauritius": "Sub-Saharan Africa",
    "Côte d'Ivoire": "Sub-Saharan Africa", "Oman": "Middle East and North Africa",
    "Palestine": "Middle East and North Africa", "Singapore": "Southeast Asia", "Hong Kong": "East Asia",
}


def read_sheet(path):
    """First worksheet of an .xlsx as a list of {column letter: value} dicts, using only the standard library."""
    ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
    z = zipfile.ZipFile(path)
    shared = [''.join(t.text or '' for t in si.iter(ns + "t"))
              for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall(ns + "si")]
    rows = []
    for r in ET.fromstring(z.read("xl/worksheets/sheet1.xml")).find(ns + "sheetData"):
        cells = {}
        for c in r:
            v = c.find(ns + "v")
            if v is not None:
                cells[re.match(r"[A-Z]+", c.get("r")).group(0)] = shared[int(v.text)] if c.get("t") == "s" else v.text
        rows.append(cells)
    return rows


def main():
    rows = read_sheet(SOURCE)
    head = rows[0]
    assert (head["A"], head["C"], head["D"]) == ("Year", "Country name", "Ladder score"), head
    data = [(int(float(r["A"])), RENAME.get(r["C"], r["C"]), float(r["D"]))
            for r in rows[1:] if r.get("A") and r.get("D")]   # the sheet ends with empty rows

    old = HERE / "happiness.csv"
    regions = {RENAME.get(r["country"], r["country"]): r["region"] for r in csv.DictReader(old.open(encoding="utf-8"))}
    regions.update(NEW_REGIONS)

    latest = sorted((d for d in data if d[0] == LATEST), key=lambda d: -d[2])
    missing = [c for _, c, _ in latest if c not in regions]
    if missing:
        raise SystemExit(f"No region for: {', '.join(missing)}. Add them to NEW_REGIONS.")

    with old.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["country", "score", "region"])
        w.writerows((c, f"{s:.3f}", regions[c]) for _, c, s in latest)
    with (HERE / "happiness_history.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["country", "year", "score"])
        w.writerows((c, y, f"{s:.3f}") for y, c, s in sorted(data, key=lambda d: (d[1], d[0])))
    years = sorted({d[0] for d in data})
    print(f"happiness.csv: {len(latest)} countries ({LATEST}); happiness_history.csv: {len(data)} rows, years {years}")


if __name__ == "__main__":
    main()
