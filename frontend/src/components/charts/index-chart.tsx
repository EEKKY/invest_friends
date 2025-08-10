import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { chartApi } from '../../services/chart';
import type { IndexChartResponse, GetIndexChartParams } from '../../services/chart';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface IndexChartProps {
    indexCode: '0001' | '1001';
    className?: string;
}

export const IndexChart: React.FC<IndexChartProps> = ({ indexCode, className }) => {
    const [chartData, setChartData] = useState<IndexChartResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState<'D' | 'W' | 'M'>('D');

    const fetchIndexData = async (selectedPeriod: 'D' | 'W' | 'M') => {
        setLoading(true);
        try {
            const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const startDate = getStartDate(selectedPeriod);

            const params: GetIndexChartParams = {
                indexCode,
                period: selectedPeriod,
                startDate,
                endDate,
            };

            const data = await chartApi.getIndexChart(params);
            setChartData(data);
        } catch (error: any) {
            console.error('Failed to fetch index data:', error);
            const errorMessage = error.response?.data?.message || error.message || '지수 데이터를 불러오는데 실패했습니다.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStartDate = (period: string): string => {
        const now = new Date();
        const start = new Date();

        switch (period) {
            case 'D':
                start.setMonth(now.getMonth() - 1); // 1개월
                break;
            case 'W':
                start.setMonth(now.getMonth() - 3); // 3개월
                break;
            case 'M':
                start.setFullYear(now.getFullYear() - 1); // 1년
                break;
        }

        return start.toISOString().slice(0, 10).replace(/-/g, '');
    };

    useEffect(() => {
        fetchIndexData(period);
    }, [indexCode, period]);

    const handlePeriodChange = (newPeriod: 'D' | 'W' | 'M') => {
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
                text: `${chartData?.indexName || '지수'} 차트`,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: function (context: any) {
                        const dataPoint = chartData?.data[context.dataIndex];
                        if (!dataPoint) return '';

                        return [
                            `지수: ${dataPoint.index.toLocaleString()}`,
                            `전일대비: ${dataPoint.change >= 0 ? '+' : ''}${dataPoint.change.toFixed(2)}`,
                            `등락률: ${dataPoint.changeRate >= 0 ? '+' : ''}${dataPoint.changeRate.toFixed(2)}%`,
                            `거래량: ${dataPoint.volume.toLocaleString()}`,
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
                    text: '날짜',
                },
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: '지수',
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

        const labels = chartData.data.map((item) => {
            const date = item.date;
            if (date.length === 8) {
                return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
            }
            return date;
        });

        const indexName = chartData.indexName;
        
        // 지수 값이 모두 0인지 확인
        const hasValidData = chartData.data.some(item => item.index > 0);
        
        console.log('Index chart data check:', {
            dataLength: chartData.data.length,
            hasValidData,
            sampleData: chartData.data.slice(0, 3)
        });
        
        if (!hasValidData) {
            // 모든 지수가 0인 경우 거래량 데이터로 대체 표시

            return {
                labels,
                datasets: [
                    {
                        label: `${indexName} (거래량)`,
                        data: chartData.data.map((item) => item.volume),
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
        }

        const isPositive = chartData.data.length > 1 && 
            chartData.data[chartData.data.length - 1].index > chartData.data[0].index;

        return {
            labels,
            datasets: [
                {
                    label: indexName,
                    data: chartData.data.map((item) => item.index),
                    borderColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                    backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
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
                <div className="text-lg">지수 데이터 로딩 중...</div>
            </div>
        );
    }

    return (
        <div className={`w-full ${className}`}>
            {/* Period Selection */}
            <div className="flex gap-2 mb-4">
                {(['D', 'W', 'M'] as const).map((p) => (
                    <Button
                        key={p}
                        variant={period === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePeriodChange(p)}
                    >
                        {p === 'D' ? '일봉' : p === 'W' ? '주봉' : '월봉'}
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
                    <h4 className="font-semibold mb-2">지수 정보</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>지수명: {chartData.indexName}</div>
                        <div>기간: {period === 'D' ? '일봉' : period === 'W' ? '주봉' : '월봉'}</div>
                        <div>데이터 수: {chartData.data.length}개</div>
                        <div>조회기간: {chartData.startDate} ~ {chartData.endDate}</div>
                    </div>
                    
                    {chartData.data.length > 0 && (
                        <div className="border-t pt-4">
                            {chartData.data.some(item => item.index > 0) ? (
                                <>
                                    <h5 className="font-medium mb-2">최근 지수 현황</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="text-center">
                                            <div className="font-medium text-gray-600">현재 지수</div>
                                            <div className="text-lg font-bold">
                                                {chartData.data[chartData.data.length - 1].index.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium text-gray-600">전일 대비</div>
                                            <div className={`text-lg font-bold ${
                                                chartData.data[chartData.data.length - 1].change >= 0 
                                                    ? 'text-green-600' 
                                                    : 'text-red-600'
                                            }`}>
                                                {chartData.data[chartData.data.length - 1].change >= 0 ? '+' : ''}
                                                {chartData.data[chartData.data.length - 1].change.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium text-gray-600">등락률</div>
                                            <div className={`text-lg font-bold ${
                                                chartData.data[chartData.data.length - 1].changeRate >= 0 
                                                    ? 'text-green-600' 
                                                    : 'text-red-600'
                                            }`}>
                                                {chartData.data[chartData.data.length - 1].changeRate >= 0 ? '+' : ''}
                                                {chartData.data[chartData.data.length - 1].changeRate.toFixed(2)}%
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium text-gray-600">거래량</div>
                                            <div className="text-lg font-bold text-blue-600">
                                                {chartData.data[chartData.data.length - 1].volume.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="text-amber-500 font-medium mb-2">⚠️ 지수 데이터 조회 제한</div>
                                    <div className="text-sm text-gray-700 mb-2">
                                        현재 KIS API에서 지수 데이터를 조회할 수 없습니다.
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        대신 거래량 데이터로 시장 활동을 확인하실 수 있습니다.
                                    </div>
                                    <div className="mt-3 p-3 bg-blue-50 rounded">
                                        <div className="font-medium text-blue-800">최근 거래량</div>
                                        <div className="text-lg font-bold text-blue-600">
                                            {chartData.data[chartData.data.length - 1].volume.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};