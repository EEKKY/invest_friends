import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard } from 'lucide-react';
import { FinancialStatements } from '../../services/investment-analysis';
import { Bar, Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface FinancialStatementsViewProps {
  data: FinancialStatements;
}

const FinancialStatementsView: React.FC<FinancialStatementsViewProps> = ({ data }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1_000_000_000_000) {
      return `${(value / 1_000_000_000_000).toFixed(2)}조`;
    } else if (Math.abs(value) >= 100_000_000) {
      return `${(value / 100_000_000).toFixed(0)}억`;
    } else if (Math.abs(value) >= 10_000) {
      return `${(value / 10_000).toFixed(0)}만`;
    }
    return value.toLocaleString();
  };

  const getChangeIndicator = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / Math.abs(previous)) * 100;
    
    return (
      <span className={`text-xs flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  const incomeChartData = {
    labels: data.incomeStatement.map(item => item.period),
    datasets: [
      {
        label: '매출',
        data: data.incomeStatement.map(item => item.revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: '영업이익',
        data: data.incomeStatement.map(item => item.operatingIncome),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
      {
        label: '순이익',
        data: data.incomeStatement.map(item => item.netIncome),
        backgroundColor: 'rgba(251, 146, 60, 0.6)',
        borderColor: 'rgb(251, 146, 60)',
        borderWidth: 1,
      },
    ],
  };

  const balanceChartData = {
    labels: data.balanceSheet.map(item => item.period),
    datasets: [
      {
        label: '총자산',
        data: data.balanceSheet.map(item => item.totalAssets),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        fill: false,
      },
      {
        label: '총부채',
        data: data.balanceSheet.map(item => item.totalLiabilities),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        fill: false,
      },
      {
        label: '자본총계',
        data: data.balanceSheet.map(item => item.totalEquity),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  const cashFlowChartData = {
    labels: data.cashFlow.map(item => item.period),
    datasets: [
      {
        label: '영업현금흐름',
        data: data.cashFlow.map(item => item.operatingCashFlow),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: '투자현금흐름',
        data: data.cashFlow.map(item => item.investingCashFlow),
        backgroundColor: 'rgba(251, 146, 60, 0.6)',
        borderColor: 'rgb(251, 146, 60)',
        borderWidth: 1,
      },
      {
        label: '재무현금흐름',
        data: data.cashFlow.map(item => item.financingCashFlow),
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
      },
      {
        label: '잉여현금흐름',
        data: data.cashFlow.map(item => item.freeCashFlow),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
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

  const lineChartOptions: ChartOptions<'line'> = {
    ...chartOptions,
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              재무제표
            </CardTitle>
            <div className="flex gap-2">
              <Select value={viewMode} onValueChange={(value: 'table' | 'chart') => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">표 보기</SelectItem>
                  <SelectItem value="chart">차트 보기</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="income">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="income" className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                손익계산서
              </TabsTrigger>
              <TabsTrigger value="balance" className="flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                재무상태표
              </TabsTrigger>
              <TabsTrigger value="cashflow" className="flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                현금흐름표
              </TabsTrigger>
            </TabsList>

            {/* Income Statement */}
            <TabsContent value="income">
              {viewMode === 'table' ? (
                data.incomeStatement.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>기간</TableHead>
                        <TableHead className="text-right">매출</TableHead>
                        <TableHead className="text-right">매출원가</TableHead>
                        <TableHead className="text-right">매출총이익</TableHead>
                        <TableHead className="text-right">영업비용</TableHead>
                        <TableHead className="text-right">영업이익</TableHead>
                        <TableHead className="text-right">순이익</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.incomeStatement.map((item, index) => (
                        <TableRow key={item.period}>
                          <TableCell className="font-medium">{item.period}</TableCell>
                          <TableCell className="text-right">
                            <div>
                              {formatCurrency(item.revenue)}원
                              {index > 0 && getChangeIndicator(
                                item.revenue,
                                data.incomeStatement[index - 1].revenue
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.costOfGoodsSold)}원</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.grossProfit)}원</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.operatingExpenses)}원</TableCell>
                          <TableCell className="text-right">
                            <div>
                              {formatCurrency(item.operatingIncome)}원
                              {index > 0 && getChangeIndicator(
                                item.operatingIncome,
                                data.incomeStatement[index - 1].operatingIncome
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={item.netIncome < 0 ? 'text-red-600' : ''}>
                              {formatCurrency(item.netIncome)}원
                              {index > 0 && getChangeIndicator(
                                item.netIncome,
                                data.incomeStatement[index - 1].netIncome
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">손익계산서 데이터가 없습니다.</div>
                )
              ) : (
                <div className="h-96">
                  <Bar options={chartOptions} data={incomeChartData} />
                </div>
              )}
            </TabsContent>

            {/* Balance Sheet */}
            <TabsContent value="balance">
              {viewMode === 'table' ? (
                data.balanceSheet.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>기간</TableHead>
                        <TableHead className="text-right">총자산</TableHead>
                        <TableHead className="text-right">유동자산</TableHead>
                        <TableHead className="text-right">총부채</TableHead>
                        <TableHead className="text-right">유동부채</TableHead>
                        <TableHead className="text-right">자본총계</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.balanceSheet.map((item, index) => (
                        <TableRow key={item.period}>
                          <TableCell className="font-medium">{item.period}</TableCell>
                          <TableCell className="text-right">
                            <div>
                              {formatCurrency(item.totalAssets)}원
                              {index > 0 && getChangeIndicator(
                                item.totalAssets,
                                data.balanceSheet[index - 1].totalAssets
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.currentAssets)}원</TableCell>
                          <TableCell className="text-right">
                            <div>
                              {formatCurrency(item.totalLiabilities)}원
                              {index > 0 && getChangeIndicator(
                                item.totalLiabilities,
                                data.balanceSheet[index - 1].totalLiabilities
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.currentLiabilities)}원</TableCell>
                          <TableCell className="text-right">
                            <div>
                              {formatCurrency(item.totalEquity)}원
                              {index > 0 && getChangeIndicator(
                                item.totalEquity,
                                data.balanceSheet[index - 1].totalEquity
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">재무상태표 데이터가 없습니다.</div>
                )
              ) : (
                <div className="h-96">
                  <Line options={lineChartOptions} data={balanceChartData} />
                </div>
              )}
            </TabsContent>

            {/* Cash Flow Statement */}
            <TabsContent value="cashflow">
              {viewMode === 'table' ? (
                data.cashFlow.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>기간</TableHead>
                        <TableHead className="text-right">영업현금흐름</TableHead>
                        <TableHead className="text-right">투자현금흐름</TableHead>
                        <TableHead className="text-right">재무현금흐름</TableHead>
                        <TableHead className="text-right">순현금흐름</TableHead>
                        <TableHead className="text-right">잉여현금흐름</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.cashFlow.map((item) => (
                        <TableRow key={item.period}>
                          <TableCell className="font-medium">{item.period}</TableCell>
                          <TableCell className={`text-right ${item.operatingCashFlow < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(item.operatingCashFlow)}원
                          </TableCell>
                          <TableCell className={`text-right ${item.investingCashFlow < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(item.investingCashFlow)}원
                          </TableCell>
                          <TableCell className={`text-right ${item.financingCashFlow < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(item.financingCashFlow)}원
                          </TableCell>
                          <TableCell className={`text-right ${item.netCashFlow < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(item.netCashFlow)}원
                          </TableCell>
                          <TableCell className={`text-right ${item.freeCashFlow < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(item.freeCashFlow)}원
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">현금흐름표 데이터가 없습니다.</div>
                )
              ) : (
                <div className="h-96">
                  <Bar options={chartOptions} data={cashFlowChartData} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialStatementsView;