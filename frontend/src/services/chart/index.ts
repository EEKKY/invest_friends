import { api } from "../axios";

export interface TimeChartItemDto {
  stck_cntg_hour: string; // date or time
  stck_oprc: string; // open price
  stck_hgpr: string; // high price
  stck_lwpr: string; // low price
  stck_prpr: string; // close price
  cntg_vol: string; // volume traded
  acml_vol: string; // accumulated volume
}

export interface ChartData {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output: TimeChartItemDto[];
}

export interface ChartResponse {
  stock: ChartData | null;
  index: ChartData | null;
  status: number;
  msg: string;
}

export interface FinancialData {
  corpCode: string;
  year: number;
  revenue: number;
  operatingProfit: number;
  netIncome: number;
  totalAssets: number;
  totalEquity: number;
  eps: number;
  roe: number;
  roa: number;
}

export interface GetChartParams {
  FID_COND_MRKT_DIV_CODE: "J";
  FID_INPUT_ISCD: string;
  FID_PERIOD_DIV_CODE: "D" | "W" | "M" | "Y";
  FID_ORG_ADJ_PRC?: "0" | "1";
  FID_PW_DATA_INCU_YN?: "Y" | "N";
  interval?: "1m" | "5m" | "30m" | "60m";
  type: "item" | "daily";
}

export interface GetFinancialParams {
  corpCode: string;
  year: number;
}

export const chartApi = {
  // 주식 차트 데이터 조회
  getStockChart: async (params: GetChartParams): Promise<ChartResponse> => {
    if (params.type === "daily") {
      const { type, FID_PW_DATA_INCU_YN, ...rest } = params;
      const response = await api.get("/kis/daily-chart", { params: rest });
      return response.data;
    } else {
      const { type, FID_ORG_ADJ_PRC, FID_PERIOD_DIV_CODE, ...rest } = params;
      const response = await api.get("/kis/item-chart", { params: rest });
      return response.data;
    }
  },

  // 재무 데이터 조회
  getFinancialData: async (
    params: GetFinancialParams
  ): Promise<FinancialData> => {
    const response = await api.get("/dart/financial", { params });
    return response.data;
  },
};
