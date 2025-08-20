import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { ChartData } from '../../services/investment-analysis';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StockPriceChartProps {
  data: ChartData;
  period: string;
}

const StockPriceChart: React.FC<StockPriceChartProps> = ({ data, period }) => {
  const [showMA5, setShowMA5] = useState(true);
  const [showMA20, setShowMA20] = useState(true);
  const [showMA60, setShowMA60] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  const chartData = useMemo(() => {
    if (!data?.dailyChart?.output || !Array.isArray(data.dailyChart.output)) return null;

    const dailyData = data.dailyChart.output.slice(0, 60).reverse();
    const labels = dailyData.map(item => {
      const date = item.stck_bsop_date || '';
      if (!date || date.length < 8) return '';
      return `${date.slice(4, 6)}/${date.slice(6, 8)}`;
    });

    const prices = dailyData.map(item => parseFloat(item.stck_prpr));
    const volumes = dailyData.map(item => parseInt(item.acml_vol));

    const datasets: any[] = [
      {
        label: '종가',
        data: prices,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        yAxisID: 'y',
      },
    ];

    if (showMA5 && data.movingAverages?.ma5) {
      datasets.push({
        label: 'MA5',
        data: data.movingAverages.ma5.slice(0, 60).reverse(),
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        borderDash: [2, 2],
        pointRadius: 0,
        tension: 0.1,
        yAxisID: 'y',
      });
    }

    if (showMA20 && data.movingAverages?.ma20) {
      datasets.push({
        label: 'MA20',
        data: data.movingAverages.ma20.slice(0, 60).reverse(),
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        borderDash: [2, 2],
        pointRadius: 0,
        tension: 0.1,
        yAxisID: 'y',
      });
    }

    if (showMA60 && data.movingAverages?.ma60) {
      datasets.push({
        label: 'MA60',
        data: data.movingAverages.ma60.slice(0, 60).reverse(),
        borderColor: 'rgb(251, 146, 60)',
        borderWidth: 1,
        borderDash: [2, 2],
        pointRadius: 0,
        tension: 0.1,
        yAxisID: 'y',
      });
    }

    return {
      labels,
      datasets,
      volumes,
      prices,
    };
  }, [data, showMA5, showMA20, showMA60]);

  const volumeChartData = useMemo(() => {
    if (!chartData) return null;

    return {
      labels: chartData.labels,
      datasets: [
        {
          label: '거래량',
          data: chartData.volumes,
          backgroundColor: chartData.prices.map((price, index) => {
            if (index === 0) return 'rgba(59, 130, 246, 0.5)';
            return price >= chartData.prices[index - 1]
              ? 'rgba(239, 68, 68, 0.5)'
              : 'rgba(59, 130, 246, 0.5)';
          }),
          borderWidth: 0,
        },
      ],
    };
  }, [chartData]);

  const rsiChartData = useMemo(() => {
    if (!data?.technicalIndicators?.rsi) return null;

    const rsiData = data.technicalIndicators.rsi.slice(0, 60).reverse();
    
    return {
      labels: chartData?.labels || [],
      datasets: [
        {
          label: 'RSI',
          data: rsiData,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderWidth: 2,
          tension: 0.1,
          fill: true,
        },
      ],
    };
  }, [data, chartData]);

  const priceOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString()}원`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => `${value.toLocaleString()}원`,
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
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `거래량: ${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => {
            const num = Number(value);
            if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
            if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
            return value.toString();
          },
        },
      },
    },
  };

  const rsiOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `RSI: ${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  if (!chartData) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>주가 차트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">차트 데이터가 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>주가 차트</CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Switch
                id="ma5"
                checked={showMA5}
                onCheckedChange={setShowMA5}
              />
              <Label htmlFor="ma5" className="text-red-500">MA5</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="ma20"
                checked={showMA20}
                onCheckedChange={setShowMA20}
              />
              <Label htmlFor="ma20" className="text-green-500">MA20</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="ma60"
                checked={showMA60}
                onCheckedChange={setShowMA60}
              />
              <Label htmlFor="ma60" className="text-orange-500">MA60</Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="price" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="price">가격</TabsTrigger>
            <TabsTrigger value="volume">거래량</TabsTrigger>
            <TabsTrigger value="rsi">RSI</TabsTrigger>
          </TabsList>
          
          <TabsContent value="price" className="h-96">
            <Line options={priceOptions} data={chartData} />
          </TabsContent>
          
          <TabsContent value="volume" className="h-96">
            {volumeChartData && <Bar options={volumeOptions} data={volumeChartData} />}
          </TabsContent>
          
          <TabsContent value="rsi" className="h-96">
            {rsiChartData ? (
              <>
                <Line options={rsiOptions} data={rsiChartData} />
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>과매도 (30 이하)</span>
                  <span>과매수 (70 이상)</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">RSI 데이터가 없습니다.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StockPriceChart;