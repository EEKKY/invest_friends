import { ReactNode, createContext } from "react";

export type Message = {
  id: string;
  type: "ai" | "user";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  status?: "sending" | "sent" | "error";
};

export type ChatContextType = {
  messages: Message[];
  optimisticMessages: Message[];
  isTyping: boolean;
  isPending: boolean;
  sendMessage: (content: string) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  clearChat: () => void;
};

export type ChatProviderProps = {
  children: ReactNode;
};

export const ChatContext = createContext<ChatContextType | undefined>(undefined);