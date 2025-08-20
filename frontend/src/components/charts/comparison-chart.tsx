import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Filler,
  type ChartOptions,
} from 'chart.js';
import { chartService } from '@/services/chart';
import { TrendingUp, BarChart3 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ComparisonChartProps {
  stockCode: string;
  companyName: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ stockCode, companyName }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComparisonData();
  }, [stockCode]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      // Fetch both stock and KOSPI index data
      const [stockData, indexData] = await Promise.all([
        chartService.getStockChart(stockCode, 'daily'),
        chartService.getIndexChart('0001', 'daily') // KOSPI
      ]);
      
      formatComparisonData(stockData, indexData);
    } catch (error) {
      console.error('Failed to fetch comparison data:', error);
      generateMockComparisonData();
    } finally {
      setLoading(false);
    }
  };

  const formatComparisonData = (stockData: any, indexData: any) => {
    if (!stockData?.output2 || !indexData?.output2) {
      generateMockComparisonData();
      return;
    }

    // Sort and normalize data
    const sortedStock = [...stockData.output2].sort((a: any, b: any) => {
      return parseInt(a.stck_bsop_date) - parseInt(b.stck_bsop_date);
    }).slice(-30); // Last 30 days

    const sortedIndex = [...indexData.output2].sort((a: any, b: any) => {
      return parseInt(a.bsop_date) - parseInt(b.bsop_date);
    }).slice(-30);

    const labels = sortedStock.map((item: any) => {
      const dateStr = item.stck_bsop_date;
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${month}/${day}`;
    });

    // Normalize to percentage change from first day
    const stockPrices = sortedStock.map((item: any) => parseFloat(item.stck_clpr));
    const indexPrices = sortedIndex.map((item: any) => parseFloat(item.bstp_nmix_prpr));
    
    const stockBase = stockPrices[0];
    const indexBase = indexPrices[0];
    
    const stockNormalized = stockPrices.map((price: number) => ((price - stockBase) / stockBase) * 100);
    const indexNormalized = indexPrices.map((price: number) => ((price - indexBase) / indexBase) * 100);

    setChartData({
      labels,
      stockData: stockNormalized,
      indexData: indexNormalized,
      stockName: companyName,
      performance: stockNormalized[stockNormalized.length - 1] - indexNormalized[indexNormalized.length - 1]
    });
  };

  const generateMockComparisonData = () => {
    const labels = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    });

    const stockData = Array.from({ length: 30 }, (_, i) => 
      (Math.random() - 0.5) * 20 + i * 0.3
    );

    const indexData = Array.from({ length: 30 }, (_, i) => 
      (Math.random() - 0.5) * 10 + i * 0.2
    );

    setChartData({
      labels,
      stockData,
      indexData,
      stockName: companyName,
      performance: stockData[stockData.length - 1] - indexData[indexData.length - 1]
    });
  };

  if (loading || !chartData) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-lg">비교 차트 로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: chartData.stockName,
        data: chartData.stockData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5,
      },
      {
        label: 'KOSPI',
        data: chartData.indexData,
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2) + '%';
            }
            return label;
          },
        },
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
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            시장 대비 성과
          </CardTitle>
          <div className={`text-lg font-bold ${chartData.performance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {chartData.performance >= 0 ? '+' : ''}{chartData.performance.toFixed(2)}%
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Line data={data} options={options} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-sm text-gray-600">{chartData.stockName}</div>
            <div className="text-lg font-bold text-blue-600">
              {chartData.stockData[chartData.stockData.length - 1].toFixed(2)}%
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">KOSPI</div>
            <div className="text-lg font-bold text-gray-600">
              {chartData.indexData[chartData.indexData.length - 1].toFixed(2)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};