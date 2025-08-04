import React, { useState } from 'react';
import { StockChart } from '../../components/charts/stock-chart';
import { FinancialChart } from '../../components/charts/financial-chart';
import { IndexChart } from '../../components/charts/index-chart';
import { ComparisonChart } from '../../components/charts/comparison-chart';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

// 종목 코드와 기업 코드 매핑
const STOCK_MAPPINGS = [
    { name: '삼성전자', stockCode: '005930', corpCode: '00126380' },
    { name: 'SK하이닉스', stockCode: '000660', corpCode: '00164779' },
    { name: 'NAVER', stockCode: '035420', corpCode: '00158430' },
    { name: '현대차', stockCode: '005380', corpCode: '00126144' },
];

export const ChartsPage: React.FC = () => {
    const [stockTicker, setStockTicker] = useState('005930'); // 삼성전자 기본값
    const [corpCode, setCorpCode] = useState('00126380'); // 삼성전자 기업코드
    const [companyName, setCompanyName] = useState('삼성전자');
    const [selectedIndexCode, setSelectedIndexCode] = useState<'0001' | '1001'>('0001'); // KOSPI 기본값

    const handleCompanySelect = (mapping: typeof STOCK_MAPPINGS[0]) => {
        setStockTicker(mapping.stockCode);
        setCorpCode(mapping.corpCode);
        setCompanyName(mapping.name);
    };

    const handleManualInput = () => {
        // 수동 입력된 종목코드에서 기업코드 찾기 (간단한 매핑)
        const found = STOCK_MAPPINGS.find(m => m.stockCode === stockTicker);
        if (found) {
            setCorpCode(found.corpCode);
            setCompanyName(found.name);
        } else {
            // 매핑을 찾지 못한 경우 기본값 사용
            setCompanyName('');
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">투자 분석 대시보드</h1>
                <p className="text-gray-600">{companyName ? `${companyName} (${stockTicker})` : stockTicker}의 주가 차트와 재무 데이터를 한눈에 확인하세요</p>
            </div>

            {/* Company Selection and Input */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">기업 선택</h2>
                
                {/* Manual Input */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">종목코드</label>
                        <Input
                            type="text"
                            value={stockTicker}
                            onChange={(e) => setStockTicker(e.target.value)}
                            placeholder="종목코드를 입력하세요 (예: 005930)"
                            className="w-full"
                        />
                    </div>
                    <div className="flex items-end">
                        <Button onClick={handleManualInput}>조회</Button>
                    </div>
                </div>

                {/* Quick Select Buttons */}
                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-3 text-gray-700">인기 종목 빠른 선택</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {STOCK_MAPPINGS.map((mapping) => (
                            <Button
                                key={mapping.stockCode}
                                variant={stockTicker === mapping.stockCode ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleCompanySelect(mapping)}
                                className="justify-start"
                            >
                                {mapping.name}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Index Selection */}
                <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-3 text-gray-700">지수 차트 선택</h3>
                    <div className="flex gap-3">
                        <Button
                            variant={selectedIndexCode === '0001' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedIndexCode('0001')}
                        >
                            KOSPI
                        </Button>
                        <Button
                            variant={selectedIndexCode === '1001' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedIndexCode('1001')}
                        >
                            KOSDAQ
                        </Button>
                    </div>
                </div>
            </div>

            {/* Primary Dashboard - Stock Chart and Financial Data */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                {/* Stock Chart Section */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold mb-4">📈 주가 차트</h2>
                    <StockChart
                        ticker={stockTicker}
                        key={`stock-${stockTicker}`}
                        className="w-full overflow-hidden"
                    />
                </div>

                {/* Financial Chart Section */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold mb-4">📊 재무 분석</h2>
                    <FinancialChart
                        corpCode={corpCode}
                        key={`financial-${corpCode}`}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Market Analysis Dashboard - Index and Comparison */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                {/* Index Chart Section */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold mb-4">📊 {selectedIndexCode === '0001' ? 'KOSPI' : 'KOSDAQ'} 지수</h2>
                    <IndexChart
                        indexCode={selectedIndexCode}
                        key={`index-${selectedIndexCode}`}
                        className="w-full"
                    />
                </div>

                {/* Comparison Chart Section */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold mb-4">⚖️ 시장 대비 성과</h2>
                    <ComparisonChart
                        ticker={stockTicker}
                        key={`comparison-${stockTicker}`}
                        className="w-full"
                    />
                </div>
            </div>


            {/* Additional Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stock Analysis Guide */}
                <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                        📈 주가 분석
                    </h3>
                    <div className="text-sm text-gray-700 space-y-2">
                        <p>• <strong>1일 차트:</strong> 30분 간격 일중 패턴</p>
                        <p>• <strong>기간별:</strong> 1주~1년 트렌드</p>
                        <p>• <strong>OHLC:</strong> 호버시 상세 정보</p>
                        <p>• <strong>실시간:</strong> KIS API 연동</p>
                    </div>
                </div>

                {/* Financial Analysis Guide */}
                <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                        📊 재무 분석
                    </h3>
                    <div className="text-sm text-gray-700 space-y-2">
                        <p>• <strong>손익:</strong> 매출, 영업이익, 순이익</p>
                        <p>• <strong>재무상태:</strong> 총자산, 자본</p>
                        <p>• <strong>투자지표:</strong> ROE, ROA, EPS</p>
                        <p>• <strong>연도별:</strong> 5년간 성과 비교</p>
                    </div>
                </div>

                {/* Index Analysis Guide */}
                <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                        📊 지수 분석
                    </h3>
                    <div className="text-sm text-gray-700 space-y-2">
                        <p>• <strong>KOSPI:</strong> 대형주 중심 종합지수</p>
                        <p>• <strong>KOSDAQ:</strong> 중소형주 중심 지수</p>
                        <p>• <strong>일/주/월봉:</strong> 다양한 기간 분석</p>
                        <p>• <strong>시장 현황:</strong> 전일대비 등락률</p>
                    </div>
                </div>

                {/* Comparison Analysis Guide */}
                <div className="bg-yellow-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                        ⚖️ 비교 분석
                    </h3>
                    <div className="text-sm text-gray-700 space-y-2">
                        <p>• <strong>상대 성과:</strong> 시장 대비 수익률</p>
                        <p>• <strong>정규화:</strong> 동일 기준점 비교</p>
                        <p>• <strong>베타값:</strong> 시장 민감도 확인</p>
                        <p>• <strong>아웃퍼폼:</strong> 초과 수익 분석</p>
                    </div>
                </div>
            </div>

            {/* Usage Instructions */}
            <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">💡 사용 방법</h3>
                <div className="text-sm text-gray-700 space-y-2">
                    <p>
                        <strong>1. 기업 선택:</strong> 인기 종목 버튼을 클릭하거나 직접 종목코드를 입력하세요.
                    </p>
                    <p>
                        <strong>2. 지수 선택:</strong> KOSPI 또는 KOSDAQ 지수를 선택하여 시장 전체 흐름을 확인하세요.
                    </p>
                    <p>
                        <strong>3. 종합 분석:</strong> 개별 주가, 재무 데이터, 시장 지수, 상대 성과를 종합적으로 분석하세요.
                    </p>
                    <p>
                        <strong>4. 상대 비교:</strong> 시장 대비 성과 차트에서 개별 종목의 상대적 강도를 확인하세요.
                    </p>
                    <p>
                        <strong>5. 상세 정보:</strong> 모든 차트에 마우스를 올리면 상세한 수치 정보를 확인할 수 있습니다.
                    </p>
                </div>
            </div>
        </div>
    );
};
