export interface SectorStock {
  code: string;
  name: string;
  sector: string;
  subSector?: string;
}

export interface RecommendedStock {
  code: string;
  name: string;
  reason: string;
  currentPrice: number;
  targetPrice: number;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SectorRecommendation {
  sector: string;
  stocks: RecommendedStock[];
  sectorAnalysis: string;
  marketTrend: string;
}