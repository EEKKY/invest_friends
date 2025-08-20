import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { InvestmentMetrics } from '@/services/investment-analysis';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface InvestmentMetricsCardsProps {
  metrics: InvestmentMetrics;
}

export const InvestmentMetricsCards: React.FC<InvestmentMetricsCardsProps> = ({ metrics }) => {
  const formatNumber = (value: number | undefined, suffix: string = '') => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + suffix;
  };

  const getMetricIndicator = (value: number, metric: string) => {
    // Define good/bad thresholds for each metric
    const thresholds: Record<string, { good: number; bad: number; inverted?: boolean }> = {
      per: { good: 15, bad: 30 },
      pbr: { good: 1, bad: 2 },
      roe: { good: 15, bad: 5, inverted: true },
      debtRatio: { good: 50, bad: 100 },
      currentRatio: { good: 150, bad: 100, inverted: true },
      operatingMargin: { good: 10, bad: 5, inverted: true },
    };

    const threshold = thresholds[metric];
    if (!threshold) return <Minus className="h-4 w-4 text-gray-500" />;

    const isGood = threshold.inverted 
      ? value >= threshold.good 
      : value <= threshold.good;
    
    const isBad = threshold.inverted 
      ? value <= threshold.bad 
      : value >= threshold.bad;

    if (isGood) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (isBad) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const metricsData = [
    {
      title: 'PER',
      value: metrics.per,
      suffix: '배',
      description: '주가수익비율',
      metricKey: 'per',
      tooltip: '낮을수록 저평가',
    },
    {
      title: 'PBR',
      value: metrics.pbr,
      suffix: '배',
      description: '주가순자산비율',
      metricKey: 'pbr',
      tooltip: '1 이하면 저평가',
    },
    {
      title: 'ROE',
      value: metrics.roe,
      suffix: '%',
      description: '자기자본이익률',
      metricKey: 'roe',
      tooltip: '높을수록 효율적',
    },
    {
      title: 'EPS',
      value: metrics.eps,
      suffix: '원',
      description: '주당순이익',
      metricKey: 'eps',
      tooltip: '높을수록 좋음',
    },
    {
      title: 'BPS',
      value: metrics.bps,
      suffix: '원',
      description: '주당순자산',
      metricKey: 'bps',
      tooltip: '높을수록 좋음',
    },
    {
      title: '부채비율',
      value: metrics.debtRatio,
      suffix: '%',
      description: '총부채/자기자본',
      metricKey: 'debtRatio',
      tooltip: '낮을수록 안정적',
    },
    {
      title: '유동비율',
      value: metrics.currentRatio,
      suffix: '%',
      description: '유동자산/유동부채',
      metricKey: 'currentRatio',
      tooltip: '100% 이상이면 안정',
    },
    {
      title: '영업이익률',
      value: metrics.operatingMargin,
      suffix: '%',
      description: '영업이익/매출액',
      metricKey: 'operatingMargin',
      tooltip: '높을수록 수익성 좋음',
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>투자 지표</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricsData.map((metric) => (
            <div
              key={metric.title}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {metric.title}
                </span>
                {metric.metricKey && getMetricIndicator(metric.value, metric.metricKey)}
              </div>
              <div className="text-2xl font-bold">
                {formatNumber(metric.value, metric.suffix)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metric.description}
              </div>
              {metric.tooltip && (
                <div className="text-xs text-gray-400 mt-1 italic">
                  {metric.tooltip}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};