import { createFileRoute } from "@tanstack/react-router";
import { chat, maxIterations, toServerSentEventsResponse } from "@tanstack/ai";
import { anthropicText } from "@tanstack/ai-anthropic";
import { openaiText } from "@tanstack/ai-openai";
import { REBER_SYSTEM_PROMPT } from "@/lib/reber-system";

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
