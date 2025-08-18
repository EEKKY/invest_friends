import { Agentica, assertHttpController } from "@agentica/core";
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Invest Friends 백엔드 API를 Agentica로 호출하는 예제
 * 
 * 이 코드는 Swagger 문서를 통해 자동으로 API 함수를 생성하고
 * LLM이 자연어 요청을 API 호출로 변환할 수 있게 합니다.
 */
export const InvestFriendsAgent = async (): Promise<any> => {
  // OpenAI API 초기화
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });

  // Agentica 에이전트 생성
  const agent = new Agentica({
    model: "chatgpt",
    vendor: {
      api: openai,
      model: "gpt-4o-mini", // 또는 "gpt-4o"
    },
    controllers: [
      // HTTP Controller - Swagger 문서를 통한 API 통합
      assertHttpController({
        name: "InvestFriends", // 컨트롤러 이름
        model: "chatgpt" as const, // LLM 모델 타입
        
        // Swagger 문서 가져오기 (백엔드 서버가 실행 중이어야 함)
        document: await fetch(
          "http://localhost:3000/api/v1-json" // Swagger JSON endpoint
        ).then((r) => r.json()),
        
        // 실제 API 서버 연결 정보
        connection: {
          host: "http://localhost:3000", // 백엔드 서버 주소
          headers: {
            // JWT 토큰이 필요한 경우
            Authorization: "Bearer YOUR_JWT_TOKEN_HERE",
            "Content-Type": "application/json",
          },
        },
      }),
    ],
  });

  return agent;
};

// 사용 예제
async function main() {
  try {
    // 에이전트 초기화
    const agent = await InvestFriendsAgent();
    
    // 자연어로 API 호출
    console.log("🤖 Agentica Agent가 준비되었습니다!");
    
    // 예제 1: 주식 가격 조회
    const priceResponse = await agent.conversate(
      "삼성전자(005930)의 현재 주가를 알려줘"
    );
    console.log("📊 주가 정보:", priceResponse);
    
    // 예제 2: 차트 데이터 조회
    const chartResponse = await agent.conversate(
      "삼성전자의 최근 1개월 차트 데이터를 보여줘"
    );
    console.log("📈 차트 데이터:", chartResponse);
    
    // 예제 3: 재무제표 조회
    const financialResponse = await agent.conversate(
      "삼성전자의 2023년 재무제표를 조회해줘"
    );
    console.log("💰 재무 데이터:", financialResponse);
    
    // 예제 4: 여러 작업 한번에 수행
    const complexResponse = await agent.conversate(
      "삼성전자와 SK하이닉스의 현재 주가를 비교하고, " +
      "KOSPI 지수와 함께 보여줘. " +
      "그리고 두 회사의 PER과 PBR도 비교해줘."
    );
    console.log("🔍 복합 분석:", complexResponse);
    
  } catch (error) {
    console.error("❌ 에러 발생:", error);
  }
}

// 프로그램 실행
if (require.main === module) {
  main().catch(console.error);
}

/**
 * Agentica의 주요 기능:
 * 
 * 1. **자동 함수 매핑**: Swagger 문서에서 자동으로 함수 생성
 * 2. **자연어 이해**: "삼성전자 주가 알려줘" → API 호출로 변환
 * 3. **타입 검증**: LLM이 잘못된 파라미터를 전달하면 자동 수정
 * 4. **에러 처리**: API 에러를 이해하고 재시도
 * 
 * Swagger에 정의된 모든 엔드포인트를 자연어로 호출 가능:
 * - GET /kis/price - 주가 조회
 * - GET /kis/time-daily-chart - 일봉 차트
 * - GET /kis/time-item-chart - 분봉 차트
 * - GET /auth - 사용자 목록
 * - POST /auth - 회원가입
 * - POST /login - 로그인
 * - GET /sociallogin/* - 소셜 로그인
 */