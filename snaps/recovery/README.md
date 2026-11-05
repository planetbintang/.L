# SNAPS Recovery & Backup

Status: recovery plan only; no recovery image is available.

Release gate:
- Identify all relevant partitions from verified device documentation and read-only inspection.
- Establish a complete, verified backup path and test restoration.
- Preserve original boot, vendor, vbmeta, recovery, and partition metadata as appropriate for the exact device.
- Document a device-specific unbrick path and required host tools.
- Confirm power, cable, storage capacity, and battery requirements.
- Require explicit user confirmation immediately before any future destructive operation.

Never treat a copied file or an unverified backup as a recovery plan. This directory currently contains no destructive command.
