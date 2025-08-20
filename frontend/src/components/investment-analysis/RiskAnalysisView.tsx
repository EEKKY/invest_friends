import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Shield, 
  Brain,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { RiskAnalysis } from '../../services/investment-analysis';
import { Radar, Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface RiskAnalysisViewProps {
  data: RiskAnalysis;
}

const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({ data }) => {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'high':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getRiskLevelLabel = (level: string) => {
    switch (level) {
      case 'low':
        return '낮음';
      case 'high':
        return '높음';
      default:
        return '보통';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const volatilityChartData = {
    labels: ['일간', '주간', '월간', '연간'],
    datasets: [
      {
        label: '변동성 (%)',
        data: [
          data.volatility.daily * 100,
          data.volatility.weekly * 100,
          data.volatility.monthly * 100,
          data.volatility.annual * 100,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(251, 146, 60, 0.6)',
          'rgba(239, 68, 68, 0.6)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const financialRiskRadarData = {
    labels: ['부채비율', '이자보상배율', '당좌비율', 'Z-Score'],
    datasets: [
      {
        label: '재무 리스크 지표',
        data: [
          Math.min(data.financialRisk.debtToEquity * 20, 100),
          Math.min(data.financialRisk.interestCoverage * 10, 100),
          Math.min(data.financialRisk.quickRatio * 50, 100),
          Math.min(data.financialRisk.altmanZScore * 20, 100),
        ],
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 2,
      },
    ],
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `변동성: ${context.parsed.y.toFixed(2)}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  const radarOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div className="space-y-4">
      {/* AI Risk Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI 리스크 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">종합 리스크 점수</p>
                <p className={`text-3xl font-bold ${getScoreColor(data.aiAnalysis.score)}`}>
                  {data.aiAnalysis.score}점
                </p>
                <p className="text-xs text-gray-500 mt-1">0점(안전) - 100점(위험)</p>
              </div>
              <div className="w-48">
                <Progress 
                  value={data.aiAnalysis.score} 
                  className="h-3"
                />
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>AI 분석 요약</AlertTitle>
              <AlertDescription>{data.aiAnalysis.summary}</AlertDescription>
            </Alert>

            {data.aiAnalysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm">AI 추천사항</p>
                <ul className="space-y-1">
                  {data.aiAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>상세 리스크 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="volatility">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="volatility" className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                변동성
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                재무리스크
              </TabsTrigger>
              <TabsTrigger value="factors" className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                리스크요인
              </TabsTrigger>
            </TabsList>

            {/* Volatility Tab */}
            <TabsContent value="volatility" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-gray-500">일간 변동성</p>
                    <p className="text-xl font-bold">{(data.volatility.daily * 100).toFixed(2)}%</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-gray-500">주간 변동성</p>
                    <p className="text-xl font-bold">{(data.volatility.weekly * 100).toFixed(2)}%</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-gray-500">월간 변동성</p>
                    <p className="text-xl font-bold">{(data.volatility.monthly * 100).toFixed(2)}%</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-gray-500">연간 변동성</p>
                    <p className="text-xl font-bold">{(data.volatility.annual * 100).toFixed(2)}%</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">베타 계수</p>
                    <p className="text-xl font-bold">{data.volatility.beta.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.volatility.beta > 1 ? '시장보다 변동성 높음' : 
                       data.volatility.beta < 1 ? '시장보다 변동성 낮음' : '시장과 동일한 변동성'}
                    </p>
                  </div>
                </div>
                <div className="h-80">
                  <Bar options={barChartOptions} data={volatilityChartData} />
                </div>
              </div>
            </TabsContent>

            {/* Financial Risk Tab */}
            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">부채비율</p>
                      <p className="text-xl font-bold">{data.financialRisk.debtToEquity.toFixed(2)}</p>
                    </div>
                    <Shield className={`w-8 h-8 ${data.financialRisk.debtToEquity < 1 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">이자보상배율</p>
                      <p className="text-xl font-bold">{data.financialRisk.interestCoverage.toFixed(2)}</p>
                    </div>
                    <Shield className={`w-8 h-8 ${data.financialRisk.interestCoverage > 3 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">당좌비율</p>
                      <p className="text-xl font-bold">{data.financialRisk.quickRatio.toFixed(2)}</p>
                    </div>
                    <Shield className={`w-8 h-8 ${data.financialRisk.quickRatio > 1 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Altman Z-Score</p>
                      <p className="text-xl font-bold">{data.financialRisk.altmanZScore.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {data.financialRisk.altmanZScore > 3 ? '안전' : 
                         data.financialRisk.altmanZScore > 1.8 ? '주의' : '위험'}
                      </p>
                    </div>
                    <Shield className={`w-8 h-8 ${data.financialRisk.altmanZScore > 3 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">종합 리스크 수준</p>
                    <Badge className={`mt-1 ${getRiskLevelColor(data.financialRisk.riskLevel)}`}>
                      {getRiskLevelLabel(data.financialRisk.riskLevel)}
                    </Badge>
                  </div>
                </div>
                <div className="h-80">
                  <Radar options={radarOptions} data={financialRiskRadarData} />
                </div>
              </div>
            </TabsContent>

            {/* Risk Factors Tab */}
            <TabsContent value="factors" className="space-y-3">
              {data.riskFactors.length > 0 ? (
                data.riskFactors.map((factor, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{factor.category}</Badge>
                          <div className="flex items-center gap-1">
                            {getImpactIcon(factor.impact)}
                            <span className="text-xs text-gray-500">영향도: {factor.impact}</span>
                          </div>
                        </div>
                        <p className="text-sm">{factor.description}</p>
                      </div>
                      <Badge 
                        variant={factor.probability === 'high' ? 'destructive' : 
                                factor.probability === 'low' ? 'secondary' : 'outline'}
                      >
                        발생확률: {factor.probability}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-xs">
                        <span className="text-gray-500">영향도: </span>
                        <Progress 
                          value={factor.impact === 'high' ? 100 : factor.impact === 'medium' ? 50 : 25} 
                          className="h-1 mt-1"
                        />
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">발생확률: </span>
                        <Progress 
                          value={factor.probability === 'high' ? 100 : factor.probability === 'medium' ? 50 : 25} 
                          className="h-1 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  리스크 요인 데이터가 없습니다.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskAnalysisView;