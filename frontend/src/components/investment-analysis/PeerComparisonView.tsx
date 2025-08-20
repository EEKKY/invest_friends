import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, TrendingUp, BarChart3 } from 'lucide-react';
import { PeerComparison } from '../../services/investment-analysis';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface PeerComparisonViewProps {
  data: PeerComparison;
}

const PeerComparisonView: React.FC<PeerComparisonViewProps> = ({ data }) => {
  const formatMarketCap = (value: number) => {
    if (value >= 1_000_000_000_000) {
      return `${(value / 1_000_000_000_000).toFixed(2)}조`;
    } else if (value >= 100_000_000) {
      return `${(value / 100_000_000).toFixed(0)}억`;
    }
    return `${value.toLocaleString()}`;
  };

  const getRankingBadge = (rank: number, total: number) => {
    const percentage = (rank / total) * 100;
    if (percentage <= 10) {
      return <Badge variant="default">상위 10%</Badge>;
    } else if (percentage <= 30) {
      return <Badge variant="secondary">상위 30%</Badge>;
    } else if (percentage <= 50) {
      return <Badge variant="outline">상위 50%</Badge>;
    } else {
      return <Badge variant="outline">하위 50%</Badge>;
    }
  };

  const radarData = {
    labels: ['PER', 'PBR', 'ROE', '배당수익률'],
    datasets: [
      {
        label: '업계 평균',
        data: [
          data.industryAverages.per,
          data.industryAverages.pbr,
          data.industryAverages.roe,
          data.industryAverages.dividendYield,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
      },
    },
  };

  return (
    <div className="space-y-4">
      {/* Industry Averages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            업계 평균 비교
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">업계 평균 PER</p>
                  <p className="text-xl font-bold">{data.industryAverages.per.toFixed(1)}배</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">업계 평균 PBR</p>
                  <p className="text-xl font-bold">{data.industryAverages.pbr.toFixed(1)}배</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">업계 평균 ROE</p>
                  <p className="text-xl font-bold">{data.industryAverages.roe.toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">업계 평균 배당수익률</p>
                  <p className="text-xl font-bold">{data.industryAverages.dividendYield.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            <div className="h-64">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Industry Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            업종 내 순위
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">전체 기업 수</span>
              <span className="font-semibold">{data.ranking.totalCompanies}개</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">시가총액 순위</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{data.ranking.byMarketCap}위</span>
                    {getRankingBadge(data.ranking.byMarketCap, data.ranking.totalCompanies)}
                  </div>
                </div>
                <Progress 
                  value={(1 - data.ranking.byMarketCap / data.ranking.totalCompanies) * 100} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">매출액 순위</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{data.ranking.byRevenue}위</span>
                    {getRankingBadge(data.ranking.byRevenue, data.ranking.totalCompanies)}
                  </div>
                </div>
                <Progress 
                  value={(1 - data.ranking.byRevenue / data.ranking.totalCompanies) * 100} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">순이익 순위</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{data.ranking.byProfit}위</span>
                    {getRankingBadge(data.ranking.byProfit, data.ranking.totalCompanies)}
                  </div>
                </div>
                <Progress 
                  value={(1 - data.ranking.byProfit / data.ranking.totalCompanies) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitors Table */}
      {data.competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              주요 경쟁사 비교
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기업명</TableHead>
                  <TableHead>종목코드</TableHead>
                  <TableHead className="text-right">시가총액</TableHead>
                  <TableHead className="text-right">PER</TableHead>
                  <TableHead className="text-right">PBR</TableHead>
                  <TableHead className="text-right">ROE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.competitors.map((competitor) => (
                  <TableRow key={competitor.stockCode}>
                    <TableCell className="font-medium">{competitor.name}</TableCell>
                    <TableCell>{competitor.stockCode}</TableCell>
                    <TableCell className="text-right">
                      {formatMarketCap(competitor.marketCap)}원
                    </TableCell>
                    <TableCell className="text-right">{competitor.per.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{competitor.pbr.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{competitor.roe.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PeerComparisonView;