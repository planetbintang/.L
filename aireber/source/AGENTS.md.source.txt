# AGENTS.md — Reber AI / AlluniverS_OS

Architecture guide for AI agents working on this project.

## Project Overview

Reber AI is a dual-view AI management system: an AI Studio (chat) and a File Manager for a virtual 1.45M+ kata filesystem. It is deployed on Netlify using TanStack Start.

## Key Directories

```
src/
  lib/
    kata-data.ts      # Word lists, kata generators, open source refs, perpusnas ref
    reber-system.ts   # Reber AI system prompt, philosophy, tool definitions
    reber-hook.ts     # useReberAI() — React hook for chat
    virtual-fs.ts     # browseVirtualPath(), getVirtualFileContent(), VirtualNode type
  routes/
    __root.tsx        # Header nav (Studio | File Manager | Projects)
    index.tsx         # AI Studio — main Reber AI chat view
    manager.tsx       # File Manager — virtual filesystem browser + kata browser
    projects.tsx      # Projects — derivative system manager
    api.reber.ts      # POST /api/reber — AI streaming endpoint
    api.filesystem.ts # GET/POST /api/filesystem — virtual FS + DB CRUD
    api.projects.ts   # GET/POST /api/projects — project CRUD
  styles.css          # White-blue CSS design system (CSS variables: --reber-*)
db/
  schema.ts           # Drizzle schema: fsNodes, projects, chatSessions, kataCustom
  index.ts            # db client: drizzle({ schema })
drizzle.config.ts     # Points migrations to netlify/database/migrations/
netlify/database/migrations/  # Auto-applied by Netlify
```

## Architecture Decisions

### Virtual Filesystem
The 1.45M+ kata filesystem is **virtual** — not stored as physical folders. Content is generated algorithmically by `kata-data.ts` and `virtual-fs.ts`. The database (`kataCustom` table) only stores user-created/modified kata entries. This is scalable and avoids prohibitive storage costs.

### AlluniverS File Extensions
- `.ieje` — view/interface layer
- `.aeea` — style/aesthetic layer
- `.nz` — logic/function layer (min 15 lines)
- `.ck` — component knowledge
- `.regs` — registries
- `.log` — logs

### Dual Views
The app has two completely separate views accessible via the header nav:
1. **Studio** (`/`) — `index.tsx` — AI chat powered by `useReberAI()` → `/api/reber` → Claude
2. **Manager** (`/manager`) — `manager.tsx` — virtual filesystem browser + kata browser
3. **Projects** (`/projects`) — `projects.tsx` → `/api/projects` → PostgreSQL

### AI System Prompt
`REBER_SYSTEM_PROMPT` in `reber-system.ts` embeds:
- Full Reber philosophy
- AlluniverS_OS directory structure
- Kata category counts
- Perpusnas.go.id reference
- Open source references

### Database Tables
- `fs_nodes` — user-created virtual filesystem nodes (path-based, unique constraint)
- `projects` — derivative systems with `.allunivers.digital` domains
- `chatSessions` — (reserved) session persistence
- `kataCustom` — user-modified kata entries with .ieje/.aeea/.nz content

## Coding Conventions

- TypeScript strict mode via `tsconfig.json`
- CSS design tokens: always use `var(--reber-*)` variables from `styles.css`
- TanStack Start server routes: use `createFileRoute('/api/...')` with `server.handlers`
- Always import from `@/lib/...` (path alias to `src/lib/`)
- DB client: import `db` from `../../db/index.js` (note: `.js` extension required for ESM)
- Never run build commands; the CI pipeline handles builds

## Adding New Features

### New AI capability
Extend `REBER_SYSTEM_PROMPT` in `reber-system.ts`.

### New kata category
Add entry to `KATA_CATEGORIES` in `kata-data.ts` with `id`, `name`, `nameid`, `count`, and either `words[]` or `generator`.

### New filesystem path
Extend `browseVirtualPath()` and `getVirtualFileContent()` in `virtual-fs.ts` with an additional `if (path === ...)` block.

### New DB table
1. Add to `db/schema.ts`
2. Run `npx drizzle-kit generate`
3. Use in API routes via Drizzle ORM

### New page/view
Create `src/routes/[name].tsx` using `createFileRoute('/name')`. The router auto-discovers routes via TanStack Router's file-based routing.
