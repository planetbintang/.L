import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addActivity,
  createFileRecord,
  createFolder,
  createShare,
  duplicateFile,
  duplicateFolder,
  ensureMenuFolders,
  getAccessibleFileById,
  getDashboardData,
  getFileById,
  getFolderById,
  getStorageUsedBytes,
  isFolderDescendant,
  moveFile,
  moveFolder,
  renameFile,
  renameFolder,
  removeShare,
  softDeleteFile,
  softDeleteFolder,
  toggleFavorite,
} from "./db";
import { storageCreateUploadUrl, storageGetSignedUrl } from "./storage";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 * 1024;
const categorySchema = z.enum(["document", "photo", "video", "movie", "other"]);

function categoryFromMime(mimeType: string, name: string) {
  const lowerName = name.toLowerCase();
  if (mimeType.startsWith("image/")) return "photo" as const;
  if (mimeType.startsWith("video/") && /(mkv|mov|avi|m4v)/.test(lowerName)) return "movie" as const;
  if (mimeType.startsWith("video/")) return "video" as const;
  if (mimeType.startsWith("text/") || /\.(pdf|docx?|xlsx?|pptx?|zip|rar|7z|js|ts|tsx|jsx|json|md|csv)$/i.test(lowerName)) return "document" as const;
  return "other" as const;
}

function safeFileName(name: string) {
  const safe = name.replace(/[\\/\0]/g, "-").replace(/\s+/g, " ").trim();
  return safe || "untitled-file";
}

function actorName(user: { name: string | null; email: string | null }) {
  return user.name || user.email || "PlanetBintang user";
}

function requireFolderId(folderId: number | null | undefined) {
  return folderId == null ? null : folderId;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    get: protectedProcedure
      .input(z.object({ parentId: z.number().nullable().optional(), search: z.string().trim().max(120).default("") }))
      .query(({ ctx, input }) => getDashboardData(ctx.user.id, ctx.user.email, input.parentId, input.search)),
    menu: protectedProcedure.query(({ ctx }) => ensureMenuFolders(ctx.user.id)),
  }),
  files: router({
    createFolder: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1).max(255), parentId: z.number().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const parentId = requireFolderId(input.parentId);
        if (parentId !== null && !(await getFolderById(ctx.user.id, parentId))) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Folder tujuan tidak ditemukan" });
        }
        const folder = await createFolder(ctx.user.id, input.name, parentId);
        await addActivity(ctx.user.id, actorName(ctx.user), "Membuat folder", input.name, undefined, folder?.id);
        return folder;
      }),
    renameFolder: protectedProcedure
      .input(z.object({ folderId: z.number().int(), name: z.string().trim().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        const current = await getFolderById(ctx.user.id, input.folderId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Folder tidak ditemukan" });
        if (current.kind !== "custom") throw new TRPCError({ code: "FORBIDDEN", message: "Folder menu inti tidak dapat diganti nama" });
        const folder = await renameFolder(ctx.user.id, input.folderId, input.name);
        await addActivity(ctx.user.id, actorName(ctx.user), "Mengganti nama folder", input.name, undefined, input.folderId);
        return folder;
      }),
    moveFolder: protectedProcedure
      .input(z.object({ folderId: z.number().int(), parentId: z.number().int().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const current = await getFolderById(ctx.user.id, input.folderId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Folder tidak ditemukan" });
        if (current.kind !== "custom") throw new TRPCError({ code: "FORBIDDEN", message: "Folder menu inti tidak dapat dipindahkan" });
        const target = requireFolderId(input.parentId);
        if (target === input.folderId) throw new TRPCError({ code: "BAD_REQUEST", message: "Folder tidak dapat dipindahkan ke dirinya sendiri" });
        if (target !== null && !(await getFolderById(ctx.user.id, target))) throw new TRPCError({ code: "NOT_FOUND", message: "Folder tujuan tidak ditemukan" });
        if (target !== null && await isFolderDescendant(ctx.user.id, input.folderId, target)) throw new TRPCError({ code: "BAD_REQUEST", message: "Folder tidak dapat dipindahkan ke dalam turunannya sendiri" });
        await moveFolder(ctx.user.id, input.folderId, target);
        await addActivity(ctx.user.id, actorName(ctx.user), "Memindahkan folder", current.name, undefined, input.folderId);
        return { success: true } as const;
      }),
    copyFolder: protectedProcedure
      .input(z.object({ folderId: z.number().int(), parentId: z.number().int().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const current = await getFolderById(ctx.user.id, input.folderId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Folder tidak ditemukan" });
        const target = requireFolderId(input.parentId);
        if (target !== null && !(await getFolderById(ctx.user.id, target))) throw new TRPCError({ code: "NOT_FOUND", message: "Folder tujuan tidak ditemukan" });
        const folder = await duplicateFolder(ctx.user.id, input.folderId, target);
        await addActivity(ctx.user.id, actorName(ctx.user), "Menyalin folder", current.name, undefined, folder?.id);
        return folder;
      }),
    deleteFolder: protectedProcedure
      .input(z.object({ folderId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const current = await getFolderById(ctx.user.id, input.folderId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Folder tidak ditemukan" });
        if (current.kind !== "custom") throw new TRPCError({ code: "FORBIDDEN", message: "Folder menu inti tidak dapat dihapus" });
        await softDeleteFolder(ctx.user.id, input.folderId);
        await addActivity(ctx.user.id, actorName(ctx.user), "Menghapus folder", current.name, undefined, input.folderId);
        return { success: true } as const;
      }),
    createUpload: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1).max(255), mimeType: z.string().trim().max(255).default("application/octet-stream"), sizeBytes: z.number().int().nonnegative().max(MAX_UPLOAD_BYTES), folderId: z.number().int().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const folderId = requireFolderId(input.folderId);
        if (folderId !== null && !(await getFolderById(ctx.user.id, folderId))) throw new TRPCError({ code: "NOT_FOUND", message: "Folder upload tidak ditemukan" });
        const usedBytes = await getStorageUsedBytes(ctx.user.id);
        if (usedBytes + input.sizeBytes > 500 * 1024 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Kuota storage 500 GB akan terlampaui" });
        const originalName = safeFileName(input.name);
        const target = await storageCreateUploadUrl(`planetbintang/users/${ctx.user.id}/${Date.now()}-${originalName}`, input.mimeType);
        return { ...target, originalName, category: categoryFromMime(input.mimeType, originalName), folderId };
      }),
    registerUpload: protectedProcedure
      .input(z.object({ storageKey: z.string().min(1).max(700), originalName: z.string().trim().min(1).max(255), stableUrl: z.string().url().or(z.string().startsWith("/manus-storage/")), mimeType: z.string().trim().max(255).default("application/octet-stream"), sizeBytes: z.number().int().nonnegative().max(MAX_UPLOAD_BYTES), folderId: z.number().int().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const prefix = `planetbintang/users/${ctx.user.id}/`;
        if (!input.storageKey.startsWith(prefix)) throw new TRPCError({ code: "FORBIDDEN", message: "Storage key tidak cocok dengan akun aktif" });
        const folderId = requireFolderId(input.folderId);
        if (folderId !== null && !(await getFolderById(ctx.user.id, folderId))) throw new TRPCError({ code: "NOT_FOUND", message: "Folder upload tidak ditemukan" });
        const stableUrl = `/manus-storage/${input.storageKey}`;
        const file = await createFileRecord({
          ownerId: ctx.user.id,
          folderId,
          originalName: safeFileName(input.originalName),
          storageKey: input.storageKey,
          stableUrl,
          mimeType: input.mimeType,
          category: categoryFromMime(input.mimeType, input.originalName),
          sizeBytes: input.sizeBytes,
        });
        await addActivity(ctx.user.id, actorName(ctx.user), "Mengunggah", input.originalName, file?.id, folderId ?? undefined);
        return file;
      }),
    renameFile: protectedProcedure
      .input(z.object({ fileId: z.number().int(), originalName: z.string().trim().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        const current = await getFileById(ctx.user.id, input.fileId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "File tidak ditemukan" });
        const file = await renameFile(ctx.user.id, input.fileId, safeFileName(input.originalName));
        await addActivity(ctx.user.id, actorName(ctx.user), "Mengganti nama file", input.originalName, input.fileId);
        return file;
      }),
    moveFile: protectedProcedure
      .input(z.object({ fileId: z.number().int(), folderId: z.number().int().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const current = await getFileById(ctx.user.id, input.fileId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "File tidak ditemukan" });
        const folderId = requireFolderId(input.folderId);
        if (folderId !== null && !(await getFolderById(ctx.user.id, folderId))) throw new TRPCError({ code: "NOT_FOUND", message: "Folder tujuan tidak ditemukan" });
        await moveFile(ctx.user.id, input.fileId, folderId);
        await addActivity(ctx.user.id, actorName(ctx.user), "Memindahkan file", current.originalName, input.fileId, folderId ?? undefined);
        return { success: true } as const;
      }),
    copyFile: protectedProcedure
      .input(z.object({ fileId: z.number().int(), folderId: z.number().int().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        const current = await getFileById(ctx.user.id, input.fileId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "File tidak ditemukan" });
        const folderId = requireFolderId(input.folderId);
        if (folderId !== null && !(await getFolderById(ctx.user.id, folderId))) throw new TRPCError({ code: "NOT_FOUND", message: "Folder tujuan tidak ditemukan" });
        const file = await duplicateFile(ctx.user.id, input.fileId, folderId);
        await addActivity(ctx.user.id, actorName(ctx.user), "Menyalin file", current.originalName, input.fileId, folderId ?? undefined);
        return file;
      }),
    deleteFile: protectedProcedure
      .input(z.object({ fileId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const current = await getFileById(ctx.user.id, input.fileId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "File tidak ditemukan" });
        await softDeleteFile(ctx.user.id, input.fileId);
        await addActivity(ctx.user.id, actorName(ctx.user), "Menghapus file", current.originalName, input.fileId);
        return { success: true } as const;
      }),
    toggleFavorite: protectedProcedure
      .input(z.object({ fileId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const current = await getFileById(ctx.user.id, input.fileId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "File tidak ditemukan" });
        return { isFavorite: await toggleFavorite(ctx.user.id, input.fileId) };
      }),
    download: protectedProcedure
      .input(z.object({ fileId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const accessible = await getAccessibleFileById(ctx.user.id, ctx.user.email, input.fileId);
        if (!accessible) throw new TRPCError({ code: "NOT_FOUND", message: "File tidak ditemukan atau tidak dibagikan ke akun ini" });
        return { url: await storageGetSignedUrl(accessible.file.storageKey), name: accessible.file.originalName };
      }),
  }),
  shares: router({
    create: protectedProcedure
      .input(z.object({ fileId: z.number().int().optional(), folderId: z.number().int().optional(), sharedWithEmail: z.string().trim().email(), permission: z.enum(["viewer", "editor"]).default("viewer") }))
      .mutation(async ({ ctx, input }) => {
        if (!input.fileId && !input.folderId) throw new TRPCError({ code: "BAD_REQUEST", message: "Pilih file atau folder yang akan dibagikan" });
        if (input.fileId && !(await getFileById(ctx.user.id, input.fileId))) throw new TRPCError({ code: "NOT_FOUND", message: "File tidak ditemukan" });
        if (input.folderId && !(await getFolderById(ctx.user.id, input.folderId))) throw new TRPCError({ code: "NOT_FOUND", message: "Folder tidak ditemukan" });
        await createShare(ctx.user.id, input);
        await addActivity(ctx.user.id, actorName(ctx.user), "Membagikan", input.sharedWithEmail, input.fileId, input.folderId);
        await ensureMenuFolders(ctx.user.id);
        return { success: true } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ shareId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await removeShare(ctx.user.id, input.shareId);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
