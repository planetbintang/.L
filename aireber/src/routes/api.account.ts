import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomBytes, timingSafeEqual, pbkdf2 } from "node:crypto";
import { promisify } from "node:util";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { aireberAudit, aireberFiles, aireberSessions, aireberSettings, aireberUsers, aireberUsage } from "../../db/schema.js";

const deriveKey = promisify(pbkdf2);
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const clean = (value: unknown, max = 120) => String(value ?? "").trim().slice(0, max);
const allowedOrigins = () => new Set((process.env.REIC_ALLOWED_ORIGINS || "https://planetbintang.github.io").split(",").map((v) => v.trim()).filter(Boolean));
const cors = (request: Request, response: Response) => {
  const origin = request.headers.get("origin") || "";
  let sameOrigin = false;
  try { sameOrigin = !!origin && new URL(origin).host === new URL(request.url).host; } catch { /* invalid origin */ }
  if (origin && (sameOrigin || allowedOrigins().has(origin))) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.append("Vary", "Origin");
  }
  return response;
};
const json = (request: Request, body: unknown, init?: ResponseInit) => { const headers = new Headers(init?.headers); headers.set("cache-control", "no-store"); return cors(request, Response.json(body, { ...init, headers })); };
const fail = (request: Request, message: string, status: number) => json(request, { ok: false, error: message }, { status });
async function hashPassword(password: string, salt: string) {
  return (await deriveKey(password, salt, 210000, 64, "sha512") as Buffer).toString("hex");
}
function safeEqual(a: string, b: string) {
  const left = Buffer.from(a, "hex"), right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
function bearer(request: Request) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}
async function currentUser(request: Request) {
  const token = bearer(request);
  if (!token) return null;
  const [session] = await db.select().from(aireberSessions).where(and(
    eq(aireberSessions.tokenHash, digest(token)), isNull(aireberSessions.revokedAt), gt(aireberSessions.expiresAt, new Date()),
  )).limit(1);
  if (!session) return null;
  const [user] = await db.select().from(aireberUsers).where(eq(aireberUsers.id, session.userId)).limit(1);
  return user?.status === "active" ? { user, session } : null;
}
async function audit(userId: number, action: string, detail: unknown = {}) {
  await db.insert(aireberAudit).values({ userId, action, detail });
}
async function issueSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(aireberSessions).values({ userId, tokenHash: digest(token), expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
  return token;
}
const publicUser = (user: typeof aireberUsers.$inferSelect) => ({
  id: user.id, email: user.email, name: user.displayName, role: user.role,
  plan: user.plan, quotaRequests: user.quotaRequests, usedRequests: user.usedRequests, quotaResetAt: user.quotaResetAt,
  createdAt: user.createdAt, lastLoginAt: user.lastLoginAt,
});
function safePath(input: unknown) {
  const parts = String(input ?? "").replaceAll("\\", "/").split("/").filter(Boolean);
  if (!parts.length || parts.some((p) => p === "." || p === ".." || p.length > 120 || /[\u0000-\u001f\u007f]/.test(p))) return null;
  const path = parts.join("/");
  return path.startsWith("aireber/") ? path : null;
}

export const Route = createFileRoute("/api/account")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => cors(request, new Response(null, { status: 204 })),
      GET: async ({ request }) => {
        const action = new URL(request.url).searchParams.get("action") || "me";
        if (action === "health") return json(request, { ok: true, service: "AIREBER Account Registry", storage: "netlify-postgres" });
        const auth = await currentUser(request);
        if (!auth) return fail(request, "Sesi AIREBER tidak valid atau telah berakhir.", 401);
        if (action === "me") return json(request, { ok: true, user: publicUser(auth.user) });
        if (action === "files") {
          const files = await db.select().from(aireberFiles).where(eq(aireberFiles.userId, auth.user.id)).orderBy(desc(aireberFiles.updatedAt)).limit(500);
          return json(request, { ok: true, files });
        }
        if (action === "settings") {
          const [row] = await db.select().from(aireberSettings).where(eq(aireberSettings.userId, auth.user.id)).limit(1);
          return json(request, { ok: true, settings: row?.settings || {} });
        }
        if (action === "audit") {
          const rows = await db.select().from(aireberAudit).where(eq(aireberAudit.userId, auth.user.id)).orderBy(desc(aireberAudit.createdAt)).limit(100);
          return json(request, { ok: true, audit: rows });
        }
        if (action === "usage") {
          const rows = await db.select().from(aireberUsage).where(eq(aireberUsage.userId, auth.user.id)).orderBy(desc(aireberUsage.createdAt)).limit(100);
          return json(request, { ok: true, quota: { plan: auth.user.plan, limit: auth.user.quotaRequests, used: auth.user.usedRequests, remaining: Math.max(0, auth.user.quotaRequests - auth.user.usedRequests), resetAt: auth.user.quotaResetAt }, usage: rows });
        }
        if (action === "members") {
          if (auth.user.role !== "admin") return fail(request, "Akses khusus administrator.", 403);
          const members = await db.select().from(aireberUsers).orderBy(desc(aireberUsers.createdAt)).limit(250);
          return json(request, { ok: true, members: members.map(publicUser) });
        }
        return fail(request, "Aksi akun tidak dikenal.", 400);
      },
      POST: async ({ request }) => {
        const origin = request.headers.get("origin") || "";
        let sameOrigin = false;
        try { sameOrigin = !!origin && new URL(origin).host === new URL(request.url).host; } catch { /* invalid origin */ }
        if (origin && !sameOrigin && !allowedOrigins().has(origin)) return fail(request, "Origin tidak diizinkan.", 403);
        let body: Record<string, unknown>;
        try { body = await request.json() as Record<string, unknown>; } catch { return fail(request, "Body JSON tidak valid.", 400); }
        const action = clean(body.action, 40);

        if (action === "register") {
          const email = clean(body.email, 254).toLowerCase();
          const name = clean(body.name, 80);
          const password = String(body.password || "");
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(request, "Alamat email tidak valid.", 400);
          if (!name) return fail(request, "Nama pengguna wajib diisi.", 400);
          if (password.length < 10 || password.length > 128) return fail(request, "Kata sandi harus 10–128 karakter.", 400);
          const [existing] = await db.select({ id: aireberUsers.id }).from(aireberUsers).where(eq(aireberUsers.email, email)).limit(1);
          if (existing) return fail(request, "Email sudah terdaftar.", 409);
          const salt = randomBytes(16).toString("hex");
          const passwordHash = await hashPassword(password, salt);
          const adminEmails = new Set((process.env.AIREBER_ADMIN_EMAILS || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean));
          const [user] = await db.insert(aireberUsers).values({ email, displayName: name, passwordHash, passwordSalt: salt, role: adminEmails.has(email) ? "admin" : "member" }).returning();
          const token = await issueSession(user.id);
          await audit(user.id, "REGISTER");
          return json(request, { ok: true, user: publicUser(user), token, expiresIn: SESSION_TTL_MS / 1000 }, { status: 201, headers: { "set-cookie": "aireber_session=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200" } });
        }
        if (action === "login") {
          const email = clean(body.email, 254).toLowerCase(), password = String(body.password || "");
          const [user] = await db.select().from(aireberUsers).where(eq(aireberUsers.email, email)).limit(1);
          if (!user || user.status !== "active") return fail(request, "Email atau kata sandi salah.", 401);
          const candidate = await hashPassword(password, user.passwordSalt);
          if (!safeEqual(candidate, user.passwordHash)) { await audit(user.id, "LOGIN_FAILED"); return fail(request, "Email atau kata sandi salah.", 401); }
          const token = await issueSession(user.id);
          await db.update(aireberUsers).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(aireberUsers.id, user.id));
          await audit(user.id, "LOGIN_SUCCESS");
          return json(request, { ok: true, user: publicUser(user), token, expiresIn: SESSION_TTL_MS / 1000 }, { headers: { "set-cookie": "aireber_session=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200" } });
        }
        const auth = await currentUser(request);
        if (!auth) return fail(request, "Silakan login kembali.", 401);
        if (action === "logout") {
          await db.update(aireberSessions).set({ revokedAt: new Date() }).where(eq(aireberSessions.id, auth.session.id));
          await audit(auth.user.id, "LOGOUT");
          return json(request, { ok: true }, { headers: { "set-cookie": "aireber_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0" } });
        }
        if (action === "update-profile") {
          const name = clean(body.name, 80);
          if (!name) return fail(request, "Nama profil wajib diisi.", 400);
          const [user] = await db.update(aireberUsers).set({ displayName: name, updatedAt: new Date() }).where(eq(aireberUsers.id, auth.user.id)).returning();
          await audit(auth.user.id, "UPDATE_PROFILE");
          return json(request, { ok: true, user: publicUser(user) });
        }
        if (action === "update-settings") {
          const settings = body.settings && typeof body.settings === "object" && !Array.isArray(body.settings) ? body.settings : {};
          const [existing] = await db.select().from(aireberSettings).where(eq(aireberSettings.userId, auth.user.id)).limit(1);
          if (existing) await db.update(aireberSettings).set({ settings, updatedAt: new Date() }).where(eq(aireberSettings.userId, auth.user.id));
          else await db.insert(aireberSettings).values({ userId: auth.user.id, settings });
          await audit(auth.user.id, "UPDATE_SETTINGS");
          return json(request, { ok: true, settings });
        }
        if (action === "save-file") {
          const path = safePath(body.path), name = clean(body.name, 180), content = String(body.content ?? "");
          if (!path || !name) return fail(request, "Path dan nama file wajib diisi.", 400);
          const size = new TextEncoder().encode(content).byteLength;
          if (size > MAX_FILE_BYTES) return fail(request, "Ukuran file maksimal 5 MB.", 413);
          const mime = clean(body.mime, 120) || "text/plain";
          const [file] = await db.insert(aireberFiles).values({ userId: auth.user.id, path, name, content, mime, size, metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {} })
            .onConflictDoUpdate({ target: [aireberFiles.userId, aireberFiles.path], set: { name, content, mime, size, updatedAt: new Date(), metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {} } }).returning();
          await audit(auth.user.id, "SAVE_FILE", { path, size });
          return json(request, { ok: true, file }, { status: 201 });
        }
        if (action === "update-member") {
          if (auth.user.role !== "admin") return fail(request, "Akses khusus administrator.", 403);
          const id = Number(body.id), plan = clean(body.plan, 24), status = clean(body.status, 24);
          const plans: Record<string, number> = { free: 30, creator: 500, pro: 3000, enterprise: 30000 };
          if (!Number.isSafeInteger(id) || id < 1 || !(plan in plans) || !["active", "suspended"].includes(status)) return fail(request, "Data keanggotaan tidak valid.", 400);
          const [member] = await db.update(aireberUsers).set({ plan, quotaRequests: plans[plan], usedRequests: 0, quotaResetAt: new Date(), status, updatedAt: new Date() }).where(eq(aireberUsers.id, id)).returning();
          if (!member) return fail(request, "Pengguna tidak ditemukan.", 404);
          await audit(auth.user.id, "ADMIN_UPDATE_MEMBER", { memberId: id, plan, status });
          return json(request, { ok: true, member: publicUser(member) });
        }
        if (action === "delete-file") {
          const id = Number(body.id);
          if (!Number.isSafeInteger(id) || id < 1) return fail(request, "ID file tidak valid.", 400);
          const [file] = await db.select().from(aireberFiles).where(and(eq(aireberFiles.id, id), eq(aireberFiles.userId, auth.user.id))).limit(1);
          if (!file) return fail(request, "File tidak ditemukan.", 404);
          await db.delete(aireberFiles).where(and(eq(aireberFiles.id, id), eq(aireberFiles.userId, auth.user.id)));
          await audit(auth.user.id, "DELETE_FILE", { path: file.path });
          return json(request, { ok: true });
        }
        return fail(request, "Aksi akun tidak dikenal.", 400);
      },
    },
  },
});
