# SNAPS OS Migration Gate

Target: VMDESKTOPREIC / PlanetBintang OS on the reported vivo 1904 device.

Migration is blocked until every item is proven:
- Exact hardware variant and boot chain identified.
- Kernel, device tree, drivers, firmware, and vendor interfaces are available and licensed for use.
- A bootable image is built specifically for the device.
- Recovery and rollback have been tested.
- Core hardware tests pass, including modem, emergency calling, charging, thermal behavior, storage, display and touch.
- Data backup is verified and the user understands that OS replacement can erase data or brick the device.
- A separate, explicit confirmation is obtained for the exact image and exact operation.

Until then, SNAPS provides read-only diagnostics and development scaffolding only. Android remains untouched.
