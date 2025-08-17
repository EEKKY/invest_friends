import {
  useState,
  useCallback,
  useTransition,
  useMemo,
} from "react";
import { ChatContext, type Message, type ChatProviderProps } from "./chat-context.types";

const ChatProvider = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const [isTyping, setIsTyping] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Simulate AI response
  const simulateAIResponse = useCallback(async (userMessage: string): Promise<Message> => {
    // Simulate network delay and processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate mock AI response based on user input
    const responses: Record<string, string> = {
      default: `네, "${userMessage}"에 대해 답변드리겠습니다. 

**주요 포인트:**
1. 먼저 문제를 정확히 파악하는 것이 중요합니다
2. 단계별로 접근하여 해결책을 찾아보세요
3. 필요하다면 추가 정보를 요청하셔도 좋습니다

더 구체적인 도움이 필요하시면 말씀해 주세요!`,
      react: `React에서 상태 관리 방법은 여러 가지가 있어요:

**1. 로컬 상태 (useState, useReducer)**
- 컴포넌트 내부에서만 사용하는 간단한 상태
- 폼 입력, 토글 상태 등

**2. 전역 상태 관리**
- **Context API**: React 내장, 간단한 전역 상태
- **Redux Toolkit**: 복잡한 앱, 디버깅 도구 강력
- **Zustand**: 가볍고 사용하기 쉬움
- **Jotai**: 원자 단위 상태 관리

**3. 서버 상태**
- **React Query/TanStack Query**: 서버 데이터 캐싱
- **SWR**: 간단한 데이터 페칭

어떤 종류의 프로젝트를 하고 계신가요?`,
    };

    const responseContent = userMessage.toLowerCase().includes("react")
      ? responses.react
      : responses.default;

    return {
      id: crypto.randomUUID(),
      type: "ai",
      content: responseContent,
      timestamp: new Date(),
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      // Prevent duplicate messages
      const userMessageId = crypto.randomUUID();
      
      const userMessage: Message = {
        id: userMessageId,
        type: "user",
        content,
        timestamp: new Date(),
        status: "sent",
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

      // Simulate AI processing
      try {
        const aiResponse = await simulateAIResponse(content);
        
        // Replace typing message with actual response
        setMessages((prev) => {
          const filtered = prev.filter(msg => msg.id !== "ai-typing");
          // Create new array to trigger re-render
          return [...filtered, { ...aiResponse }];
        });
        setIsTyping(false);
      } catch (error) {
        console.error("Failed to get AI response:", error);
        // Remove typing message on error
        setMessages((prev) => prev.filter(msg => msg.id !== "ai-typing"));
        setIsTyping(false);
      }
    },
    [simulateAIResponse]
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

      // Generate new response
      setTimeout(async () => {
        try {
          const newAIResponse = await simulateAIResponse(userMessage);
          setMessages((prev) => {
            const filtered = prev.filter(msg => msg.id !== "ai-typing-regen");
            return [...filtered, newAIResponse];
          });
          setIsTyping(false);
        } catch (error) {
          console.error("Failed to regenerate message:", error);
          setMessages((prev) => prev.filter(msg => msg.id !== "ai-typing-regen"));
          setIsTyping(false);
        }
      }, 100);
    },
    [messages, simulateAIResponse]
  );

  const deleteMessage = useCallback((messageId: string) => {
    startTransition(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });
  }, []);

  const clearChat = useCallback(() => {
    startTransition(() => {
      setMessages([]);
    });
  }, []);

  const value = useMemo(
    () => ({
      messages,
      optimisticMessages: messages,
      isTyping,
      isPending,
      sendMessage,
      regenerateMessage,
      deleteMessage,
      clearChat,
    }),
    [
      messages,
      isTyping,
      isPending,
      sendMessage,
      regenerateMessage,
      deleteMessage,
      clearChat,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;