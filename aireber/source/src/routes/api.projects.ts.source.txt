import { createFileRoute } from "@tanstack/react-router";
import { db } from "../../db/index.js";
import { projects } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (id) {
          const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, parseInt(id)));
          if (!project) return new Response("Not found", { status: 404 });
          return Response.json(project);
        }

        const all = await db.select().from(projects).orderBy(projects.createdAt);
        return Response.json(all);
      },

      POST: async ({ request }) => {
        const body = await request.json();
        const { action, name, slug, description, domain, systemPath, config } = body;

        if (action === "create") {
          const [project] = await db
            .insert(projects)
            .values({
              name,
              slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
              description,
              domain: domain || `${slug || name.toLowerCase().replace(/\s+/g, "-")}.allunivers.digital`,
              systemPath,
              config,
            })
            .returning();
          return Response.json(project, { status: 201 });
        }

        if (action === "update") {
          const [project] = await db
            .update(projects)
            .set({ name, description, domain, config, updatedAt: new Date() })
            .where(eq(projects.id, body.id))
            .returning();
          return Response.json(project);
        }

        if (action === "delete") {
          await db.delete(projects).where(eq(projects.id, body.id));
          return Response.json({ deleted: true });
        }

        return Response.json({ error: "Unknown action" }, { status: 400 });
      },
    },
  },
});
