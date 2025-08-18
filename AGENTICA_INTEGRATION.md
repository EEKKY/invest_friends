# Agentica 통합 가이드

이 문서는 Invest Friends 프로젝트에서 Agentica를 사용하여 자연어로 백엔드 API를 호출하는 방법을 설명합니다.

## Agentica란?

Agentica는 LLM을 사용하여 자연어 요청을 API 호출로 자동 변환하는 프레임워크입니다. Swagger/OpenAPI 문서를 통해 API 스키마를 자동으로 학습하고, 사용자의 자연어 입력을 적절한 API 호출로 매핑합니다.

## 주요 기능

- **자동 함수 매핑**: Swagger 문서에서 자동으로 함수 생성
- **자연어 이해**: "삼성전자 주가 알려줘" → `/kis/price` API 호출로 변환
- **타입 검증**: LLM이 잘못된 파라미터를 전달하면 자동 수정
- **에러 처리**: API 에러를 이해하고 재시도

## 설치 방법

### 백엔드 (이미 완료됨)

백엔드는 이미 Swagger 문서가 설정되어 있습니다:
- Swagger UI: http://localhost:3000/api/v1
- Swagger JSON: http://localhost:3000/api/v1-json

### 프론트엔드

```bash
cd frontend
pnpm add @agentica/core openai
```

## 사용 방법

### 1. 백엔드에서 Agentica 사용 (Node.js)

```typescript
// backend/examples/agentica-client.ts
import { Agentica, assertHttpController } from "@agentica/core";
import OpenAI from "openai";

const agent = new Agentica({
  model: "chatgpt",
  vendor: {
    api: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    model: "gpt-4o-mini"
  },
  controllers: [
    assertHttpController({
      name: "InvestFriends",
      document: await fetch("http://localhost:3000/api/v1-json").then(r => r.json()),
      connection: {
        host: "http://localhost:3000",
        headers: {
          Authorization: "Bearer YOUR_JWT_TOKEN"
        }
      }
    })
  ]
});

// 자연어로 API 호출
const response = await agent.conversate("삼성전자의 현재 주가를 알려줘");
```

### 2. 프론트엔드에서 Agentica 사용 (React)

```typescript
// frontend/src/services/agentica/index.ts
import { agenticaService } from './services/agentica';

// 초기화 (앱 시작시 1회)
await agenticaService.initialize(openAiKey, jwtToken);

// 자연어로 API 호출
const response = await agenticaService.processMessage("삼성전자 주가 알려줘");
```

### 3. Chat Context와 통합

```typescript
// frontend/src/contexts/chat-context-with-agentica.tsx
const processWithAgentica = async (content: string) => {
  const response = await agenticaService.processMessage(content);
  return response;
};
```

## 지원되는 자연어 명령 예시

### 주가 조회
- "삼성전자 주가 알려줘"
- "005930 현재가는?"
- "SK하이닉스 가격 조회"

### 차트 데이터
- "삼성전자 최근 1개월 차트"
- "KOSPI 지수 일봉 차트 보여줘"
- "어제 삼성전자 분봉 데이터"

### 재무제표
- "삼성전자 2023년 재무제표"
- "SK하이닉스 실적 조회"
- "LG전자 매출액 알려줘"

### 복합 분석
- "삼성전자와 SK하이닉스 주가 비교해줘"
- "KOSPI와 KOSDAQ 지수 함께 보여줘"
- "반도체 관련주 PER 비교 분석"

## API 엔드포인트 매핑

Agentica는 다음 Swagger 엔드포인트를 자동으로 이해하고 호출합니다:

| 자연어 패턴 | API 엔드포인트 | 설명 |
|------------|---------------|------|
| "주가", "가격" | `GET /kis/price` | 현재가 조회 |
| "차트", "그래프" | `GET /kis/time-daily-chart` | 일봉 차트 |
| "분봉" | `GET /kis/time-item-chart` | 분봉 차트 |
| "재무", "실적" | `GET /dart/financial-statement` | 재무제표 |
| "로그인" | `POST /login` | 사용자 로그인 |
| "회원가입" | `POST /auth` | 사용자 등록 |

## 환경 변수 설정

### 백엔드 (.env)
```bash
# 이미 설정됨
JWT_SECRET=your-jwt-secret
KIS_APP_KEY=your-kis-key
DART_API_KEY=your-dart-key
```

### 프론트엔드 (.env)
```bash
VITE_API_URL=http://localhost:3000
VITE_OPENAI_API_KEY=your-openai-api-key
```

## 보안 고려사항

1. **API 키 보호**: OpenAI API 키는 환경 변수로 관리
2. **JWT 토큰**: 인증이 필요한 API는 JWT 토큰 포함
3. **CORS 설정**: 백엔드에서 적절한 CORS 정책 설정
4. **Rate Limiting**: API 호출 횟수 제한 고려

## 문제 해결

### Agentica가 API를 찾지 못하는 경우
1. Swagger 문서가 올바르게 노출되는지 확인: http://localhost:3000/api/v1
2. ApiOperation, ApiResponse 데코레이터가 제대로 설정되었는지 확인
3. DTO에 ApiProperty가 정의되었는지 확인

### 인증 오류
1. JWT 토큰이 유효한지 확인
2. Authorization 헤더가 올바르게 설정되었는지 확인
3. @ApiBearerAuth() 데코레이터가 컨트롤러에 있는지 확인

### 타입 오류
1. Swagger 문서의 스키마가 실제 API와 일치하는지 확인
2. DTO 검증 규칙이 너무 엄격하지 않은지 확인

## 참고 문서

- [Agentica 공식 문서](https://wrtnlabs.io/agentica/docs)
- [Agentica Swagger Controller](https://wrtnlabs.io/agentica/docs/core/controller/swagger/)
- [NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [OpenAI API](https://platform.openai.com/docs)

## 예제 실행

```bash
# 백엔드 서버 시작
cd backend
pnpm dev

# 별도 터미널에서 Agentica 예제 실행
cd backend
node -r ts-node/register examples/agentica-client.ts

# 또는 프론트엔드에서 테스트
cd frontend
pnpm dev
# 브라우저에서 채팅 인터페이스 사용
```

## 다음 단계

1. OpenAI API 키 발급
2. 프론트엔드에 Agentica 패키지 설치
3. `chat-context-with-agentica.tsx`를 `chat-context.tsx`로 교체
4. 환경 변수 설정
5. 채팅 인터페이스에서 자연어로 API 호출 테스트