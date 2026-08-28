#!/usr/bin/env python3
"""
VETApp database seeder.

Works with the Docker container names used by the VETApp docker-compose:
  auth_db, users_db, pet_db, clinic_db, appointment_db, medicalr_db

It writes directly to PostgreSQL through `docker exec ... psql`, so the database
containers do NOT need to expose port 5432 to the host.

Examples:
  python vetapp_seed.py
  python vetapp_seed.py --preset small
  python vetapp_seed.py --preset large
  python vetapp_seed.py --wipe --yes

All generated accounts use password: Vetapp123
"""

from __future__ import annotations

import argparse
import json
import random
import re
import shutil
import subprocess
import sys
import uuid
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Any, Iterable

APP_PASSWORD = "Vetapp123"
SEED_DOMAIN = "seed.vetapp.local"
RNG = random.Random()

DB_CONFIG = {
    "auth": ("auth_db", "auth_db"),
    "users": ("users_db", "users_db"),
    "pet": ("pet_db", "pet_db"),
    "clinic": ("clinic_db", "clinic_db"),
    "appointment": ("appointment_db", "appointment_db"),
    "medicalr": ("medicalr_db", "medicalr_db"),
}

PRESETS = {
    "small": dict(owners=10, veterinarians=4, admins=1, clinics=2, pets=25, appointments=50),
    "demo": dict(owners=50, veterinarians=15, admins=2, clinics=8, pets=150, appointments=350),
    "large": dict(owners=200, veterinarians=50, admins=4, clinics=20, pets=650, appointments=1800),
}

FIRST_NAMES = [
    "Andrei", "Maria", "Ioana", "Vlad", "Elena", "Radu", "Diana", "Mihai", "Ana", "Alexandru",
    "Bianca", "Cristian", "Irina", "Sorin", "Larisa", "Paul", "Teodora", "Robert", "Denisa", "George",
    "Alina", "Tudor", "Carmen", "Victor", "Oana", "Darius", "Raluca", "Stefan", "Iulia", "Matei",
]
LAST_NAMES = [
    "Popescu", "Ionescu", "Muresan", "Rusu", "Dumitru", "Stan", "Matei", "Marinescu", "Pop", "Toma",
    "Ilie", "Lazar", "Stoica", "Dobre", "Moldovan", "Avram", "Barbu", "Nistor", "Sandu", "Vasile",
]
CITIES = {
    "Cluj-Napoca": (46.7712, 23.6236),
    "Brasov": (45.6579, 25.6012),
    "Bucuresti": (44.4268, 26.1025),
    "Sibiu": (45.7983, 24.1256),
    "Timisoara": (45.7489, 21.2087),
    "Oradea": (47.0465, 21.9189),
    "Iasi": (47.1585, 27.6014),
}
STREETS = ["Republicii", "Florilor", "Avram Iancu", "Memorandumului", "Dorobantilor", "Primaverii", "Victoriei", "Eroilor"]
CLINIC_WORDS = ["Paws", "VetCare", "Animalis", "PetMed", "VetPoint", "Sanivet", "Happy Paws", "VetLife", "PetHealth", "Animavet"]

PET_DATA = {
    "Dog": ["Labrador", "Golden Retriever", "Beagle", "Poodle", "German Shepherd", "French Bulldog", "Mixed Breed"],
    "Cat": ["British Shorthair", "Maine Coon", "Siamese", "Ragdoll", "European Shorthair", "Persian", "Mixed Breed"],
    "Rabbit": ["Mini Lop", "Netherland Dwarf", "Lionhead", "Mixed Breed"],
}
PET_NAMES = [
    "Luna", "Cedar", "Max", "Bella", "Milo", "Nala", "Leo", "Kira", "Rocky", "Maya", "Simba", "Toby",
    "Coco", "Loki", "Ruby", "Oscar", "Mia", "Charlie", "Zoe", "Bruno", "Daisy", "Felix", "Rex", "Iris",
]

SERVICES = [
    ("General consultation", 30, 150.0, "General clinical examination and treatment recommendations."),
    ("Vaccination", 30, 120.0, "Routine vaccination and preventive consultation."),
    ("Dermatology consultation", 45, 220.0, "Skin, coat and allergy assessment."),
    ("Dental consultation", 45, 200.0, "Oral and dental health assessment."),
    ("Ultrasound", 45, 280.0, "Diagnostic ultrasound examination."),
    ("Blood tests", 30, 190.0, "Blood collection and routine laboratory panel."),
    ("Minor surgery", 60, 500.0, "Minor surgical procedure with postoperative recommendations."),
    ("Emergency consultation", 45, 300.0, "Urgent veterinary evaluation."),
]

MEDICAL_CASES = [
    ("Reduced appetite and lethargy", "Gastroenteritis", "Hydration, dietary management and clinical monitoring recommended."),
    ("Ear scratching and head shaking", "Otitis externa", "Ear cleaning and topical treatment recommended."),
    ("Itching and skin redness", "Allergic dermatitis", "Possible allergen exposure; symptomatic treatment and follow-up."),
    ("Sneezing and nasal discharge", "Upper respiratory infection", "Supportive treatment and reassessment if symptoms persist."),
    ("Eye redness and discharge", "Conjunctivitis", "Topical therapy and eye hygiene recommended."),
    ("Bad breath and dental plaque", "Dental disease", "Dental cleaning and oral hygiene plan recommended."),
    ("Routine preventive visit", "Clinically healthy", "Routine examination completed; preventive care discussed."),
    ("Limping after activity", "Soft tissue injury", "Rest and activity restriction recommended with follow-up."),
]


class SeedError(RuntimeError):
    pass


@dataclass(frozen=True)
class RawSQL:
    value: str


def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def qident(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def sql_literal(value: Any) -> str:
    if isinstance(value, RawSQL):
        return value.value
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (date, datetime, time)):
        value = value.isoformat(sep=" ") if isinstance(value, datetime) else value.isoformat()
    if isinstance(value, uuid.UUID):
        value = str(value)
    return "'" + str(value).replace("'", "''") + "'"


class DockerPostgres:
    def __init__(self, container: str, database: str, user: str = "postgres"):
        self.container = container
        self.database = database
        self.user = user
        self._schema: dict[str, list[dict[str, str]]] | None = None

    def is_running(self) -> bool:
        p = subprocess.run(
            ["docker", "inspect", "-f", "{{.State.Running}}", self.container],
            capture_output=True, text=True
        )
        return p.returncode == 0 and p.stdout.strip().lower() == "true"

    def execute(self, sql: str, capture: bool = False, quiet: bool = False) -> str:
        cmd = [
            "docker", "exec", "-i", self.container,
            "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", self.user, "-d", self.database
        ]
        if capture:
            cmd += ["-A", "-t", "-F", "\t"]
        p = subprocess.run(cmd, input=sql, text=True, capture_output=True)
        if p.returncode != 0:
            raise SeedError(
                f"SQL failed in {self.container}/{self.database}:\n{p.stderr.strip()}\n\nSQL:\n{sql[:1800]}"
            )
        if not quiet and not capture and p.stderr.strip():
            print(p.stderr.strip())
        return p.stdout.strip()

    def scalar(self, sql: str) -> str:
        out = self.execute(sql, capture=True)
        lines = [line for line in out.splitlines() if line.strip()]
        return lines[-1].strip() if lines else ""

    def refresh_schema(self) -> None:
        sql = """
        SELECT table_name, column_name, data_type, is_nullable,
               COALESCE(column_default, ''), COALESCE(udt_name, '')
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
        """
        schema: dict[str, list[dict[str, str]]] = {}
        for line in self.execute(sql, capture=True).splitlines():
            parts = line.split("\t")
            if len(parts) < 6:
                continue
            table, column, data_type, nullable, default, udt = parts[:6]
            schema.setdefault(table, []).append({
                "name": column,
                "type": data_type,
                "nullable": nullable,
                "default": default,
                "udt": udt,
            })
        self._schema = schema

    @property
    def schema(self) -> dict[str, list[dict[str, str]]]:
        if self._schema is None:
            self.refresh_schema()
        return self._schema or {}

    def find_table(self, *aliases: str, required: bool = True) -> str | None:
        by_norm = {norm(t): t for t in self.schema}
        for alias in aliases:
            if norm(alias) in by_norm:
                return by_norm[norm(alias)]
        if required:
            raise SeedError(
                f"Could not find table {aliases} in {self.database}. Found: {', '.join(sorted(self.schema))}"
            )
        return None

    def column(self, table: str, *aliases: str, required: bool = True) -> str | None:
        cols = {norm(c["name"]): c["name"] for c in self.schema.get(table, [])}
        for alias in aliases:
            if norm(alias) in cols:
                return cols[norm(alias)]
        if required:
            raise SeedError(
                f"Could not find column {aliases} in {self.database}.{table}. Found: {', '.join(c['name'] for c in self.schema.get(table, []))}"
            )
        return None

    def column_meta(self, table: str, column: str) -> dict[str, str]:
        for meta in self.schema.get(table, []):
            if meta["name"] == column:
                return meta
        raise SeedError(f"Unknown column {table}.{column}")

    def insert_many(self, table: str, rows: list[dict[str, Any]], chunk_size: int = 250) -> None:
        if not rows:
            return
        columns = list(rows[0].keys())
        for row in rows:
            if list(row.keys()) != columns:
                raise SeedError(f"Rows for {table} do not have identical columns/order")
        for start in range(0, len(rows), chunk_size):
            chunk = rows[start:start + chunk_size]
            values = []
            for row in chunk:
                values.append("(" + ", ".join(sql_literal(row[c]) for c in columns) + ")")
            sql = (
                f"INSERT INTO {qident(table)} ({', '.join(qident(c) for c in columns)}) VALUES\n"
                + ",\n".join(values) + ";"
            )
            self.execute(sql, quiet=True)

    def max_int(self, table: str, column: str) -> int:
        value = self.scalar(f"SELECT COALESCE(MAX({qident(column)}), 0) FROM {qident(table)};")
        return int(value or 0)

    def enum_labels(self, udt_name: str) -> list[str]:
        if not udt_name:
            return []
        sql = f"""
        SELECT e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = {sql_literal(udt_name)}
        ORDER BY e.enumsortorder;
        """
        return [x for x in self.execute(sql, capture=True).splitlines() if x.strip()]


def person_name() -> tuple[str, str, str]:
    first = RNG.choice(FIRST_NAMES)
    last = RNG.choice(LAST_NAMES)
    return first, last, f"{first} {last}"


def phone(unique_num: int) -> str:
    return f"07{unique_num % 100000000:08d}"


def address() -> str:
    return f"Str. {RNG.choice(STREETS)} nr. {RNG.randint(1, 150)}"


def random_date_between(start: date, end: date) -> date:
    if start >= end:
        return start
    return start + timedelta(days=RNG.randint(0, (end - start).days))


def choose_pet_weight(species: str) -> float:
    if species == "Cat":
        return round(RNG.uniform(2.5, 8.5), 1)
    if species == "Rabbit":
        return round(RNG.uniform(0.9, 4.2), 1)
    return round(RNG.uniform(4.0, 45.0), 1)


def table_mapping(db: DockerPostgres) -> dict[str, str]:
    result = {}
    if db.database == "auth_db":
        result["authentication"] = db.find_table("authentication")
    elif db.database == "users_db":
        result["users"] = db.find_table("users")
    elif db.database == "pet_db":
        result["pet"] = db.find_table("pet")
    elif db.database == "clinic_db":
        result["clinic"] = db.find_table("clinic")
        result["veterinarian"] = db.find_table("veterinarian")
        result["vet_service"] = db.find_table("vet_service", "vetservice")
        result["availability"] = db.find_table("availability")
    elif db.database == "appointment_db":
        result["appointment"] = db.find_table("appointment")
    elif db.database == "medicalr_db":
        result["medical_record"] = db.find_table("medical_record", "medicalrecord")
    return result


def wipe_core(dbs: dict[str, DockerPostgres], mappings: dict[str, dict[str, str]]) -> None:
    groups = {
        "medicalr": [mappings["medicalr"]["medical_record"]],
        "appointment": [mappings["appointment"]["appointment"]],
        "pet": [mappings["pet"]["pet"]],
        "clinic": [
            mappings["clinic"]["availability"], mappings["clinic"]["vet_service"],
            mappings["clinic"]["veterinarian"], mappings["clinic"]["clinic"]
        ],
        "users": [mappings["users"]["users"]],
        "auth": [mappings["auth"]["authentication"]],
    }
    for key in ["medicalr", "appointment", "pet", "clinic", "users", "auth"]:
        tables = groups[key]
        sql = "TRUNCATE TABLE " + ", ".join(qident(t) for t in tables) + " RESTART IDENTITY CASCADE;"
        dbs[key].execute(sql, quiet=True)
    print("[OK] Core VETApp tables wiped.")


def build_user_rows(
    auth_db: DockerPostgres,
    users_db: DockerPostgres,
    auth_table: str,
    users_table: str,
    owners: int,
    vets: int,
    admins: int,
    run_tag: str,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[uuid.UUID], list[uuid.UUID], list[uuid.UUID], list[dict[str, Any]]]:
    aid = auth_db.column(auth_table, "id")
    username_col = auth_db.column(auth_table, "username")
    password_col = auth_db.column(auth_table, "password")
    email_col = auth_db.column(auth_table, "email")
    phone_col = auth_db.column(auth_table, "telefon", "phone")
    role_col = auth_db.column(auth_table, "rol_user", "rolUser", "role")
    role_meta = auth_db.column_meta(auth_table, role_col)

    uid = users_db.column(users_table, "id")
    uname = users_db.column(users_table, "name")
    uemail = users_db.column(users_table, "email")
    uphone = users_db.column(users_table, "phone", "telefon")
    uaddress = users_db.column(users_table, "address", "adresa")

    try:
        auth_db.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;", quiet=True)
        password_hash = auth_db.scalar(f"SELECT crypt({sql_literal(APP_PASSWORD)}, gen_salt('bf', 4));")
        if not password_hash.startswith("$2"):
            raise SeedError("pgcrypto returned an unexpected BCrypt hash")
    except SeedError as exc:
        raise SeedError(
            "Could not generate BCrypt password in auth_db using pgcrypto. "
            "The official PostgreSQL image normally includes it.\n" + str(exc)
        )

    def role_value(role: str) -> Any:
        data_type = role_meta["type"].lower()
        if any(x in data_type for x in ["smallint", "integer", "bigint", "numeric"]):
            return {"OWNER": 0, "VETERINARIAN": 1, "ADMIN": 2}[role]
        return role

    auth_rows: list[dict[str, Any]] = []
    user_rows: list[dict[str, Any]] = []
    owner_ids: list[uuid.UUID] = []
    vet_user_ids: list[uuid.UUID] = []
    admin_ids: list[uuid.UUID] = []
    account_info: list[dict[str, Any]] = []

    role_specs = [("OWNER", owners), ("VETERINARIAN", vets), ("ADMIN", admins)]
    seq = 0
    for role, count in role_specs:
        for i in range(1, count + 1):
            seq += 1
            user_id = uuid.uuid4()
            first, last, full = person_name()
            username = f"seed_{role.lower()}_{run_tag}_{i}"
            email = f"{username}@{SEED_DOMAIN}"
            tel = phone(int(run_tag[-6:], 36) + seq if run_tag[-6:].isalnum() else RNG.randint(100000, 999999) + seq)

            auth_rows.append({
                aid: user_id,
                username_col: username,
                password_col: password_hash,
                email_col: email,
                role_col: role_value(role),
                phone_col: tel,
            })
            user_rows.append({
                uid: user_id,
                uname: full,
                uemail: email,
                uphone: tel,
                uaddress: address(),
            })
            account_info.append({"id": str(user_id), "username": username, "role": role, "email": email})

            if role == "OWNER":
                owner_ids.append(user_id)
            elif role == "VETERINARIAN":
                vet_user_ids.append(user_id)
            else:
                admin_ids.append(user_id)

    return auth_rows, user_rows, owner_ids, vet_user_ids, admin_ids, account_info


def build_clinics_and_vets(
    db: DockerPostgres,
    mappings: dict[str, str],
    vet_user_ids: list[uuid.UUID],
    clinic_count: int,
    run_tag: str,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    clinic_table = mappings["clinic"]
    vet_table = mappings["veterinarian"]
    service_table = mappings["vet_service"]
    availability_table = mappings["availability"]

    cid = db.column(clinic_table, "id")
    cname = db.column(clinic_table, "name", "denumire")
    caddress = db.column(clinic_table, "address", "adresa")
    ccity = db.column(clinic_table, "city", "oras")
    cphone = db.column(clinic_table, "phone", "telefon")
    crating = db.column(clinic_table, "rating", "rating_mediu", "ratingMediu")
    cgoogle = db.column(clinic_table, "google_place_id", "googlePlaceId", required=False)
    clat = db.column(clinic_table, "latitude", "lat", required=False)
    clon = db.column(clinic_table, "longitude", "lng", "lon", required=False)

    clinics: list[dict[str, Any]] = []
    clinic_objects: list[dict[str, Any]] = []
    for i in range(1, clinic_count + 1):
        clinic_id = uuid.uuid4()
        city = RNG.choice(list(CITIES))
        base_lat, base_lon = CITIES[city]
        row = {
            cid: clinic_id,
            cname: f"{RNG.choice(CLINIC_WORDS)} {city} {run_tag[-3:]}-{i}",
            caddress: f"Str. {RNG.choice(STREETS)} nr. {20 + i}, {city}",
            ccity: city,
            cphone: f"0264{RNG.randint(100000, 999999)}",
            crating: round(RNG.uniform(3.8, 5.0), 1),
        }
        if cgoogle:
            row[cgoogle] = f"seed_place_{run_tag}_{i}"
        if clat:
            row[clat] = round(base_lat + RNG.uniform(-0.04, 0.04), 6)
        if clon:
            row[clon] = round(base_lon + RNG.uniform(-0.04, 0.04), 6)
        clinics.append(row)
        clinic_objects.append({"id": clinic_id, "city": city})

    vid = db.column(vet_table, "id")
    vuser = db.column(vet_table, "user_id", "userId")
    vclinic = db.column(vet_table, "clinic_id", "clinicID", "clinicId")
    vsurgeon = db.column(vet_table, "surgeon")

    vets: list[dict[str, Any]] = []
    vet_objects: list[dict[str, Any]] = []
    for i, user_id in enumerate(vet_user_ids):
        vet_id = uuid.uuid4()
        clinic_obj = clinic_objects[i % len(clinic_objects)]
        vets.append({
            vid: vet_id,
            vuser: user_id,
            vclinic: clinic_obj["id"],
            vsurgeon: RNG.random() < 0.25,
        })
        vet_objects.append({"id": vet_id, "user_id": user_id, "clinic_id": clinic_obj["id"]})

    sid = db.column(service_table, "id")
    sclinic = db.column(service_table, "clinic_id", "clinicId")
    sname = db.column(service_table, "service_name", "serviceName", "name")
    sduration = db.column(service_table, "duration")
    sprice = db.column(service_table, "price")
    sdesc = db.column(service_table, "description", "descriere", required=False)
    next_service_id = db.max_int(service_table, sid) + 1

    services: list[dict[str, Any]] = []
    service_objects: list[dict[str, Any]] = []
    for clinic_obj in clinic_objects:
        selected = RNG.sample(SERVICES, k=min(5, len(SERVICES)))
        for service_name, duration, price, description in selected:
            service_id = next_service_id
            next_service_id += 1
            row = {
                sid: service_id,
                sclinic: clinic_obj["id"],
                sname: service_name,
                sduration: duration,
                sprice: round(price * RNG.uniform(0.9, 1.2), 2),
            }
            if sdesc:
                row[sdesc] = description
            services.append(row)
            service_objects.append({
                "id": service_id,
                "clinic_id": clinic_obj["id"],
                "duration": duration,
                "name": service_name,
            })

    aday = db.column(availability_table, "day")
    avet = db.column(availability_table, "veterinarian_id", "veterinarianId")
    astart = db.column(availability_table, "start_hour", "startHour")
    aend = db.column(availability_table, "end_hour", "endHour")

    availabilities: list[dict[str, Any]] = []
    today = date.today()
    for vet in vet_objects:
        for offset in range(0, 61):
            day = today + timedelta(days=offset)
            if day.weekday() >= 5:
                continue
            availabilities.append({
                avet: vet["id"],
                aday: day,
                astart: time(8, 0),
                aend: time(18, 0),
            })

    return clinics, vets, services, availabilities, clinic_objects, vet_objects, service_objects


def build_pets(
    db: DockerPostgres,
    table: str,
    owner_ids: list[uuid.UUID],
    count: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    pid = db.column(table, "id")
    powner = db.column(table, "owner_id", "ownerID", "ownerId")
    pname = db.column(table, "name")
    pspecies = db.column(table, "species")
    prace = db.column(table, "race", "breed")
    pdob = db.column(table, "dob", "date_of_birth")
    psex = db.column(table, "sex")

    rows: list[dict[str, Any]] = []
    objects: list[dict[str, Any]] = []
    for i in range(count):
        pet_id = uuid.uuid4()
        owner_id = owner_ids[i % len(owner_ids)] if owner_ids else None
        species = RNG.choices(["Dog", "Cat", "Rabbit"], weights=[50, 43, 7])[0]
        breed = RNG.choice(PET_DATA[species])
        pet_name = RNG.choice(PET_NAMES)
        dob = random_date_between(date.today() - timedelta(days=14 * 365), date.today() - timedelta(days=90))
        sex = RNG.choice(["MALE", "FEMALE"])
        rows.append({
            pid: pet_id,
            powner: owner_id,
            pname: pet_name,
            pspecies: species,
            prace: breed,
            pdob: dob,
            psex: sex,
        })
        objects.append({
            "id": pet_id,
            "owner_id": owner_id,
            "name": pet_name,
            "species": species,
            "race": breed,
            "sex": sex,
        })
    return rows, objects


def non_overlapping_slot(used: set[tuple[uuid.UUID, date, int]], vet_id: uuid.UUID, day: date) -> int | None:
    hours = list(range(8, 17))
    RNG.shuffle(hours)
    for hour in hours:
        key = (vet_id, day, hour)
        if key not in used:
            used.add(key)
            return hour
    return None


def build_appointments(
    db: DockerPostgres,
    table: str,
    pets: list[dict[str, Any]],
    vets: list[dict[str, Any]],
    services: list[dict[str, Any]],
    count: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    aid = db.column(table, "id")
    aowner = db.column(table, "owner_id", "ownerId")
    apet = db.column(table, "pet_id", "petId")
    avet = db.column(table, "veterinarian_id", "veterinarianId")
    astart = db.column(table, "start_of_appointment", "startOfAppointment")
    aend = db.column(table, "end_of_appointment", "endOfAppointment")
    aservice = db.column(table, "vet_service_id", "vetServiceId")
    astatus = db.column(table, "status")

    services_by_clinic: dict[uuid.UUID, list[dict[str, Any]]] = {}
    for service in services:
        services_by_clinic.setdefault(service["clinic_id"], []).append(service)

    rows: list[dict[str, Any]] = []
    objects: list[dict[str, Any]] = []
    used_slots: set[tuple[uuid.UUID, date, int]] = set()
    today = date.today()

    future_count = min(int(count * 0.30), len(pets))
    history_count = max(0, count - future_count)
    future_pets = RNG.sample(pets, future_count) if future_count else []

    def create_one(pet: dict[str, Any], future: bool) -> bool:
        for _ in range(50):
            vet = RNG.choice(vets)
            clinic_services = services_by_clinic.get(vet["clinic_id"], [])
            if not clinic_services:
                continue
            service = RNG.choice(clinic_services)
            if future:
                day = random_date_between(today + timedelta(days=1), today + timedelta(days=45))
                while day.weekday() >= 5:
                    day += timedelta(days=1)
                status = RNG.choice(["PENDING", "CONFIRMED"])
            else:
                day = random_date_between(today - timedelta(days=240), today - timedelta(days=1))
                if day.weekday() >= 5:
                    day -= timedelta(days=day.weekday() - 4)
                status = RNG.choices(["FINISHED", "CANCELED", "NO_SHOW"], weights=[68, 20, 12])[0]

            hour = non_overlapping_slot(used_slots, vet["id"], day)
            if hour is None:
                continue
            start = datetime.combine(day, time(hour, RNG.choice([0, 30])))
            # Keep the next whole-hour slot free as well if a 60-min service was selected.
            if service["duration"] > 30:
                used_slots.add((vet["id"], day, hour + 1))
            end = start + timedelta(minutes=service["duration"])
            appointment_id = uuid.uuid4()
            row = {
                aid: appointment_id,
                aowner: pet["owner_id"],
                apet: pet["id"],
                avet: vet["id"],
                astart: start,
                aend: end,
                aservice: service["id"],
                astatus: status,
            }
            rows.append(row)
            objects.append({
                "id": appointment_id,
                "owner_id": pet["owner_id"],
                "pet_id": pet["id"],
                "veterinarian_id": vet["id"],
                "clinic_id": vet["clinic_id"],
                "service_id": service["id"],
                "start": start,
                "end": end,
                "status": status,
            })
            return True
        return False

    for pet in future_pets:
        create_one(pet, True)
    for _ in range(history_count):
        create_one(RNG.choice(pets), False)

    return rows, objects


def build_medical_records(
    db: DockerPostgres,
    table: str,
    appointments: list[dict[str, Any]],
    pets_by_id: dict[uuid.UUID, dict[str, Any]],
) -> list[dict[str, Any]]:
    rid = db.column(table, "id")
    rpet = db.column(table, "pet_id", "petId")
    rapp = db.column(table, "appointment_id", "appointmentId")
    rvet = db.column(table, "veterinarian_id", "veterinarianId")
    rdate = db.column(table, "consultation_date", "consultationDate")
    rservice = db.column(table, "vet_service_id", "vetServiceId")
    rclinic = db.column(table, "clinic_id", "clinicId")
    rsymptoms = db.column(table, "symptoms")
    rdiagnosis = db.column(table, "diagnosis")
    robs = db.column(table, "observations")
    rweight = db.column(table, "weight")
    rtemp = db.column(table, "temperature")

    rows: list[dict[str, Any]] = []
    for app in appointments:
        if app["status"] != "FINISHED":
            continue
        pet = pets_by_id[app["pet_id"]]
        symptoms, diagnosis, observation = RNG.choice(MEDICAL_CASES)
        rows.append({
            rid: uuid.uuid4(),
            rpet: app["pet_id"],
            rapp: app["id"],
            rvet: app["veterinarian_id"],
            rdate: app["end"] + timedelta(minutes=RNG.randint(0, 20)),
            rservice: app["service_id"],
            rclinic: app["clinic_id"],
            rsymptoms: symptoms,
            rdiagnosis: diagnosis,
            robs: observation,
            rweight: choose_pet_weight(pet["species"]),
            rtemp: round(RNG.uniform(37.7, 39.4), 1),
        })
    return rows


def reset_identity_sequence(db: DockerPostgres, table: str, id_column: str) -> None:
    sql = f"""
    SELECT setval(
        pg_get_serial_sequence({sql_literal(table)}, {sql_literal(id_column)}),
        COALESCE(MAX({qident(id_column)}), 1),
        true
    )
    FROM {qident(table)};
    """
    db.execute(sql, quiet=True)


def try_seed_notification_db(all_user_ids: list[uuid.UUID], appointments: list[dict[str, Any]]) -> None:
    container = "notification_db"
    db_name = "notification_db"
    db = DockerPostgres(container, db_name)
    if not db.is_running():
        return
    try:
        db.refresh_schema()
        table = db.find_table("notification", "notifications", required=False)
        if not table:
            print(f"[SKIP] {db_name}: container exists, but no notification table was found.")
            return

        columns = db.schema[table]
        rows: list[dict[str, Any]] = []
        messages = [
            ("Appointment confirmed", "Your veterinary appointment has been confirmed."),
            ("Appointment reminder", "You have an upcoming veterinary appointment."),
            ("Medical record available", "A new medical record is available for your pet."),
            ("Appointment updated", "There is an update regarding your veterinary appointment."),
        ]

        def value_for(meta: dict[str, str]) -> tuple[bool, Any]:
            n = norm(meta["name"])
            typ = meta["type"].lower()
            if n == "id":
                return True, uuid.uuid4()
            if n in {"userid", "recipientid", "receiverid"}:
                return True, RNG.choice(all_user_ids)
            if n == "appointmentid":
                return True, RNG.choice(appointments)["id"] if appointments else None
            if n in {"message", "content", "text"}:
                return True, RNG.choice(messages)[1]
            if n in {"title", "subject"}:
                return True, RNG.choice(messages)[0]
            if n in {"isread", "read", "seen"}:
                return True, RNG.random() < 0.55
            if n in {"createdat", "createddate", "timestamp", "sentat", "datatrimitere"}:
                return True, datetime.now() - timedelta(hours=RNG.randint(1, 240))
            if n in {"updatedat"}:
                return True, datetime.now()
            if meta["type"] == "USER-DEFINED":
                labels = db.enum_labels(meta["udt"])
                if labels:
                    return True, RNG.choice(labels)
            if meta["nullable"] == "YES" or meta["default"]:
                return False, None
            return False, None

        template: dict[str, Any] = {}
        missing_required = []
        for meta in columns:
            recognized, value = value_for(meta)
            if recognized:
                template[meta["name"]] = value
            elif meta["nullable"] == "NO" and not meta["default"]:
                missing_required.append(meta["name"])

        if missing_required:
            print(
                f"[SKIP] {db_name}.{table}: schema differs from the generic notification seeder. "
                f"Unrecognized required columns: {', '.join(missing_required)}"
            )
            return

        for _ in range(min(150, max(25, len(all_user_ids) * 2))):
            row = {}
            for meta in columns:
                recognized, value = value_for(meta)
                if recognized:
                    row[meta["name"]] = value
            rows.append(row)
        if rows:
            db.insert_many(table, rows)
            print(f"[OK] Notifications: {len(rows)}")
    except Exception as exc:
        print(f"[SKIP] notification_db could not be seeded safely: {exc}")


def validate_docker() -> None:
    if shutil.which("docker") is None:
        raise SeedError("Docker CLI was not found. Start Docker Desktop and run this script from a terminal with docker available.")
    p = subprocess.run(["docker", "info"], capture_output=True, text=True)
    if p.returncode != 0:
        raise SeedError("Docker is not running or the current user cannot access it.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Populate VETApp PostgreSQL databases with coherent demo data.")
    parser.add_argument("--preset", choices=PRESETS, default="demo", help="Dataset size (default: demo)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducible data")
    parser.add_argument("--owners", type=int, help="Override number of owners")
    parser.add_argument("--vets", type=int, help="Override number of veterinarians")
    parser.add_argument("--admins", type=int, help="Override number of admins")
    parser.add_argument("--clinics", type=int, help="Override number of clinics")
    parser.add_argument("--pets", type=int, help="Override number of pets")
    parser.add_argument("--appointments", type=int, help="Override number of appointments")
    parser.add_argument("--wipe", action="store_true", help="TRUNCATE core VETApp tables before seeding")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation when used with --wipe")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.seed is not None:
        RNG.seed(args.seed)
    else:
        RNG.seed()

    validate_docker()
    cfg = dict(PRESETS[args.preset])
    overrides = {
        "owners": args.owners,
        "veterinarians": args.vets,
        "admins": args.admins,
        "clinics": args.clinics,
        "pets": args.pets,
        "appointments": args.appointments,
    }
    for key, value in overrides.items():
        if value is not None:
            if value < 1:
                raise SeedError(f"--{key} must be at least 1")
            cfg[key] = value
    run_tag = datetime.now().strftime("%m%d%H%M%S")[-8:]

    dbs = {key: DockerPostgres(container, dbname) for key, (container, dbname) in DB_CONFIG.items()}
    missing = [db.container for db in dbs.values() if not db.is_running()]
    if missing:
        raise SeedError(
            "These database containers are not running: " + ", ".join(missing) +
            "\nStart the VETApp stack first (docker compose up -d)."
        )

    print("\n[VETApp Seeder]")
    print(f"Preset: {args.preset}")
    print(f"Generated account password: {APP_PASSWORD}")
    print("Reading database schemas...")

    mappings: dict[str, dict[str, str]] = {}
    for key, db in dbs.items():
        db.refresh_schema()
        mappings[key] = table_mapping(db)

    if args.wipe:
        if not args.yes:
            answer = input("This will DELETE all rows from the core VETApp tables. Type WIPE to continue: ")
            if answer.strip() != "WIPE":
                print("Canceled.")
                return 0
        wipe_core(dbs, mappings)

    print("Creating users...")
    auth_rows, user_rows, owner_ids, vet_user_ids, admin_ids, account_info = build_user_rows(
        dbs["auth"], dbs["users"], mappings["auth"]["authentication"], mappings["users"]["users"],
        cfg["owners"], cfg["veterinarians"], cfg["admins"], run_tag
    )
    dbs["auth"].insert_many(mappings["auth"]["authentication"], auth_rows)
    dbs["users"].insert_many(mappings["users"]["users"], user_rows)
    print(f"[OK] Accounts: {len(auth_rows)} ({len(owner_ids)} owners, {len(vet_user_ids)} vets, {len(admin_ids)} admins)")

    print("Creating clinics, veterinarians, services and availability...")
    (
        clinic_rows, vet_rows, service_rows, availability_rows,
        clinic_objects, vet_objects, service_objects
    ) = build_clinics_and_vets(
        dbs["clinic"], mappings["clinic"], vet_user_ids, cfg["clinics"], run_tag
    )
    dbs["clinic"].insert_many(mappings["clinic"]["clinic"], clinic_rows)
    dbs["clinic"].insert_many(mappings["clinic"]["veterinarian"], vet_rows)
    dbs["clinic"].insert_many(mappings["clinic"]["vet_service"], service_rows)
    dbs["clinic"].insert_many(mappings["clinic"]["availability"], availability_rows)
    service_id_col = dbs["clinic"].column(mappings["clinic"]["vet_service"], "id")
    reset_identity_sequence(dbs["clinic"], mappings["clinic"]["vet_service"], service_id_col)
    print(f"[OK] Clinics: {len(clinic_rows)}")
    print(f"[OK] Veterinarians: {len(vet_rows)}")
    print(f"[OK] Vet services: {len(service_rows)}")
    print(f"[OK] Availability rows: {len(availability_rows)}")

    print("Creating pets...")
    pet_rows, pet_objects = build_pets(dbs["pet"], mappings["pet"]["pet"], owner_ids, cfg["pets"])
    dbs["pet"].insert_many(mappings["pet"]["pet"], pet_rows)
    print(f"[OK] Pets: {len(pet_rows)}")

    print("Creating appointments...")
    appointment_rows, appointment_objects = build_appointments(
        dbs["appointment"], mappings["appointment"]["appointment"],
        pet_objects, vet_objects, service_objects, cfg["appointments"]
    )
    dbs["appointment"].insert_many(mappings["appointment"]["appointment"], appointment_rows)
    status_counts: dict[str, int] = {}
    for appointment in appointment_objects:
        status_counts[appointment["status"]] = status_counts.get(appointment["status"], 0) + 1
    print(f"[OK] Appointments: {len(appointment_rows)} {status_counts}")

    print("Creating medical records for FINISHED appointments...")
    pet_map = {p["id"]: p for p in pet_objects}
    medical_rows = build_medical_records(
        dbs["medicalr"], mappings["medicalr"]["medical_record"], appointment_objects, pet_map
    )
    dbs["medicalr"].insert_many(mappings["medicalr"]["medical_record"], medical_rows)
    print(f"[OK] Medical records: {len(medical_rows)}")

    all_user_ids = owner_ids + vet_user_ids + admin_ids
    try_seed_notification_db(all_user_ids, appointment_objects)

    credentials_path = "vetapp_seed_accounts.json"
    with open(credentials_path, "w", encoding="utf-8") as f:
        json.dump({"password": APP_PASSWORD, "accounts": account_info}, f, ensure_ascii=False, indent=2)

    print("\nSeed completed successfully.")
    print(f"Accounts: {len(account_info)}")
    print(f"Login password for every generated account: {APP_PASSWORD}")
    print(f"Credentials written to: {credentials_path}")
    if admin_ids:
        first_admin = next(x for x in account_info if x["role"] == "ADMIN")
        print(f"Example admin login: {first_admin['username']} / {APP_PASSWORD}")
    if vet_user_ids:
        first_vet = next(x for x in account_info if x["role"] == "VETERINARIAN")
        print(f"Example veterinarian login: {first_vet['username']} / {APP_PASSWORD}")
    if owner_ids:
        first_owner = next(x for x in account_info if x["role"] == "OWNER")
        print(f"Example owner login: {first_owner['username']} / {APP_PASSWORD}")
    print("\nTip: use --wipe --yes if you want a completely clean demo dataset next time.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SeedError as exc:
        print(f"\n[ERROR] {exc}", file=sys.stderr)
        raise SystemExit(1)
