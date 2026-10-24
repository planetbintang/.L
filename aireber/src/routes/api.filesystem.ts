import { createFileRoute } from "@tanstack/react-router";
import { db } from "../../db/index.js";
import { fsNodes, kataCustom } from "../../db/schema.js";
import { eq, isNull } from "drizzle-orm";
import { browseVirtualPath, getVirtualFileContent } from "@/lib/virtual-fs";
import {
  searchKata,
  getKataList,
  KATA_CATEGORIES,
  getTotalKataCount,
} from "@/lib/kata-data";

export const Route = createFileRoute("/api/filesystem")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const action = url.searchParams.get("action") || "browse";
        const path = url.searchParams.get("path") || "/";
        const page = parseInt(url.searchParams.get("page") || "0");
        const pageSize = parseInt(url.searchParams.get("pageSize") || "50");
        const query = url.searchParams.get("q") || "";
        const category = url.searchParams.get("category") || "";

        if (action === "browse") {
          // Check for DB custom nodes first
          const dbNodes = await db
            .select()
            .from(fsNodes)
            .where(isNull(fsNodes.parentId))
            .limit(20);

          const virtualResult = browseVirtualPath(path, page, pageSize);
          return Response.json({
            ...virtualResult,
            dbNodes: dbNodes.slice(0, 5),
            total: getTotalKataCount(),
          });
        }

        if (action === "file") {
          // Check DB first
          const [dbFile] = await db
            .select()
            .from(fsNodes)
            .where(eq(fsNodes.path, path));

          if (dbFile) {
            return Response.json({ path, content: dbFile.content, source: "db" });
          }

          const content = getVirtualFileContent(path);
          if (content) {
            return Response.json({ path, content, source: "virtual" });
          }

          return new Response("File not found", { status: 404 });
        }

        if (action === "search") {
          const results = searchKata(query, 50);
          return Response.json({ results, query });
        }

        if (action === "kata-list") {
          const catId = category || "en";
          const words = getKataList(catId, page, pageSize);
          const cat = KATA_CATEGORIES.find((c) => c.id === catId);
          return Response.json({
            words,
            category: catId,
            total: cat?.count || 0,
            page,
            pageSize,
          });
        }

        if (action === "categories") {
          return Response.json({
            categories: KATA_CATEGORIES.map((c) => ({
              id: c.id,
              name: c.name,
              nameid: c.nameid,
              count: c.count,
            })),
            total: getTotalKataCount(),
          });
        }

        return Response.json({ error: "Unknown action" }, { status: 400 });
      },

      POST: async ({ request }) => {
        const body = await request.json();
        const { action, path, name, type, content, extension, parentId } = body;

        if (action === "create") {
          const [node] = await db
            .insert(fsNodes)
            .values({
              name,
              type,
              path,
              content,
              extension,
              parentId,
              metadata: body.metadata,
            })
            .returning();
          return Response.json(node, { status: 201 });
        }

        if (action === "update") {
          const [node] = await db
            .update(fsNodes)
            .set({ content, updatedAt: new Date() })
            .where(eq(fsNodes.path, path))
            .returning();
          return Response.json(node);
        }

        if (action === "delete") {
          await db.delete(fsNodes).where(eq(fsNodes.path, path));
          return Response.json({ deleted: true });
        }

        if (action === "create-kata") {
          const { kata, category, lang, indexContent, styleContent, fungsiContent } = body;
          const [entry] = await db
            .insert(kataCustom)
            .values({ kata, category, lang, indexContent, styleContent, fungsiContent })
            .onConflictDoUpdate({
              target: kataCustom.kata,
              set: { indexContent, styleContent, fungsiContent, updatedAt: new Date() },
            })
            .returning();
          return Response.json(entry, { status: 201 });
        }

        return Response.json({ error: "Unknown action" }, { status: 400 });
      },
    },
  },
});
