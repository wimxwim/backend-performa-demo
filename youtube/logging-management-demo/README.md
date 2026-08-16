# Demo: Logging yang Benar — dari `console.log` sampai Centralized Logging

Demo pendamping materi **"Logging yang Kamu Pakai Selama Ini SALAH"**.
Stack: **Bun**. Container: **Podman** + `podman-compose`. Centralized logging:
**Grafana Alloy → Loki → Grafana**.

Demo dibikin **bertahap per branch**. Tiap branch = satu babak di materi, jadi
bisa di-checkout satu-satu pas ngajar/ngerekam.

## Alur Branch

| Branch | Babak | Isi |
|---|---|---|
| `01-console-log` | Cara biasa (Slide 4–5) | `order-service` + `payment-service` pakai `console.log`. Kelihatan aman. |
| `02-proper-logging` | Logging yang bener (Slide 6–14) | pino + level + JSON + redact data sensitif + `requestId`. |
| `03-scale` | Pas di-scale kacau (Slide 15–17) | Dockerize, scale 3 container per service di belakang load balancer. Log kepisah-pisah. |
| `04-centralized` | Centralized logging (Slide 18–25) | Grafana Alloy ngumpulin stdout semua container → Loki → cari di Grafana. |

## Cara Pakai

```bash
# lihat semua branch
git branch -a

# mulai dari babak pertama
git checkout 01-console-log
cat README.md   # tiap branch punya README cara jalaninnya
```

## Prasyarat

- [Bun](https://bun.sh) >= 1.3
- [Podman](https://podman.io) + `podman-compose` (buat branch `03` & `04`)
  ```bash
  brew install podman podman-compose
  podman machine init && podman machine start
  ```

## Dua Service di Demo Ini

- **order-service** — terima `POST /checkout`, bikin `requestId`, panggil payment-service.
- **payment-service** — terima `POST /charge`, proses pembayaran (kadang gagal `CARD_DECLINED`).

Satu request `checkout` → order-service → payment-service. Inilah yang nanti
kita lacak ujung ke ujung pakai `requestId` di Grafana.
