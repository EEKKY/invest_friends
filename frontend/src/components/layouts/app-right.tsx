import { InvestmentCanvas } from "@/pages/canvas/InvestmentCanvas";
import { useStock } from "@/contexts/stock-context";
import { useEffect, useState } from "react";

export function AppRight() {
  const { selectedStock, selectedStockName } = useStock();
  const [key, setKey] = useState(0);

  // Force re-render when stock changes
  useEffect(() => {
    if (selectedStock) {
      setKey(prev => prev + 1);
    }
  }, [selectedStock]);

  if (!selectedStock) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">주식 분석을 시작하세요</p>
          <p className="text-sm">채팅창에서 종목명이나 종목코드를 입력하면</p>
          <p className="text-sm">자동으로 분석 정보가 표시됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <InvestmentCanvas 
        key={key} 
        stockCode={selectedStock} 
        stockName={selectedStockName}
      />
    </div>
  );
}
