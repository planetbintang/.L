import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomBytes, timingSafeEqual, pbkdf2 } from "node:crypto";
import { promisify } from "node:util";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  reicKamusAudit,
  reicKamusRecords,
  reicKamusSessions,
  reicKamusSettings,
  reicKamusUsers,
} from "../../db/schema.js";

const deriveKey = promisify(pbkdf2);
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const allowedOrigins = () => new Set(
  (process.env.REIC_ALLOWED_ORIGINS || "https://planetbintang.github.io")
    .split(",").map((value) => value.trim()).filter(Boolean),
);
const cors = (request: Request, response: Response) => {
  const origin = request.headers.get("origin") || "";
  if (allowedOrigins().has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.append("Vary", "Origin");
  }
  return response;
};
const json = (request: Request, body: unknown, init?: ResponseInit) => cors(request, Response.json(body, init));
const fail = (request: Request, message: string, status: number) => json(request, { ok: false, error: message }, { status });
const clean = (value: unknown, max = 120) => String(value ?? "").trim().slice(0, max);
async function hashPassword(password: string, salt: string) {
  const key = await deriveKey(password, salt, 210000, 64, "sha512") as Buffer;
  return key.toString("hex");
}
function safeEqual(leftValue: string, rightValue: string) {
  const left = Buffer.from(leftValue, "hex"), right = Buffer.from(rightValue, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
function bearer(request: Request) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}
async function currentUser(request: Request) {
  const token = bearer(request);
  if (!token) return null;
  const [session] = await db.select().from(reicKamusSessions).where(and(
    eq(reicKamusSessions.tokenHash, digest(token)),
    isNull(reicKamusSessions.revokedAt),
    gt(reicKamusSessions.expiresAt, new Date()),
  )).limit(1);
  if (!session) return null;
  const [user] = await db.select().from(reicKamusUsers).where(eq(reicKamusUsers.id, session.userId)).limit(1);
  if (!user || user.status !== "active") return null;
  return { user, session };
}
async function audit(userId: number, action: string, detail: unknown = {}) {
  await db.insert(reicKamusAudit).values({ userId, action, detail });
}
async function issueSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(reicKamusSessions).values({
    userId, tokenHash: digest(token), expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}
const publicUser = (user: typeof reicKamusUsers.$inferSelect) => ({
  id: user.id, email: user.email, name: user.displayName, role: user.role,
  createdAt: user.createdAt, lastLoginAt: user.lastLoginAt,
});

export const Route = createFileRoute("/api/kamus")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => cors(request, new Response(null, { status: 204 })),
      GET: async ({ request }) => {
        const action = new URL(request.url).searchParams.get("action") || "me";
        if (action === "health") return json(request, { ok: true, service: "REIC Kamus Tables", storage: "netlify-postgres", version: "1.0" });
        const auth = await currentUser(request);
        if (!auth) return fail(request, "Sesi Kamus Digital tidak valid atau telah berakhir.", 401);
        if (action === "me") return json(request, { ok: true, user: publicUser(auth.user) });
        if (action === "collections" || action === "files" || action === "history") {
          const kind = action === "collections" ? "collection" : action === "files" ? "file" : "history";
          const rows = await db.select().from(reicKamusRecords)
            .where(and(eq(reicKamusRecords.userId, auth.user.id), eq(reicKamusRecords.kind, kind)))
            .orderBy(desc(reicKamusRecords.updatedAt)).limit(500);
          return json(request, { ok: true, records: rows });
        }
        if (action === "settings") {
          const [row] = await db.select().from(reicKamusSettings).where(eq(reicKamusSettings.userId, auth.user.id)).limit(1);
          return json(request, { ok: true, settings: row?.settings || {} });
        }
        if (action === "audit") {
          const rows = await db.select().from(reicKamusAudit).where(eq(reicKamusAudit.userId, auth.user.id))
            .orderBy(desc(reicKamusAudit.createdAt)).limit(100);
          return json(request, { ok: true, audit: rows });
        }
        return fail(request, "Aksi Kamus Digital tidak dikenal.", 400);
      },
      POST: async ({ request }) => {
        const origin = request.headers.get("origin") || "";
        if (origin && !allowedOrigins().has(origin)) return fail(request, "Origin tidak diizinkan.", 403);
        let body: Record<string, unknown>;
        try { body = await request.json() as Record<string, unknown>; }
        catch { return fail(request, "Body JSON tidak valid.", 400); }
        const action = clean(body.action, 40);

        if (action === "register") {
          const email = clean(body.email, 254).toLowerCase();
          const name = clean(body.name, 80);
          const password = String(body.password || "");
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(request, "Alamat email tidak valid.", 400);
          if (!name) return fail(request, "Nama pengguna wajib diisi.", 400);
          if (password.length < 10 || password.length > 128) return fail(request, "Kata sandi harus 10–128 karakter.", 400);
          const [existing] = await db.select({ id: reicKamusUsers.id }).from(reicKamusUsers).where(eq(reicKamusUsers.email, email)).limit(1);
          if (existing) return fail(request, "Email sudah terdaftar.", 409);
          const salt = randomBytes(16).toString("hex");
          const passwordHash = await hashPassword(password, salt);
          const [user] = await db.insert(reicKamusUsers).values({ email, displayName: name, passwordHash, passwordSalt: salt }).returning();
          const token = await issueSession(user.id);
          await audit(user.id, "REGISTER");
          return json(request, { ok: true, user: publicUser(user), token, expiresIn: SESSION_TTL_MS / 1000 }, { status: 201 });
        }

        if (action === "login") {
          const email = clean(body.email, 254).toLowerCase();
          const password = String(body.password || "");
          const [user] = await db.select().from(reicKamusUsers).where(eq(reicKamusUsers.email, email)).limit(1);
          if (!user || user.status !== "active") return fail(request, "Email atau kata sandi salah.", 401);
          const candidate = await hashPassword(password, user.passwordSalt);
          if (!safeEqual(candidate, user.passwordHash)) {
            await audit(user.id, "LOGIN_FAILED");
            return fail(request, "Email atau kata sandi salah.", 401);
          }
          const token = await issueSession(user.id);
          await db.update(reicKamusUsers).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(reicKamusUsers.id, user.id));
          await audit(user.id, "LOGIN_SUCCESS");
          return json(request, { ok: true, user: publicUser(user), token, expiresIn: SESSION_TTL_MS / 1000 });
        }

        const auth = await currentUser(request);
        if (!auth) return fail(request, "Silakan login kembali.", 401);
        if (action === "logout") {
          await db.update(reicKamusSessions).set({ revokedAt: new Date() }).where(eq(reicKamusSessions.id, auth.session.id));
          await audit(auth.user.id, "LOGOUT");
          return json(request, { ok: true });
        }
        if (action === "save-word" || action === "save-file" || action === "save-history") {
          const kind = action === "save-word" ? "collection" : action === "save-file" ? "file" : "history";
          const name = clean(body.name || body.word, 180);
          const content = String(body.content ?? "");
          const mime = clean(body.mime, 120) || "text/plain";
          if (!name) return fail(request, "Nama data wajib diisi.", 400);
          if (new TextEncoder().encode(content).byteLength > MAX_FILE_BYTES) return fail(request, "Ukuran konten melebihi 5 MB.", 413);
          const recordKey = clean(body.recordKey, 180) || digest(kind + ":" + name).slice(0, 32);
          const [record] = await db.insert(reicKamusRecords).values({
            userId: auth.user.id, kind, recordKey, name, content, mime,
            size: new TextEncoder().encode(content).byteLength,
            metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
          }).returning();
          await audit(auth.user.id, action.toUpperCase(), { name });
          return json(request, { ok: true, record }, { status: 201 });
        }
        if (action === "delete-record") {
          const recordId = Number(body.id);
          if (!Number.isSafeInteger(recordId) || recordId < 1) return fail(request, "ID data tidak valid.", 400);
          const [record] = await db.select().from(reicKamusRecords).where(and(
            eq(reicKamusRecords.id, recordId), eq(reicKamusRecords.userId, auth.user.id),
          )).limit(1);
          if (!record) return fail(request, "Data tidak ditemukan.", 404);
          await db.delete(reicKamusRecords).where(and(eq(reicKamusRecords.id, recordId), eq(reicKamusRecords.userId, auth.user.id)));
          await audit(auth.user.id, "DELETE_RECORD", { name: record.name, kind: record.kind });
          return json(request, { ok: true });
        }
        if (action === "update-settings") {
          const settings = body.settings && typeof body.settings === "object" ? body.settings : {};
          const [existing] = await db.select().from(reicKamusSettings).where(eq(reicKamusSettings.userId, auth.user.id)).limit(1);
          if (existing) await db.update(reicKamusSettings).set({ settings, updatedAt: new Date() }).where(eq(reicKamusSettings.userId, auth.user.id));
          else await db.insert(reicKamusSettings).values({ userId: auth.user.id, settings });
          await audit(auth.user.id, "SETTINGS_UPDATE");
          return json(request, { ok: true, settings });
        }
        if (action === "update-profile") {
          const name = clean(body.name, 80);
          if (!name) return fail(request, "Nama pengguna wajib diisi.", 400);
          const [user] = await db.update(reicKamusUsers).set({ displayName: name, updatedAt: new Date() })
            .where(eq(reicKamusUsers.id, auth.user.id)).returning();
          await audit(auth.user.id, "PROFILE_UPDATE");
          return json(request, { ok: true, user: publicUser(user) });
        }
        return fail(request, "Aksi Kamus Digital tidak dikenal.", 400);
      },
    },
  },
});
