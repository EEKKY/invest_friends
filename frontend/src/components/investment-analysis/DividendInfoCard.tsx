import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, DollarSign, Percent, TrendingUp } from 'lucide-react';
import { DividendInfo } from '../../services/investment-analysis';
import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface DividendInfoCardProps {
  data: DividendInfo;
}

const DividendInfoCard: React.FC<DividendInfoCardProps> = ({ data }) => {
  const historyChartData = {
    labels: data.history.map(h => h.year),
    datasets: [
      {
        label: '주당 배당금',
        data: data.history.map(h => h.dividendPerShare),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: '배당수익률 (%)',
        data: data.history.map(h => h.dividendYield),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
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
            if (label.includes('수익률')) {
              return `${label}: ${value.toFixed(2)}%`;
            }
            return `${label}: ${value.toLocaleString()}원`;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: '주당 배당금 (원)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: '배당수익률 (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const getDividendStatus = (dividendYield: number) => {
    if (dividendYield > 4) return { label: '고배당', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (dividendYield > 2) return { label: '보통', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (dividendYield > 0) return { label: '저배당', color: 'text-gray-600', bgColor: 'bg-gray-50' };
    return { label: '무배당', color: 'text-gray-400', bgColor: 'bg-gray-50' };
  };

  const status = getDividendStatus(data.dividendYield);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            배당 정보
          </CardTitle>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} ${status.bgColor}`}>
            {status.label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="schedule">일정</TabsTrigger>
            <TabsTrigger value="history">이력</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-500">주당 배당금</p>
                <p className="text-2xl font-bold">{data.dividendPerShare.toLocaleString()}원</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Percent className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-gray-500">배당수익률</p>
                <p className="text-2xl font-bold">{data.dividendYield.toFixed(2)}%</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-gray-500">배당성향</p>
                <p className="text-2xl font-bold">{data.payoutRatio.toFixed(1)}%</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {data.dividendYield > 3 
                  ? '높은 배당수익률을 제공하고 있어 안정적인 수익을 추구하는 투자자에게 적합합니다.'
                  : data.dividendYield > 0
                  ? '적정 수준의 배당을 지급하고 있습니다.'
                  : '현재 배당을 지급하지 않고 있습니다.'}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            {data.schedule && Object.keys(data.schedule).length > 0 ? (
              <div className="space-y-3">
                {data.schedule.exDividendDate && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">배당락일</span>
                    </div>
                    <span className="text-gray-700">{data.schedule.exDividendDate}</span>
                  </div>
                )}
                {data.schedule.recordDate && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">배당기준일</span>
                    </div>
                    <span className="text-gray-700">{data.schedule.recordDate}</span>
                  </div>
                )}
                {data.schedule.paymentDate && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">배당지급일</span>
                    </div>
                    <span className="text-gray-700">{data.schedule.paymentDate}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                배당 일정 정보가 없습니다.
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {data.history.length > 0 ? (
              <>
                <div className="h-64">
                  <Bar options={chartOptions} data={historyChartData} />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>연도</TableHead>
                      <TableHead className="text-right">주당 배당금</TableHead>
                      <TableHead className="text-right">배당수익률</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.history.map((item) => (
                      <TableRow key={item.year}>
                        <TableCell className="font-medium">{item.year}</TableCell>
                        <TableCell className="text-right">
                          {item.dividendPerShare.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-right">
                          {item.dividendYield.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                배당 이력 정보가 없습니다.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DividendInfoCard;