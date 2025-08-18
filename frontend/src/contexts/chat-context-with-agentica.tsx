import {
  useState,
  useCallback,
  useTransition,
  useMemo,
} from "react";
import { ChatContext, type Message, type ChatProviderProps } from "./chat-context.types";

/**
 * Agentica를 통합한 ChatProvider 예제
 * 
 * 이 파일은 Agentica를 사용하여 백엔드 API와 통신하는 방법을 보여줍니다.
 * 실제 사용하려면:
 * 1. pnpm add @agentica/core openai
 * 2. OpenAI API 키 설정
 * 3. 이 파일을 chat-context.tsx로 교체
 */

// Agentica 서비스 임포트 (실제 구현시 주석 해제)
// import { agenticaService } from '../services/agentica';

const ChatProviderWithAgentica = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * Agentica를 사용한 메시지 처리
   * 백엔드 Swagger 문서를 통해 자동으로 API를 호출합니다
   */
  const processWithAgentica = useCallback(async (content: string): Promise<string> => {
    // 실제 Agentica 구현
    // try {
    //   // Agentica 초기화 (앱 시작시 1회만 수행)
    //   if (!agenticaService.isInitialized) {
    //     const openAiKey = process.env.REACT_APP_OPENAI_API_KEY;
    //     const jwtToken = localStorage.getItem('accessToken');
    //     await agenticaService.initialize(openAiKey, jwtToken);
    //   }
    //
    //   // 자연어 메시지를 백엔드 API 호출로 변환
    //   const response = await agenticaService.processMessage(content);
    //   
    //   // 응답 포맷팅
    //   if (typeof response === 'object') {
    //     return JSON.stringify(response, null, 2);
    //   }
    //   return response;
    // } catch (error) {
    //   console.error('Agentica 처리 실패:', error);
    //   throw error;
    // }

    // 시뮬레이션 (Agentica가 실제로 처리할 내용)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 메시지 패턴 분석
    const lowerContent = content.toLowerCase();
    
    // 주가 조회 패턴
    if (lowerContent.includes('주가') || lowerContent.includes('가격')) {
      return `📊 **주가 정보 조회**
      
삼성전자 (005930)
- 현재가: 78,900원
- 전일 대비: +1,100원 (+1.41%)
- 거래량: 12,345,678주
- PER: 13.12
- PBR: 1.25

*Agentica가 /kis/price API를 자동 호출하여 조회한 결과입니다*`;
    }
    
    // 차트 데이터 패턴
    if (lowerContent.includes('차트') || lowerContent.includes('그래프')) {
      return `📈 **차트 데이터**
      
최근 30일 일봉 데이터:
- 최고가: 82,000원
- 최저가: 76,500원
- 평균가: 79,200원
- 변동성: 7.2%

*Agentica가 /kis/time-daily-chart API를 자동 호출하여 조회한 결과입니다*`;
    }
    
    // 재무제표 패턴
    if (lowerContent.includes('재무') || lowerContent.includes('실적')) {
      return `💰 **재무제표 정보**
      
2023년 연간 실적:
- 매출액: 302조 2,314억원
- 영업이익: 6조 5,673억원
- 당기순이익: 15조 4,928억원
- 부채비율: 42.3%

*Agentica가 /dart/financial-statement API를 자동 호출하여 조회한 결과입니다*`;
    }
    
    // 복합 분석 패턴
    if (lowerContent.includes('비교') || lowerContent.includes('분석')) {
      return `🔍 **종합 분석 결과**
      
삼성전자 vs SK하이닉스 비교:
- 삼성전자: 78,900원 (PER 13.12)
- SK하이닉스: 134,500원 (PER 8.45)

KOSPI 지수: 2,490.80 (+0.85%)

투자 의견: 
- 삼성전자는 안정적인 실적 기반
- SK하이닉스는 메모리 반도체 시장 회복 기대

*Agentica가 여러 API를 조합하여 분석한 결과입니다*`;
    }
    
    // 기본 응답
    return `네, "${content}"에 대해 분석해드리겠습니다.

백엔드 API를 통해 실시간 데이터를 조회하고 있습니다...

*Agentica를 통해 자연어로 모든 백엔드 API를 호출할 수 있습니다*`;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return;

      setIsSending(true);
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: content.trim(),
        timestamp: new Date(),
        status: "sending",
      };

      setMessages((prev) => [...prev, userMessage]);

      startTransition(async () => {
        setIsTyping(true);

        // AI 응답 준비
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: "AI가 분석중입니다...",
          timestamp: new Date(),
          isTyping: true,
        };
        setMessages((prev) => [...prev, aiMessage]);

        try {
          // Agentica를 통한 백엔드 API 호출
          const response = await processWithAgentica(content);

          // 응답 업데이트
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessage.id
                ? {
                    ...msg,
                    content: response,
                    isTyping: false,
                  }
                : msg
            )
          );
        } catch (error) {
          console.error("메시지 전송 실패:", error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessage.id
                ? {
                    ...msg,
                    content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
                    isTyping: false,
                  }
                : msg
            )
          );
        } finally {
          setIsTyping(false);
          setIsSending(false);
        }
      });
    },
    [isSending, processWithAgentica]
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

      // Remove old AI message
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      
      // Send message again
      await sendMessage(userMessage);
    },
    [messages, sendMessage]
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
      isPending: isPending || isSending,
      sendMessage,
      regenerateMessage,
      deleteMessage,
      clearChat,
    }),
    [
      messages,
      isTyping,
      isPending,
      isSending,
      sendMessage,
      regenerateMessage,
      deleteMessage,
      clearChat,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProviderWithAgentica;