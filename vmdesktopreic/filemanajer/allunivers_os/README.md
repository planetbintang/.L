# AlluniverS_OS / kata — Filemanajer Integration

Source of truth: `planetbintang/aireber`, branch `io`.

Source implementation:
- `src/lib/virtual-fs.ts` — virtual root, folder browsing, pagination, and six-file kata nodes.
- `src/lib/kata-data.ts` — category registry and generators.

Integrated file schema for every kata node:
- `index.ieje`
- `style.aeea`
- `fungsi.nz`
- `component.ck`
- `registry.regs`
- `activity.log`

The source filesystem is virtual and generated on demand. The 1.45M+ entries are indexed nodes, not 1.45 million physical Git directories. Filemanajer exposes the AlluniverS_OS / Kata category and preserves the source paths and schema. Pagination and on-demand generation are required to keep GitHub Pages and the desktop responsive.

Source reference: https://github.com/planetbintang/aireber/tree/io/src/lib
