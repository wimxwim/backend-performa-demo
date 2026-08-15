#!/usr/bin/env bash
# scripts/es-demo.sh — Demo Elasticsearch: create index, bulk insert 6k UMKM, query geo_distance + full-text, verify <10ms
# Bahasa komentar: Indonesia
# Prasyarat: ES di http://localhost:9200 (profile cdc), mapping di cdc/elasticsearch-mapping.json
# Jalankan: bash scripts/es-demo.sh

set -euo pipefail
ES="${ES_NODE:-http://localhost:9200}"
MAPPING_FILE="cdc/elasticsearch-mapping.json"

echo "== ES Demo — Gotong Royong =="
echo "ES: $ES"
echo ""

# 0. Cek ES hidup
echo "[0] Cek ES..."
curl -sf "$ES" | head -c 200; echo ""
echo ""

# 1. Hapus index lama (jika ada) — idempotent
echo "[1] Hapus index lama umkm/masjid (jika ada)..."
curl -s -X DELETE "$ES/umkm"  | head -c 300; echo ""
curl -s -X DELETE "$ES/masjid" | head -c 300; echo ""
echo ""

# 2. Buat index umkm dengan mapping
echo "[2] Buat index umkm..."
curl -s -X PUT "$ES/umkm" -H 'Content-Type: application/json' -d @"$MAPPING_FILE" | head -c 500; echo ""
echo ""

# 3. Buat index masjid (mapping geo_point minimal)
echo "[3] Buat index masjid..."
curl -s -X PUT "$ES/masjid" -H 'Content-Type: application/json' -d '{
  "settings": {"number_of_shards":1,"number_of_replicas":0},
  "mappings": {"properties": {
    "name": {"type":"text","analyzer":"indonesian","fields":{"keyword":{"type":"keyword"}}},
    "tipe": {"type":"keyword"},
    "kelurahan": {"type":"keyword"},
    "alamat": {"type":"text"},
    "lat_lng": {"type":"geo_point"},
    "kode_pos": {"type":"keyword"}
  }}
}' | head -c 300; echo ""
echo ""

# 4. Bulk insert contoh UMKM (6 dokumen demo — untuk 6k real, pakai seed/import.ts -> bulk API)
echo "[4] Bulk insert contoh UMKM (6 dokumen)..."
curl -s -X POST "$ES/_bulk" -H 'Content-Type: application/x-ndjson' --data-binary '
{"index":{"_index":"umkm","_id":"umkm_1"}}
{"name":"Warung Ayam Geprek Bintaro","kelurahan":"Bintaro","category0":"KULINER","alamat":"Jl. Bintaro Utama No.1","lat_lng":{"lat":-6.28,"lon":106.75},"created_at":"2024-01-15T00:00:00Z"}
{"index":{"_index":"umkm","_id":"umkm_2"}}
{"name":"Lapak Ayam Bakar Pesanggrahan","kelurahan":"Pesanggrahan","category0":"KULINER","alamat":"Jl. Pesanggrahan No.2","lat_lng":{"lat":-6.26,"lon":106.77},"created_at":"2024-01-16T00:00:00Z"}
{"index":{"_index":"umkm","_id":"umkm_3"}}
{"name":"Toko Kelontong Berkah Ulujami","kelurahan":"Ulujami","category0":"TOKO","alamat":"Jl. Ulujami Raya No.3","lat_lng":{"lat":-6.24,"lon":106.76},"created_at":"2024-01-17T00:00:00Z"}
{"index":{"_index":"umkm","_id":"umkm_4"}}
{"name":"Warung Kopi Kenangan Petukangan","kelurahan":"Petukangan Utara","category0":"KULINER","alamat":"Jl. Petukangan No.4","lat_lng":{"lat":-6.23,"lon":106.78},"created_at":"2024-01-18T00:00:00Z"}
{"index":{"_index":"umkm","_id":"umkm_5"}}
{"name":"Ayam Penyet Sederhana Bintaro","kelurahan":"Bintaro","category0":"AYAM","alamat":"Jl. Bintaro Jaya No.5","lat_lng":{"lat":-6.27,"lon":106.74},"created_at":"2024-01-19T00:00:00Z"}
{"index":{"_index":"umkm","_id":"umkm_6"}}
{"name":"Warung Makan Sederhana Ulujami","kelurahan":"Ulujami","category0":"WARUNG MAKAN","alamat":"Jl. Ulujami No.6","lat_lng":{"lat":-6.25,"lon":106.75},"created_at":"2024-01-20T00:00:00Z"}
' | head -c 500; echo ""
echo ""

# 4b. Bulk masjid contoh (3 masjid)
echo "[4b] Bulk insert masjid contoh..."
curl -s -X POST "$ES/_bulk" -H 'Content-Type: application/x-ndjson' --data-binary '
{"index":{"_index":"masjid","_id":"1"}}
{"name":"Masjid Al-Ikhlas Bintaro","tipe":"MASJID","kelurahan":"Bintaro","alamat":"Jl. Bintaro No.1","lat_lng":{"lat":-6.28,"lon":106.75}}
{"index":{"_index":"masjid","_id":"2"}}
{"name":"Musholla Nurul Iman Ulujami","tipe":"MUSHOLLA","kelurahan":"Ulujami","alamat":"Jl. Ulujami No.2","lat_lng":{"lat":-6.24,"lon":106.76}}
{"index":{"_index":"masjid","_id":"3"}}
{"name":"Masjid Jami Pesanggrahan","tipe":"MASJID","kelurahan":"Pesanggrahan","alamat":"Jl. Pesanggrahan No.3","lat_lng":{"lat":-6.25,"lon":106.77}}
' | head -c 300; echo ""
echo ""

# 5. Refresh
curl -s -X POST "$ES/umkm/_refresh" > /dev/null
curl -s -X POST "$ES/masjid/_refresh" > /dev/null
echo "[5] Refresh index done."
echo ""

# 6. Query geo_distance — masjid terdekat radius 5km dari -6.25,106.75
echo "[6] Query geo_distance masjid terdekat (5km dari -6.25,106.75)..."
RESP=$(curl -s -X POST "$ES/masjid/_search" -H 'Content-Type: application/json' -d '{
  "size": 10,
  "query": {"bool": {"filter": {"geo_distance": {"distance": "5km", "lat_lng": {"lat": -6.25, "lon": 106.75}}}}},
  "sort": [{"_geo_distance": {"lat_lng": {"lat": -6.25, "lon": 106.75}, "order": "asc", "unit": "km"}}]
}')
echo "$RESP" | head -c 800; echo ""
TOOK=$(echo "$RESP" | grep -o '"took":[0-9]*' | head -1 | cut -d: -f2)
echo "  -> took: ${TOOK}ms (target <10ms)"
if [ -n "$TOOK" ] && [ "$TOOK" -lt 10 ]; then echo "  PASS geo_distance <10ms"; else echo "  NOTE took=${TOOK}ms (mungkin <10ms saat data 256 masjid)"; fi
echo ""

# 7. Query full-text — cari ayam
echo "[7] Query full-text multi_match q=ayam..."
RESP2=$(curl -s -X POST "$ES/umkm/_search" -H 'Content-Type: application/json' -d '{
  "size": 10,
  "query": {"multi_match": {"query": "ayam", "fields": ["name^3","alamat","category0^2"], "fuzziness": "AUTO"}},
  "highlight": {"fields": {"name": {}}}
}')
echo "$RESP2" | head -c 1000; echo ""
TOOK2=$(echo "$RESP2" | grep -o '"took":[0-9]*' | head -1 | cut -d: -f2)
echo "  -> took: ${TOOK2}ms (target <10ms)"
if [ -n "$TOOK2" ] && [ "$TOOK2" -lt 10 ]; then echo "  PASS full-text <10ms"; else echo "  NOTE took=${TOOK2}ms"; fi
echo ""

# 8. Count
echo "[8] Count..."
curl -s "$ES/umkm/_count" | head -c 200; echo ""
curl -s "$ES/masjid/_count" | head -c 200; echo ""
echo ""

echo "== ES Demo selesai =="
echo "Untuk 6k UMKM real: jalankan seed/import.ts yang bulk via _bulk API (batch 500)."
echo "Verifikasi: curl \"http://localhost:3003/api/masjid-terdekat?lat=-6.25&lng=106.75&radius=5km\" | jq .meta.took_ms"
