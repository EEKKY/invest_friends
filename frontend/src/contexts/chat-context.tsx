import {
  useState,
  useCallback,
  useTransition,
  useMemo,
} from "react";
import { ChatContext, type Message, type ChatProviderProps } from "./chat-context.types";
import type { ChatMessage } from "@/types/chat";
import { chatApi } from "@/services/chat";

const ChatProvider = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sendMessage = useCallback(
    async (content: string) => {
      // Prevent duplicate messages
      const userMessageId = crypto.randomUUID();
      
      const userMessage: Message = {
        id: userMessageId,
        type: "user",
        content,
        timestamp: new Date(),
        status: "sending",
      };

      // Add user message immediately
      setMessages((prev) => {
        // Check if this message already exists
        if (prev.some(msg => msg.content === content && msg.type === "user" && 
            new Date().getTime() - new Date(msg.timestamp).getTime() < 1000)) {
          return prev;
        }
        return [...prev, userMessage];
      });

      // Update chat history for API context
      const newUserMessage: ChatMessage = {
        role: "user",
        content,
        timestamp: new Date(),
      };
      
      setChatHistory((prev) => [...prev, newUserMessage]);

      // Small delay to show user message first
      await new Promise(resolve => setTimeout(resolve, 300));

      // Add AI typing indicator message
      const typingMessage: Message = {
        id: "ai-typing",
        type: "ai",
        content: "",
        timestamp: new Date(),
        isTyping: true,
      };

      setMessages((prev) => [...prev, typingMessage]);
      setIsTyping(true);

      // Update user message status to sent
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === userMessageId ? { ...msg, status: "sent" } : msg
        )
      );

      // Call API for AI response
      try {
        const response = await chatApi.sendMessage(content, chatHistory);
        
        if (response.success) {
          const aiMessage: Message = {
            id: crypto.randomUUID(),
            type: "ai",
            content: response.message,
            timestamp: new Date(),
            status: "sent",
          };
          
          // Update chat history with AI response
          const newAiMessage: ChatMessage = {
            role: "assistant",
            content: response.message,
            timestamp: new Date(),
          };
          
          setChatHistory((prev) => [...prev, newAiMessage]);
          
          // Replace typing message with actual response
          setMessages((prev) => {
            const filtered = prev.filter(msg => msg.id !== "ai-typing");
            return [...filtered, aiMessage];
          });
        } else {
          throw new Error(response.message);
        }
        
        setIsTyping(false);
      } catch (error) {
        console.error("Failed to get AI response:", error);
        
        // Update user message status to error
        setMessages((prev) => 
          prev.map(msg => 
            msg.id === userMessageId ? { ...msg, status: "error" } : msg
          )
        );
        
        // Remove typing message and add error message
        setMessages((prev) => {
          const filtered = prev.filter(msg => msg.id !== "ai-typing");
          const errorMessage: Message = {
            id: crypto.randomUUID(),
            type: "ai",
            content: "죄송합니다. 메시지 전송 중 오류가 발생했습니다. 다시 시도해 주세요.",
            timestamp: new Date(),
            status: "error",
          };
          return [...filtered, errorMessage];
        });
        
        setIsTyping(false);
      }
    },
    [chatHistory]
  );

  const regenerateMessage = useCallback(
    async (messageId: string) => {
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex === -1) return;

      // Find the user message before this AI message
      let userMessage = "";
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].type === "user") {
          userMessage = messages[i].content;
          break;
        }
      }

      if (!userMessage) return;

      // Remove old AI message and add typing indicator
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== messageId);
        const typingMessage: Message = {
          id: "ai-typing-regen",
          type: "ai",
          content: "",
          timestamp: new Date(),
          isTyping: true,
        };
        return [...filtered, typingMessage];
      });
      setIsTyping(true);

      // Regenerate using API with current context
      try {
        const response = await chatApi.sendMessage(userMessage, chatHistory);
        
        if (response.success) {
          const newAIMessage: Message = {
            id: crypto.randomUUID(),
            type: "ai",
            content: response.message,
            timestamp: new Date(),
            status: "sent",
          };
          
          // Update chat history with new AI response
          const newAiChatMessage: ChatMessage = {
            role: "assistant",
            content: response.message,
            timestamp: new Date(),
          };
          
          // Replace the old AI message in history
          setChatHistory((prev) => {
            const newHistory = [...prev];
            // Find and replace the last assistant message
            for (let i = newHistory.length - 1; i >= 0; i--) {
              if (newHistory[i].role === "assistant") {
                newHistory[i] = newAiChatMessage;
                break;
              }
            }
            return newHistory;
          });
          
          setMessages((prev) => {
            const filtered = prev.filter(msg => msg.id !== "ai-typing-regen");
            return [...filtered, newAIMessage];
          });
        } else {
          throw new Error(response.message);
        }
        
        setIsTyping(false);
      } catch (error) {
        console.error("Failed to regenerate message:", error);
        setMessages((prev) => prev.filter(msg => msg.id !== "ai-typing-regen"));
        setIsTyping(false);
      }
    },
    [messages, chatHistory]
  );

  const deleteMessage = useCallback((messageId: string) => {
    startTransition(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });
  }, []);

  const clearChat = useCallback(() => {
    startTransition(() => {
      setMessages([]);
      setChatHistory([]);
    });
  }, []);

  const value = useMemo(
    () => ({
      messages,
      optimisticMessages: messages,
      isTyping,
      isPending,
      chatHistory,
      sendMessage,
      regenerateMessage,
      deleteMessage,
      clearChat,
    }),
    [
      messages,
      isTyping,
      isPending,
      chatHistory,
      sendMessage,
      regenerateMessage,
      deleteMessage,
      clearChat,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;