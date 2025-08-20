import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DividendInfo } from '@/services/investment-analysis';
import { DollarSign, Calendar, TrendingUp, History } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DividendInfoSectionProps {
  dividendInfo: DividendInfo;
}

export const DividendInfoSection: React.FC<DividendInfoSectionProps> = ({ dividendInfo }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '미정';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Prepare chart data for dividend history - Sort by year
  const sortedHistory = dividendInfo.history ? 
    [...dividendInfo.history].sort((a, b) => a.year.localeCompare(b.year)) : 
    [];
  
  const chartData = {
    labels: sortedHistory.map(h => h.year),
    datasets: [
      {
        label: '주당 배당금',
        data: sortedHistory.map(h => h.dividendPerShare),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y',
      },
      {
        label: '배당수익률 (%)',
        data: sortedHistory.map(h => h.dividendYield),
        borderColor: 'rgb(251, 191, 36)',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '배당 이력',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '주당 배당금 (원)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: '배당수익률 (%)',
        },
      },
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          배당 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Dividend Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">주당 배당금</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(dividendInfo.dividendPerShare || 0)}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">배당수익률</span>
            </div>
            <div className="text-2xl font-bold">
              {formatPercent(dividendInfo.dividendYield || 0)}
            </div>
            {dividendInfo.dividendYield > 3 && (
              <Badge variant="default" className="mt-1">높은 수익률</Badge>
            )}
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">배당성향</span>
            </div>
            <div className="text-2xl font-bold">
              {formatPercent(dividendInfo.payoutRatio || 0)}
            </div>
            {dividendInfo.payoutRatio > 0 && dividendInfo.payoutRatio < 50 && (
              <Badge variant="secondary" className="mt-1">안정적</Badge>
            )}
          </div>
        </div>

        {/* Dividend Schedule */}
        {dividendInfo.schedule && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">배당 일정</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">배당락일</span>
                <p className="font-medium">{formatDate(dividendInfo.schedule.exDividendDate)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">배당기준일</span>
                <p className="font-medium">{formatDate(dividendInfo.schedule.recordDate)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">지급일</span>
                <p className="font-medium">{formatDate(dividendInfo.schedule.paymentDate)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dividend History Chart */}
        {dividendInfo.history && dividendInfo.history.length > 0 && (
          <div className="w-full h-80 border rounded-lg p-4">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};