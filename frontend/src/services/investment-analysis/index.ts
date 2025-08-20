import { api } from "../axios";

export interface ChartData {
  dailyChart: any;
  itemChart?: any;
  indexChart?: any;
  movingAverages?: {
    ma5?: number[];
    ma20?: number[];
    ma60?: number[];
  };
  technicalIndicators?: {
    rsi?: number[];
    macd?: number[];
    bollinger?: {
      upper: number[];
      middle: number[];
      lower: number[];
    };
  };
}

export interface CompanyInfo {
  stockCode: string;
  companyName: string;
  industry: string;
  listingDate: string;
  marketCap: number;
  sharesOutstanding: number;
  description: string;
  ceo: string;
  website: string;
}

export interface InvestmentMetrics {
  per: number;
  pbr: number;
  roe: number;
  eps: number;
  bps: number;
  debtRatio: number;
  currentRatio: number;
  operatingMargin: number;
}

export interface PerformanceConsensus {
  quarterlyResults: Array<{
    period: string;
    revenue: number;
    operatingProfit: number;
    netProfit: number;
    yoyGrowth: number;
  }>;
  annualResults: Array<{
    year: string;
    revenue: number;
    operatingProfit: number;
    netProfit: number;
    yoyGrowth: number;
  }>;
  consensus: {
    targetPrice: number;
    recommendation: string;
    numberOfAnalysts: number;
    updatedAt: string;
  };
}

export interface DividendInfo {
  dividendPerShare: number;
  dividendYield: number;
  payoutRatio: number;
  schedule: {
    exDividendDate?: string;
    recordDate?: string;
    paymentDate?: string;
  };
  history: Array<{
    year: string;
    dividendPerShare: number;
    dividendYield: number;
  }>;
}

export interface PeerComparison {
  industryAverages: {
    per: number;
    pbr: number;
    roe: number;
    dividendYield: number;
  };
  ranking: {
    byMarketCap: number;
    byRevenue: number;
    byProfit: number;
    totalCompanies: number;
  };
  competitors: Array<{
    name: string;
    stockCode: string;
    marketCap: number;
    per: number;
    pbr: number;
    roe: number;
  }>;
}

export interface AnalystNews {
  analystReports: Array<{
    title: string;
    firm: string;
    analyst: string;
    date: string;
    targetPrice: number;
    recommendation: string;
    summary: string;
  }>;
  news: Array<{
    title: string;
    source: string;
    date: string;
    url: string;
    summary: string;
    sentiment: "positive" | "neutral" | "negative";
  }>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
    overallSentiment: string;
  };
}

export interface FinancialStatements {
  incomeStatement: Array<{
    period: string;
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    netIncome: number;
  }>;
  balanceSheet: Array<{
    period: string;
    totalAssets: number;
    currentAssets: number;
    totalLiabilities: number;
    currentLiabilities: number;
    totalEquity: number;
  }>;
  cashFlow: Array<{
    period: string;
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    freeCashFlow: number;
  }>;
}

export interface RiskAnalysis {
  volatility: {
    daily: number;
    weekly: number;
    monthly: number;
    annual: number;
    beta: number;
  };
  financialRisk: {
    debtToEquity: number;
    interestCoverage: number;
    quickRatio: number;
    altmanZScore: number;
    riskLevel: "low" | "medium" | "high";
  };
  riskFactors: Array<{
    category: string;
    description: string;
    impact: "low" | "medium" | "high";
    probability: "low" | "medium" | "high";
  }>;
  aiAnalysis: {
    summary: string;
    score: number;
    recommendations: string[];
  };
}

export interface InvestmentAnalysisResponse {
  stockCode: string;
  analysisDate: string;
  chartData: ChartData;
  companyInfo: CompanyInfo;
  investmentMetrics: InvestmentMetrics;
  performanceConsensus: PerformanceConsensus;
  dividendInfo: DividendInfo;
  peerComparison: PeerComparison;
  analystNews: AnalystNews;
  financialStatements: FinancialStatements;
  riskAnalysis: RiskAnalysis;
}

export const investmentAnalysisService = {
  async getAnalysis(
    stockCode: string,
    period?: string,
    sections?: string
  ): Promise<InvestmentAnalysisResponse> {
    const params = new URLSearchParams({ stockCode });
    if (period) params.append("period", period);
    if (sections) params.append("sections", sections);

    const response = await api.get(`/investment-analysis?${params.toString()}`);
    return response.data;
  },

  // Individual endpoint methods with proper section mapping
  async getChart(stockCode: string): Promise<Partial<InvestmentAnalysisResponse>> {
    const response = await api.get(`/investment-analysis?stockCode=${stockCode}&sections=chart`, {
      timeout: 30000, // 30 second timeout
    });
    return response.data;
  },

  async getCompany(stockCode: string): Promise<Partial<InvestmentAnalysisResponse>> {
    const response = await api.get(`/investment-analysis?stockCode=${stockCode}&sections=company`, {
      timeout: 30000, // 30 seconds for company info
    });
    return response.data;
  },

  async getMetrics(stockCode: string): Promise<Partial<InvestmentAnalysisResponse>> {
    const response = await api.get(`/investment-analysis?stockCode=${stockCode}&sections=metrics,peer`, {
      timeout: 45000, // 45 seconds for metrics and peer comparison
    });
    return response.data;
  },

  async getFinancial(stockCode: string): Promise<Partial<InvestmentAnalysisResponse>> {
    const response = await api.get(`/investment-analysis?stockCode=${stockCode}&sections=financial`, {
      timeout: 45000, // 45 seconds for financial data
    });
    return response.data;
  },

  async getDividend(stockCode: string): Promise<Partial<InvestmentAnalysisResponse>> {
    const response = await api.get(`/investment-analysis?stockCode=${stockCode}&sections=dividend`, {
      timeout: 30000, // 30 seconds for dividend
    });
    return response.data;
  },

  async getNews(stockCode: string): Promise<Partial<InvestmentAnalysisResponse>> {
    const response = await api.get(`/investment-analysis?stockCode=${stockCode}&sections=news`, {
      timeout: 45000, // 45 seconds for news (includes GPT analysis)
    });
    return response.data;
  },

  async getRisk(stockCode: string): Promise<Partial<InvestmentAnalysisResponse>> {
    const response = await api.get(`/investment-analysis?stockCode=${stockCode}&sections=risk`, {
      timeout: 60000, // 60 second timeout for risk analysis (includes OpenAI analysis)
    });
    return response.data;
  },

  // Fetch all data from individual endpoints
  async getAnalysisByParts(stockCode: string): Promise<InvestmentAnalysisResponse> {
    // Fetch all parts in parallel with individual error handling
    const [chartData, companyData, metricsData, financialData, dividendData, newsData, riskData] = await Promise.all([
      this.getChart(stockCode).catch(err => {
        console.error('Failed to fetch chart data:', err);
        return {} as Partial<InvestmentAnalysisResponse>;
      }),
      this.getCompany(stockCode).catch(err => {
        console.error('Failed to fetch company data:', err);
        return {} as Partial<InvestmentAnalysisResponse>;
      }),
      this.getMetrics(stockCode).catch(err => {
        console.error('Failed to fetch metrics data:', err);
        return {} as Partial<InvestmentAnalysisResponse>;
      }),
      this.getFinancial(stockCode).catch(err => {
        console.error('Failed to fetch financial data:', err);
        return {} as Partial<InvestmentAnalysisResponse>;
      }),
      this.getDividend(stockCode).catch(err => {
        console.error('Failed to fetch dividend data:', err);
        return {} as Partial<InvestmentAnalysisResponse>;
      }),
      this.getNews(stockCode).catch(err => {
        console.error('Failed to fetch news data:', err);
        return {} as Partial<InvestmentAnalysisResponse>;
      }),
      this.getRisk(stockCode).catch(err => {
        console.error('Failed to fetch risk data:', err);
        return {} as Partial<InvestmentAnalysisResponse>;
      }),
    ]);

    // Combine all data
    return {
      stockCode,
      analysisDate: new Date().toISOString(),
      chartData: chartData?.chartData || {} as ChartData,
      companyInfo: companyData?.companyInfo || {} as CompanyInfo,
      investmentMetrics: metricsData?.investmentMetrics || {} as InvestmentMetrics,
      performanceConsensus: metricsData?.performanceConsensus || {} as PerformanceConsensus,
      dividendInfo: dividendData?.dividendInfo || {} as DividendInfo,
      peerComparison: metricsData?.peerComparison || {} as PeerComparison,
      analystNews: newsData?.analystNews || {} as AnalystNews,
      financialStatements: financialData?.financialStatements || {} as FinancialStatements,
      riskAnalysis: riskData?.riskAnalysis || {} as RiskAnalysis,
    };
  },
};
