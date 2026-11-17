# Data toko & usaha untuk pencarian di peta, dari Overture Maps (data terbuka, gratis, tanpa akun).
# Hasil: web/places.json (hanya tempat di dalam wilayah layanan, region.js).
# Pakai: pip install duckdb shapely  lalu  python tools/build-places.py [rilis]
# Jalankan ulang sebulan sekali untuk data baru (rilis terbaru diambil otomatis dari katalog Overture).
import os, sys, json, urllib.request, duckdb
from shapely.geometry import MultiPolygon, Point
from shapely.prepared import prep

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rel = sys.argv[1] if len(sys.argv) > 1 else json.load(urllib.request.urlopen("https://stac.overturemaps.org/catalog.json"))["latest"]
s = open(os.path.join(root, "web", "region.js"), encoding="utf8").read()
R = json.loads(s[s.index("{"):s.rindex("}") + 1])
area = prep(MultiPolygon([(p[0], p[1:]) for p in R["polygons"]]))
x0, y0, x1, y1 = R["bbox"]

# Nama kategori untuk ditampilkan; kategori lain tampil tanpa label.
LABEL = {
    "restaurant": "Rumah makan", "casual_eatery": "Warung makan", "fast_food_restaurant": "Makanan cepat saji", "food_truck_stand": "Kaki lima",
    "food_and_drink": "Makanan & minuman", "cafe": "Kafe", "coffee_shop": "Kedai kopi", "bakery": "Toko roti",
    "food_and_beverage_store": "Toko makanan", "convenience_store": "Minimarket", "grocery_store": "Toko kelontong", "supermarket": "Supermarket",
    "warehouse_club_store": "Toko grosir", "department_store": "Toserba", "shopping_mall": "Mal", "shopping": "Toko", "specialty_store": "Toko",
    "fashion_and_apparel_store": "Toko pakaian", "electronics_store": "Toko elektronik", "hardware_home_and_garden_store": "Toko bangunan",
    "pharmacy_and_drug_store": "Apotek", "personal_care_and_beauty_store": "Toko kosmetik", "flowers_and_gifts_store": "Toko bunga & kado",
    "animal_and_pet_store": "Toko hewan", "sporting_goods_store": "Toko olahraga", "vehicle_parts_store": "Toko onderdil",
    "books_music_and_video_store": "Toko buku", "toys_and_games_store": "Toko mainan", "arts_crafts_and_hobby_store": "Toko alat tulis & kerajinan",
    "market": "Pasar", "farmers_market": "Pasar", "gas_station": "SPBU", "automotive_service": "Bengkel", "vehicle_service": "Bengkel",
    "auto_dealer": "Dealer", "vehicle_dealer": "Dealer", "laundry_service": "Laundry", "personal_or_beauty_service": "Salon & kecantikan",
    "printing_service": "Percetakan", "shipping_or_delivery_service": "Ekspedisi", "bank_or_credit_union": "Bank", "financial_service": "Keuangan",
    "hotel": "Hotel", "lodging": "Penginapan", "hospital": "Rumah sakit", "outpatient_care_facility": "Klinik", "health_care": "Kesehatan",
    "diagnostics_imaging_or_lab_service": "Laboratorium", "muslim_place_of_worship": "Masjid/musala", "christian_place_of_worship": "Gereja",
    "religious_organization": "Organisasi keagamaan", "government_office": "Kantor pemerintah", "community_and_government": "Pemerintahan",
    "police_station": "Polisi", "elementary_school": "SD", "middle_school": "SMP", "high_school": "SMA/SMK", "preschool": "TK/PAUD",
    "college_university": "Kampus", "place_of_learning": "Pendidikan", "education": "Pendidikan", "specialty_school": "Kursus",
    "park": "Taman", "sport_field": "Lapangan", "gym": "Gym", "sport_or_fitness_facility": "Olahraga", "swimming_pool": "Kolam renang",
    "stadium_arena": "Stadion", "historic_site": "Situs sejarah", "travel_service": "Travel", "travel_and_transportation": "Transportasi",
    "event_or_party_service": "Acara & dekorasi", "rental_service": "Rental", "real_estate_service": "Properti", "home_service": "Jasa rumah",
}
SKIP = {"river", "mountain", "geographic_entities"}

c = duckdb.connect()
c.sql("INSTALL httpfs; LOAD httpfs; INSTALL spatial; LOAD spatial; SET s3_region='us-west-2';")
rows = c.sql(f"""SELECT names.primary, basic_category, ST_Y(geometry), ST_X(geometry), addresses[1].locality
  FROM read_parquet('s3://overturemaps-us-west-2/release/{rel}/theme=places/type=place/*', hive_partitioning=1)
  WHERE bbox.xmin BETWEEN {x0} AND {x1} AND bbox.ymin BETWEEN {y0} AND {y1}
    AND names.primary IS NOT NULL AND confidence >= 0.3 AND coalesce(operating_status, 'open') = 'open'""").fetchall()

cats, locs, out, seen = [""], [""], [], set()
def idx(lst, v):
    if v not in lst: lst.append(v)
    return lst.index(v)
for name, cat, lat, lng, loc in rows:
    name = " ".join(name.split())
    key = (name.lower(), round(lat, 3), round(lng, 3))  # nama sama dalam ±100 m = duplikat
    if cat in SKIP or key in seen or not area.contains(Point(lng, lat)): continue
    seen.add(key)
    out.append([name, round(lat, 5), round(lng, 5), idx(cats, LABEL.get(cat, "")), idx(locs, loc or "")])

data = {"src": "Overture Maps Foundation " + rel, "c": cats, "l": locs, "p": out}
assert len(out) > 1000, "data terlalu sedikit, periksa kueri"
path = os.path.join(root, "web", "places.json")
json.dump(data, open(path, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
print(f"{len(out)} tempat dari rilis {rel} -> web/places.json ({os.path.getsize(path) // 1024} KB)")
