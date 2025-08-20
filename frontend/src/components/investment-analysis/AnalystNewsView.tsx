import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Newspaper, 
  FileText, 
  ExternalLink, 
  Calendar, 
  User, 
  Building, 
  Target,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';
import { AnalystNews } from '../../services/investment-analysis';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AnalystNewsViewProps {
  data: AnalystNews;
}

const AnalystNewsView: React.FC<AnalystNewsViewProps> = ({ data }) => {
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [selectedNews, setSelectedNews] = useState<number | null>(null);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="w-4 h-4 text-green-600" />;
      case 'negative':
        return <ThumbsDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
      'positive': 'default',
      'neutral': 'secondary',
      'negative': 'destructive',
    };
    
    return (
      <Badge variant={variants[sentiment] || 'secondary'}>
        {sentiment === 'positive' ? '긍정' : sentiment === 'negative' ? '부정' : '중립'}
      </Badge>
    );
  };

  const getRecommendationColor = (recommendation: string) => {
    const colors: { [key: string]: string } = {
      'Strong Buy': 'text-green-700 bg-green-50',
      'Buy': 'text-green-600 bg-green-50',
      'Hold': 'text-gray-600 bg-gray-50',
      'Sell': 'text-red-600 bg-red-50',
      'Strong Sell': 'text-red-700 bg-red-50',
    };
    return colors[recommendation] || 'text-gray-600 bg-gray-50';
  };

  const sentimentChartData = {
    labels: ['긍정', '중립', '부정'],
    datasets: [
      {
        data: [
          data.sentimentAnalysis.positive,
          data.sentimentAnalysis.neutral,
          data.sentimentAnalysis.negative,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(156, 163, 175, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(156, 163, 175)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${value}%`;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      {/* Sentiment Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>뉴스 감성 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      긍정적
                    </span>
                    <span className="text-sm font-bold">{data.sentimentAnalysis.positive}%</span>
                  </div>
                  <Progress value={data.sentimentAnalysis.positive} className="h-2 bg-green-100" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Minus className="w-4 h-4 text-gray-600" />
                      중립적
                    </span>
                    <span className="text-sm font-bold">{data.sentimentAnalysis.neutral}%</span>
                  </div>
                  <Progress value={data.sentimentAnalysis.neutral} className="h-2 bg-gray-100" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4 text-red-600" />
                      부정적
                    </span>
                    <span className="text-sm font-bold">{data.sentimentAnalysis.negative}%</span>
                  </div>
                  <Progress value={data.sentimentAnalysis.negative} className="h-2 bg-red-100" />
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">종합 감성</p>
                <p className="text-lg font-bold capitalize">{data.sentimentAnalysis.overallSentiment}</p>
              </div>
            </div>
            
            <div className="h-64">
              <Doughnut data={sentimentChartData} options={chartOptions} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyst Reports and News */}
      <Card>
        <CardHeader>
          <CardTitle>애널리스트 리포트 & 뉴스</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="reports">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reports">애널리스트 리포트</TabsTrigger>
              <TabsTrigger value="news">최근 뉴스</TabsTrigger>
            </TabsList>

            <TabsContent value="reports">
              {data.analystReports.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {data.analystReports.map((report, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedReport(selectedReport === index ? null : index)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{report.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {report.firm}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {report.analyst}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {report.date}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`px-2 py-1 rounded text-sm font-medium ${getRecommendationColor(report.recommendation)}`}>
                              {report.recommendation}
                            </div>
                            <div className="mt-1 text-sm font-semibold">
                              목표가: {report.targetPrice.toLocaleString()}원
                            </div>
                          </div>
                        </div>
                        {selectedReport === index && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-600">{report.summary}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  애널리스트 리포트가 없습니다.
                </div>
              )}
            </TabsContent>

            <TabsContent value="news">
              {data.news.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {data.news.map((article, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedNews(selectedNews === index ? null : index)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              {article.title}
                              {getSentimentIcon(article.sentiment)}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Newspaper className="w-3 h-3" />
                                {article.source}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {article.date}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSentimentBadge(article.sentiment)}
                            {article.url && (
                              <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        {selectedNews === index && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-600">{article.summary}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  최근 뉴스가 없습니다.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalystNewsView;