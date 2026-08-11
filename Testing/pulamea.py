import requests

GOOGLE_API_KEY = "AIzaSyCbwMW7oA1ftELIHErXd8-gyYFnakrUi8Y"

GOOGLE_URL = "https://places.googleapis.com/v1/places:searchText"

CLINIC_URL = "http://localhost:8082/clinic/addClinic"


def main():

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask":
            "places.id,"
            "places.displayName,"
            "places.formattedAddress,"
            "places.nationalPhoneNumber,"
            "places.rating,"
            "nextPageToken"
    }

    body = {
        "textQuery": "veterinary clinics in Bartolomeu, Brasov, Romania",
        "includedType": "veterinary_care",
        "strictTypeFiltering": True,
        "regionCode": "RO",
        "pageSize": 20
    }

    page_token = None
    count = 0

    while True:

        if page_token:
            body["pageToken"] = page_token

        response = requests.post(
            GOOGLE_URL,
            headers=headers,
            json=body,
            timeout=20
        )

        if response.status_code != 200:
            print("Google API error:")
            print(response.status_code)
            print(response.text)
            break

        data = response.json()

        places = data.get("places", [])

        for place in places:

            name = place.get("displayName", {}).get("text")
            address = place.get("formattedAddress")
            phone = place.get("nationalPhoneNumber")
            rating = place.get("rating")

            if not name or not address or not phone or rating is None:
                print(f"SKIP -> {name} - lipsesc date")
                continue

            payload = {
                "name": name,
                "address": address,
                "city": "Cluj-Napoca",
                "phone": phone,
                "rating": rating
            }

            try:
                resp = requests.post(
                    CLINIC_URL,
                    json=payload,
                    timeout=10
                )

                count += 1

                print(
                    f"[{count}] {name} -> "
                    f"{resp.status_code}: {resp.text[:200]}"
                )

            except requests.exceptions.RequestException as e:
                print(f"{name} -> EROARE: {e}")

        page_token = data.get("nextPageToken")

        if not page_token:
            break

    print()
    print(f"Total clinici procesate: {count}")


if __name__ == "__main__":
    main()