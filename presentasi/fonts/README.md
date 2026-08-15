# Fonts — Offline woff2

Woff2 akan di-download via https://gwfh.mranftl.com/fonts

Untuk sekarang pakai fallback `local()` + `system-ui` — `fonts.css` sudah handle `font-display:swap`.

## Download manual (jika offline build butuh file fisik)

```bash
# Plus Jakarta Sans (400,600,700,800)
curl -L -o plus-jakarta-sans-v8-latin-regular.woff2 "https://gwfh.mranftl.com/api/fonts/plus-jakarta-sans?download=zip&subsets=latin&variants=regular,600,700,800&formats=woff2"
# Atau per-file dari google-webfonts-helper:
# https://gwfh.mranftl.com/fonts/plus-jakarta-sans?subsets=latin

# JetBrains Mono (400,600)
# https://gwfh.mranftl.com/fonts/jetbrains-mono?subsets=latin

# Lora (600)
# https://gwfh.mranftl.com/fonts/lora?subsets=latin
```

Alternatif cepat (Google Fonts direct woff2 — butuh user-agent):
```bash
curl -A "Mozilla/5.0" -L "https://fonts.gstatic.com/s/plusjakartasans/v8/..." -o plus-jakarta-sans-v8-latin-700.woff2
```

Selama woff2 belum ada, browser akan pakai `local('Plus Jakarta Sans')` fallback lalu `system-ui` via `font-family` di `style.css` — tidak ada FOIT karena `font-display:swap`.
