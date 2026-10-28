# Desktop OS Menu Filesystem

The desktop menu catalog is now represented by real website files, grouped under 12 existing system/submenu families.

- 15,000 menu folders: `system-menus/<category-slug>/menu-00001/index.html` (global five-digit ID).
- Exactly one HTML file per menu folder (within the requested 1–9 file limit).
- Twelve category landing pages each provide search and paginated submenu links.
- The main navigation links to the Menu OS Center; the catalog detail opens the corresponding real static menu file.
- The filesystem manifest is `data/desktop-os-menu-filesystem.json`.

Each page displays presentation, system function, integration family, data scope, autosave status, and activity mode. Browser state is local to the device. The website is static; it does not activate native OS processes, DNS changes, or backend services by listing a menu.
