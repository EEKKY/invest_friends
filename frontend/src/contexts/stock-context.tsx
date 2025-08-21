import React, { createContext, useContext, useState, useCallback } from 'react';

interface StockContextType {
  selectedStock: string | null;
  selectedStockName: string | null;
  setSelectedStock: (stockCode: string | null, stockName?: string | null) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedStock, setSelectedStockState] = useState<string | null>(null);
  const [selectedStockName, setSelectedStockName] = useState<string | null>(null);

  const setSelectedStock = useCallback((stockCode: string | null, stockName: string | null = null) => {
    setSelectedStockState(stockCode);
    setSelectedStockName(stockName);
  }, []);

  return (
    <StockContext.Provider value={{ selectedStock, selectedStockName, setSelectedStock }}>
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};