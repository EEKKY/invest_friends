import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CompanyInfo } from '@/services/investment-analysis';
import { Building2, Globe, User, TrendingUp, Info } from 'lucide-react';

interface CompanyInfoSectionProps {
  companyInfo: CompanyInfo;
}

export const CompanyInfoSection: React.FC<CompanyInfoSectionProps> = ({ companyInfo }) => {
  const formatMarketCap = (value: number) => {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(2)}조원`;
    } else if (value >= 100000000) {
      return `${(value / 100000000).toFixed(0)}억원`;
    }
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          회사 정보
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Company Name and Code */}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">{companyInfo.companyName}</h3>
            <Badge variant="secondary" className="text-sm">
              {companyInfo.stockCode}
            </Badge>
          </div>

          {/* Industry */}
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">업종:</span>
            <span className="font-medium">{companyInfo.industry}</span>
          </div>

          {/* Grid Layout for Key Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">시가총액</span>
              </div>
              <p className="font-medium">{formatMarketCap(companyInfo.marketCap)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">발행주식수</span>
              </div>
              <p className="font-medium">
                {new Intl.NumberFormat('ko-KR').format(companyInfo.sharesOutstanding)}주
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">대표이사</span>
              </div>
              <p className="font-medium">{companyInfo.ceo || '-'}</p>
            </div>
          </div>

          {/* Description */}
          {companyInfo.description && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">기업 개요</span>
              </div>
              <p className="text-sm leading-relaxed">{companyInfo.description}</p>
            </div>
          )}

          {/* Website */}
          {companyInfo.website && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a 
                href={companyInfo.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {companyInfo.website}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};