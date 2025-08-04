import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import type { TooltipItem, ScriptableScaleContext } from 'chart.js';
import { chartApi } from '../../services/chart';
import type { ChartResponse, IndexChartResponse, GetChartParams, GetIndexChartParams } from '../../services/chart';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface ComparisonChartProps {
    ticker: string;
    className?: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ ticker, className }) => {
    const [stockData, setStockData] = useState<ChartResponse | null>(null);
    const [kospiData, setKospiData] = useState<IndexChartResponse | null>(null);
    const [kosdaqData, setKosdaqData] = useState<IndexChartResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState<'1w' | '1m' | '1y'>('1m');
    const [showKosdaq, setShowKosdaq] = useState(true);

    const fetchComparisonData = useCallback(async (selectedPeriod: '1w' | '1m' | '1y') => {
        if (!ticker) return;

        setLoading(true);
        try {
            const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const startDate = getStartDate(selectedPeriod);

            // Get stock data
            const stockParams: GetChartParams = {
                ticker,
                period: selectedPeriod,
                startDate,
                endDate,
            };

            // Get index data with corresponding period
            const indexPeriod = selectedPeriod === '1w' ? 'D' : selectedPeriod === '1m' ? 'D' : 'W';
            const kospiParams: GetIndexChartParams = {
                indexCode: '0001',
                period: indexPeriod,
                startDate,
                endDate,
            };
            const kosdaqParams: GetIndexChartParams = {
                indexCode: '1001',
                period: indexPeriod,
                startDate,
                endDate,
            };

            const [stock, kospi, kosdaq] = await Promise.all([
                chartApi.getStockChart(stockParams),
                chartApi.getIndexChart(kospiParams),
                chartApi.getIndexChart(kosdaqParams),
            ]);

            console.log('Stock data:', stock);
            console.log('KOSPI data:', kospi);
            console.log('KOSDAQ data:', kosdaq);

            setStockData(stock);
            setKospiData(kospi);
            setKosdaqData(kosdaq);
        } catch (error) {
            console.error('Failed to fetch comparison data:', error);
            toast.error('비교 차트 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [ticker]);

    const getStartDate = (period: string): string => {
        const now = new Date();
        const start = new Date();

        switch (period) {
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
        fetchComparisonData(period);
    }, [ticker, period, fetchComparisonData]);

    const handlePeriodChange = (newPeriod: '1w' | '1m' | '1y') => {
        setPeriod(newPeriod);
    };

    const normalizeData = (data: number[]): number[] => {
        if (data.length === 0) return [];
        const baseValue = data[0];
        if (baseValue === 0) return data.map(() => 0);
        // 첫 번째 값을 100으로 설정하고 나머지는 비율로 계산
        return data.map(value => ((value / baseValue) * 100) - 100);
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: `${ticker} vs 시장지수 비교 (수익률 기준)`,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: function (context: TooltipItem<'line'>) {
                        const value = context.raw as number;
                        return `${context.dataset.label}: ${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
                    },
                },
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: '날짜',
                },
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: '수익률 (%)',
                },
                ticks: {
                    callback: function (value: string | number) {
                        const numValue = typeof value === 'string' ? parseFloat(value) : value;
                        return `${numValue > 0 ? '+' : ''}${numValue.toFixed(1)}%`;
                    },
                },
                grid: {
                    drawBorder: false,
                    color: function(context: ScriptableScaleContext) {
                        if (context.tick.value === 0) {
                            return '#000000'; // 0% 라인은 검은색
                        }
                        return 'rgba(0, 0, 0, 0.1)';
                    },
                    lineWidth: function(context: ScriptableScaleContext) {
                        if (context.tick.value === 0) {
                            return 2; // 0% 라인은 굵게
                        }
                        return 1;
                    }
                },
            },
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false,
        },
    };

    const getChartData = () => {
        if (!stockData?.data || !kospiData?.data || stockData.data.length === 0 || kospiData.data.length === 0) {
            console.log('Missing data - stock:', !!stockData?.data, 'kospi:', !!kospiData?.data);
            return { labels: [], datasets: [] };
        }

        // Debug logging
        console.log('Stock data length:', stockData.data.length);
        console.log('KOSPI data length:', kospiData.data.length);
        console.log('Stock dates sample:', stockData.data.slice(0, 3).map(d => d.date));
        console.log('KOSPI dates sample:', kospiData.data.slice(0, 3).map(d => d.date));

        // Use the minimum length between stock and index data
        const minLength = Math.min(stockData.data.length, kospiData.data.length);
        
        // Just use the data in order without date matching (assuming they're in the same date order)
        const alignedStockData = stockData.data.slice(-minLength);
        const alignedKospiData = kospiData.data.slice(-minLength);
        const alignedKosdaqData = kosdaqData?.data ? kosdaqData.data.slice(-minLength) : [];

        // Use aligned dates as labels
        const labels = alignedStockData.map((item) => {
            const date = item.date;
            if (date.length === 8) {
                const month = date.slice(4, 6);
                const day = date.slice(6, 8);
                return `${month}/${day}`;
            }
            return date;
        });

        // Get price/index data
        const stockPrices = alignedStockData.map(item => item.close);
        const kospiPrices = alignedKospiData.map(item => item.index);
        const kosdaqPrices = alignedKosdaqData.map(item => item.index);

        // Check if we have valid data for normalization
        if (stockPrices.length === 0 || kospiPrices.length === 0) {
            console.warn('Insufficient data for chart rendering');
            return { labels: [], datasets: [] };
        }

        const datasets = [
            {
                label: `${ticker} 주가`,
                data: normalizeData(stockPrices),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderWidth: 3,
                fill: false,
                tension: 0.2,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
            {
                label: 'KOSPI',
                data: normalizeData(kospiPrices),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.05)',
                borderWidth: 2,
                fill: false,
                tension: 0.2,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBackgroundColor: 'rgb(34, 197, 94)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                borderDash: [5, 5], // 점선으로 구분
            },
        ];

        if (showKosdaq && kosdaqPrices.length > 0) {
            datasets.push({
                label: 'KOSDAQ',
                data: normalizeData(kosdaqPrices),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                borderWidth: 2,
                fill: false,
                tension: 0.2,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBackgroundColor: 'rgb(239, 68, 68)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                borderDash: [2, 2], // 더 짧은 점선
            });
        }

        return { labels, datasets };
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center h-64 ${className}`}>
                <div className="text-lg">비교 차트 로딩 중...</div>
            </div>
        );
    }

    return (
        <div className={`w-full ${className}`}>
            {/* Controls */}
            <div className="flex flex-wrap gap-4 mb-4 items-center">
                {/* Period Selection */}
                <div className="flex gap-2">
                    {(['1w', '1m', '1y'] as const).map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePeriodChange(p)}
                        >
                            {p === '1w' ? '1주' : p === '1m' ? '1개월' : '1년'}
                        </Button>
                    ))}
                </div>

                {/* Index Toggle */}
                <div className="flex gap-2">
                    <Button
                        variant={showKosdaq ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowKosdaq(!showKosdaq)}
                    >
                        KOSDAQ {showKosdaq ? '숨기기' : '보기'}
                    </Button>
                </div>
            </div>

            {/* Chart */}
            <div className="h-80 mb-4">
                <Line options={chartOptions} data={getChartData()} />
            </div>

            {/* Performance Summary */}
            {stockData && kospiData && (
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-4">성과 비교 ({period})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {/* Stock Performance */}
                        <div className="text-center p-3 bg-white rounded-lg">
                            <div className="font-medium text-gray-600 mb-1">{ticker}</div>
                            <div className="text-lg font-bold text-blue-600">
                                {stockData.data.length > 0 && (
                                    <>
                                        {(() => {
                                            const first = stockData.data[0].close;
                                            const last = stockData.data[stockData.data.length - 1].close;
                                            const change = ((last - first) / first) * 100;
                                            return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                                        })()}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* KOSPI Performance */}
                        <div className="text-center p-3 bg-white rounded-lg">
                            <div className="font-medium text-gray-600 mb-1">KOSPI</div>
                            <div className="text-lg font-bold text-green-600">
                                {kospiData.data.length > 0 && (
                                    <>
                                        {(() => {
                                            const first = kospiData.data[0].index;
                                            const last = kospiData.data[kospiData.data.length - 1].index;
                                            const change = ((last - first) / first) * 100;
                                            return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                                        })()}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* KOSDAQ Performance */}
                        {showKosdaq && kosdaqData && (
                            <div className="text-center p-3 bg-white rounded-lg">
                                <div className="font-medium text-gray-600 mb-1">KOSDAQ</div>
                                <div className="text-lg font-bold text-red-600">
                                    {kosdaqData.data.length > 0 && (
                                        <>
                                            {(() => {
                                                const first = kosdaqData.data[0].index;
                                                const last = kosdaqData.data[kosdaqData.data.length - 1].index;
                                                const change = ((last - first) / first) * 100;
                                                return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t text-xs text-gray-600">
                        <p>• 모든 수치는 기간 시작일 대비 수익률입니다.</p>
                        <p>• 개별 종목과 시장 지수의 상대적 성과를 비교할 수 있습니다.</p>
                    </div>
                </div>
            )}
        </div>
    );
};