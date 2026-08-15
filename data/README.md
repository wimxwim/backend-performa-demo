# Data CSV — Pesanggrahan (UMKM + Masjid)

Folder ini untuk file CSV seed. `seed/import.ts` mencari CSV dengan prioritas:

1. `CSV_UMKM` / `CSV_MASJID` dari env (`.env`)
2. `./data/Pesanggrahan.csv` dan `./data/Masjid.csv` (folder ini)
3. Fallback absolut laptop asli: `/home/ngome/GotongRoyong/Docs-wa/Data Kecamatan Pesanggrahan.xlsx.*.csv`
4. Fallback relatif: `../../Docs-wa/Data Kecamatan Pesanggrahan.xlsx.*.csv`

## Opsi A — Copy CSV ke data/ (paling mudah)

```bash
cp "../Docs-wa/Data Kecamatan Pesanggrahan.xlsx.Pesanggrahan.csv" ./data/Pesanggrahan.csv
cp "../Docs-wa/Data Kecamatan Pesanggrahan.xlsx.Masjid.csv" ./data/Masjid.csv
# atau dari root GotongRoyong:
cp Docs-wa/Data\ Kecamatan\ Pesanggrahan.xlsx.Pesanggrahan.csv backend-performa-demo/data/Pesanggrahan.csv
cp Docs-wa/Data\ Kecamatan\ Pesanggrahan.xlsx.Masjid.csv backend-performa-demo/data/Masjid.csv
```

## Opsi B — Set env di .env

```bash
cp .env.example .env
# edit .env:
CSV_UMKM=/path/lokal/Pesanggrahan.csv
CSV_MASJID=/path/lokal/Masjid.csv
# atau relatif:
CSV_UMKM=./data/Pesanggrahan.csv
CSV_MASJID=./data/Masjid.csv
```

## Opsi C — Pakai path absolut (laptop asli ngome)

Tidak perlu apa-apa — `seed/import.ts` sudah fallback ke `/home/ngome/...` jika env dan `data/` tidak ada.

## Verifikasi

```bash
ls -lh data/
bun run --cwd seed import.ts        # import real 6081 UMKM + 256 Masjid
bun run --cwd seed import.ts --synthetic 100000  # + synthetic untuk load test
```

## Catatan

- File CSV tidak di-commit (terlalu besar, ada di `Docs-wa/`).
- `.gitignore` sudah mengabaikan `data/*.csv`.
