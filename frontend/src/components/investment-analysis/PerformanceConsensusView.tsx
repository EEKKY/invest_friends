import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Target, Users, Calendar } from 'lucide-react';
import { PerformanceConsensus } from '../../services/investment-analysis';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface PerformanceConsensusViewProps {
  data: PerformanceConsensus;
}

const PerformanceConsensusView: React.FC<PerformanceConsensusViewProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000_000) {
      return `${(value / 1_000_000_000_000).toFixed(2)}조`;
    } else if (value >= 100_000_000) {
      return `${(value / 100_000_000).toFixed(0)}억`;
    }
    return `${value.toLocaleString()}`;
  };

  const getRecommendationBadge = (recommendation: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'Strong Buy': 'default',
      'Buy': 'default',
      'Hold': 'secondary',
      'Sell': 'destructive',
      'Strong Sell': 'destructive',
    };
    
    return (
      <Badge variant={variants[recommendation] || 'outline'}>
        {recommendation}
      </Badge>
    );
  };

  const quarterlyChartData = {
    labels: data.quarterlyResults.map(r => r.period),
    datasets: [
      {
        label: '매출',
        data: data.quarterlyResults.map(r => r.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
      },
      {
        label: '영업이익',
        data: data.quarterlyResults.map(r => r.operatingProfit),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y',
      },
      {
        label: '순이익',
        data: data.quarterlyResults.map(r => r.netProfit),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        yAxisID: 'y',
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatCurrency(value)}원`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatCurrency(Number(value)) + '원',
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      {/* Consensus Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            애널리스트 컨센서스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">목표주가</p>
              <p className="text-2xl font-bold">
                {data.consensus.targetPrice.toLocaleString()}원
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">투자의견</p>
              {getRecommendationBadge(data.consensus.recommendation)}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Users className="w-4 h-4" />
                애널리스트 수
              </p>
              <p className="text-xl font-semibold">{data.consensus.numberOfAnalysts}명</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                업데이트
              </p>
              <p className="text-sm">{new Date(data.consensus.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>실적 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quarterly">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quarterly">분기별</TabsTrigger>
              <TabsTrigger value="annual">연간</TabsTrigger>
            </TabsList>

            <TabsContent value="quarterly">
              {data.quarterlyResults.length > 0 ? (
                <>
                  <div className="h-64 mb-4">
                    <Line options={chartOptions} data={quarterlyChartData} />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>분기</TableHead>
                        <TableHead className="text-right">매출</TableHead>
                        <TableHead className="text-right">영업이익</TableHead>
                        <TableHead className="text-right">순이익</TableHead>
                        <TableHead className="text-right">YoY</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.quarterlyResults.map((result) => (
                        <TableRow key={result.period}>
                          <TableCell className="font-medium">{result.period}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(result.revenue)}원
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(result.operatingProfit)}원
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(result.netProfit)}원
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`flex items-center justify-end gap-1 ${
                              result.yoyGrowth > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {result.yoyGrowth > 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {Math.abs(result.yoyGrowth).toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  분기별 실적 데이터가 없습니다.
                </div>
              )}
            </TabsContent>

            <TabsContent value="annual">
              {data.annualResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>연도</TableHead>
                      <TableHead className="text-right">매출</TableHead>
                      <TableHead className="text-right">영업이익</TableHead>
                      <TableHead className="text-right">순이익</TableHead>
                      <TableHead className="text-right">YoY</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.annualResults.map((result) => (
                      <TableRow key={result.year}>
                        <TableCell className="font-medium">{result.year}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(result.revenue)}원
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(result.operatingProfit)}원
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(result.netProfit)}원
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`flex items-center justify-end gap-1 ${
                            result.yoyGrowth > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {result.yoyGrowth > 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {Math.abs(result.yoyGrowth).toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  연간 실적 데이터가 없습니다.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceConsensusView;