import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, User, Globe, Hash, TrendingUp } from 'lucide-react';
import { CompanyInfo } from '../../services/investment-analysis';

interface CompanyInfoCardProps {
  data: CompanyInfo;
}

const CompanyInfoCard: React.FC<CompanyInfoCardProps> = ({ data }) => {
  // Handle empty or undefined data
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            회사 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  const formatMarketCap = (value: number) => {
    if (!value || value === 0) return 'N/A';
    if (value >= 1_000_000_000_000) {
      return `${(value / 1_000_000_000_000).toFixed(2)}조원`;
    } else if (value >= 100_000_000) {
      return `${(value / 100_000_000).toFixed(0)}억원`;
    }
    return `${value.toLocaleString()}원`;
  };

  const formatShares = (value: number) => {
    if (!value || value === 0) return 'N/A';
    if (value >= 100_000_000) {
      return `${(value / 100_000_000).toFixed(2)}억주`;
    } else if (value >= 10_000) {
      return `${(value / 10_000).toFixed(0)}만주`;
    }
    return `${value.toLocaleString()}주`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          회사 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">업종</p>
            <Badge variant="secondary" className="mt-1">
              {data.industry || 'N/A'}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500">상장일</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {data.listingDate || 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">시가총액</p>
            <p className="font-semibold text-lg flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {formatMarketCap(data.marketCap)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">발행주식수</p>
            <p className="font-medium flex items-center gap-1">
              <Hash className="w-4 h-4" />
              {formatShares(data.sharesOutstanding)}
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 mb-2">기업개요</p>
          <p className="text-sm">{data.description || '정보가 없습니다.'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <p className="text-sm text-gray-500">대표이사</p>
            <p className="font-medium flex items-center gap-1">
              <User className="w-4 h-4" />
              {data.ceo || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">홈페이지</p>
            {data.website ? (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center gap-1"
              >
                <Globe className="w-4 h-4" />
                방문하기
              </a>
            ) : (
              <p className="text-gray-400">N/A</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyInfoCard;