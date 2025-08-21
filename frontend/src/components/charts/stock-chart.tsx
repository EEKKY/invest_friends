import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'chart.js';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { chartService } from '@/services/chart';

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

interface StockChartProps {
  stockCode: string;
  companyName: string;
}

export const StockChart: React.FC<StockChartProps> = ({ stockCode, companyName }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'price' | 'volume'>('price');

  useEffect(() => {
    fetchChartData();
  }, [stockCode, period]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const data = await chartService.getStockChart(stockCode, period);
      formatChartData(data);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (data: any) => {
    if (!data || !data.output2 || data.output2.length === 0) {
      return;
    }

    // Sort data chronologically
    const sortedData = [...data.output2].sort((a: any, b: any) => {
      return parseInt(a.stck_bsop_date) - parseInt(b.stck_bsop_date);
    });

    const labels = sortedData.map((item: any) => {
      const dateStr = item.stck_bsop_date;
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${month}/${day}`;
    });

    const prices = sortedData.map((item: any) => parseFloat(item.stck_clpr));
    const volumes = sortedData.map((item: any) => parseInt(item.acml_vol));
    const highs = sortedData.map((item: any) => parseFloat(item.stck_hgpr));
    const lows = sortedData.map((item: any) => parseFloat(item.stck_lwpr));

    // Calculate change
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    setChartData({
      labels,
      prices,
      volumes,
      highs,
      lows,
      change,
      changePercent,
      currentPrice: lastPrice,
    });
  };


  if (loading || !chartData) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-lg">차트 로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  const priceChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: '종가',
        data: chartData.prices,
        borderColor: chartData.change >= 0 ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)',
        backgroundColor: chartData.change >= 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5,
      },
    ],
  };

  const volumeChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: '거래량',
        data: chartData.volumes,
        backgroundColor: 'rgba(156, 163, 175, 0.5)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return '₩' + value.toLocaleString();
          },
        },
      },
    },
  };

  const volumeOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            }
            return (value / 1000).toFixed(0) + 'K';
          },
        },
      },
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{companyName} ({stockCode})</CardTitle>
            <Badge variant={chartData.change >= 0 ? "destructive" : "default"}>
              {chartData.change >= 0 ? '+' : ''}{chartData.changePercent.toFixed(2)}%
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              ₩{chartData.currentPrice.toLocaleString()}
            </span>
            <span className={`text-sm ${chartData.change >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
              {chartData.change >= 0 ? '▲' : '▼'} {Math.abs(chartData.change).toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={period === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('daily')}
          >
            일간
          </Button>
          <Button
            variant={period === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('weekly')}
          >
            주간
          </Button>
          <Button
            variant={period === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('monthly')}
          >
            월간
          </Button>
          <div className="ml-auto flex gap-2">
            <Button
              variant={chartType === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('price')}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              가격
            </Button>
            <Button
              variant={chartType === 'volume' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('volume')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              거래량
            </Button>
          </div>
        </div>
        
        <div className="h-96">
          {chartType === 'price' ? (
            <Line data={priceChartData} options={chartOptions} />
          ) : (
            <Bar data={volumeChartData} options={volumeOptions} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};