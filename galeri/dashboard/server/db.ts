import { and, asc, desc, eq, inArray, isNull, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  fileActivities,
  fileFolders,
  fileShares,
  InsertUser,
  storedFiles,
  User,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  } else {
    values.lastSignedIn = new Date();
    updateSet.lastSignedIn = values.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const MENU_FOLDERS = [
  { name: "All Files", kind: "all-files" as const },
  { name: "Photos", kind: "photos" as const },
  { name: "Videos", kind: "videos" as const },
  { name: "Movies", kind: "movies" as const },
  { name: "Shared", kind: "shared" as const },
  { name: "Favorites", kind: "favorites" as const },
  { name: "Documents", kind: "documents" as const },
];

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

export async function ensureMenuFolders(ownerId: number) {
  const db = await requireDb();
  const result = [];
  for (const menu of MENU_FOLDERS) {
    const existing = await db
      .select()
      .from(fileFolders)
      .where(and(eq(fileFolders.ownerId, ownerId), isNull(fileFolders.parentId), eq(fileFolders.kind, menu.kind)))
      .limit(1);
    if (existing[0]) {
      result.push(existing[0]);
      continue;
    }
    await db.insert(fileFolders).values({ ownerId, parentId: null, name: menu.name, kind: menu.kind });
    const inserted = await db
      .select()
      .from(fileFolders)
      .where(and(eq(fileFolders.ownerId, ownerId), isNull(fileFolders.parentId), eq(fileFolders.kind, menu.kind)))
      .limit(1);
    if (inserted[0]) result.push(inserted[0]);
  }
  return result;
}

function activeFileWhere(ownerId: number) {
  return and(eq(storedFiles.ownerId, ownerId), eq(storedFiles.status, "active"));
}

function parentWhere(ownerId: number, parentId?: number | null) {
  return parentId == null
    ? and(eq(fileFolders.ownerId, ownerId), isNull(fileFolders.parentId))
    : and(eq(fileFolders.ownerId, ownerId), eq(fileFolders.parentId, parentId));
}

export async function getDashboardData(ownerId: number, ownerEmail: string | null, parentId?: number | null, search = "") {
  const db = await requireDb();
  const menuFolders = await ensureMenuFolders(ownerId);
  const currentFolder = parentId == null ? undefined : await getFolderById(ownerId, parentId);
  const currentKind = currentFolder?.kind;
  const searchLike = search ? `%${search}%` : undefined;

  let folders: Array<typeof fileFolders.$inferSelect> = [];
  if (parentId == null) {
    folders = await db.select().from(fileFolders).where(searchLike ? and(parentWhere(ownerId, null), like(fileFolders.name, searchLike)) : parentWhere(ownerId, null)).orderBy(asc(fileFolders.name)).limit(100);
  } else if (currentKind === "all-files") {
    folders = await db.select().from(fileFolders).where(searchLike ? and(eq(fileFolders.ownerId, ownerId), isNull(fileFolders.parentId), eq(fileFolders.kind, "custom"), like(fileFolders.name, searchLike)) : and(eq(fileFolders.ownerId, ownerId), isNull(fileFolders.parentId), eq(fileFolders.kind, "custom"))).orderBy(asc(fileFolders.name)).limit(100);
  } else if (currentKind === "custom") {
    folders = await db.select().from(fileFolders).where(searchLike ? and(parentWhere(ownerId, parentId), like(fileFolders.name, searchLike)) : parentWhere(ownerId, parentId)).orderBy(asc(fileFolders.name)).limit(100);
  }

  const sharedRows = await db
    .select({ share: fileShares, file: storedFiles, folder: fileFolders })
    .from(fileShares)
    .leftJoin(storedFiles, eq(fileShares.fileId, storedFiles.id))
    .leftJoin(fileFolders, eq(fileShares.folderId, fileFolders.id))
    .where(ownerEmail ? or(eq(fileShares.ownerId, ownerId), eq(fileShares.sharedWithEmail, ownerEmail)) : eq(fileShares.ownerId, ownerId))
    .orderBy(desc(fileShares.createdAt))
    .limit(100);
  const sharedFiles = sharedRows.flatMap(row => row.file && row.file.status === "active" ? [row.file] : []);

  let files;
  if (currentKind === "shared") {
    files = sharedFiles.filter(file => !search || file.originalName.toLowerCase().includes(search.toLowerCase())).slice(0, 100);
  } else {
    let scope = activeFileWhere(ownerId);
    if (parentId == null) scope = and(scope, isNull(storedFiles.folderId));
    else if (currentKind === "custom") scope = and(scope, eq(storedFiles.folderId, parentId));
    else if (currentKind === "photos") scope = and(scope, eq(storedFiles.category, "photo"));
    else if (currentKind === "videos") scope = and(scope, eq(storedFiles.category, "video"));
    else if (currentKind === "movies") scope = and(scope, eq(storedFiles.category, "movie"));
    else if (currentKind === "documents") scope = and(scope, eq(storedFiles.category, "document"));
    else if (currentKind === "favorites") scope = and(scope, eq(storedFiles.isFavorite, true));
    files = await db.select().from(storedFiles).where(searchLike ? and(scope, like(storedFiles.originalName, searchLike)) : scope).orderBy(desc(storedFiles.updatedAt)).limit(100);
  }

  const recentFiles = await db.select().from(storedFiles).where(activeFileWhere(ownerId)).orderBy(desc(storedFiles.updatedAt)).limit(6);
  const recentFolders = await db.select().from(fileFolders).where(eq(fileFolders.ownerId, ownerId)).orderBy(desc(fileFolders.updatedAt)).limit(6);
  const shares = sharedRows.slice(0, 5);
  const activities = await db.select().from(fileActivities).where(eq(fileActivities.ownerId, ownerId)).orderBy(desc(fileActivities.createdAt)).limit(5);

  const totals = await db.select({ bytes: sql<number>`coalesce(sum(${storedFiles.sizeBytes}), 0)`, count: sql<number>`count(*)` }).from(storedFiles).where(activeFileWhere(ownerId));
  const categories = await db.select({ category: storedFiles.category, bytes: sql<number>`coalesce(sum(${storedFiles.sizeBytes}), 0)` }).from(storedFiles).where(activeFileWhere(ownerId)).groupBy(storedFiles.category);
  const folderCount = await db.select({ count: sql<number>`count(*)` }).from(fileFolders).where(eq(fileFolders.ownerId, ownerId));

  return {
    menuFolders,
    currentFolder,
    folders,
    files,
    recentFiles,
    recentFolders,
    shares,
    activities,
    stats: {
      usedBytes: Number(totals[0]?.bytes ?? 0),
      fileCount: Number(totals[0]?.count ?? 0),
      folderCount: Number(folderCount[0]?.count ?? 0),
      categories: categories.map(item => ({ category: item.category, bytes: Number(item.bytes ?? 0) })),
    },
  };
}

export async function createFolder(ownerId: number, name: string, parentId?: number | null) {
  const db = await requireDb();
  const [created] = await db.insert(fileFolders).values({ ownerId, name, parentId: parentId ?? null, kind: "custom" }).$returningId();
  return db.select().from(fileFolders).where(eq(fileFolders.id, created.id)).limit(1).then(rows => rows[0]);
}

export async function renameFolder(ownerId: number, folderId: number, name: string) {
  const db = await requireDb();
  await db.update(fileFolders).set({ name, updatedAt: new Date() }).where(and(eq(fileFolders.id, folderId), eq(fileFolders.ownerId, ownerId)));
  return db.select().from(fileFolders).where(and(eq(fileFolders.id, folderId), eq(fileFolders.ownerId, ownerId))).limit(1).then(rows => rows[0]);
}

export async function moveFolder(ownerId: number, folderId: number, parentId?: number | null) {
  const db = await requireDb();
  await db.update(fileFolders).set({ parentId: parentId ?? null, updatedAt: new Date() }).where(and(eq(fileFolders.id, folderId), eq(fileFolders.ownerId, ownerId)));
}

export async function createFileRecord(input: {
  ownerId: number;
  folderId?: number | null;
  originalName: string;
  storageKey: string;
  stableUrl: string;
  mimeType: string;
  category: "document" | "photo" | "video" | "movie" | "other";
  sizeBytes: number;
}) {
  const db = await requireDb();
  const [created] = await db.insert(storedFiles).values({ ...input, folderId: input.folderId ?? null }).$returningId();
  return db.select().from(storedFiles).where(eq(storedFiles.id, created.id)).limit(1).then(rows => rows[0]);
}

export async function renameFile(ownerId: number, fileId: number, originalName: string) {
  const db = await requireDb();
  await db.update(storedFiles).set({ originalName, updatedAt: new Date() }).where(and(eq(storedFiles.id, fileId), eq(storedFiles.ownerId, ownerId), eq(storedFiles.status, "active")));
  return db.select().from(storedFiles).where(and(eq(storedFiles.id, fileId), eq(storedFiles.ownerId, ownerId))).limit(1).then(rows => rows[0]);
}

export async function moveFile(ownerId: number, fileId: number, folderId?: number | null) {
  const db = await requireDb();
  await db.update(storedFiles).set({ folderId: folderId ?? null, updatedAt: new Date() }).where(and(eq(storedFiles.id, fileId), eq(storedFiles.ownerId, ownerId), eq(storedFiles.status, "active")));
}

export async function duplicateFile(ownerId: number, fileId: number, folderId?: number | null) {
  const db = await requireDb();
  const source = await db.select().from(storedFiles).where(and(eq(storedFiles.id, fileId), eq(storedFiles.ownerId, ownerId), eq(storedFiles.status, "active"))).limit(1);
  if (!source[0]) return undefined;
  const [created] = await db.insert(storedFiles).values({
    ownerId,
    folderId: folderId === undefined ? source[0].folderId : folderId,
    originalName: `Copy of ${source[0].originalName}`,
    // A copy is a metadata hard-link to the same durable object. The bytes are not duplicated.
    storageKey: source[0].storageKey,
    stableUrl: source[0].stableUrl,
    mimeType: source[0].mimeType,
    category: source[0].category,
    sizeBytes: source[0].sizeBytes,
    isFavorite: false,
    status: "active",
  }).$returningId();
  return db.select().from(storedFiles).where(eq(storedFiles.id, created.id)).limit(1).then(rows => rows[0]);
}

export async function duplicateFolder(ownerId: number, folderId: number, parentId?: number | null) {
  const db = await requireDb();
  const source = await getFolderById(ownerId, folderId);
  if (!source) return undefined;
  const targetParent = parentId === undefined ? source.parentId : parentId;
  const [rootId] = await db.insert(fileFolders).values({
    ownerId,
    parentId: targetParent ?? null,
    name: `Copy of ${source.name}`,
    kind: "custom",
  }).$returningId();

  const folderMap = new Map<number, number>([[source.id, rootId.id]]);
  let frontier = [source.id];
  while (frontier.length) {
    const children = await db
      .select()
      .from(fileFolders)
      .where(and(eq(fileFolders.ownerId, ownerId), inArray(fileFolders.parentId, frontier)));
    const next: number[] = [];
    for (const child of children) {
      const copiedParent = folderMap.get(child.parentId ?? -1);
      if (!copiedParent) continue;
      const [copiedId] = await db.insert(fileFolders).values({ ownerId, parentId: copiedParent, name: child.name, kind: "custom" }).$returningId();
      folderMap.set(child.id, copiedId.id);
      next.push(child.id);
    }
    frontier = next;
  }

  const sourceFiles = await db
    .select()
    .from(storedFiles)
    .where(and(eq(storedFiles.ownerId, ownerId), eq(storedFiles.status, "active"), inArray(storedFiles.folderId, Array.from(folderMap.keys()))));
  for (const file of sourceFiles) {
    await db.insert(storedFiles).values({
      ownerId,
      folderId: file.folderId == null ? rootId.id : folderMap.get(file.folderId) ?? rootId.id,
      originalName: `Copy of ${file.originalName}`,
      storageKey: file.storageKey,
      stableUrl: file.stableUrl,
      mimeType: file.mimeType,
      category: file.category,
      sizeBytes: file.sizeBytes,
      isFavorite: false,
      status: "active",
    });
  }
  return db.select().from(fileFolders).where(eq(fileFolders.id, rootId.id)).limit(1).then(rows => rows[0]);
}

async function collectFolderIds(ownerId: number, rootId: number) {
  const db = await requireDb();
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length) {
    const children = await db.select({ id: fileFolders.id }).from(fileFolders).where(and(eq(fileFolders.ownerId, ownerId), inArray(fileFolders.parentId, frontier)));
    frontier = children.map(child => child.id).filter(id => !ids.includes(id));
    ids.push(...frontier);
  }
  return ids;
}

export async function softDeleteFolder(ownerId: number, folderId: number) {
  const db = await requireDb();
  const ids = await collectFolderIds(ownerId, folderId);
  await db.update(fileFolders).set({ updatedAt: new Date() }).where(and(eq(fileFolders.ownerId, ownerId), inArray(fileFolders.id, ids)));
  await db.update(storedFiles).set({ status: "deleted", updatedAt: new Date() }).where(and(eq(storedFiles.ownerId, ownerId), inArray(storedFiles.folderId, ids), eq(storedFiles.status, "active")));
  await db.delete(fileFolders).where(and(eq(fileFolders.ownerId, ownerId), inArray(fileFolders.id, ids)));
}

export async function softDeleteFile(ownerId: number, fileId: number) {
  const db = await requireDb();
  await db.update(storedFiles).set({ status: "deleted", updatedAt: new Date() }).where(and(eq(storedFiles.id, fileId), eq(storedFiles.ownerId, ownerId), eq(storedFiles.status, "active")));
}

export async function toggleFavorite(ownerId: number, fileId: number) {
  const db = await requireDb();
  const existing = await db.select({ isFavorite: storedFiles.isFavorite }).from(storedFiles).where(and(eq(storedFiles.id, fileId), eq(storedFiles.ownerId, ownerId), eq(storedFiles.status, "active"))).limit(1);
  if (!existing[0]) return undefined;
  await db.update(storedFiles).set({ isFavorite: !existing[0].isFavorite, updatedAt: new Date() }).where(and(eq(storedFiles.id, fileId), eq(storedFiles.ownerId, ownerId)));
  return !existing[0].isFavorite;
}

export async function getFolderById(ownerId: number, folderId: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(fileFolders)
    .where(and(eq(fileFolders.id, folderId), eq(fileFolders.ownerId, ownerId)))
    .limit(1);
  return rows[0];
}

export async function getFileById(ownerId: number, fileId: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(storedFiles)
    .where(and(eq(storedFiles.id, fileId), eq(storedFiles.ownerId, ownerId), eq(storedFiles.status, "active")))
    .limit(1);
  return rows[0];
}

export async function getAccessibleFileById(ownerId: number, ownerEmail: string | null, fileId: number) {
  const own = await getFileById(ownerId, fileId);
  if (own) return { file: own, permission: "owner" as const };
  if (!ownerEmail) return undefined;
  const db = await requireDb();
  const rows = await db
    .select({ file: storedFiles, share: fileShares })
    .from(fileShares)
    .innerJoin(storedFiles, eq(fileShares.fileId, storedFiles.id))
    .where(and(eq(fileShares.fileId, fileId), eq(fileShares.sharedWithEmail, ownerEmail), eq(storedFiles.status, "active")))
    .limit(1);
  return rows[0] ? { file: rows[0].file, permission: rows[0].share.permission } : undefined;
}

export async function getStorageUsedBytes(ownerId: number) {
  const db = await requireDb();
  const rows = await db
    .select({ bytes: sql<number>`coalesce(sum(${storedFiles.sizeBytes}), 0)` })
    .from(storedFiles)
    .where(activeFileWhere(ownerId));
  return Number(rows[0]?.bytes ?? 0);
}

export async function isFolderDescendant(ownerId: number, folderId: number, candidateParentId: number) {
  const db = await requireDb();
  let cursor: number | null = candidateParentId;
  const seen = new Set<number>();
  while (cursor !== null && !seen.has(cursor)) {
    if (cursor === folderId) return true;
    seen.add(cursor);
    const rows = await db
      .select({ parentId: fileFolders.parentId })
      .from(fileFolders)
      .where(and(eq(fileFolders.id, cursor), eq(fileFolders.ownerId, ownerId)))
      .limit(1);
    cursor = rows[0]?.parentId ?? null;
  }
  return false;
}

export async function createShare(
  ownerId: number,
  input: { fileId?: number; folderId?: number; sharedWithEmail: string; permission: "viewer" | "editor" },
) {
  const db = await requireDb();
  await db.insert(fileShares).values({
    ownerId,
    fileId: input.fileId ?? null,
    folderId: input.folderId ?? null,
    sharedWithEmail: input.sharedWithEmail,
    permission: input.permission,
  });
}

export async function removeShare(ownerId: number, shareId: number) {
  const db = await requireDb();
  await db.delete(fileShares).where(and(eq(fileShares.id, shareId), eq(fileShares.ownerId, ownerId)));
}

export async function addActivity(ownerId: number, actorName: string, action: string, targetName: string, fileId?: number, folderId?: number) {
  const db = await requireDb();
  await db.insert(fileActivities).values({ ownerId, actorName, action, targetName, fileId: fileId ?? null, folderId: folderId ?? null });
}
