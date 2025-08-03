import { Injectable, Logger } from '@nestjs/common';
import { KisService } from '../kis/kis.service';
import { DartService } from '../dart/dart.service';
import {
  GetChartRequestDto,
  ChartResponseDto,
  GetFinancialDataRequestDto,
  FinancialDataResponseDto,
} from './dto/chart.dto';
import {
  KisChartRequestDto,
  KisTimeDailyChartRequestDto,
  KisTimeItemChartRequestDto,
} from '../kis/dto/kis.dto';

@Injectable()
export class ChartService {
  private readonly logger = new Logger(ChartService.name);

  constructor(
    private readonly kisService: KisService,
    private readonly dartService: DartService,
  ) {}

  async getStockChart(dto: GetChartRequestDto): Promise<ChartResponseDto> {
    const { ticker, period, startDate, endDate } = dto;

    try {
      // For 1d period, use intraday chart (currently using mock data)
      if (period === '1d') {
        // Temporarily use mock data for 1d charts
        const mockData = this.generateMockIntradayData();
        this.logger.log(`Using mock intraday data for ${ticker} (${period})`);

        return {
          ticker,
          period,
          startDate,
          endDate: startDate, // Same day for intraday
          data: mockData,
        };

        // TODO: Uncomment when KIS API is properly configured
        // return await this.getIntradayChart(ticker, startDate);
      }

      // For other periods, use regular daily chart
      const periodMap = {
        '1w': 'D',
        '1m': 'D',
        '1y': 'D',
      };

      const kisChartDto = {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: ticker,
        FID_INPUT_DATE_1: startDate,
        FID_INPUT_DATE_2: endDate,
        FID_PERIOD_DIV_CODE: periodMap[period] || 'D',
        FID_ORG_ADJ_PRC: '0',
      };

      const chartData = await this.kisService.getChartData(kisChartDto);

      return {
        ticker,
        period,
        startDate,
        endDate,
        data: chartData.output2.map((item) => ({
          date: item.stck_bsop_date,
          open: parseFloat(item.stck_oprc),
          high: parseFloat(item.stck_hgpr),
          low: parseFloat(item.stck_lwpr),
          close: parseFloat(item.stck_clpr),
          volume: parseInt(item.acml_vol),
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get chart data: ${error.message}`);

      // Fallback to mock data
      const mockData = this.generateMockChartData(startDate, endDate, period);
      this.logger.log(`Using mock data for ${ticker} (${period})`);

      return {
        ticker,
        period,
        startDate,
        endDate,
        data: mockData,
      };
    }

    /* Original KIS API code - commented out for mock testing
    const periodMap = {
      '1d': 'D',
      '1w': 'W',
      '1m': 'M',
      '1y': 'Y',
    };

    const kisChartDto: KisChartRequestDto = {
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: ticker,
      FID_INPUT_DATE_1: startDate,
      FID_INPUT_DATE_2: endDate,
      FID_PERIOD_DIV_CODE: periodMap[period] || 'D',
      FID_ORG_ADJ_PRC: '0',
    };

    try {
      const chartData = await this.kisService.getChartData(kisChartDto);
      
      return {
        ticker,
        period,
        startDate,
        endDate,
        data: chartData.output2.map(item => ({
          date: item.stck_bsop_date,
          open: parseFloat(item.stck_oprc),
          high: parseFloat(item.stck_hgpr),
          low: parseFloat(item.stck_lwpr),
          close: parseFloat(item.stck_clpr),
          volume: parseInt(item.acml_vol),
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get chart data: ${error.message}`);
      throw error;
    }
    */
  }

  private async getIntradayChart(
    ticker: string,
    date: string,
  ): Promise<ChartResponseDto> {
    try {
      // Use time-item chart for intraday data with 30-minute intervals
      const kisTimeDto: KisTimeItemChartRequestDto = {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: ticker,
        FID_INPUT_HOUR_1: '090000', // Start from 9:00 AM
        FID_ORG_ADJ_PRC: '0',
        FID_PW_DATA_INCU_YN: '30', // 30-minute intervals
      };

      const chartData = await this.kisService.getTimeItemChart(kisTimeDto);

      return {
        ticker,
        period: '1d',
        startDate: date,
        endDate: date,
        data: chartData.output2.map((item) => ({
          date: item.stck_cntg_hour, // Time format: HHMMSS
          open: parseFloat(item.stck_oprc),
          high: parseFloat(item.stck_hgpr),
          low: parseFloat(item.stck_lwpr),
          close: parseFloat(item.stck_prpr), // Use current price as close
          volume: parseInt(item.cntg_vol),
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get intraday chart data: ${error.message}`);

      // Fallback: try daily chart for the date
      try {
        const kisDailyDto: KisTimeDailyChartRequestDto = {
          FID_COND_MRKT_DIV_CODE: 'J',
          FID_INPUT_ISCD: ticker,
          FID_INPUT_DATE_1: date,
          FID_ORG_ADJ_PRC: '0',
        };

        const dailyData = await this.kisService.getTimeDailyChart(kisDailyDto);

        return {
          ticker,
          period: '1d',
          startDate: date,
          endDate: date,
          data: dailyData.output2.map((item) => ({
            date: item.stck_cntg_hour,
            open: parseFloat(item.stck_oprc),
            high: parseFloat(item.stck_hgpr),
            low: parseFloat(item.stck_lwpr),
            close: parseFloat(item.stck_prpr),
            volume: parseInt(item.cntg_vol),
          })),
        };
      } catch (fallbackError) {
        this.logger.error(
          `Daily chart fallback also failed: ${fallbackError.message}`,
        );

        // Final fallback: use mock intraday data
        const mockData = this.generateMockIntradayData();
        this.logger.log(`Using mock intraday data for ${ticker}`);

        return {
          ticker,
          period: '1d',
          startDate: date,
          endDate: date,
          data: mockData,
        };
      }
    }
  }

  private generateMockChartData(
    startDate: string,
    endDate: string,
    period: string,
  ) {
    // For 1d period, generate intraday data
    if (period === '1d') {
      return this.generateMockIntradayData();
    }

    // For other periods, generate daily data
    const start = new Date(
      parseInt(startDate.slice(0, 4)),
      parseInt(startDate.slice(4, 6)) - 1,
      parseInt(startDate.slice(6, 8)),
    );
    const end = new Date(
      parseInt(endDate.slice(0, 4)),
      parseInt(endDate.slice(4, 6)) - 1,
      parseInt(endDate.slice(6, 8)),
    );

    const data = [];
    let currentPrice = 75000; // Starting price
    const current = new Date(start);

    while (current <= end) {
      // Generate realistic stock price movement
      const change = (Math.random() - 0.5) * 0.04; // ±2% daily change
      const open = currentPrice;
      const close = currentPrice * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(Math.random() * 20000000) + 5000000;

      data.push({
        date: current.toISOString().slice(0, 10).replace(/-/g, ''),
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
        volume,
      });

      currentPrice = close;
      current.setDate(current.getDate() + 1);
    }

    return data;
  }

  private generateMockIntradayData() {
    const data = [];
    let currentPrice = 75000; // Starting price

    // Generate data from 9:00 to 15:30 in 30-minute intervals
    const startHour = 9;
    const endHour = 15;
    const endMinute = 30;

    for (let hour = startHour; hour <= endHour; hour++) {
      const maxMinute = hour === endHour ? endMinute : 60;

      for (let minute = 0; minute < maxMinute; minute += 30) {
        // Generate realistic intraday price movement (smaller changes)
        const change = (Math.random() - 0.5) * 0.01; // ±0.5% per 30min
        const open = currentPrice;
        const close = currentPrice * (1 + change);
        const high = Math.max(open, close) * (1 + Math.random() * 0.005);
        const low = Math.min(open, close) * (1 - Math.random() * 0.005);
        const volume = Math.floor(Math.random() * 1000000) + 100000;

        const timeString = `${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}00`;

        data.push({
          date: timeString, // HHMMSS format for intraday
          open: Math.round(open),
          high: Math.round(high),
          low: Math.round(low),
          close: Math.round(close),
          volume,
        });

        currentPrice = close;
      }
    }

    return data;
  }

  async getFinancialData(
    dto: GetFinancialDataRequestDto,
  ): Promise<FinancialDataResponseDto> {
    const { corpCode, year } = dto;

    try {
      // Get financial data from DART API (will use mock data if API fails)
      const financialData = await this.dartService.getFinancialStatements(
        corpCode,
        year,
      );

      this.logger.log(`Financial data retrieved for ${corpCode} (${year})`);

      return {
        corpCode,
        year,
        revenue: financialData.revenue,
        operatingProfit: financialData.operatingProfit,
        netIncome: financialData.netIncome,
        totalAssets: financialData.totalAssets,
        totalEquity: financialData.totalEquity,
        eps: financialData.eps,
        roe: financialData.roe,
        roa: financialData.roa,
      };
    } catch (error) {
      this.logger.error(`Failed to get financial data: ${error.message}`);

      // Return a simple error response instead of throwing
      return {
        corpCode,
        year,
        revenue: 0,
        operatingProfit: 0,
        netIncome: 0,
        totalAssets: 0,
        totalEquity: 0,
        eps: 0,
        roe: 0,
        roa: 0,
      };
    }
  }
}
