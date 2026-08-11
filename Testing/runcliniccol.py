import csv
import requests

URL = "http://localhost:8082/clinic/addClinic"
CSV_PATH = "clinic.csv"

def main():
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1):
            payload = {
                "name": row["name"],
                "address": row["address"],
                "city": row["city"],
                "phone": row["phone"],
                "rating": float(row["rating"]),
            }

            try:
                resp = requests.post(URL, json=payload, timeout=10)
                print(f"[{i}] {row['name']} -> {resp.status_code}: {resp.text[:200]}")
            except requests.exceptions.RequestException as e:
                print(f"[{i}] {row['name']} -> EROARE: {e}")

if __name__ == "__main__":
    main()