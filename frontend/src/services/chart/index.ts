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
        
        console.log('Index API response:', {
            status: response.data.rt_cd,
            message: response.data.msg1,
            dataLength: response.data.output2?.length,
            sampleData: response.data.output2?.slice(0, 2)
        });
        
        // Transform KIS API response to our interface
        const indexName = params.indexCode === '0001' ? 'KOSPI' : 'KOSDAQ';
        
        // 데이터를 날짜 순으로 정렬하고 전일 대비 계산
        interface KisIndexItem {
            stck_bsop_date: string;
            indx_prpr: string;
            acml_vol: string;
            acml_tr_pbmn: string;
        }
        
        const sortedData = response.data.output2
            .map((item: KisIndexItem) => {
                const index = parseFloat(item.indx_prpr);
                console.log('Parsing index data:', {
                    raw: item.indx_prpr,
                    parsed: index,
                    isValid: !isNaN(index) && index > 0
                });
                return {
                    date: item.stck_bsop_date,
                    index: isNaN(index) ? 0 : index,
                    volume: parseFloat(item.acml_vol) || 0,
                    tradingValue: parseFloat(item.acml_tr_pbmn) || 0,
                };
            })
            .sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));

        // 전일 대비 계산
        const dataWithChange = sortedData.map((item: { date: string; index: number; volume: number; tradingValue: number }, index: number) => {
            let change = 0;
            let changeRate = 0;
            
            if (index > 0) {
                const prevIndex = sortedData[index - 1].index;
                change = item.index - prevIndex;
                changeRate = prevIndex > 0 ? (change / prevIndex) * 100 : 0;
            }
            
            return {
                ...item,
                change: change,
                changeRate: changeRate,
            };
        });

        return {
            indexCode: params.indexCode,
            indexName,
            period: params.period,
            startDate: params.startDate,
            endDate: params.endDate,
            data: dataWithChange,
        };
    },
};
