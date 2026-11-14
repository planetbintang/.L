import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

const queryClient = new QueryClient();
const apiBase = (window.__MANUS_CONFIG__?.apiUrl || window.location.origin).replace(/\/$/, "");

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  if (error.message === UNAUTHED_ERR_MSG) startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.query.state.error);
    console.error("[API Query Error]", event.query.state.error);
  }
});
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    redirectToLoginIfUnauthorized(event.mutation.state.error);
    console.error("[API Mutation Error]", event.mutation.state.error);
  }
});

const trpcClient = trpc.createClient({
  links: [httpBatchLink({
    url: `${apiBase}/api/trpc`,
    transformer: superjson,
    headers() {
      try {
        const raw = sessionStorage.getItem("manus-cookie");
        if (raw) {
          const prefix = `${COOKIE_NAME}=`;
          const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
          const token = pair?.trim().slice(prefix.length);
          if (token) return { Authorization: `Bearer ${token}` };
        }
      } catch { /* sessionStorage unavailable */ }
      return {};
    },
    fetch(input, init) {
      return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
    },
  })],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
  </trpc.Provider>
);
