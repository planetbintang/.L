# Planetbintang .L — Media Library

The media library supports importing large image, video/film, audio, PDF, office-document, subtitle and text files into browser-local IndexedDB, plus registering external HTTPS media URLs.

## Storage model
- Local uploads are stored as Blob records in IndexedDB on the current browser/device.
- Playback and previews use browser-native Blob URLs. Videos can use native seeking/playback when the browser supports the media codec.
- External URL entries store only the URL and metadata; the actual content remains on the source server.
- Quota is browser/device-dependent. The UI checks StorageManager estimates before each upload and reports usage. No fixed file-size limit is imposed by this app, but the browser may reject files larger than available quota.
- Local assets do not automatically sync to GitHub or other devices. Export/download individual assets before clearing browser storage.

## Supported preview
Images, browser-supported video/audio, PDFs, and text files up to 2 MiB can be previewed. Office formats and unsupported codecs can be downloaded and opened in a compatible app. For large video collections, use MP4/H.264 or WebM for broad browser compatibility.

## Privacy and safety
The library is local-first. External URLs must use HTTPS. Files are not executed as code. SVG and office documents are not rendered as active HTML; unsupported formats are downloaded instead.
