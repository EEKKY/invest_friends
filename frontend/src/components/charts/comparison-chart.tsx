import React, { useEffect, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { chartApi } from "../../services/chart";
import type { ChartData, GetChartParams } from "../../services/chart";
import { Button } from "../ui/button";
import { toast } from "sonner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ComparisonChartProps {
  ticker: string;
  className?: string;
  showStockOnly?: boolean; // 주식만 표시
  showIndexOnly?: boolean; // 지수만 표시
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  ticker,
  className,
  showStockOnly = false,
  showIndexOnly = false,
}) => {
  const [stockData, setStockData] = useState<ChartData | null>(null);
  const [indexData, setIndexData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"1w" | "1m" | "1y">("1m");

  const fetchComparisonData = useCallback(
    async (selectedPeriod: "1w" | "1m" | "1y") => {
      if (!ticker) return;

      setLoading(true);
      try {
        // Map period to FID_PERIOD_DIV_CODE
        let periodCode: "D" | "W" | "M" | "Y" = "D";
        if (selectedPeriod === "1w") periodCode = "D";
        else if (selectedPeriod === "1m") periodCode = "W";
        else if (selectedPeriod === "1y") periodCode = "M";

        // Get stock data
        const stockParams: GetChartParams = {
          FID_COND_MRKT_DIV_CODE: "J",
          FID_INPUT_ISCD: ticker,
          FID_PERIOD_DIV_CODE: periodCode,
          FID_ORG_ADJ_PRC: "1",
          FID_PW_DATA_INCU_YN: "N",
          type: "daily",
        };

        // Get index data with corresponding period
        const { stock, index } = await chartApi.getStockChart(stockParams);

        console.log("Stock data:", stock);
        console.log("Index data:", index);

        setStockData(stock);
        setIndexData(index);
      } catch (error) {
        console.error("Failed to fetch comparison data:", error);
        toast.error("비교 차트 데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [ticker]
  );

  useEffect(() => {
    fetchComparisonData(period);
  }, [ticker, period, fetchComparisonData]);

  const handlePeriodChange = (newPeriod: "1w" | "1m" | "1y") => {
    setPeriod(newPeriod);
  };

  const normalizeData = (data: number[]): number[] => {
    if (data.length === 0) return [];
    const baseValue = data[0];
    if (baseValue === 0) return data.map(() => 0);
    // 첫 번째 값을 100으로 설정하고 나머지는 비율로 계산
    return data.map((value) => (value / baseValue) * 100 - 100);
  };

  const chartOptions: any = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: showIndexOnly
          ? `KOSPI 지수 추이`
          : showStockOnly
          ? `${ticker} 주가 추이 (수익률 기준)`
          : `${ticker} vs 시장지수 비교 (수익률 기준)`,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            const value = context.raw as number;
            const label = context.dataset?.label || "";
            return `${label}: ${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "날짜",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: showIndexOnly || showStockOnly ? "가격/지수" : "수익률 (%)",
        },
        ticks: {
          callback: function (value: any) {
            const numValue =
              typeof value === "number" ? value : parseFloat(value);
            if (showIndexOnly || showStockOnly) {
              return numValue.toLocaleString();
            }
            return `${numValue > 0 ? "+" : ""}${numValue.toFixed(1)}%`;
          },
        },
        grid: {
          drawBorder: false,
          color: function (context: any) {
            if (context.tick.value === 0) {
              return "#000000"; // 0% 라인은 검은색
            }
            return "rgba(0, 0, 0, 0.1)";
          },
          lineWidth: function (context: any) {
            if (context.tick.value === 0) {
              return 2; // 0% 라인은 굵게
            }
            return 1;
          },
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  const getChartData = () => {
    if (
      !stockData?.output ||
      !indexData?.output ||
      stockData.output.length === 0 ||
      indexData.output.length === 0
    ) {
      console.log(
        "Missing data - stock:",
        !!stockData?.output,
        "index:",
        !!indexData?.output
      );
      return { labels: [], datasets: [] };
    }

    // Debug logging
    console.log("Stock data length:", stockData.output.length);
    console.log("Index data length:", indexData.output.length);
    console.log(
      "Stock dates sample:",
      stockData.output.slice(0, 3).map((d: any) => d.stck_cntg_hour)
    );
    console.log(
      "Index dates sample:",
      indexData.output.slice(0, 3).map((d: any) => d.stck_cntg_hour)
    );

    // Use the minimum length between stock and index data
    const minLength = Math.min(
      stockData.output.length,
      indexData.output.length
    );

    // Just use the data in order without date matching (assuming they're in the same date order)
    // Reverse to show chronological order (oldest to newest)
    const alignedStockData = stockData.output.slice(-minLength).reverse();
    const alignedIndexData = indexData.output.slice(-minLength).reverse();

    // Use aligned dates as labels
    const labels = alignedStockData.map((item: any) => {
      const date = item.stck_cntg_hour;
      if (date.length === 8) {
        const month = date.slice(4, 6);
        const day = date.slice(6, 8);
        return `${month}/${day}`;
      }
      return date;
    });

    // Get price/index data
    const stockPrices = alignedStockData.map((item: any) =>
      parseFloat(item.stck_prpr)
    );
    const indexPrices = alignedIndexData.map((item: any) =>
      parseFloat(item.stck_prpr)
    );

    // Check if we have valid data for normalization
    if (stockPrices.length === 0 || indexPrices.length === 0) {
      console.warn("Insufficient data for chart rendering");
      return { labels: [], datasets: [] };
    }

    const indexName = "KOSPI"; // Default to KOSPI, could be determined differently

    const datasets = [];

    // 주식 데이터 추가 (지수만 표시가 아닐 때)
    if (!showIndexOnly) {
      datasets.push({
        label: `${ticker} 주가`,
        data: showStockOnly ? stockPrices : normalizeData(stockPrices),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        borderWidth: 3,
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      });
    }

    // 지수 데이터 추가 (주식만 표시가 아닐 때)
    if (!showStockOnly) {
      datasets.push({
        label: indexName,
        data: showIndexOnly ? indexPrices : normalizeData(indexPrices),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.05)",
        borderWidth: showIndexOnly ? 3 : 2,
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: showIndexOnly ? 6 : 5,
        pointBackgroundColor: "rgb(34, 197, 94)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        borderDash: showIndexOnly ? undefined : [5, 5], // 비교 모드에서만 점선
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
          {(["1w", "1m", "1y"] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange(p)}
            >
              {p === "1w" ? "1주" : p === "1m" ? "1개월" : "1년"}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-4">
        <Line options={chartOptions} data={getChartData()} />
      </div>

      {/* Performance Summary */}
      {stockData && indexData && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-4">
            {showIndexOnly
              ? `지수 현황`
              : showStockOnly
              ? `주가 현황`
              : `성과 비교`}{" "}
            ({period})
          </h4>
          <div
            className={`grid ${
              showIndexOnly || showStockOnly
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2"
            } gap-4 text-sm`}
          >
            {/* Stock Performance */}
            {!showIndexOnly && (
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="font-medium text-gray-600 mb-1">{ticker}</div>
                <div className="text-lg font-bold text-blue-600">
                  {stockData.output.length > 0 && (
                    <>
                      {(() => {
                        const last = parseFloat(stockData.output[0].stck_prpr);
                        const first = parseFloat(
                          stockData.output[stockData.output.length - 1]
                            .stck_prpr
                        );
                        const change = ((last - first) / first) * 100;
                        return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
                      })()}
                    </>
                  )}
                </div>
                {showStockOnly && (
                  <div className="mt-2 text-sm text-gray-500">
                    현재가:{" "}
                    {parseFloat(
                      stockData.output[0].stck_prpr
                    ).toLocaleString()}
                    원
                  </div>
                )}
              </div>
            )}

            {/* Index Performance */}
            {!showStockOnly && (
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="font-medium text-gray-600 mb-1">KOSPI</div>
                <div className="text-lg font-bold text-green-600">
                  {indexData.output.length > 0 && (
                    <>
                      {(() => {
                        const last = parseFloat(indexData.output[0].stck_prpr);
                        const first = parseFloat(
                          indexData.output[indexData.output.length - 1]
                            .stck_prpr
                        );
                        const change = ((last - first) / first) * 100;
                        return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
                      })()}
                    </>
                  )}
                </div>
                {showIndexOnly && (
                  <div className="mt-2 text-sm text-gray-500">
                    현재 지수:{" "}
                    {parseFloat(
                      indexData.output[0].stck_prpr
                    ).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {!showIndexOnly && !showStockOnly && (
            <div className="mt-4 pt-4 border-t text-xs text-gray-600">
              <p>• 모든 수치는 기간 시작일 대비 수익률입니다.</p>
              <p>• 개별 종목과 시장 지수의 상대적 성과를 비교할 수 있습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
