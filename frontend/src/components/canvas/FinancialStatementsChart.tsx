import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FinancialStatements } from "@/services/investment-analysis";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialStatementsChartProps {
  financialStatements: FinancialStatements;
}

export const FinancialStatementsChart: React.FC<
  FinancialStatementsChartProps
> = ({ financialStatements }) => {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [period, setPeriod] = useState<"quarterly" | "annual">("quarterly");

  // Sort data chronologically
  const sortedIncome = [...(financialStatements.incomeStatement || [])].sort(
    (a, b) => {
      return a.period.localeCompare(b.period);
    }
  );

  const sortedBalance = [...(financialStatements.balanceSheet || [])].sort(
    (a, b) => {
      return a.period.localeCompare(b.period);
    }
  );

  const sortedCashFlow = [...(financialStatements.cashFlow || [])].sort(
    (a, b) => {
      return a.period.localeCompare(b.period);
    }
  );

  // Filter data based on period
  const filterByPeriod = (data: any[]) => {
    if (period === "quarterly") {
      return data.slice(-4); // Last 4 quarters
    }
    return data.slice(-3); // Last 3 years
  };

  const incomeData = filterByPeriod(sortedIncome);
  const balanceData = filterByPeriod(sortedBalance);
  const cashFlowData = filterByPeriod(sortedCashFlow);

  // Calculate growth rates
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  // Format large numbers - backend sends values in 억원 units
  const formatValue = (value: number) => {
    // Backend sends data in 억원 (hundred million won) units
    // So we need to convert: value * 100,000,000 to get actual won amount
    const actualValue = value * 100000000; // Convert 억원 to 원

    if (Math.abs(actualValue) >= 1000000000000) {
      return `${(actualValue / 1000000000000).toFixed(1)}조`;
    } else if (Math.abs(actualValue) >= 100000000) {
      return `${(actualValue / 100000000).toFixed(0)}억`;
    } else if (Math.abs(actualValue) >= 10000000) {
      return `${(actualValue / 10000000).toFixed(1)}천만`;
    }
    return actualValue.toLocaleString();
  };

  // Income Statement Chart Data
  const incomeChartData = {
    labels: incomeData.map((d) => d.period),
    datasets: [
      {
        label: "매출액",
        data: incomeData.map((d) => d.revenue),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: "영업이익",
        data: incomeData.map((d) => d.operatingIncome),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: "순이익",
        data: incomeData.map((d) => d.netIncome),
        backgroundColor: "rgba(251, 191, 36, 0.8)",
        borderColor: "rgb(251, 191, 36)",
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  // Balance Sheet Chart Data
  const balanceChartData = {
    labels: balanceData.map((d) => d.period),
    datasets: [
      {
        label: "총자산",
        data: balanceData.map((d) => d.totalAssets),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: "총부채",
        data: balanceData.map((d) => d.totalLiabilities),
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: "자본총계",
        data: balanceData.map((d) => d.totalEquity),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  // Cash Flow Chart Data
  const cashFlowChartData = {
    labels: cashFlowData.map((d) => d.period),
    datasets: [
      {
        label: "영업활동 현금흐름",
        data: cashFlowData.map((d) => d.operatingCashFlow),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: "투자활동 현금흐름",
        data: cashFlowData.map((d) => d.investingCashFlow),
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: "재무활동 현금흐름",
        data: cashFlowData.map((d) => d.financingCashFlow),
        backgroundColor: "rgba(251, 191, 36, 0.8)",
        borderColor: "rgb(251, 191, 36)",
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: "잉여현금흐름",
        data: cashFlowData.map((d) => d.freeCashFlow),
        type: "line" as const,
        backgroundColor: "transparent",
        borderColor: "rgb(168, 85, 247)",
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "rgb(168, 85, 247)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
          font: {
            size: 11,
            family: "Inter, system-ui, sans-serif",
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 12,
          weight: "600",
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: (context: TooltipItem<"bar">) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${formatValue(value)}원`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            family: "Inter, system-ui, sans-serif",
          },
          color: "rgb(107, 114, 128)",
        },
      },
      y: {
        grid: {
          color: "rgba(229, 231, 235, 0.5)",
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
            family: "Inter, system-ui, sans-serif",
          },
          color: "rgb(107, 114, 128)",
          callback: function (value: any) {
            return formatValue(value);
          },
        },
      },
    },
  };

  // Calculate key metrics
  const latestIncome = incomeData[incomeData.length - 1];
  const profitMargin = latestIncome
    ? (latestIncome.netIncome / latestIncome.revenue) * 100
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              재무제표
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={period === "quarterly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod("quarterly")}
                className={`h-7 px-3 text-xs ${
                  period === "quarterly"
                    ? "bg-white shadow-sm text-black"
                    : "hover:bg-gray-50"
                }`}
              >
                분기
              </Button>
              <Button
                variant={period === "annual" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod("annual")}
                className={`h-7 px-3 text-xs ${
                  period === "annual"
                    ? "bg-white shadow-sm"
                    : "hover:bg-gray-50"
                }`}
              >
                연간
              </Button>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === "chart" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("chart")}
                className={`h-7 px-3 text-xs ${
                  viewMode === "chart"
                    ? "bg-white shadow-sm text-black"
                    : "hover:bg-gray-50"
                }`}
              >
                차트
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={`h-7 px-3 text-xs ${
                  viewMode === "table"
                    ? "bg-white shadow-sm"
                    : "hover:bg-gray-50"
                }`}
              >
                테이블
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Metrics Summary */}
        {latestIncome && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-blue-700 mb-1">
                <DollarSign className="h-3 w-3" />
                <span>매출액</span>
              </div>
              <p className="text-sm font-bold text-blue-900">
                {formatValue(latestIncome.revenue)}원
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-green-700 mb-1">
                <TrendingUp className="h-3 w-3" />
                <span>영업이익</span>
              </div>
              <p className="text-sm font-bold text-green-900">
                {formatValue(latestIncome.operatingIncome)}원
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-yellow-700 mb-1">
                <Activity className="h-3 w-3" />
                <span>순이익</span>
              </div>
              <p className="text-sm font-bold text-yellow-900">
                {formatValue(latestIncome.netIncome)}원
              </p>
              <p className="text-xs text-gray-600 mt-1">
                이익률: {profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-purple-700 mb-1">
                <PieChart className="h-3 w-3" />
                <span>영업이익률</span>
              </div>
              <p className="text-sm font-bold text-purple-900">
                {(
                  (latestIncome.operatingIncome / latestIncome.revenue) *
                  100
                ).toFixed(1)}
                %
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {period === "quarterly" ? "분기" : "연간"} 기준
              </p>
            </div>
          </div>
        )}

        {viewMode === "chart" ? (
          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="income">손익계산서</TabsTrigger>
              <TabsTrigger value="balance">재무상태표</TabsTrigger>
              <TabsTrigger value="cashflow">현금흐름표</TabsTrigger>
            </TabsList>

            <TabsContent value="income" className="mt-0">
              <div className="h-[400px] w-full">
                <Bar data={incomeChartData} options={chartOptions} />
              </div>
            </TabsContent>

            <TabsContent value="balance" className="mt-0">
              <div className="h-[400px] w-full">
                <Bar data={balanceChartData} options={chartOptions} />
              </div>
            </TabsContent>

            <TabsContent value="cashflow" className="mt-0">
              <div className="h-[400px] w-full">
                <Bar data={cashFlowChartData} options={chartOptions} />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            {/* Income Statement Table */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                손익계산서
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2 font-medium">기간</th>
                      <th className="text-right p-2 font-medium">매출액</th>
                      <th className="text-right p-2 font-medium">매출원가</th>
                      <th className="text-right p-2 font-medium">매출총이익</th>
                      <th className="text-right p-2 font-medium">영업이익</th>
                      <th className="text-right p-2 font-medium">순이익</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeData.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.period}</td>
                        <td className="text-right p-2">
                          {formatValue(item.revenue)}
                        </td>
                        <td className="text-right p-2">
                          {formatValue(item.costOfGoodsSold)}
                        </td>
                        <td className="text-right p-2">
                          {formatValue(item.grossProfit)}
                        </td>
                        <td className="text-right p-2 font-medium">
                          {formatValue(item.operatingIncome)}
                        </td>
                        <td className="text-right p-2 font-bold">
                          {formatValue(item.netIncome)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Balance Sheet Table */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                재무상태표
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2 font-medium">기간</th>
                      <th className="text-right p-2 font-medium">총자산</th>
                      <th className="text-right p-2 font-medium">유동자산</th>
                      <th className="text-right p-2 font-medium">총부채</th>
                      <th className="text-right p-2 font-medium">유동부채</th>
                      <th className="text-right p-2 font-medium">자본총계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanceData.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.period}</td>
                        <td className="text-right p-2 font-medium">
                          {formatValue(item.totalAssets)}
                        </td>
                        <td className="text-right p-2">
                          {formatValue(item.currentAssets)}
                        </td>
                        <td className="text-right p-2 text-red-600">
                          {formatValue(item.totalLiabilities)}
                        </td>
                        <td className="text-right p-2">
                          {formatValue(item.currentLiabilities)}
                        </td>
                        <td className="text-right p-2 font-bold text-green-600">
                          {formatValue(item.totalEquity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
