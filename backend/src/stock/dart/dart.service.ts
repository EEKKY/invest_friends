import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SinglIndxRequest, SinglIndxResponse } from './dto/singl-indx.dto';
import { CorpCode } from './entities/corp-code.entity';
import * as AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import { firstValueFrom } from 'rxjs';
import { CorpCodeDto } from './dto/corp-code.dto';
import {
  FinancialDataResponseDto,
  FinancialDataRequestDto,
} from './dto/financialData.dto';
import { formatFinancialData } from './financial-data-processor';

@Injectable()
export class DartService implements OnModuleInit {
  private readonly crtfcKey: string;
  private readonly logger = new Logger(DartService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(CorpCode)
    private readonly corpCodeRepo: Repository<CorpCode>,
  ) {
    this.crtfcKey = this.config.get<string>('DART_API_KEY');
  }

  async onModuleInit() {
    const count = await this.corpCodeRepo.count();
    if (count > 0) {
      this.logger.log('corp_code 테이블에 데이터가 이미 존재합니다.');
      return;
    }
    this.logger.log('corp_code 데이터가 없으므로 Dart에서 받아와 적재합니다.');
    await this.fetchAndStoreCorpCode();
  }

  async getCorpCode(): Promise<CorpCodeDto[]> {
    // DB에서 corp_code 데이터 가져오기
    const entities = await this.corpCodeRepo.find();

    // Entity를 DTO로 변환
    const corpList: CorpCodeDto[] = entities.map((entity) => ({
      corp_code: entity.corp_code,
      corp_name: entity.corp_name,
      corp_eng_name: entity.corp_eng_name,
      stock_code: entity.stock_code || '',
      modify_date: entity.modify_date,
    }));

    return corpList;
  }

  async getCorpCodeFromAPI(): Promise<CorpCodeDto[]> {
    const params = {
      crtfc_key: this.crtfcKey,
    };

    const { data } = await firstValueFrom(
      this.httpService.get<SinglIndxResponse>(
        'https://opendart.fss.or.kr/api/corpCode.xml',
        { params: params, responseType: 'arraybuffer' },
      ),
    );

    const zip = new AdmZip(data);
    const xmlContent = zip.readAsText('CORPCODE.xml');

    const parser = new XMLParser();
    const parsed = parser.parse(xmlContent);

    const list = parsed.result.list;
    const corpList: CorpCodeDto[] = Array.isArray(list) ? list : [list];

    return corpList;
  }

  // 수동으로 corp_code 데이터를 다시 가져오는 메서드
  async refreshCorpCodes(): Promise<{ message: string; count: number }> {
    this.logger.log('Refreshing corp_code data...');

    // 기존 데이터 삭제
    await this.corpCodeRepo.clear();
    this.logger.log('Cleared existing corp_code data');

    // 새로운 데이터 가져오기
    await this.fetchAndStoreCorpCode();

    // 새로운 데이터 개수 확인
    const newCount = await this.corpCodeRepo.count();
    const message = `Successfully refreshed corp_code data. Total: ${newCount} records`;
    this.logger.log(message);

    return { message, count: newCount };
  }

  async getSingleIndex(
    userParams: Partial<SinglIndxRequest>,
  ): Promise<SinglIndxResponse> {
    const params = {
      crtfc_key: this.crtfcKey,
      corp_code: '126380',
      bsns_year: '2023',
      reprt_code: '11013',
      idx_cl_code: 'M230000',
      ...userParams,
    };

    const { data } = await firstValueFrom(
      this.httpService.get<SinglIndxResponse>(
        'https://opendart.fss.or.kr/api/fnlttSinglIndx.json',
        { params: params },
      ),
    );

    return data;
  }

  async fetchAndStoreCorpCode() {
    const corpList = await this.getCorpCodeFromAPI();

    // 상장회사만 필터링 (stock_code가 있는 회사만)
    const listedCompanies = corpList.filter((item) => {
      return (
        item.stock_code && item.stock_code !== '' && item.stock_code !== 'null'
      );
    });

    const entities = listedCompanies.map((item) => {
      const corp = new CorpCode();
      // corp_code를 8자리 문자열로 변환하여 저장 (앞에 0 패딩)
      corp.corp_code = String(item.corp_code).padStart(8, '0');
      corp.corp_name = item.corp_name;
      corp.corp_eng_name = item.corp_eng_name ?? '';
      // stock_code를 6자리 문자열로 변환하여 저장 (앞에 0 패딩)
      corp.stock_code = String(item.stock_code).padStart(6, '0');
      corp.modify_date = Number(item.modify_date);
      return corp;
    });

    const batchSize = 1000;
    let totalSaved = 0;

    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      await this.corpCodeRepo.save(batch);
      totalSaved += batch.length;
      this.logger.log(
        `상장회사 데이터 ${totalSaved}/${entities.length}건 적재 중...`,
      );
    }

    this.logger.log(`상장회사 데이터 ${entities.length}건 적재 완료!`);
  }

  async getByCorpCode(corp_code: string) {
    // Ensure corp_code is 8 digits
    const paddedCorpCode = corp_code.padStart(8, '0');
    return this.corpCodeRepo.findOne({ where: { corp_code: paddedCorpCode } });
  }

  async getFinancialStatements(
    query: FinancialDataRequestDto,
  ): Promise<FinancialDataResponseDto> {
    try {
      // Ensure corp_code is 8 digits (DART API requirement)
      const paddedCorpCode = query.corpCode.padStart(8, '0');

      // 현재 날짜 기준으로 적절한 보고서 코드 선택
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 0-based to 1-based
      let requestYear = query.year || currentYear;

      let reprtCode = '11011'; // 기본값: 사업보고서

      // 요청 연도가 현재 연도인 경우, 월별로 적절한 보고서 선택
      if (requestYear === currentYear) {
        if (currentMonth <= 3) {
          // 1-3월: 전년도 사업보고서 사용
          requestYear = currentYear - 1;
          reprtCode = '11011';
        } else if (currentMonth <= 5) {
          // 4-5월: 1분기 보고서 (3월 말 기준, 5월 중순까지 제출)
          reprtCode = '11013';
        } else if (currentMonth <= 8) {
          // 6-8월: 반기 보고서 (6월 말 기준, 8월 중순까지 제출)
          reprtCode = '11012';
        } else if (currentMonth <= 11) {
          // 9-11월: 3분기 보고서 (9월 말 기준, 11월 중순까지 제출)
          reprtCode = '11014';
        } else {
          // 12월: 3분기 보고서 사용
          reprtCode = '11014';
        }
      }
      // 요청 연도가 과거 연도인 경우, 사업보고서 사용

      this.logger.log(
        `Using report code ${reprtCode} for year ${requestYear} (current month: ${currentMonth})`,
      );

      // 재무제표 데이터 가져오기
      const params = {
        crtfc_key: this.crtfcKey,
        corp_code: paddedCorpCode,
        bsns_year: requestYear.toString(),
        reprt_code: reprtCode,
      };

      const { data } = await firstValueFrom(
        this.httpService.get(
          'https://opendart.fss.or.kr/api/fnlttSinglAcnt.json',
          { params: params },
        ),
      );

      // API 응답 확인
      if (data.status !== '000') {
        this.logger.warn(`DART API error: ${data.message}`);
        throw new Error('DART API returned error');
      }

      // 재무 데이터 처리
      const processedData = formatFinancialData(data);

      this.logger.log(
        `Processed financial data: ${JSON.stringify(processedData)}`,
      );

      // ROE와 ROA 계산
      let roe = 0;
      let roa = 0;

      if (processedData.totalEquity > 0) {
        // ROE = 당기순이익 / 자본총계 * 100
        roe = (processedData.netIncome / processedData.totalEquity) * 100;
        this.logger.log(
          `ROE calculation: ${processedData.netIncome} / ${processedData.totalEquity} * 100 = ${roe}`,
        );
      }

      if (processedData.totalAssets > 0) {
        // ROA = 당기순이익 / 자산총계 * 100
        roa = (processedData.netIncome / processedData.totalAssets) * 100;
        this.logger.log(
          `ROA calculation: ${processedData.netIncome} / ${processedData.totalAssets} * 100 = ${roa}`,
        );
      }

      // 응답 반환
      return {
        corpCode: query.corpCode,
        year: query.year,
        revenue: processedData.revenue,
        operatingProfit: processedData.operatingProfit,
        netIncome: processedData.netIncome,
        totalAssets: processedData.totalAssets,
        totalEquity: processedData.totalEquity,
        eps: processedData.eps || 0,
        roe: Math.round(roe * 100) / 100, // 소수점 2자리
        roa: Math.round(roa * 100) / 100, // 소수점 2자리
      };
    } catch (error) {
      this.logger.error(`Failed to get financial statements: ${error.message}`);

      // 오류 발생 시 모의 데이터 반환 (개발/테스트용)
      this.logger.warn('Returning mock financial data due to API error');

      const mockData = {
        corpCode: query.corpCode,
        year: query.year,
        revenue: 2589355, // 매출액 (억원)
        operatingProfit: 65670, // 영업이익 (억원)
        netIncome: 154871, // 당기순이익 (억원)
        totalAssets: 4559060, // 총자산 (억원)
        totalEquity: 3636779, // 총자본 (억원)
        eps: 2594, // EPS (원)
        roe: 4.26, // ROE (%)
        roa: 3.4, // ROA (%)
      };

      return mockData;
    }
  }
}
