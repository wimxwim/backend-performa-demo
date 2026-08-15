GotongRoyong backend-performa-demo — DOCX Pelajaran (3 file)
==============================================================
Tanggal: 15 Aug 2026 | Sumber: docs/*.md | Tool: pandoc 3.1.3 + python-docx 1.2.0 + Pillow 12.2.0

Daftar File
-----------
1. SUDUT_PANDANG_TERLUAS.docx  (86K, 898 baris md, 7 lensa)
   Sumber: docs/SUDUT_PANDANG_TERLUAS.md (61K)
   Isi: Diagnosis 5% vs 100% visi, 7 lensa (TIGA INSAN, Piagam Madinah, Socio Corp, 7 Fondasi+6DB, Pesanggrahan 6.081, UX 100 prinsip, Roadmap 300 fitur), sintesis & rekomendasi A/B/C.
   Heading: 64 | Tabel: 43 | TOC: Ya | Banner: Ya

2. RANGKUMAN_PELAJARAN_5M.docx  (69K, 629 baris md)
   Sumber: docs/RANGKUMAN_PELAJARAN_5M.md (35K)
   Isi: Streaming 99s 50K rows/s, COPY 25x, GIN 200x, 8 konsep warung, tuning 22 param, benchmark, 7 pelajaran, 10 perintah reproducible.
   Heading: 51 | Tabel: 14 | TOC: Ya | Banner: Ya

3. PANDUAN_PRESENTASI.docx  (66K, 798 baris md)
   Sumber: docs/PANDUAN_PRESENTASI.md (38K)
   Isi: Timeline 60 menit 40 slides, checklist 10 item, alur 40 slides, bahasa awam vs teknikal, demo 5 langkah, Q&A 10, DoD, troubleshooting, demo ZIS/RLS.
   Heading: 41 | Tabel: 6 | TOC: Ya | Banner: Ya

Total: 232K (3 docx) | Format: Microsoft Word 2007+ (OOXML zip valid)

Styling
-------
- H1 navy #1B3A5C 18pt Calibri Bold, H2 orange #D46B08 14pt, H3 navy 12pt
- Tabel: border #B0B8C1 single 4pt, header navy #1B3A5C teks putih bold 9pt, body 9pt Calibri
- Code block: Consolas 8.5pt, background #F2F4F7
- Margin 2cm semua sisi, line spacing 1.15, space after 6pt
- Banner cover PNG 1600x400 navy+orange di halaman 1 tiap file
- Page break sebelum tiap H1 (kecuali cover+TOC) — bab baru di halaman baru
- TOC field otomatis (pandoc --toc --toc-depth=3 --highlight-style=tango)

Cara Buka
---------
- Windows/macOS: double-click .docx -> Microsoft Word (2007+), atau drag ke Word.
- Linux: LibreOffice Writer (24.2.7.2 teruji) -> `libreoffice docs/docx/SUDUT_PANDANG_TERLUAS.docx`
- Google Docs: Upload ke drive.google.com -> Open with Google Docs (TOC jadi link).
- WPS Office / OnlyOffice: buka langsung, TOC tetap klik-able.
- Validasi: `file docs/docx/*.docx` harus "Microsoft Word 2007+", `unzip -l docs/docx/*.docx` harus list word/document.xml.

Cara Update Daftar Isi (TOC)
-----------------------------
TOC di halaman 1 adalah field Word yang auto-update. Jika heading berubah:
- Microsoft Word: klik kanan di TOC -> "Update Field" -> pilih "Update entire table" -> OK. Atau References > Update Table > Entire table.
- LibreOffice Writer: klik kanan TOC -> "Update Index" atau Tools > Update > All.
- Jika TOC kosong di LibreOffice, tekan F9 atau Ctrl+A lalu F9.
- Pandoc TOC depth 3: H1/H2/H3 masuk TOC, H4+ tidak.

Link MD Asli (jangan hapus)
----------------------------
- docs/SUDUT_PANDANG_TERLUAS.md
- docs/RANGKUMAN_PELAJARAN_5M.md
- docs/PANDUAN_PRESENTASI.md
Tetap ada dan tidak diedit. DOCX adalah turunan untuk cetak/baca nyaman. Edit md lalu re-convert jika perlu:
  pandoc docs/SUDUT_PANDANG_TERLUAS.md -o docs/docx/SUDUT_PANDANG_TERLUAS.docx --toc --toc-depth=3 --highlight-style=tango
  pandoc docs/RANGKUMAN_PELAJARAN_5M.md -o docs/docx/RANGKUMAN_PELAJARAN_5M.docx --toc --toc-depth=3 --highlight-style=tango
  pandoc docs/PANDUAN_PRESENTASI.md -o docs/docx/PANDUAN_PRESENTASI.docx --toc --toc-depth=3 --highlight-style=tango
  python3 /tmp/style_docx.py && python3 /tmp/add_cover.py  # styling navy/orange + banner

Catatan
-------
- Badge shields.io di md jadi placeholder SVG (rsvg-convert tidak ada) — tidak mengganggu isi.
- Font Calibri default Word; jika tidak ada, fallback ke sans-serif tetap rapi.
- Tidak ada edit ke presentasi/, tsconfig, atau md asli — hanya tambah docs/docx/.
