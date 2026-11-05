#!/usr/bin/env bash
# SNAPS read-only compatibility probe for the reported vivo 1904 target.
# Runs on a Linux/macOS host with Android Platform Tools (adb).
# It NEVER unlocks, roots, flashes, erases, formats, or changes the phone.
set -euo pipefail

if ! command -v adb >/dev/null 2>&1; then
  echo "ERROR: adb tidak ditemukan. Pasang Android Platform Tools terlebih dahulu." >&2
  exit 2
fi

DEVICE_LIST="$(adb devices | awk 'NR>1 && $2=="device" {print $1}')"
DEVICE_COUNT="$(printf '%s\n' "$DEVICE_LIST" | awk 'NF {n++} END {print n+0}')"
if [[ "$DEVICE_COUNT" -ne 1 ]]; then
  echo "ERROR: Hubungkan tepat satu perangkat dengan status ADB 'device'." >&2
  echo "Perangkat yang terdeteksi: $DEVICE_COUNT" >&2
  exit 3
fi
DEVICE="$(printf '%s\n' "$DEVICE_LIST" | awk 'NF {print; exit}')"

getprop() { adb -s "$DEVICE" shell getprop "$1" 2>/dev/null | tr -d '\r'; }
MODEL="$(getprop ro.product.model)"
MANUFACTURER="$(getprop ro.product.manufacturer)"
DEVICE_NAME="$(getprop ro.product.device)"
PRODUCT="$(getprop ro.product.name)"
HARDWARE="$(getprop ro.hardware)"
PLATFORM="$(getprop ro.board.platform)"
ABI="$(getprop ro.product.cpu.abi)"
ABI2="$(getprop ro.product.cpu.abi2)"
BOOTLOADER="$(getprop ro.bootloader)"
LOCKED="$(getprop ro.boot.flash.locked)"
VERIFIED="$(getprop ro.boot.verifiedbootstate)"
SLOT="$(getprop ro.boot.slot_suffix)"
KERNEL="$(adb -s "$DEVICE" shell uname -a 2>/dev/null | tr -d '\r')"
MEMORY="$(adb -s "$DEVICE" shell cat /proc/meminfo 2>/dev/null | head -n 5 | tr -d '\r')"
STORAGE="$(adb -s "$DEVICE" shell df -h /data 2>/dev/null | tr -d '\r')"
PARTITIONS="$(adb -s "$DEVICE" shell 'ls -1 /dev/block/by-name 2>/dev/null || ls -1 /dev/block/bootdevice/by-name 2>/dev/null || true' | tr -d '\r')"
ANDROID="$(adb -s "$DEVICE" shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')"
SDK="$(getprop ro.build.version.sdk)"
SECURITY_PATCH="$(getprop ro.build.version.security_patch)"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT="snaps-vivo-1904-report-${STAMP}.txt"
{
  echo "PLANETBINTANG SNAPS — DEVICE COMPATIBILITY REPORT"
  echo "Generated UTC: $STAMP"
  echo "Probe mode: READ-ONLY; no device writes performed"
  echo
  echo "[IDENTITY]"
  printf 'Manufacturer: %s\nModel: %s\nDevice codename: %s\nProduct: %s\n' "$MANUFACTURER" "$MODEL" "$DEVICE_NAME" "$PRODUCT"
  echo
  echo "[PLATFORM]"
  printf 'Hardware: %s\nBoard platform: %s\nPrimary ABI: %s\nSecondary ABI: %s\n' "$HARDWARE" "$PLATFORM" "$ABI" "$ABI2"
  echo
  echo "[ANDROID]"
  printf 'Android release: %s\nSDK: %s\nSecurity patch: %s\n' "$ANDROID" "$SDK" "$SECURITY_PATCH"
  echo
  echo "[BOOT]"
  printf 'Bootloader: %s\nBoot locked property: %s\nVerified boot state: %s\nSlot suffix: %s\n' "$BOOTLOADER" "$LOCKED" "$VERIFIED" "$SLOT"
  echo
  echo "[KERNEL]"
  echo "$KERNEL"
  echo
  echo "[MEMORY]"
  echo "$MEMORY"
  echo
  echo "[DATA STORAGE]"
  echo "$STORAGE"
  echo
  echo "[PARTITION LABELS — NAMES ONLY]"
  echo "$PARTITIONS"
  echo
  echo "[SAFETY]"
  echo "No root, unlock, flash, erase, format, repartition, or boot command was issued."
  echo "This report alone does not establish compatibility or readiness to replace Android."
} | tee "$REPORT"

if [[ "$MODEL $DEVICE_NAME $PRODUCT" =~ (1904|vivo1904|PD19) ]]; then
  echo
  echo "TARGET CHECK: model identifiers contain a possible vivo 1904 match; manual confirmation is still required."
else
  echo
  echo "TARGET CHECK: model identifiers do not clearly match vivo 1904. Stop and verify the exact variant."
fi

echo "Laporan disimpan di komputer host: $REPORT"
