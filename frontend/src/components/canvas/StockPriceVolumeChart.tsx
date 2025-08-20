import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { investmentAnalysisService } from '@/services/investment-analysis';
import type { ChartData } from '@/services/investment-analysis';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StockPriceVolumeChartProps {
  stockCode: string;
  chartData?: ChartData;
  className?: string;
}

export const StockPriceVolumeChart: React.FC<StockPriceVolumeChartProps> = ({ 
  stockCode, 
  chartData: initialData,
  className = ''
}) => {
  const [period, setPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  const [chartType, setChartType] = useState<'candle' | 'line' | 'area'>('area');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData | undefined>(initialData);

  useEffect(() => {
    if (initialData) {
      setChartData(initialData);
    }
  }, [initialData]);

  // Ensure dailyData is an array - check for both output and output2 formats
  let dailyData = [];
  if (chartData?.dailyChart?.output) {
    dailyData = Array.isArray(chartData.dailyChart.output) ? chartData.dailyChart.output : [];
  } else if (chartData?.dailyChart?.output2) {
    dailyData = Array.isArray(chartData.dailyChart.output2) ? chartData.dailyChart.output2 : [];
  } else if (chartData?.dailyChart) {
    dailyData = Array.isArray(chartData.dailyChart) ? chartData.dailyChart : [];
  }
  
  // Sort data chronologically - handle both date field names
  const sortedData = dailyData.length > 0 ? [...dailyData].sort((a: any, b: any) => {
    const dateA = parseInt(a.stck_cntg_hour || a.stck_bsop_date || 0);
    const dateB = parseInt(b.stck_cntg_hour || b.stck_bsop_date || 0);
    return dateA - dateB;
  }) : [];

  // Filter data based on period
  const filterDataByPeriod = () => {
    if (sortedData.length === 0) return [];
    
    const periodDays = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '1Y': 365
    };
    
    const daysToShow = periodDays[period];
    return sortedData.slice(-daysToShow);
  };

  const filteredData = filterDataByPeriod();

  // Calculate statistics
  const calculateStats = () => {
    if (filteredData.length === 0) return {
      currentPrice: 0,
      change: 0,
      changePercent: 0,
      high: 0,
      low: 0,
      volume: 0,
      avgVolume: 0,
      isPositive: true
    };

    // Handle both field naming conventions
    const prices = filteredData.map((d: any) => parseFloat(d.stck_prpr || d.stck_clpr || 0));
    const volumes = filteredData.map((d: any) => parseInt(d.acml_vol || d.cntg_vol || 0));
    
    const currentPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2] || prices[0];
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    
    return {
      currentPrice,
      change,
      changePercent,
      high: Math.max(...prices),
      low: Math.min(...prices),
      volume: volumes[volumes.length - 1],
      avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      isPositive: change >= 0
    };
  };

  const stats = calculateStats();

  // Format date labels - handle both stck_cntg_hour and stck_bsop_date
  const formatDateLabel = (item: any) => {
    const dateStr = item.stck_cntg_hour || item.stck_bsop_date || '';
    if (!dateStr) return '';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    
    if (period === '1D' || period === '1W') {
      return `${month}/${day}`;
    } else if (period === '1Y') {
      return `${year}.${month}`;
    }
    return `${month}/${day}`;
  };

  // Prepare price chart data
  const priceChartData = {
    labels: filteredData.map((item: any) => formatDateLabel(item)),
    datasets: [
      {
        label: '주가',
        data: filteredData.map((item: any) => parseFloat(item.stck_prpr || item.stck_clpr || 0)),
        borderColor: stats.isPositive ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)',
        backgroundColor: chartType === 'area' 
          ? stats.isPositive 
            ? 'rgba(239, 68, 68, 0.05)' 
            : 'rgba(59, 130, 246, 0.05)'
          : 'transparent',
        borderWidth: 2.5,
        fill: chartType === 'area',
        tension: chartType === 'line' ? 0.4 : 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: stats.isPositive ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
      },
      {
        label: 'MA20',
        data: filteredData.map((item: any, index: number) => {
          if (index < 19) return null;
          const sum = filteredData
            .slice(index - 19, index + 1)
            .reduce((acc: number, curr: any) => acc + parseFloat(curr.stck_prpr || curr.stck_clpr || 0), 0);
          return sum / 20;
        }),
        borderColor: 'rgb(251, 191, 36)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [3, 3],
        tension: 0.4,
        pointRadius: 0,
        fill: false,
        pointHoverRadius: 0,
      },
      {
        label: 'MA60',
        data: filteredData.map((item: any, index: number) => {
          if (index < 59) return null;
          const sum = filteredData
            .slice(index - 59, index + 1)
            .reduce((acc: number, curr: any) => acc + parseFloat(curr.stck_prpr || curr.stck_clpr || 0), 0);
          return sum / 60;
        }),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [3, 3],
        tension: 0.4,
        pointRadius: 0,
        fill: false,
        pointHoverRadius: 0,
      }
    ],
  };

  // Prepare volume chart data
  const volumeChartData = {
    labels: filteredData.map((item: any) => formatDateLabel(item)),
    datasets: [
      {
        label: '거래량',
        data: filteredData.map((item: any) => parseInt(item.acml_vol || item.cntg_vol || 0)),
        backgroundColor: filteredData.map((item: any, index: number) => {
          if (index === 0) return 'rgba(156, 163, 175, 0.5)';
          const prevClose = parseFloat(filteredData[index - 1]?.stck_prpr || filteredData[index - 1]?.stck_clpr || 0);
          const currClose = parseFloat(item.stck_prpr || item.stck_clpr || 0);
          return currClose >= prevClose 
            ? 'rgba(239, 68, 68, 0.5)' 
            : 'rgba(59, 130, 246, 0.5)';
        }),
        borderColor: filteredData.map((item: any, index: number) => {
          if (index === 0) return 'rgb(156, 163, 175)';
          const prevClose = parseFloat(filteredData[index - 1]?.stck_prpr || filteredData[index - 1]?.stck_clpr || 0);
          const currClose = parseFloat(item.stck_prpr || item.stck_clpr || 0);
          return currClose >= prevClose 
            ? 'rgb(239, 68, 68)' 
            : 'rgb(59, 130, 246)';
        }),
        borderWidth: 1,
        borderRadius: 2,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      },
    ],
  };

  const priceChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 12,
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
          usePointStyle: true,
          pointStyle: 'line',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 12,
          weight: '600',
        },
        bodyFont: {
          size: 12,
        },
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (!value) return '';
            return `${label}: ₩${value.toLocaleString()}`;
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
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          font: {
            size: 10,
            family: 'Inter, system-ui, sans-serif',
          },
          color: 'rgb(107, 114, 128)',
        },
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
            family: 'Inter, system-ui, sans-serif',
          },
          color: 'rgb(107, 114, 128)',
          padding: 8,
          callback: function(value: any) {
            return '₩' + value.toLocaleString();
          },
        },
      },
    },
  };

  const volumeChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 12,
          weight: '600',
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const value = context.parsed.y;
            return `거래량: ${value.toLocaleString()}주`;
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
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          font: {
            size: 10,
            family: 'Inter, system-ui, sans-serif',
          },
          color: 'rgb(107, 114, 128)',
        },
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
            family: 'Inter, system-ui, sans-serif',
          },
          color: 'rgb(107, 114, 128)',
          padding: 8,
          callback: function(value: any) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'K';
            }
            return value;
          },
        },
      },
    },
  };

  // Show loading or empty state if no data
  if (!chartData && !dailyData.length) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">차트 데이터 로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-semibold">주가 차트</CardTitle>
            <div className="flex items-center gap-2">
              {stats.isPositive ? (
                <ArrowUpRight className="h-5 w-5 text-red-500" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-blue-500" />
              )}
              <span className={`text-2xl font-bold ${stats.isPositive ? 'text-red-500' : 'text-blue-500'}`}>
                ₩{stats.currentPrice.toLocaleString()}
              </span>
              <Badge 
                variant={stats.isPositive ? "destructive" : "default"}
                className="ml-2"
              >
                {stats.isPositive ? '+' : ''}{stats.change.toLocaleString()} ({stats.isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%)
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['1D', '1W', '1M', '3M', '1Y'] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className={`h-7 px-3 text-xs ${
                    period === p 
                      ? 'bg-white shadow-sm' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <TrendingUp className="h-3 w-3" />
              <span>최고가</span>
            </div>
            <p className="text-sm font-semibold text-red-600">
              ₩{stats.high.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <TrendingDown className="h-3 w-3" />
              <span>최저가</span>
            </div>
            <p className="text-sm font-semibold text-blue-600">
              ₩{stats.low.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <BarChart3 className="h-3 w-3" />
              <span>거래량</span>
            </div>
            <p className="text-sm font-semibold">
              {(stats.volume / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <Clock className="h-3 w-3" />
              <span>평균 거래량</span>
            </div>
            <p className="text-sm font-semibold">
              {(stats.avgVolume / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Charts */}
        <Tabs defaultValue="price" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="price">가격 차트</TabsTrigger>
            <TabsTrigger value="volume">거래량 차트</TabsTrigger>
          </TabsList>
          
          <TabsContent value="price" className="mt-0">
            <div className="relative h-[400px] w-full">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              )}
              <Line data={priceChartData} options={priceChartOptions} />
            </div>
          </TabsContent>
          
          <TabsContent value="volume" className="mt-0">
            <div className="relative h-[400px] w-full">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              )}
              <Bar data={volumeChartData} options={volumeChartOptions} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Chart Type Selector */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">차트 유형:</span>
            <div className="flex gap-1">
              {(['area', 'line'] as const).map((type) => (
                <Button
                  key={type}
                  variant={chartType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType(type)}
                  className="h-6 px-2 text-xs"
                >
                  {type === 'area' ? '영역' : '라인'}
                </Button>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            데이터: {filteredData.length}개 포인트
          </div>
        </div>
      </CardContent>
    </Card>
  );
};