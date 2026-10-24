import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from "@tanstack/ai-react";
import type { InferChatMessages } from "@tanstack/ai-react";
import { attachPlanetbintangWorkspaceContext } from "./planetbintang-files.js";

const reberChatOptions = createChatClientOptions({
  connection: fetchServerSentEvents("/api/reber"),
});

export type ChatMessages = InferChatMessages<typeof reberChatOptions>;

export const useReberAI = () => {
  const chatOptions = createChatClientOptions({
    connection: fetchServerSentEvents("/api/reber"),
  });
  const chat = useChat(chatOptions);
  return {
    ...chat,
    sendMessage: (message: string) => chat.sendMessage(attachPlanetbintangWorkspaceContext(message)),
  };
};
