import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomBytes, timingSafeEqual, pbkdf2 } from "node:crypto";
import { promisify } from "node:util";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { biosAudit, biosDevices, biosSessions } from "../../db/schema.js";

const deriveKey = promisify(pbkdf2);
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const COOKIE = "pb_reic_bios_session";
const serialise = (value: unknown) => String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
const tokenDigest = (token: string) => createHash("sha256").update(token).digest("hex");
const jsonError = (message: string, status: number) => Response.json({ ok: false, error: message }, { status });
const adminSerials = () => new Set((process.env.BIOS_ADMIN_SERIALS || "").split(",").map(serialise).filter(Boolean));

async function passwordHash(password: string, salt: string) {
  const key = await deriveKey(password, salt, 210000, 64, "sha512") as Buffer;
  return key.toString("hex");
}
function safeEqual(a: string, b: string) {
  const left = Buffer.from(a, "hex"), right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
function cookieValue(request: Request) {
  const raw = request.headers.get("cookie") || "";
  const item = raw.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="));
  return item ? decodeURIComponent(item.slice(COOKIE.length + 1)) : "";
}
function sessionCookie(token: string, maxAge: number) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
async function currentDevice(request: Request) {
  const token = cookieValue(request);
  if (!token) return null;
  const [session] = await db.select().from(biosSessions).where(and(
    eq(biosSessions.tokenHash, tokenDigest(token)),
    isNull(biosSessions.revokedAt),
    gt(biosSessions.expiresAt, new Date()),
  )).limit(1);
  if (!session) return null;
  const [device] = await db.select().from(biosDevices).where(eq(biosDevices.id, session.deviceId)).limit(1);
  if (!device || device.status !== "active") return null;
  return { device, session };
}
async function audit(device: typeof biosDevices.$inferSelect | null, serialNumber: string, event: string, detail: Record<string, unknown> = {}) {
  await db.insert(biosAudit).values({ deviceId: device?.id ?? null, serialNumber, event, detail });
}
async function issueSession(device: typeof biosDevices.$inferSelect) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(biosSessions).values({ deviceId: device.id, tokenHash: tokenDigest(token), expiresAt });
  await db.update(biosDevices).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(biosDevices.id, device.id));
  return { token };
}
const publicDevice = (device: typeof biosDevices.$inferSelect) => ({
  id: device.id, serialNumber: device.serialNumber, displayName: device.displayName,
  role: device.role, status: device.status, createdAt: device.createdAt,
  updatedAt: device.updatedAt, lastLoginAt: device.lastLoginAt,
});

export const Route = createFileRoute("/api/bios")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const action = new URL(request.url).searchParams.get("action") || "health";
        if (action === "health") return Response.json({ ok: true, service: "REIC BIOS Registry", storage: "reic-table", version: "1.0" });
        const auth = await currentDevice(request);
        if (!auth) return jsonError("BIOS session tidak valid atau telah berakhir.", 401);
        if (action === "me") return Response.json({ ok: true, device: publicDevice(auth.device) });
        if (action === "devices") {
          const rows = auth.device.role === "admin" ? await db.select().from(biosDevices).orderBy(desc(biosDevices.createdAt)) : [auth.device];
          return Response.json({ ok: true, devices: rows.map(publicDevice), canManage: auth.device.role === "admin" });
        }
        if (action === "audit") {
          const rows = auth.device.role === "admin"
            ? await db.select().from(biosAudit).orderBy(desc(biosAudit.createdAt)).limit(100)
            : await db.select().from(biosAudit).where(eq(biosAudit.deviceId, auth.device.id)).orderBy(desc(biosAudit.createdAt)).limit(50);
          return Response.json({ ok: true, audit: rows });
        }
        return jsonError("Aksi BIOS tidak dikenal.", 400);
      },
      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try { body = await request.json() as Record<string, unknown>; }
        catch { return jsonError("Body JSON tidak valid.", 400); }
        const action = String(body.action || "");
        if (action === "register") {
          const serialNumber = serialise(body.serialNumber);
          const displayName = String(body.displayName || "").trim();
          const password = String(body.password || "");
          if (!/^[A-Z0-9-]{8,32}$/.test(serialNumber)) return jsonError("Serial Number harus 8–32 karakter huruf, angka, atau tanda hubung.", 400);
          if (!displayName || displayName.length > 60) return jsonError("Nama perangkat wajib diisi (maksimal 60 karakter).", 400);
          if (password.length < 10 || password.length > 128) return jsonError("Kata sandi harus 10–128 karakter.", 400);
          const [existing] = await db.select({ id: biosDevices.id }).from(biosDevices).where(eq(biosDevices.serialNumber, serialNumber)).limit(1);
          if (existing) return jsonError("Serial Number sudah terdaftar.", 409);
          const salt = randomBytes(16).toString("hex");
          const hash = await passwordHash(password, salt);
          const role = adminSerials().has(serialNumber) ? "admin" : "member";
          const [device] = await db.insert(biosDevices).values({ serialNumber, displayName, passwordHash: hash, passwordSalt: salt, role, status: "active" }).returning();
          await audit(device, serialNumber, "REGISTER", { role });
          const session = await issueSession(device);
          const response = Response.json({ ok: true, device: publicDevice(device), storage: "reic-table" }, { status: 201 });
          response.headers.append("Set-Cookie", sessionCookie(session.token, SESSION_TTL_MS / 1000));
          return response;
        }
        if (action === "login") {
          const serialNumber = serialise(body.serialNumber), password = String(body.password || "");
          const [device] = await db.select().from(biosDevices).where(eq(biosDevices.serialNumber, serialNumber)).limit(1);
          if (!device || device.status !== "active") return jsonError("Serial Number tidak ditemukan atau perangkat dinonaktifkan.", 401);
          const candidate = await passwordHash(password, device.passwordSalt);
          if (!safeEqual(candidate, device.passwordHash)) {
            await audit(device, serialNumber, "LOGIN_FAILED");
            return jsonError("Kredensial BIOS tidak valid.", 401);
          }
          const session = await issueSession(device);
          await audit(device, serialNumber, "LOGIN_SUCCESS");
          const response = Response.json({ ok: true, device: publicDevice(device), storage: "reic-table" });
          response.headers.append("Set-Cookie", sessionCookie(session.token, SESSION_TTL_MS / 1000));
          return response;
        }
        const auth = await currentDevice(request);
        if (!auth) return jsonError("BIOS session tidak valid atau telah berakhir.", 401);
        if (action === "logout") {
          await db.update(biosSessions).set({ revokedAt: new Date() }).where(eq(biosSessions.id, auth.session.id));
          await audit(auth.device, auth.device.serialNumber, "LOGOUT");
          const response = Response.json({ ok: true });
          response.headers.append("Set-Cookie", sessionCookie("", 0));
          return response;
        }
        if (action === "set-device-status" || action === "delete-device") {
          if (auth.device.role !== "admin") return jsonError("Akses administrator diperlukan.", 403);
          const id = Number(body.id);
          if (!Number.isSafeInteger(id) || id < 1) return jsonError("ID perangkat tidak valid.", 400);
          const [target] = await db.select().from(biosDevices).where(eq(biosDevices.id, id)).limit(1);
          if (!target) return jsonError("Perangkat tidak ditemukan.", 404);
          if (target.id === auth.device.id && action === "delete-device") return jsonError("Administrator tidak dapat menghapus perangkat yang sedang digunakan.", 400);
          if (action === "set-device-status") {
            const status = body.status === "disabled" ? "disabled" : body.status === "active" ? "active" : "";
            if (!status) return jsonError("Status harus active atau disabled.", 400);
            await db.update(biosDevices).set({ status, updatedAt: new Date() }).where(eq(biosDevices.id, id));
            if (status === "disabled") await db.update(biosSessions).set({ revokedAt: new Date() }).where(and(eq(biosSessions.deviceId, id), isNull(biosSessions.revokedAt)));
            await audit(auth.device, target.serialNumber, status === "disabled" ? "DEVICE_DISABLED" : "DEVICE_ENABLED", { targetId: id });
            return Response.json({ ok: true });
          }
          await db.update(biosSessions).set({ revokedAt: new Date() }).where(and(eq(biosSessions.deviceId, id), isNull(biosSessions.revokedAt)));
          await audit(auth.device, target.serialNumber, "DEVICE_DELETED", { targetId: id });
          await db.delete(biosDevices).where(eq(biosDevices.id, id));
          return Response.json({ ok: true });
        }
        return jsonError("Aksi BIOS tidak dikenal.", 400);
      },
    },
  },
});
