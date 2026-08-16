# Website Lokal 1 Atap v2 — Backend Performa Demo
Website offline tanpa hosting — cukup laptop. 100% offline, tidak ada CDN wajib (mermaid CDN fallback local). v2: branch switcher + 5 tabs + code viewer + mermaid + LogQL + health badge.

## Cara jalan
```bash
cd website && python3 -m http.server 8000
# http://localhost:8000/?branch=02-proper-logging&tab=code  -> branch + tab sync (pushState, deep link shareable)
# http://localhost:8000/?branch=03-scale&tab=live           -> Pasar 6.081 scale + Live Demo
# HP 1 WiFi: http://192.168.1.41:8000/?branch=04-centralized&tab=logql
npx serve .            # alternatif Node
php -S localhost:8000  # alternatif PHP
```

## Branch switcher (header dropdown)
- 4 opsi: `01 Warung — console.log | 02 UMKM SOP — pino JSON | 03 Pasar 6.081 — scale | 04 SAKTI 5M — centralized`
- Selected chip sticky, recent di atas, URL sync `?branch=02-proper-logging` via `history.pushState`, deep link shareable, `localStorage` last branch.
- Hero CTA branch-aware: `[Buka Babak Ini ->]` link ke `?branch=xx` + deep link presentasi slide sesuai branch (01->slide 4, 02->slide 6, 03->slide 15, 04->slide 18).

## Tabs — 5 tabs per branch
- `README | Code | Diagram | Live Demo | LogQL` — UnderlinePanels pattern, `role tablist/tab/tabpanel`, keyboard Left/Right + Enter, URL sync `?branch=02&tab=code`, `pushState` per tab, Back browser kembali ke tab/branch sebelumnya via `popstate`.

## Tab baru + Back
- Tiap branch card + tiap file + tiap slide punya `target="_blank" rel="noopener"` preserve `?branch` (tab baru).
- Custom Back link `< Kembali ke Daftar Babak` di atas konten (visible underlined, di breadcrumbs), Back browser via `popstate` restore branch/tab.

## Code viewer
- Per branch, file tree (order-service/index.ts, logger.ts, compose.yaml, config.alloy) — Shiki-style static highlight (`pre code language-ts`), copy button di kanan atas tiap block + toast `Copied!`, line highlight untuk `requestId`, diff view button `Compare 01 vs 02` (side-by-side pre).

## Diagram
- Mermaid flowchart per branch (flow 01: 2 kotak, 02: +pino, 03: +3 container+LB, 04: +Alloy/Loki/Grafana) — render via `<pre class="mermaid">` + mermaid CDN fallback local, plus Excalidraw sketch placeholder SVG.

## Live Demo UX
- Per branch, health badge `● Healthy / ○ Checking` (poll `/healthz` tiap 5 detik, hanya saat Live Demo tab aktif), one-click copy command (`git checkout`, `podman-compose up`, `curl`), LogQL playground Builder/Code dual mode (Builder dropdown + Code textarea, sync, preset UMKM: `{job="warung-service"} |= "CARD_DECLINED"`).

## Struktur
```
website/index.html              # Landing v2 navy #1e3a5f + orange #f59e0b — 400+ baris, branch switcher + 5 tabs
website/app.js                  # Branch switcher + tabs + back + copy + health + mermaid — 150-200 baris
website/style.css               # Branch chip, tabs underline, copy button, health badge, mermaid bg, glass-strong
website/presentasi/index.html   # 40 slides SPA (169K, hash #slide-N) — jangan rusak, tetap 40
website/presentasi/app.js, output.css, style.css, fonts/
website/presentasi/*.pptx       # Demo 145K + Light 47K
website/docs/*.pdf,*.md         # Buku 896K, Naskah 942K, Cheat 67K + MD
website/docs/VERIFIKASI.md      # 351 baris pipeline 92/100
```

## Link
- Slides: `./presentasi/index.html` + `#slide-1`..`#slide-40` — tiap card `target="_blank"` + branch-aware highlight (01 highlight 4-5, 02 highlight 6-14, 03 highlight 15-17, 04 highlight 18-22)
- Dokumen: `./docs/*.pdf` `./docs/*.md` — branch-aware badge
- PPTX: `./presentasi/*.pptx`
- Tanpa hosting — headers DENY di gotongroyong/next.config.ts tidak dipakai di sini.

## Verifikasi
```bash
ls -lh website/index.html website/app.js website/style.css
# index.html >30K, app.js >4K
grep -c 'branch' website/index.html  # >=10
grep -c 'tab' website/index.html     # >=5
grep -c 'target="_blank"' website/index.html  # >=5
grep -c 'Kembali' website/index.html # >=1
grep -c 'mermaid' website/index.html # >=1
grep -c 'copy' website/index.html    # >=5
grep -c 'id="slide-' website/presentasi/index.html  # tetap 40
npx tsc --noEmit  # EXIT 0 jika ada tsconfig
# buka: http://localhost:8000/?branch=02-proper-logging&tab=code
```
