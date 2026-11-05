# SNAPS Boot Integration

Status: specification only; no flashable boot image is included.

Before creating a boot image for vivo 1904, verify the exact product/codename, bootloader generation, boot image header/version, partition layout, AVB/vbmeta chain, slot scheme, and recovery route from device-specific sources.

Required deliverables:
- Device-matched boot image format and build recipe.
- Device tree / DTBO compatibility evidence.
- Verified kernel + ramdisk integration.
- Signature/AVB handling consistent with the device's supported boot chain.
- Tested recovery and rollback procedure.

No generic boot image or generic fastboot command is safe for this device. Do not unlock, flash, erase, or change partitions at this stage.
