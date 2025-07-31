import { api } from '../axios';

export interface ChartDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface ChartResponse {
    ticker: string;
    period: string;
    startDate: string;
    endDate: string;
    data: ChartDataPoint[];
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
    ticker: string;
    period: '1d' | '1w' | '1m' | '1y';
    startDate: string;
    endDate: string;
}

export interface GetFinancialParams {
    corpCode: string;
    year: number;
}

export interface IndexDataPoint {
    date: string;
    index: number;
    change: number;
    changeRate: number;
    volume: number;
    tradingValue: number;
}

export interface IndexChartResponse {
    indexCode: string;
    indexName: string;
    period: string;
    startDate: string;
    endDate: string;
    data: IndexDataPoint[];
}

export interface GetIndexChartParams {
    indexCode: '0001' | '1001'; // 0001: KOSPI, 1001: KOSDAQ
    period: 'D' | 'W' | 'M';
    startDate: string;
    endDate: string;
}

export const chartApi = {
    // 주식 차트 데이터 조회
    getStockChart: async (params: GetChartParams): Promise<ChartResponse> => {
        const response = await api.get('/chart/stock', { params });
        return response.data;
    },

    // 재무 데이터 조회
    getFinancialData: async (params: GetFinancialParams): Promise<FinancialData> => {
        const response = await api.get('/chart/financial', { params });
        return response.data;
    },

    // 지수 차트 데이터 조회
    getIndexChart: async (params: GetIndexChartParams): Promise<IndexChartResponse> => {
        const response = await api.get('/kis/index-chart', { 
            params: {
                FID_INPUT_ISCD: params.indexCode,
                FID_INPUT_DATE_1: params.startDate,
                FID_INPUT_DATE_2: params.endDate,
                FID_PERIOD_DIV_CODE: params.period,
            }
        });
        
        // Transform KIS API response to our interface
        const indexName = params.indexCode === '0001' ? 'KOSPI' : 'KOSDAQ';
        
        return {
            indexCode: params.indexCode,
            indexName,
            period: params.period,
            startDate: params.startDate,
            endDate: params.endDate,
            data: response.data.output2.map((item: any) => ({
                date: item.stck_bsop_date,
                index: parseFloat(item.indx_prpr),
                change: parseFloat(item.indx_prdy_vrss),
                changeRate: parseFloat(item.indx_prdy_ctrt),
                volume: parseFloat(item.acml_vol),
                tradingValue: parseFloat(item.acml_tr_pbmn),
            })),
        };
    },
};
