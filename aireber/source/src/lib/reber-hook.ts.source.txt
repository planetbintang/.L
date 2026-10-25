import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from "@tanstack/ai-react";
import type { InferChatMessages } from "@tanstack/ai-react";

const reberChatOptions = createChatClientOptions({
  connection: fetchServerSentEvents("/api/reber"),
});

export type ChatMessages = InferChatMessages<typeof reberChatOptions>;

export const useReberAI = () => {
  const chatOptions = createChatClientOptions({
    connection: fetchServerSentEvents("/api/reber"),
  });
  return useChat(chatOptions);
};
