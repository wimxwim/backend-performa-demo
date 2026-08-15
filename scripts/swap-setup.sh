#!/usr/bin/env bash
# swap-setup.sh — Setup swap 8G untuk bulk load 5M (Ryzen 13GB RAM / 49GB NVMe)
# Idempotent: aman dijalankan ulang. Butuh sudo untuk mkswap/swapon/fstab/sysctl.
# Usage: sudo bash scripts/swap-setup.sh
set -euo pipefail

SWAPFILE="/swapfile"
SIZE_GB=8
SIZE_MB=8192

echo "=== swap-setup 8G — Ryzen 13GB NVMe ==="

# 1. Cek swap aktif
echo "[1/6] Cek swap aktif..."
swapon --show || true
free -h || true

if swapon --show | grep -q "$SWAPFILE"; then
  echo "  -> $SWAPFILE sudah aktif, skip create."
else
  # 2. Buat /swapfile 8G
  echo "[2/6] Buat $SWAPFILE ${SIZE_GB}G..."
  if [ -f "$SWAPFILE" ]; then
    echo "  -> $SWAPFILE sudah ada ($(du -h $SWAPFILE | cut -f1)), hapus dulu jika ukuran salah."
    # jika ukuran bukan 8G, recreate
    ACTUAL_MB=$(du -m "$SWAPFILE" | cut -f1)
    if [ "$ACTUAL_MB" -ne "$SIZE_MB" ]; then
      echo "  -> ukuran $ACTUAL_MB MB != $SIZE_MB MB, recreate..."
      swapoff "$SWAPFILE" 2>/dev/null || true
      rm -f "$SWAPFILE"
      fallocate -l ${SIZE_GB}G "$SWAPFILE" 2>/dev/null || dd if=/dev/zero of="$SWAPFILE" bs=1M count=$SIZE_MB status=progress
    fi
  else
    fallocate -l ${SIZE_GB}G "$SWAPFILE" 2>/dev/null || dd if=/dev/zero of="$SWAPFILE" bs=1M count=$SIZE_MB status=progress
  fi

  # 3. Permission + mkswap + swapon
  echo "[3/6] chmod 600 + mkswap + swapon..."
  chmod 600 "$SWAPFILE"
  mkswap "$SWAPFILE"
  swapon "$SWAPFILE"
fi

# 4. Persist di /etc/fstab (idempotent)
echo "[4/6] Persist ke /etc/fstab..."
if grep -qF "$SWAPFILE" /etc/fstab 2>/dev/null; then
  echo "  -> sudah ada di /etc/fstab, skip."
else
  echo "$SWAPFILE none swap sw 0 0" | tee -a /etc/fstab
fi

# 5. Sysctl tuning untuk bulk load
echo "[5/6] sysctl tuning..."
sysctl -w vm.swappiness=10
sysctl -w vm.vfs_cache_pressure=50
sysctl -w vm.dirty_background_bytes=536870912
sysctl -w vm.dirty_bytes=2147483648

# Persist sysctl (idempotent)
SYSCTL_CONF="/etc/sysctl.d/99-gotongroyong-swap.conf"
cat > "$SYSCTL_CONF" <<'SYSCTL'
vm.swappiness=10
vm.vfs_cache_pressure=50
vm.dirty_background_bytes=536870912
vm.dirty_bytes=2147483648
SYSCTL
echo "  -> sysctl persist di $SYSCTL_CONF"

# 6. Verifikasi
echo "[6/6] Verifikasi..."
echo "--- free -h ---"
free -h
echo "--- swapon --show ---"
swapon --show
echo "--- sysctl ---"
sysctl vm.swappiness vm.vfs_cache_pressure vm.dirty_background_bytes vm.dirty_bytes || true
echo "--- /proc/sys/vm/swappiness ---"
cat /proc/sys/vm/swappiness || true
echo "--- /proc/sys/vm/dirty_bytes ---"
cat /proc/sys/vm/dirty_bytes || true

echo "=== swap-setup selesai — 8G aktif, swappiness 10, dirty_bytes 2GB ==="
echo "Cek: free -h && swapon --show && cat /proc/sys/vm/swappiness"
