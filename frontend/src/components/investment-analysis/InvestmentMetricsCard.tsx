import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { InvestmentMetrics } from '../../services/investment-analysis';

interface InvestmentMetricsCardProps {
  data: InvestmentMetrics;
}

const InvestmentMetricsCard: React.FC<InvestmentMetricsCardProps> = ({ data }) => {
  const getMetricStatus = (metric: string, value: number) => {
    switch (metric) {
      case 'per':
        if (value < 10) return { status: 'good', color: 'text-green-600', icon: TrendingDown };
        if (value > 20) return { status: 'warning', color: 'text-red-600', icon: TrendingUp };
        return { status: 'neutral', color: 'text-gray-600', icon: Minus };
      
      case 'pbr':
        if (value < 1) return { status: 'good', color: 'text-green-600', icon: TrendingDown };
        if (value > 2) return { status: 'warning', color: 'text-red-600', icon: TrendingUp };
        return { status: 'neutral', color: 'text-gray-600', icon: Minus };
      
      case 'roe':
        if (value > 15) return { status: 'good', color: 'text-green-600', icon: TrendingUp };
        if (value < 5) return { status: 'warning', color: 'text-red-600', icon: TrendingDown };
        return { status: 'neutral', color: 'text-gray-600', icon: Minus };
      
      case 'debtRatio':
        if (value < 50) return { status: 'good', color: 'text-green-600', icon: TrendingDown };
        if (value > 100) return { status: 'warning', color: 'text-red-600', icon: TrendingUp };
        return { status: 'neutral', color: 'text-gray-600', icon: Minus };
      
      default:
        return { status: 'neutral', color: 'text-gray-600', icon: Minus };
    }
  };

  const metrics = [
    { key: 'per', label: 'PER', value: data.per, suffix: '배', description: '주가수익비율' },
    { key: 'pbr', label: 'PBR', value: data.pbr, suffix: '배', description: '주가순자산비율' },
    { key: 'roe', label: 'ROE', value: data.roe, suffix: '%', description: '자기자본이익률' },
    { key: 'eps', label: 'EPS', value: data.eps, suffix: '원', description: '주당순이익' },
    { key: 'bps', label: 'BPS', value: data.bps, suffix: '원', description: '주당순자산' },
    { key: 'debtRatio', label: '부채비율', value: data.debtRatio, suffix: '%', description: '' },
    { key: 'currentRatio', label: '유동비율', value: data.currentRatio, suffix: '배', description: '' },
    { key: 'operatingMargin', label: '영업이익률', value: data.operatingMargin, suffix: '%', description: '' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>투자 지표</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const status = getMetricStatus(metric.key, metric.value);
            const Icon = status.icon;
            
            return (
              <div key={metric.key} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{metric.label}</span>
                  <Icon className={`w-4 h-4 ${status.color}`} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold ${status.color}`}>
                    {metric.value.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">{metric.suffix}</span>
                </div>
                {metric.description && (
                  <p className="text-xs text-gray-400">{metric.description}</p>
                )}
                {['per', 'pbr', 'roe', 'debtRatio'].includes(metric.key) && (
                  <Progress 
                    value={
                      metric.key === 'per' ? Math.min((metric.value / 30) * 100, 100) :
                      metric.key === 'pbr' ? Math.min((metric.value / 3) * 100, 100) :
                      metric.key === 'roe' ? Math.min((metric.value / 30) * 100, 100) :
                      Math.min((metric.value / 150) * 100, 100)
                    }
                    className="h-1"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">투자 지표 요약:</span> 
            {data.per < 15 && data.pbr < 1.5 && data.roe > 10
              ? ' 전반적으로 양호한 밸류에이션을 보이고 있습니다.'
              : data.per > 25 || data.pbr > 3
              ? ' 밸류에이션이 다소 높은 수준입니다.'
              : ' 평균적인 밸류에이션 수준입니다.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentMetricsCard;