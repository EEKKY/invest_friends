import { api } from '../axios';

export interface StockChartData {
  output1?: any;
  output2?: Array<{
    stck_bsop_date: string;
    stck_clpr: string;
    stck_oprc: string;
    stck_hgpr: string;
    stck_lwpr: string;
    acml_vol: string;
    acml_tr_pbmn: string;
    flng_cls_code: string;
    prtt_rate: string;
    mod_yn: string;
    prdy_vrss_sign: string;
    prdy_vrss: string;
    revl_issu_reas: string;
  }>;
  rt_cd?: string;
  msg_cd?: string;
  msg1?: string;
}

export interface IndexChartData {
  output1?: any;
  output2?: Array<{
    bsop_date: string;
    bstp_nmix_prpr: string;
    bstp_nmix_prdy_vrss: string;
    prdy_vrss_sign: string;
    bstp_nmix_prdy_ctrt: string;
    acml_vol: string;
    acml_tr_pbmn: string;
    mod_yn: string;
  }>;
  rt_cd?: string;
  msg_cd?: string;
  msg1?: string;
}

export const chartService = {
  async getStockChart(stockCode: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<StockChartData> {
    try {
      const response = await api.get(`/stock/kis/chart/${stockCode}`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stock chart:', error);
      throw error;
    }
  },

  async getIndexChart(indexCode: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<IndexChartData> {
    try {
      const response = await api.get(`/stock/kis/index/${indexCode}`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch index chart:', error);
      throw error;
    }
  },

  async getFinancialStatements(corpCode: string, year: string) {
    try {
      const response = await api.get(`/stock/dart/financial-statements`, {
        params: { corpCode, year }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch financial statements:', error);
      throw error;
    }
  },

  async getItemChart(stockCode: string) {
    try {
      const response = await api.get(`/stock/kis/item/${stockCode}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch item chart:', error);
      throw error;
    }
  },

  async getTimeChart(stockCode: string) {
    try {
      const response = await api.get(`/stock/kis/time/${stockCode}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch time chart:', error);
      throw error;
    }
  }
};