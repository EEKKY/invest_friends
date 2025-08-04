import React, { useEffect, useState, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    LineElement,
    BarElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';
import { chartApi } from '../../services/chart';
import type { ChartResponse, GetChartParams } from '../../services/chart';
import { Button } from '../ui/button';
import { toast } from 'sonner';

ChartJS.register(CategoryScale, LinearScale, LineElement, BarElement, PointElement, Title, Tooltip, Legend, TimeScale);

interface StockChartProps {
    ticker: string;
    className?: string;
}

export const StockChart: React.FC<StockChartProps> = ({ ticker, className }) => {
    const [chartData, setChartData] = useState<ChartResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState<'1d' | '1w' | '1m' | '1y'>('1d');

    const fetchChartData = useCallback(async (selectedPeriod: '1d' | '1w' | '1m' | '1y') => {
        if (!ticker) return;

        setLoading(true);
        try {
            const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const startDate = getStartDate(selectedPeriod);

            const params: GetChartParams = {
                ticker,
                period: selectedPeriod,
                startDate,
                endDate,
            };

            const data = await chartApi.getStockChart(params);
            setChartData(data);
        } catch (error) {
            console.error('Failed to fetch chart data:', error);
            toast.error('차트 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [ticker]);

    const getStartDate = (period: string): string => {
        const now = new Date();
        const start = new Date();

        switch (period) {
            case '1d':
                // For 1d, use today's date
                return now.toISOString().slice(0, 10).replace(/-/g, '');
            case '1w':
                start.setDate(now.getDate() - 7);
                break;
            case '1m':
                start.setMonth(now.getMonth() - 1);
                break;
            case '1y':
                start.setFullYear(now.getFullYear() - 1);
                break;
        }

        return start.toISOString().slice(0, 10).replace(/-/g, '');
    };

    useEffect(() => {
        fetchChartData(period);
    }, [ticker, period, fetchChartData]);

    const handlePeriodChange = (newPeriod: '1d' | '1w' | '1m' | '1y') => {
        setPeriod(newPeriod);
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: `${ticker} ${period === '1d' ? '일중' : '주가'} 차트`,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: function (context: TooltipItem<'line'>) {
                        const dataPoint = chartData?.data[context.dataIndex];
                        if (!dataPoint) return '';

                        return [
                            `종가: ${dataPoint.close.toLocaleString()}원`,
                            `시가: ${dataPoint.open.toLocaleString()}원`,
                            `고가: ${dataPoint.high.toLocaleString()}원`,
                            `저가: ${dataPoint.low.toLocaleString()}원`,
                            `거래량: ${dataPoint.volume.toLocaleString()}주`,
                        ];
                    },
                },
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: period === '1d' ? '시간' : '날짜',
                },
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: '가격 (원)',
                },
                beginAtZero: false,
            },
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false,
        },
    };

    const getChartData = () => {
        if (!chartData?.data) return { labels: [], datasets: [] };

        // For intraday charts, show all available data
        // The backend should handle what data to send based on current time
        const filteredData = chartData.data;

        const labels = filteredData.map((item) => {
            const date = item.date;
            
            // For 1d period, format as time (HHMMSS -> HH:MM)
            if (period === '1d' && date.length === 6) {
                const hours = date.slice(0, 2);
                const minutes = date.slice(2, 4);
                return `${hours}:${minutes}`;
            }
            
            // For other periods, format as date with day count
            if (date.length === 8) {
                const month = date.slice(4, 6);
                const day = date.slice(6, 8);
                return `${month}/${day}`;
            }
            
            return date;
        });

        return {
            labels,
            datasets: [
                {
                    label: '주가',
                    data: filteredData.map((item) => item.close),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                },
            ],
        };
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center h-64 ${className}`}>
                <div className="text-lg">차트 로딩 중...</div>
            </div>
        );
    }

    return (
        <div className={`w-full ${className}`}>
            {/* Period Selection */}
            <div className="flex gap-2 mb-4">
                {(['1d', '1w', '1m', '1y'] as const).map((p) => (
                    <Button
                        key={p}
                        variant={period === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePeriodChange(p)}
                    >
                        {p === '1d' ? '1일' : p === '1w' ? '1주' : p === '1m' ? '1개월' : '1년'}
                    </Button>
                ))}
            </div>

            {/* Chart */}
            <div className="h-80">
                <Line options={chartOptions} data={getChartData()} />
            </div>

            {/* Chart Info */}
            {chartData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">차트 정보</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>종목코드: {chartData.ticker}</div>
                        <div>기간: {period}</div>
                        <div>
                            {period === '1d' ? 
                                `시간 데이터: ${getChartData().labels.length}개` : 
                                `일봉 차트: ${chartData.data.length}일`
                            }
                        </div>
                        <div>
                            조회기간: {period === '1d' ? 
                                `${chartData.startDate.slice(0, 4)}-${chartData.startDate.slice(4, 6)}-${chartData.startDate.slice(6, 8)} (일중)` : 
                                `${chartData.startDate.slice(0, 4)}-${chartData.startDate.slice(4, 6)}-${chartData.startDate.slice(6, 8)} ~ ${chartData.endDate.slice(0, 4)}-${chartData.endDate.slice(4, 6)}-${chartData.endDate.slice(6, 8)}`
                            }
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <h5 className="font-medium mb-2">차트 설명</h5>
                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex items-start gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                                <div>
                                    차트는 <strong>종가(마감가)</strong>를 기준으로 표시됩니다. 마우스를 올리면 해당 {period === '1d' ? '시간대' : '일자'}의 시가, 고가, 저가, 종가, 거래량을 모두 확인할 수 있습니다.
                                    {period === '1d' && <span className="block mt-1 text-xs text-gray-500">• 1일 차트는 30분 간격으로 표시됩니다.</span>}
                                </div>
                            </div>
                            <div className="text-xs text-gray-600 mt-2">
                                • <strong>시가:</strong> 거래 시작 가격 • <strong>고가:</strong> 하루 중 최고가 • <strong>저가:</strong> 하루 중 최저가 • <strong>종가:</strong> 거래 마감 가격
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
