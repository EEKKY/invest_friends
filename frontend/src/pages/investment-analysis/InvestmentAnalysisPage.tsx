import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { investmentAnalysisService, InvestmentAnalysisResponse } from '../../services/investment-analysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, TrendingUp, Building2, DollarSign, FileText, Users, Newspaper, AlertTriangle, Brain } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import StockPriceChart from '../../components/investment-analysis/StockPriceChart';
import CompanyInfoCard from '../../components/investment-analysis/CompanyInfoCard';
import InvestmentMetricsCard from '../../components/investment-analysis/InvestmentMetricsCard';
import PerformanceConsensusView from '../../components/investment-analysis/PerformanceConsensusView';
import DividendInfoCard from '../../components/investment-analysis/DividendInfoCard';
import PeerComparisonView from '../../components/investment-analysis/PeerComparisonView';
import AnalystNewsView from '../../components/investment-analysis/AnalystNewsView';
import FinancialStatementsView from '../../components/investment-analysis/FinancialStatementsView';
import RiskAnalysisView from '../../components/investment-analysis/RiskAnalysisView';

const InvestmentAnalysisPage: React.FC = () => {
  const { stockCode: urlStockCode } = useParams();
  const [searchParams] = useSearchParams();
  const [stockCode, setStockCode] = useState(urlStockCode || '005930');
  const [inputCode, setInputCode] = useState(stockCode);
  const [period, setPeriod] = useState(searchParams.get('period') || '3m');
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    chart: false,
    metrics: false,
    financial: false,
    news: false,
    risk: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InvestmentAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (stockCode) {
      fetchAnalysisDataProgressive();
    }
  }, [stockCode, period]);

  const fetchAnalysisData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new method that fetches from individual endpoints
      const response = await investmentAnalysisService.getAnalysisByParts(stockCode);
      setData(response);
    } catch (err: any) {
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
      console.error('Failed to fetch analysis data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisDataProgressive = async () => {
    setLoading(true);
    setError(null);
    
    // Initialize empty data structure
    const newData: InvestmentAnalysisResponse = {
      stockCode,
      analysisDate: new Date().toISOString(),
      chartData: {} as any,
      companyInfo: {} as any,
      investmentMetrics: {} as any,
      performanceConsensus: {} as any,
      dividendInfo: {} as any,
      peerComparison: {} as any,
      analystNews: {} as any,
      financialStatements: {} as any,
      riskAnalysis: {} as any,
    };
    setData(newData);

    // Update loading states
    setLoadingStates({
      chart: true,
      metrics: true,
      financial: true,
      news: true,
      risk: true,
    });

    // Fetch chart data
    investmentAnalysisService.getChart(stockCode)
      .then(result => {
        setData(prev => prev ? { ...prev, chartData: result.chartData || {} } : prev);
        setLoadingStates(prev => ({ ...prev, chart: false }));
      })
      .catch(err => {
        console.error('Failed to fetch chart data:', err);
        setLoadingStates(prev => ({ ...prev, chart: false }));
      });

    // Fetch metrics data
    investmentAnalysisService.getMetrics(stockCode)
      .then(result => {
        setData(prev => prev ? { 
          ...prev, 
          companyInfo: result.companyInfo || {},
          investmentMetrics: result.investmentMetrics || {},
          performanceConsensus: result.performanceConsensus || {},
          dividendInfo: result.dividendInfo || {},
          peerComparison: result.peerComparison || {},
        } : prev);
        setLoadingStates(prev => ({ ...prev, metrics: false }));
      })
      .catch(err => {
        console.error('Failed to fetch metrics data:', err);
        setLoadingStates(prev => ({ ...prev, metrics: false }));
      });

    // Fetch financial data
    investmentAnalysisService.getFinancial(stockCode)
      .then(result => {
        setData(prev => prev ? { ...prev, financialStatements: result.financialStatements || {} } : prev);
        setLoadingStates(prev => ({ ...prev, financial: false }));
      })
      .catch(err => {
        console.error('Failed to fetch financial data:', err);
        setLoadingStates(prev => ({ ...prev, financial: false }));
      });

    // Fetch news data
    investmentAnalysisService.getNews(stockCode)
      .then(result => {
        setData(prev => prev ? { ...prev, analystNews: result.analystNews || {} } : prev);
        setLoadingStates(prev => ({ ...prev, news: false }));
      })
      .catch(err => {
        console.error('Failed to fetch news data:', err);
        setLoadingStates(prev => ({ ...prev, news: false }));
      });

    // Fetch risk data
    investmentAnalysisService.getRisk(stockCode)
      .then(result => {
        setData(prev => prev ? { ...prev, riskAnalysis: result.riskAnalysis || {} } : prev);
        setLoadingStates(prev => ({ ...prev, risk: false }));
      })
      .catch(err => {
        console.error('Failed to fetch risk data:', err);
        setLoadingStates(prev => ({ ...prev, risk: false }));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSearch = () => {
    if (inputCode && inputCode !== stockCode) {
      setStockCode(inputCode);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header with Search */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">종목 투자 분석</h1>
        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="종목코드 입력 (예: 005930)"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="max-w-xs"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            검색
          </Button>
        </div>

        {/* Period Selection */}
        <div className="flex gap-2">
          {['1d', '1w', '1m', '3m', '6m', '1y'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange(p)}
            >
              {p === '1d' && '1일'}
              {p === '1w' && '1주'}
              {p === '1m' && '1개월'}
              {p === '3m' && '3개월'}
              {p === '6m' && '6개월'}
              {p === '1y' && '1년'}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">분석 데이터를 불러오는 중...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Company Header */}
          {data.companyInfo && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{data.companyInfo.companyName}</h2>
                    <p className="text-gray-600">{data.stockCode} | {data.companyInfo.industry}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">분석일시</p>
                    <p className="font-medium">{new Date(data.analysisDate).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                개요
              </TabsTrigger>
              <TabsTrigger value="financials" className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                재무
              </TabsTrigger>
              <TabsTrigger value="valuation" className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                밸류
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-1">
                <Newspaper className="w-4 h-4" />
                뉴스
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                리스크
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StockPriceChart data={data.chartData} period={period} />
                <CompanyInfoCard data={data.companyInfo} />
              </div>
              <InvestmentMetricsCard data={data.investmentMetrics} />
              <DividendInfoCard data={data.dividendInfo} />
            </TabsContent>

            {/* Financials Tab */}
            <TabsContent value="financials" className="space-y-4">
              <PerformanceConsensusView data={data.performanceConsensus} />
              <FinancialStatementsView data={data.financialStatements} />
            </TabsContent>

            {/* Valuation Tab */}
            <TabsContent value="valuation" className="space-y-4">
              <InvestmentMetricsCard data={data.investmentMetrics} />
              <PeerComparisonView data={data.peerComparison} />
            </TabsContent>

            {/* News Tab */}
            <TabsContent value="news" className="space-y-4">
              <AnalystNewsView data={data.analystNews} />
            </TabsContent>

            {/* Risk Tab */}
            <TabsContent value="risk" className="space-y-4">
              <RiskAnalysisView data={data.riskAnalysis} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default InvestmentAnalysisPage;