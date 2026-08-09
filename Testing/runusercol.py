import csv
import requests

URL = "http://localhost:8080/auth/register"
CSV_PATH = "users.csv"

def main():
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1):
            payload = {
                "username": row["username"],
                "password": row["password"],
                "name": row["name"],
                "email": row["email"],
                "phone": row["phone"],
                "address": row["address"],
            }

            try:
                resp = requests.post(URL, json=payload, timeout=10)
                print(f"[{i}] {row['username']} -> {resp.status_code}: {resp.text[:200]}")
            except requests.exceptions.RequestException as e:
                print(f"[{i}] {row['username']} -> EROARE: {e}")

if __name__ == "__main__":
    main()