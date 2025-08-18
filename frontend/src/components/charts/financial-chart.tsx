import React, { useEffect, useState, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { chartApi } from '../../services/chart';
import type { FinancialData, GetFinancialParams } from '../../services/chart';
import { Button } from '../ui/button';
import { toast } from 'sonner';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface FinancialChartProps {
    corpCode: string;
    className?: string;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ corpCode, className }) => {
    const [financialData, setFinancialData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(false);
    const [year, setYear] = useState(2023);

    const fetchFinancialData = useCallback(async (selectedYear: number) => {
        if (!corpCode) return;

        setLoading(true);
        try {
            const params: GetFinancialParams = {
                corpCode,
                year: selectedYear,
            };

            const data = await chartApi.getFinancialData(params);
            setFinancialData(data);
        } catch (error) {
            console.error('Failed to fetch financial data:', error);
            toast.error('재무 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [corpCode]);

    useEffect(() => {
        fetchFinancialData(year);
    }, [corpCode, year, fetchFinancialData]);

    const handleYearChange = (newYear: number) => {
        setYear(newYear);
    };

    const getRevenueChartData = () => {
        if (!financialData) return { labels: [], datasets: [] };

        return {
            labels: ['매출액', '영업이익', '당기순이익'],
            datasets: [
                {
                    label: '금액 (억원)',
                    data: [financialData.revenue, financialData.operatingProfit, financialData.netIncome],
                    backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(234, 179, 8, 0.8)'],
                    borderColor: ['rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(234, 179, 8)'],
                    borderWidth: 1,
                },
            ],
        };
    };

    const getBalanceChartData = () => {
        if (!financialData) return { labels: [], datasets: [] };

        return {
            labels: ['총자산', '총자본'],
            datasets: [
                {
                    label: '금액 (억원)',
                    data: [financialData.totalAssets, financialData.totalEquity],
                    backgroundColor: ['rgba(168, 85, 247, 0.8)', 'rgba(236, 72, 153, 0.8)'],
                    borderColor: ['rgb(168, 85, 247)', 'rgb(236, 72, 153)'],
                    borderWidth: 1,
                },
            ],
        };
    };

    const getRatioChartData = () => {
        if (!financialData) return { labels: [], datasets: [] };

        return {
            labels: ['ROE (%)', 'ROA (%)', 'EPS (원)'],
            datasets: [
                {
                    label: '비율/수치',
                    data: [financialData.roe, financialData.roa, financialData.eps],
                    backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(245, 101, 101, 0.8)', 'rgba(251, 146, 60, 0.8)'],
                    borderColor: ['rgb(239, 68, 68)', 'rgb(245, 101, 101)', 'rgb(251, 146, 60)'],
                    borderWidth: 1,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || '';
                        const value = context.raw as number;

                        if (label.includes('EPS')) {
                            return `${label}: ${value.toLocaleString()}원`;
                        } else if (label.includes('%')) {
                            return `${label}: ${value.toFixed(2)}%`;
                        } else {
                            return `${label}: ${value.toLocaleString()}억원`;
                        }
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value: string | number) {
                        const numValue = typeof value === 'string' ? parseFloat(value) : value;
                        return numValue.toLocaleString();
                    },
                },
            },
        },
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center h-64 ${className}`}>
                <div className="text-lg">재무 데이터 로딩 중...</div>
            </div>
        );
    }

    if (!financialData) {
        return (
            <div className={`flex items-center justify-center h-64 ${className}`}>
                <div className="text-gray-500">재무 데이터를 불러올 수 없습니다.</div>
            </div>
        );
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className={`w-full ${className}`}>
            {/* Year Selection */}
            <div className="flex gap-2 mb-4">
                {years.map((y) => (
                    <Button
                        key={y}
                        variant={year === y ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleYearChange(y)}
                    >
                        {y}년
                    </Button>
                ))}
            </div>

            {financialData && (
                <>
                    {/* Revenue Chart */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-3">손익 현황</h4>
                        <div className="h-48">
                            <Bar
                                options={{
                                    ...chartOptions,
                                    plugins: {
                                        ...chartOptions.plugins,
                                        title: {
                                            display: true,
                                            text: `${year}년 매출 및 이익`,
                                        },
                                        legend: {
                                            display: false,
                                        },
                                    },
                                }}
                                data={getRevenueChartData()}
                            />
                        </div>
                    </div>

                    {/* Balance Chart */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-3">재무상태</h4>
                        <div className="h-48">
                            <Bar
                                options={{
                                    ...chartOptions,
                                    plugins: {
                                        ...chartOptions.plugins,
                                        title: {
                                            display: true,
                                            text: `${year}년 자산 및 자본`,
                                        },
                                        legend: {
                                            display: false,
                                        },
                                    },
                                }}
                                data={getBalanceChartData()}
                            />
                        </div>
                    </div>

                    {/* Ratio Chart */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-3">재무비율</h4>
                        <div className="h-48">
                            <Bar
                                options={{
                                    ...chartOptions,
                                    plugins: {
                                        ...chartOptions.plugins,
                                        title: {
                                            display: true,
                                            text: `${year}년 주요 재무비율`,
                                        },
                                        legend: {
                                            display: false,
                                        },
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: function (value: string | number, index: number) {
                                                    // EPS는 원 단위로 표시
                                                    const label = getLabels()[index];
                                                    if (label && label.includes('EPS')) {
                                                        return `${typeof value === 'number' ? value.toLocaleString() : value}원`;
                                                    }
                                                    return `${value}%`;
                                                },
                                            },
                                        },
                                    },
                                }}
                                data={getRatioChartData()}
                            />
                        </div>
                    </div>

                    {/* Summary Table */}
                    <div className="p-4 bg-gray-50 rounded-lg mb-6">
                        <h4 className="font-semibold mb-4">{year}년 재무 요약</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                                <div className="font-medium text-gray-600">매출액</div>
                                <div className="text-lg font-bold text-blue-600">
                                    {financialData.revenue.toLocaleString()}억원
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="font-medium text-gray-600">영업이익</div>
                                <div className="text-lg font-bold text-green-600">
                                    {financialData.operatingProfit.toLocaleString()}억원
                                </div>
                                {financialData.revenue > 0 && (
                                    <div className="text-xs text-gray-500">
                                        ({((financialData.operatingProfit / financialData.revenue) * 100).toFixed(1)}%)
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="font-medium text-gray-600">당기순이익</div>
                                <div className="text-lg font-bold text-yellow-600">
                                    {financialData.netIncome.toLocaleString()}억원
                                </div>
                                {financialData.revenue > 0 && (
                                    <div className="text-xs text-gray-500">
                                        ({((financialData.netIncome / financialData.revenue) * 100).toFixed(1)}%)
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="font-medium text-gray-600">ROE</div>
                                <div className="text-lg font-bold text-red-600">{financialData.roe.toFixed(2)}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Ratio Explanation */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium mb-2">재무 용어 설명</h5>
                        <div className="space-y-1 text-sm text-gray-700">
                            <div>• <strong>매출액:</strong> 기업이 상품이나 서비스를 판매하여 얻은 총 수익</div>
                            <div>• <strong>영업이익:</strong> 매출액에서 매출원가와 판매관리비를 제외한 이익</div>
                            <div>• <strong>당기순이익:</strong> 모든 비용과 세금을 제외한 최종 이익</div>
                            <div>• <strong>ROE:</strong> 자기자본이익률 - 투자한 자본 대비 수익률</div>
                            <div>• <strong>ROA:</strong> 총자산이익률 - 총자산 대비 수익률</div>
                            <div>• <strong>EPS:</strong> 주당순이익 - 주식 1주당 창출하는 이익</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

function getLabels() {
    return ['ROE (%)', 'ROA (%)', 'EPS (원)'];
}
