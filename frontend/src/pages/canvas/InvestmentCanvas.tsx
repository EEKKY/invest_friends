import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { investmentAnalysisService } from '@/services/investment-analysis';
import type { InvestmentAnalysisResponse } from '@/services/investment-analysis';
import { StockPriceVolumeChart } from '@/components/canvas/StockPriceVolumeChart';
import { CompanyInfoSection } from '@/components/canvas/CompanyInfoSection';
import { InvestmentMetricsCards } from '@/components/canvas/InvestmentMetricsCards';
import { DividendInfoSection } from '@/components/canvas/DividendInfoSection';
import { PeerComparisonChart } from '@/components/canvas/PeerComparisonChart';
import { FinancialStatementsChart } from '@/components/canvas/FinancialStatementsChart';
import { RiskAnalysisSection } from '@/components/canvas/RiskAnalysisSection';
import { RefreshCw, Download, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const InvestmentCanvas: React.FC = () => {
  const { stockCode: urlStockCode } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [stockCode, setStockCode] = useState(urlStockCode || searchParams.get('code') || '005930');
  const [data, setData] = useState<InvestmentAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Individual loading states for slow sections
  const [sectionLoading, setSectionLoading] = useState({
    chart: false,
    company: false,
    metrics: false,
    financial: false,
    dividend: false,
    news: false,
    risk: false
  });

  useEffect(() => {
    if (stockCode) {
      fetchData();
    }
  }, [stockCode]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setSectionLoading({
      chart: true,
      company: true,
      metrics: true,
      financial: true,
      dividend: true,
      news: true,
      risk: true
    });
    
    try {
      // Initialize with empty data structure
      const initialData: InvestmentAnalysisResponse = {
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
        riskAnalysis: {} as any
      };
      
      setData(initialData);
      
      // Fetch data in parallel with individual error handling
      const fetchPromises = [
        // Fast data - Chart
        investmentAnalysisService.getChart(stockCode)
          .then(res => {
            setSectionLoading(prev => ({ ...prev, chart: false }));
            if (res.chartData) {
              setData(prev => prev ? { ...prev, chartData: res.chartData || {} as any } : prev);
            }
          })
          .catch(err => {
            console.error('Chart data failed:', err);
            setSectionLoading(prev => ({ ...prev, chart: false }));
          }),
        
        // Company Info
        investmentAnalysisService.getCompany(stockCode)
          .then(res => {
            setSectionLoading(prev => ({ ...prev, company: false }));
            if (res.companyInfo) {
              setData(prev => prev ? { ...prev, companyInfo: res.companyInfo || {} as any } : prev);
            }
          })
          .catch(err => {
            console.error('Company data failed:', err);
            setSectionLoading(prev => ({ ...prev, company: false }));
          }),
        
        // Metrics & Peer Comparison
        investmentAnalysisService.getMetrics(stockCode)
          .then(res => {
            setSectionLoading(prev => ({ ...prev, metrics: false }));
            if (res.investmentMetrics || res.peerComparison) {
              setData(prev => prev ? {
                ...prev,
                investmentMetrics: res.investmentMetrics || prev.investmentMetrics,
                performanceConsensus: res.performanceConsensus || prev.performanceConsensus,
                peerComparison: res.peerComparison || prev.peerComparison
              } : prev);
            }
          })
          .catch(err => {
            console.error('Metrics data failed:', err);
            setSectionLoading(prev => ({ ...prev, metrics: false }));
          }),
        
        // Financial Statements
        investmentAnalysisService.getFinancial(stockCode)
          .then(res => {
            setSectionLoading(prev => ({ ...prev, financial: false }));
            if (res.financialStatements) {
              setData(prev => prev ? { ...prev, financialStatements: res.financialStatements || {} as any } : prev);
            }
          })
          .catch(err => {
            console.error('Financial data failed:', err);
            setSectionLoading(prev => ({ ...prev, financial: false }));
          }),
        
        // Dividend Info
        investmentAnalysisService.getDividend(stockCode)
          .then(res => {
            setSectionLoading(prev => ({ ...prev, dividend: false }));
            if (res.dividendInfo) {
              setData(prev => prev ? { ...prev, dividendInfo: res.dividendInfo || {} as any } : prev);
            }
          })
          .catch(err => {
            console.error('Dividend data failed:', err);
            setSectionLoading(prev => ({ ...prev, dividend: false }));
          }),
        
        // Slow data - News & Risk (includes OpenAI)
        investmentAnalysisService.getNews(stockCode)
          .then(res => {
            setSectionLoading(prev => ({ ...prev, news: false }));
            if (res.analystNews) {
              setData(prev => prev ? { ...prev, analystNews: res.analystNews || {} as any } : prev);
            }
          })
          .catch(err => {
            console.error('News data failed:', err);
            setSectionLoading(prev => ({ ...prev, news: false }));
          }),
        
        // Risk analysis with OpenAI - slowest
        investmentAnalysisService.getRisk(stockCode)
          .then(res => {
            setSectionLoading(prev => ({ ...prev, risk: false }));
            if (res.riskAnalysis) {
              setData(prev => prev ? { ...prev, riskAnalysis: res.riskAnalysis || {} as any } : prev);
              toast.success('AI 리스크 분석 완료');
            }
          })
          .catch(err => {
            console.error('Risk analysis failed:', err);
            setSectionLoading(prev => ({ ...prev, risk: false }));
            toast.warning('AI 리스크 분석 실패 - 기본 데이터 사용');
          })
      ];
      
      // Wait for all promises to settle
      await Promise.allSettled(fetchPromises);
      
      toast.success(`${stockCode} 데이터 로딩 완료`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      toast.error('데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleExport = () => {
    if (data) {
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${stockCode}_investment_analysis_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('데이터를 내보냈습니다.');
    }
  };

  if (loading && !data) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">투자 분석 캔버스</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExport}
              disabled={!data}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {data && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="financial">재무</TabsTrigger>
            <TabsTrigger value="comparison">비교</TabsTrigger>
            <TabsTrigger value="risk">리스크</TabsTrigger>
            <TabsTrigger value="dividend">배당</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Company Info */}
            {data.companyInfo && Object.keys(data.companyInfo).length > 0 && (
              <CompanyInfoSection companyInfo={data.companyInfo} />
            )}
            
            {/* Stock Chart - Full Width */}
            <div className="relative w-full">
              {sectionLoading.chart && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center h-96">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              )}
              <div className="w-full">
                <StockPriceVolumeChart 
                  stockCode={stockCode} 
                  chartData={data.chartData}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Investment Metrics */}
            {data.investmentMetrics && Object.keys(data.investmentMetrics).length > 0 && (
              <InvestmentMetricsCards metrics={data.investmentMetrics} />
            )}
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="relative">
              {sectionLoading.financial && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg h-96">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">재무 데이터 로딩 중...</p>
                  </div>
                </div>
              )}
              {data.financialStatements && Object.keys(data.financialStatements).length > 0 && (
                <FinancialStatementsChart financialStatements={data.financialStatements} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <div className="relative">
              {sectionLoading.metrics && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg h-96">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">동종업계 데이터 로딩 중...</p>
                  </div>
                </div>
              )}
              {data.peerComparison && data.investmentMetrics && 
               Object.keys(data.peerComparison).length > 0 && (
                <PeerComparisonChart 
                  peerComparison={data.peerComparison}
                  currentMetrics={data.investmentMetrics}
                  companyName={data.companyInfo?.companyName || stockCode}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <div className="relative">
              {sectionLoading.risk && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg min-h-[400px]">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-semibold">AI 리스크 분석 중...</p>
                    <p className="text-xs text-gray-500 mt-1">OpenAI를 통한 분석에 시간이 소요됩니다</p>
                  </div>
                </div>
              )}
              {data.riskAnalysis && data.riskAnalysis.volatility && (
                <RiskAnalysisSection riskAnalysis={data.riskAnalysis} />
              )}
              {!sectionLoading.risk && (!data.riskAnalysis || !data.riskAnalysis.volatility) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>리스크 분석 불가</AlertTitle>
                  <AlertDescription>
                    현재 리스크 분석 데이터를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dividend" className="space-y-6">
            <div className="relative">
              {sectionLoading.dividend && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg h-96">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">배당 정보 로딩 중...</p>
                  </div>
                </div>
              )}
              {data.dividendInfo && Object.keys(data.dividendInfo).length > 0 && (
                <DividendInfoSection dividendInfo={data.dividendInfo} />
              )}
              {!sectionLoading.dividend && (!data.dividendInfo || Object.keys(data.dividendInfo).length === 0) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>배당 정보 없음</AlertTitle>
                  <AlertDescription>
                    현재 배당 정보를 가져올 수 없습니다.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};