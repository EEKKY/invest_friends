# 투자친구 MVP 기획서

AI 에이전트 기반 개인 투자 분석 도우미 챗봇

---

## 시스템 아키텍처

**기본 데이터 (API 직접 호출)**

-   차트: KIS API (완료)
-   회사정보, 재무제표: DART API

**Agentica AI 분석 (GPT + Gemini)**

-   펀더멘털 분석: GPT-4로 재무지표 심층분석
-   기술적 분석: Gemini로 차트 패턴 분석
-   시장/업종 분석: GPT-4로 업종 동향 분석
-   종합 의견: 모든 분석 결과를 통합해서 최종 투자 조언

---

## MVP 핵심 기능

### 1단계: 디폴트 개인비서 (투자매니저 김코인)

**고정 설정값**

-   이름: 투자매니저 김코인
-   성격: 친근형 (따뜻하고 이해하기 쉬운 설명)
-   투자성향: 균형형 (중간 위험도)
-   대화스타일: 친근하면서도 전문적

**MVP에서 제외되는 기능**

-   캐릭터 커스터마이징
-   투자성향 설문조사
-   다중 성격 선택

### 2단계: Agentica 기반 투자분석 챗봇

**종목 분석 프로세스**

```typescript
// MVP 버전 종목 분석 플로우
async analyzeStockMVP(stockCode: string, userQuery: string) {
  // 1. 기본 데이터 수집
  const basicData = await Promise.all([
    this.kisService.getChartData(stockCode),      // KIS: 차트 (완료)
    this.dartService.getCompanyInfo(stockCode),   // DART: 회사정보
    this.dartService.getFinancialData(stockCode), // DART: 재무제표
  ]);

  // 2. Agentica AI 분석 (3개 Agent 병렬 처리)
  const agenticaAnalysis = await this.agentica.multiAnalyze({
    agents: [
      {
        name: "fundamental_analyst",
        model: "gpt-4",
        task: "재무제표 기반 펀더멘털 분석",
        data: basicData.financial
      },
      {
        name: "technical_analyst",
        model: "gemini-pro",
        task: "차트 기반 기술적 분석",
        data: basicData.chart
      },
      {
        name: "market_analyst",
        model: "gpt-4",
        task: "시장 동향 및 업종 분석",
        data: basicData.company
      }
    ]
  });

  // 3. 김코인 페르소나로 종합 분석
  const finalResponse = await this.generateKimCoinResponse(
    agenticaAnalysis,
    userQuery
  );

  return finalResponse;
}
```

**Agentica Agent 설계 (MVP용)**

**펀더멘털 분석 Agent (GPT-4)**

```typescript
const fundamentalAnalyst = {
    name: 'fundamental_analyst',
    model: 'gpt-4',
    systemPrompt: `
당신은 재무 분석 전문가입니다. 다음을 분석해주세요:

분석 항목:
1. 수익성: ROE, ROA, 영업이익률
2. 안정성: 부채비율, 유동비율
3. 성장성: 매출/이익 증가율
4. 가치평가: PER, PBR

결과 형식:
- 종합점수: 1-10점
- 강점 2가지
- 약점 2가지
- 한줄 요약
`,
    outputFormat: {
        score: 'number',
        strengths: ['string'],
        weaknesses: ['string'],
        summary: 'string',
    },
};
```

**기술적 분석 Agent (Gemini)**

```typescript
const technicalAnalyst = {
    name: 'technical_analyst',
    model: 'gemini-pro',
    systemPrompt: `
당신은 기술적 분석 전문가입니다. 차트를 분석해주세요:

분석 항목:
1. 현재 추세 (상승/하락/횡보)
2. 지지/저항선
3. 거래량 패턴
4. RSI, MACD 등 지표

결과 형식:
- 단기전망: 1주일 (상승/하락/중립)
- 적정 매수가격
- 목표가
- 손절선
`,
    outputFormat: {
        trend: 'string',
        shortTermView: 'string',
        buyPrice: 'number',
        targetPrice: 'number',
        stopLoss: 'number',
    },
};
```

**시장 분석 Agent (GPT-4)**

```typescript
const marketAnalyst = {
    name: 'market_analyst',
    model: 'gpt-4',
    systemPrompt: `
당신은 시장 및 업종 분석가입니다. 분석해주세요:

분석 항목:
1. 해당 업종 전망
2. 업종 내 순위/경쟁력
3. 최근 이슈나 테마
4. 시장 환경 영향

결과 형식:
- 업종전망: 긍정/부정/중립
- 경쟁력순위: 상위/중위/하위
- 핵심이슈 1가지
- 투자포인트 1가지
`,
    outputFormat: {
        industryOutlook: 'string',
        competitiveRank: 'string',
        keyIssue: 'string',
        investmentPoint: 'string',
    },
};
```

**김코인 페르소나 응답 생성**

```typescript
async generateKimCoinResponse(analysisResult: any, userQuery: string) {
  const kimCoinPrompt = `
당신은 "투자매니저 김코인"입니다.

성격 특징:
- 친근하고 따뜻한 말투 (이모지 활용)
- 복잡한 내용을 쉽게 설명
- 균형잡힌 시각으로 리스크와 기회 모두 언급
- "~해요", "~네요" 같은 친근한 반말 사용

응답 규칙:
1. 인사말로 시작
2. 분석 결과를 3단계로 요약 (펀더멘털/기술적/시장)
3. 종합 의견과 추천
4. 추가 질문 유도

분석 결과: ${JSON.stringify(analysisResult)}
사용자 질문: "${userQuery}"

김코인 스타일로 친근하게 답변해주세요.
`;

  return await this.agentica.generate({
    model: "gpt-4",
    prompt: kimCoinPrompt
  });
}
```

---

## 대화 시나리오 (MVP)

**사용자: "삼성전자 어떻게 생각해?"**

**김코인 응답:**

안녕하세요! 김코인이에요 😊

삼성전자 분석해드릴게요!

📊 **현재 상황**

-   현재가: 71,000원 (-1.2%)
-   거래량: 평균 대비 +15%

🤖 **AI 종합 분석 결과**

💰 **펀더멘털 (7.5/10점)**

-   강점: ROE 개선, 재무안정성 우수
-   약점: 중국 의존도, 메모리 변동성
-   요약: 실적 회복 추세, 안정적 기업

📈 **기술적 분석**

-   단기전망: 상승 (지지선 67,000원)
-   목표가: 78,000원
-   적정 매수가: 69,000~70,000원

🌍 **시장 환경**

-   업종전망: 긍정 (AI 반도체 수요↑)
-   경쟁력: 업계 상위권
-   핵심이슈: 메모리 업황 회복

💡 **김코인 종합 의견**

지금 괜찮은 타이밍이에요! 메모리 반도체 업황이 회복되고 있고, 기술적으로도 지지선에서 반등 신호가 보여요.

다만 한 번에 다 사지 마시고 분할매수 추천드려요. 목표 수익률 10-15% 정도로 잡으시면 좋을 것 같아요 👍

더 궁금한 점 있으시면 언제든 물어보세요!

**빠른 응답 버튼:**

-   [📈 차트 보기]
-   [📊 상세 분석]
-   [🎯 비슷한 종목]
-   [💼 포트폴리오 추가]

---

## API 설계 (MVP)

**종목 분석 API**

```typescript
POST /api/chat/analyze
Body: {
  message: string;  // "삼성전자 어떻게 생각해?"
  stockCode?: string; // 자동 추출 또는 직접 입력
}

Response: {
  reply: string;
  stockInfo: {
    name: string;
    code: string;
    currentPrice: number;
    changeRate: number;
  },
  analysisData: {
    fundamental: object;
    technical: object;
    market: object;
  },
  quickReplies: [
    { text: "차트 보기", action: "show_chart" },
    { text: "상세 분석", action: "detailed_analysis" }
  ]
}
```

**일반 채팅 API**

```typescript
POST /api/chat/message
Body: {
  message: string;
  conversationId: string;
}

Response: {
  reply: string;
  kimcoin: {
    name: "투자매니저 김코인",
    personality: "friendly"
  },
  conversationId: string;
}
```

---

## 화면 구성 (MVP)

**메인 채팅 화면**

```
┌─────────────────────────────────┐
│ 💬 투자친구      🔍 검색    ⚙️   │
├─────────────────────────────────┤
│                                 │
│  😊 안녕하세요! 김코인이에요~    │
│     어떤 종목이 궁금하신가요?     │
│                                 │
│                    삼성전자 어때? │
│                              👤 │
│                                 │
│  📊 삼성전자 분석해드릴게요!      │
│                                 │
│  현재가: 71,000원 (-1.2%)       │
│  [차트 미리보기]                │
│                                 │
│  💰 펀더멘털: 7.5/10점          │
│  📈 기술적: 상승 전망            │
│  🌍 시장: 업종 전망 긍정적        │
│                                 │
│  김코인 의견: 분할매수 추천! 👍   │
│  😊                            │
│                                 │
│  [📈차트] [📊분석] [💼추가]     │
│                                 │
├─────────────────────────────────┤
│ 💬 종목명이나 질문을 입력하세요  [📤]│
└─────────────────────────────────┘
```

**자주 묻는 질문 (하단 고정)**

```
[📊 오늘 시장?] [🔥 핫한 종목?] [❓ 도움말]
```
