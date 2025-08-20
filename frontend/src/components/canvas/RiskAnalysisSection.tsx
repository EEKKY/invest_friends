import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { RiskAnalysis } from '@/services/investment-analysis';
import { AlertTriangle, TrendingUp, Shield, Brain, Activity } from 'lucide-react';
import { Radar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

interface RiskAnalysisSectionProps {
  riskAnalysis: RiskAnalysis;
}

export const RiskAnalysisSection: React.FC<RiskAnalysisSectionProps> = ({ riskAnalysis }) => {
  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskBadgeVariant = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'default' as const;
      case 'medium':
        return 'secondary' as const;
      case 'high':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  // Volatility Chart Data
  const volatilityData = {
    labels: ['일간', '주간', '월간', '연간'],
    datasets: [
      {
        label: '변동성 (%)',
        data: [
          riskAnalysis.volatility.daily,
          riskAnalysis.volatility.weekly,
          riskAnalysis.volatility.monthly,
          riskAnalysis.volatility.annual,
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 2,
      },
    ],
  };

  const volatilityOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '변동성 분석',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      }
    }
  };

  // Risk Factors Radar Chart
  const riskRadarData = {
    labels: riskAnalysis.riskFactors.map(factor => factor.category),
    datasets: [
      {
        label: '영향도',
        data: riskAnalysis.riskFactors.map(factor => 
          factor.impact === 'high' ? 3 : factor.impact === 'medium' ? 2 : 1
        ),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
      },
      {
        label: '발생확률',
        data: riskAnalysis.riskFactors.map(factor => 
          factor.probability === 'high' ? 3 : factor.probability === 'medium' ? 2 : 1
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        pointBackgroundColor: 'rgb(54, 162, 235)',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '리스크 매트릭스',
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 3,
        ticks: {
          stepSize: 1,
          callback: function(value: any) {
            const labels = ['', '낮음', '중간', '높음'];
            return labels[value];
          }
        }
      }
    }
  };

  const getAltmanZScoreInterpretation = (score: number) => {
    if (score > 2.99) return { text: '안전', color: 'text-green-600' };
    if (score > 1.8) return { text: '주의', color: 'text-yellow-600' };
    return { text: '위험', color: 'text-red-600' };
  };

  const altmanInterpretation = getAltmanZScoreInterpretation(riskAnalysis.financialRisk.altmanZScore);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          리스크 / AI 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Level Overview */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium mb-1">전체 리스크 수준</h4>
            <p className="text-sm text-muted-foreground">종합적인 투자 위험도 평가</p>
          </div>
          <Badge 
            variant={getRiskBadgeVariant(riskAnalysis.financialRisk.riskLevel)}
            className="text-lg px-4 py-2"
          >
            {riskAnalysis.financialRisk.riskLevel === 'low' ? '낮음' :
             riskAnalysis.financialRisk.riskLevel === 'medium' ? '보통' : '높음'}
          </Badge>
        </div>

        {/* Volatility Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              변동성 지표
            </h4>
            <Line data={volatilityData} options={volatilityOptions} />
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <div className="flex items-center justify-between text-sm">
                <span>베타 계수</span>
                <span className="font-medium">{riskAnalysis.volatility.beta.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {riskAnalysis.volatility.beta > 1 ? '시장보다 변동성 높음' : '시장보다 변동성 낮음'}
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              재무 리스크
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">부채비율</span>
                  <span className="text-sm font-medium">
                    {(riskAnalysis.financialRisk.debtToEquity * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.min(riskAnalysis.financialRisk.debtToEquity * 100, 100)} />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">이자보상배율</span>
                  <span className="text-sm font-medium">
                    {riskAnalysis.financialRisk.interestCoverage.toFixed(2)}x
                  </span>
                </div>
                <Progress value={Math.min(riskAnalysis.financialRisk.interestCoverage * 20, 100)} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">당좌비율</span>
                  <span className="text-sm font-medium">
                    {(riskAnalysis.financialRisk.quickRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.min(riskAnalysis.financialRisk.quickRatio * 100, 100)} />
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Altman Z-Score</span>
                  <span className={`text-sm font-bold ${altmanInterpretation.color}`}>
                    {riskAnalysis.financialRisk.altmanZScore.toFixed(2)} ({altmanInterpretation.text})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            주요 리스크 요인
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Radar data={riskRadarData} options={radarOptions} />
            </div>
            <div className="space-y-2">
              {riskAnalysis.riskFactors.map((factor, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <h5 className="font-medium text-sm">{factor.category}</h5>
                    <div className="flex gap-1">
                      <Badge variant={getRiskBadgeVariant(factor.impact)} className="text-xs">
                        영향: {factor.impact === 'low' ? '낮음' : factor.impact === 'medium' ? '보통' : '높음'}
                      </Badge>
                      <Badge variant={getRiskBadgeVariant(factor.probability)} className="text-xs">
                        확률: {factor.probability === 'low' ? '낮음' : factor.probability === 'medium' ? '보통' : '높음'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI 분석
          </h4>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">AI 리스크 점수</span>
              <span className="text-2xl font-bold">{riskAnalysis.aiAnalysis.score}/100</span>
            </div>
            <Progress value={riskAnalysis.aiAnalysis.score} className="h-3" />
          </div>

          <Alert className="mb-4">
            <AlertDescription>
              {riskAnalysis.aiAnalysis.summary}
            </AlertDescription>
          </Alert>

          <div>
            <h5 className="font-medium text-sm mb-2">AI 추천사항</h5>
            <ul className="space-y-1">
              {riskAnalysis.aiAnalysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};