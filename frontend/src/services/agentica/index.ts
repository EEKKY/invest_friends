import { useState, useEffect, useCallback } from 'react';
import { Agentica, assertHttpController } from '@agentica/core';
import OpenAI from 'openai';

/**
 * Agentica 에이전트를 사용한 백엔드 API 통합
 * 
 * 이 서비스는 자연어 요청을 받아서 백엔드 API를 자동으로 호출합니다.
 * Swagger 문서를 통해 API 스키마를 자동으로 학습하고 매핑합니다.
 */
export class AgenticaService {
  private agent: Agentica<"chatgpt"> | null = null;
  private initialized = false;

  /**
   * Agentica 에이전트 초기화
   * OpenAI API 키는 환경변수 또는 설정에서 가져옵니다
   */
  async initialize(openApiKey: string, jwtToken?: string): Promise<void> {
    if (this.initialized) return;

    try {
      // OpenAI 클라이언트 생성
      const openai = new OpenAI({ 
        apiKey: openApiKey,
        dangerouslyAllowBrowser: true // 브라우저에서 실행 허용
      });

      // 백엔드 Swagger 문서 가져오기
      const swaggerDoc = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1-json`
      ).then(r => r.json());

      // Agentica 에이전트 생성
      this.agent = new Agentica({
        model: "chatgpt" as const,
        vendor: {
          api: openai,
          model: "gpt-4o-mini", // 빠른 응답을 위한 경량 모델
        },
        controllers: [
          assertHttpController({
            name: "InvestFriends",
            model: "chatgpt" as const,
            document: swaggerDoc,
            connection: {
              host: import.meta.env.VITE_API_URL || "http://localhost:3000",
              headers: {
                ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
                "Content-Type": "application/json",
              },
            },
          }),
        ],
      });

      this.initialized = true;
      console.log("✅ Agentica 에이전트가 초기화되었습니다");
    } catch (error) {
      console.error("❌ Agentica 초기화 실패:", error);
      throw error;
    }
  }

  /**
   * 자연어 메시지를 처리하여 적절한 API를 호출
   * @param message 사용자의 자연어 요청
   * @returns API 응답 데이터
   */
  async processMessage(message: string): Promise<any> {
    if (!this.agent) {
      throw new Error("Agentica가 초기화되지 않았습니다. initialize()를 먼저 호출하세요.");
    }

    try {
      // 자연어를 API 호출로 변환하여 실행
      const response = await this.agent.conversate(message);
      return response;
    } catch (error) {
      console.error("메시지 처리 중 오류:", error);
      throw error;
    }
  }

  /**
   * 주가 정보 조회 (특화 메서드)
   */
  async getStockPrice(stockName: string): Promise<any> {
    return this.processMessage(`${stockName}의 현재 주가를 알려줘`);
  }

  /**
   * 차트 데이터 조회 (특화 메서드)
   */
  async getChartData(stockName: string, period: string = "1개월"): Promise<any> {
    return this.processMessage(`${stockName}의 최근 ${period} 차트 데이터를 보여줘`);
  }

  /**
   * 재무제표 조회 (특화 메서드)
   */
  async getFinancialStatement(stockName: string, year?: number): Promise<any> {
    const yearStr = year ? `${year}년` : "최근";
    return this.processMessage(`${stockName}의 ${yearStr} 재무제표를 조회해줘`);
  }

  /**
   * 복합 분석 요청
   */
  async analyzeStocks(request: string): Promise<any> {
    return this.processMessage(request);
  }
}

// 싱글톤 인스턴스
export const agenticaService = new AgenticaService();

/**
 * React Hook for Agentica
 */
export function useAgentica(openApiKey?: string) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (openApiKey) {
      const initAgent = async () => {
        try {
          const token = localStorage.getItem('accessToken');
          await agenticaService.initialize(openApiKey, token || undefined);
          setIsInitialized(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : '초기화 실패');
        }
      };
      initAgent();
    }
  }, [openApiKey]);

  const sendMessage = useCallback(async (message: string) => {
    if (!isInitialized) {
      throw new Error('Agentica가 초기화되지 않았습니다');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await agenticaService.processMessage(message);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '메시지 처리 실패';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  return {
    isInitialized,
    isLoading,
    error,
    sendMessage,
    getStockPrice: agenticaService.getStockPrice.bind(agenticaService),
    getChartData: agenticaService.getChartData.bind(agenticaService),
    getFinancialStatement: agenticaService.getFinancialStatement.bind(agenticaService),
    analyzeStocks: agenticaService.analyzeStocks.bind(agenticaService),
  };
}