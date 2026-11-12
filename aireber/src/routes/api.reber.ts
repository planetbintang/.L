import { createFileRoute } from "@tanstack/react-router";
import { chat, maxIterations, toServerSentEventsResponse } from "@tanstack/ai";
import { anthropicText } from "@tanstack/ai-anthropic";
import { openaiText } from "@tanstack/ai-openai";
import { REBER_SYSTEM_PROMPT } from "@/lib/reber-system";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { aireberSessions, aireberUsers, aireberUsage } from "../../db/schema.js";
import { createHash } from "node:crypto";

const tokenFromCookie = (request: Request) => {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)aireber_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
};

export const Route = createFileRoute("/api/reber")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestSignal = request.signal;
        if (requestSignal.aborted) return new Response(null, { status: 499 });

        const abortController = new AbortController();

        try {
          const body = await request.json();
          const { messages } = body;
          if (!Array.isArray(messages) || messages.length === 0) return Response.json({ error: "Pesan AI tidak valid." }, { status: 400 });

          const sessionToken = tokenFromCookie(request);
          if (!sessionToken) return Response.json({ error: "Silakan login AIREBER sebelum menggunakan AI." }, { status: 401 });
          const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
          const [session] = await db.select().from(aireberSessions).where(and(eq(aireberSessions.tokenHash, tokenHash), isNull(aireberSessions.revokedAt), gt(aireberSessions.expiresAt, new Date()))).limit(1);
          if (!session) return Response.json({ error: "Sesi AIREBER berakhir. Silakan login kembali." }, { status: 401 });
          const [user] = await db.select().from(aireberUsers).where(eq(aireberUsers.id, session.userId)).limit(1);
          if (!user || user.status !== "active") return Response.json({ error: "Akun AIREBER tidak aktif." }, { status: 403 });

          const now = new Date();
          if (user.quotaResetAt && user.quotaResetAt.getTime() <= now.getTime()) {
            await db.update(aireberUsers).set({ usedRequests: 0, quotaResetAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }).where(eq(aireberUsers.id, user.id));
            user.usedRequests = 0;
          }
          if (user.role !== "admin" && user.usedRequests >= user.quotaRequests) {
            return Response.json({ error: "Kuota AI bulanan habis. Silakan tingkatkan paket keanggotaan.", code: "QUOTA_EXCEEDED", quota: { limit: user.quotaRequests, used: user.usedRequests, plan: user.plan } }, { status: 429 });
          }
          if (user.role !== "admin") {
            const [charged] = await db.update(aireberUsers).set({ usedRequests: sql.raw('"used_requests" + 1') }).where(and(eq(aireberUsers.id, user.id), lt(aireberUsers.usedRequests, aireberUsers.quotaRequests))).returning({ id: aireberUsers.id });
            if (!charged) return Response.json({ error: "Kuota AI sudah habis.", code: "QUOTA_EXCEEDED" }, { status: 429 });
          } else {
            await db.update(aireberUsers).set({ usedRequests: sql.raw('"used_requests" + 1') }).where(eq(aireberUsers.id, user.id));
          }
          const modelUsed = process.env.ANTHROPIC_API_KEY ? "claude-sonnet-4-6" : process.env.OPENAI_API_KEY ? "gpt-5.2" : "claude-haiku-4-5";
          await db.insert(aireberUsage).values({ userId: user.id, action: String(body.data?.mode || "chat").slice(0, 40), units: 1, model: modelUsed, metadata: { messageCount: messages.length } });

          let adapter: ReturnType<typeof anthropicText | typeof openaiText>;

          if (process.env.ANTHROPIC_API_KEY) {
            adapter = anthropicText("claude-sonnet-4-6" as any);
          } else if (process.env.OPENAI_API_KEY) {
            adapter = openaiText("gpt-5.2" as any);
          } else {
            // Fallback to anthropic (Netlify AI Gateway will inject keys)
            adapter = anthropicText("claude-haiku-4-5" as any);
          }

          const stream = chat({
            adapter,
            systemPrompts: [REBER_SYSTEM_PROMPT],
            agentLoopStrategy: maxIterations(10),
            messages,
            abortController,
          });

          return toServerSentEventsResponse(stream, { abortController });
        } catch (error: any) {
          console.error("AI Reber error:", error);
          if (error.name === "AbortError" || abortController.signal.aborted) {
            return new Response(null, { status: 499 });
          }
          return new Response(
            JSON.stringify({
              error: "AI Reber failed",
              message: error.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
