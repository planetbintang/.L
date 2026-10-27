# Browser and HTTP/HTTPS compatibility

- Public production site should use HTTPS; redirect HTTP to HTTPS at the hosting layer.
- Use UTF-8, semantic HTML, viewport metadata, responsive CSS, accessible focus states, and graceful JavaScript fallbacks.
- Test Chrome, Firefox, Safari, Edge, Android browsers, and iOS browsers at mobile and desktop widths.
- Test keyboard navigation, zoom, slow connections, and asset paths. The GitHub Pages project path is `/.L/`; a custom domain serves the repository site at `/`.
- Third-party websites may block iframe embedding. Always provide a direct open-in-new-tab action for Google and ChatGPT.
- A configuration file alone cannot guarantee compatibility with every browser or device; test the deployed site.
