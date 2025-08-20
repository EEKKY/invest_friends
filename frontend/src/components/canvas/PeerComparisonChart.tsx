import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PeerComparison } from '@/services/investment-analysis';
import { Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Users, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

interface PeerComparisonChartProps {
  peerComparison: PeerComparison;
  currentMetrics: {
    per: number;
    pbr: number;
    roe: number;
    dividendYield?: number;
  };
  companyName: string;
}

export const PeerComparisonChart: React.FC<PeerComparisonChartProps> = ({
  peerComparison,
  currentMetrics,
  companyName,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  // Prepare data for bar chart (competitors comparison)
  const competitorsBarData = {
    labels: [companyName, ...peerComparison.competitors.map(c => c.name)],
    datasets: [
      {
        label: 'PER',
        data: [currentMetrics.per, ...peerComparison.competitors.map(c => c.per)],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
      },
      {
        label: 'PBR',
        data: [currentMetrics.pbr, ...peerComparison.competitors.map(c => c.pbr)],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
      {
        label: 'ROE (%)',
        data: [currentMetrics.roe, ...peerComparison.competitors.map(c => c.roe)],
        backgroundColor: 'rgba(251, 191, 36, 0.5)',
        borderColor: 'rgb(251, 191, 36)',
        borderWidth: 2,
      },
    ],
  };

  const barOptions: any = {
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
        text: '경쟁사 비교',
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Prepare data for radar chart (vs industry average)
  const radarData = {
    labels: ['PER', 'PBR', 'ROE', '배당수익률'],
    datasets: [
      {
        label: companyName,
        data: [
          currentMetrics.per,
          currentMetrics.pbr,
          currentMetrics.roe,
          currentMetrics.dividendYield || 0,
        ],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: '업종 평균',
        data: [
          peerComparison.industryAverages.per,
          peerComparison.industryAverages.pbr,
          peerComparison.industryAverages.roe,
          peerComparison.industryAverages.dividendYield,
        ],
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const radarOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '업종 평균 대비',
        padding: {
          top: 10,
          bottom: 10,
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: Math.max(
          currentMetrics.per,
          currentMetrics.pbr * 10,
          currentMetrics.roe,
          peerComparison.industryAverages.per,
          peerComparison.industryAverages.pbr * 10,
          peerComparison.industryAverages.roe,
          50
        ) * 1.3,
        ticks: {
          display: false,
        },
        pointLabels: {
          font: {
            size: 13,
            weight: '600',
          },
          padding: 20,
          color: 'rgba(0, 0, 0, 0.8)',
        },
        grid: {
          circular: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(2)}조원`;
    } else if (value >= 100000000) {
      return `${(value / 100000000).toFixed(0)}억원`;
    }
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            동종업계 비교
            {peerComparison.competitors && peerComparison.competitors.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({peerComparison.competitors.map(c => c.name).join(', ')})
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chart')}
            >
              차트
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              테이블
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ranking Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">시가총액 순위</span>
            </div>
            <div className="text-2xl font-bold">
              {peerComparison.ranking.byMarketCap} / {peerComparison.ranking.totalCompanies}
            </div>
            {peerComparison.ranking.byMarketCap <= 3 && (
              <Badge variant="default" className="mt-1">상위권</Badge>
            )}
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">매출액 순위</span>
            </div>
            <div className="text-2xl font-bold">
              {peerComparison.ranking.byRevenue} / {peerComparison.ranking.totalCompanies}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">수익성 순위</span>
            </div>
            <div className="text-2xl font-bold">
              {peerComparison.ranking.byProfit} / {peerComparison.ranking.totalCompanies}
            </div>
          </div>
        </div>

        {/* Charts */}
        {viewMode === 'chart' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="w-full h-[500px] border rounded-lg p-8">
              <Radar data={radarData} options={radarOptions} />
            </div>
            <div className="w-full h-[500px] border rounded-lg p-4">
              <Bar data={competitorsBarData} options={barOptions} />
            </div>
          </div>
        )}

        {/* Competitors Table */}
        {viewMode === 'table' && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2">
              <h4 className="font-medium">주요 경쟁사 상세</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 text-sm font-medium">기업명</th>
                    <th className="text-right p-3 text-sm font-medium">시가총액</th>
                    <th className="text-right p-3 text-sm font-medium">PER</th>
                    <th className="text-right p-3 text-sm font-medium">PBR</th>
                    <th className="text-right p-3 text-sm font-medium">ROE (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-blue-50 font-semibold">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span>{companyName}</span>
                        <Badge variant="default" className="text-xs">
                          현재
                        </Badge>
                      </div>
                    </td>
                    <td className="text-right p-3">-</td>
                    <td className="text-right p-3">{currentMetrics.per.toFixed(2)}</td>
                    <td className="text-right p-3">{currentMetrics.pbr.toFixed(2)}</td>
                    <td className="text-right p-3">{currentMetrics.roe.toFixed(2)}</td>
                  </tr>
                  {peerComparison.competitors.map((competitor, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span>{competitor.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {competitor.stockCode}
                          </Badge>
                        </div>
                      </td>
                      <td className="text-right p-3">
                        {formatMarketCap(competitor.marketCap)}
                      </td>
                      <td className="text-right p-3">{competitor.per.toFixed(2)}</td>
                      <td className="text-right p-3">{competitor.pbr.toFixed(2)}</td>
                      <td className="text-right p-3">{competitor.roe.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-medium">
                    <td className="p-3">업종 평균</td>
                    <td className="text-right p-3">-</td>
                    <td className="text-right p-3">{peerComparison.industryAverages.per.toFixed(2)}</td>
                    <td className="text-right p-3">{peerComparison.industryAverages.pbr.toFixed(2)}</td>
                    <td className="text-right p-3">{peerComparison.industryAverages.roe.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};