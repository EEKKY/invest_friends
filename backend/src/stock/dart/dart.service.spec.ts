import { Test, TestingModule } from '@nestjs/testing';
import { DartService } from './dart.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import * as AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';

jest.mock('adm-zip'); // ZIP 모킹

describe('DartService', () => {
  let service: DartService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DartService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('dummy-dart-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<DartService>(DartService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCorpCode', () => {
    it('should parse CORPCODE.xml and return corp list', async () => {
      const xml = `
        <result>
          <list>
            <corp_code>126380</corp_code>
            <corp_name>삼성전자</corp_name>
            <stock_code>5930</stock_code>
            <modify_date>20240621</modify_date>
          </list>
        </result>
      `;

      const mockBuffer = Buffer.from('dummy-zip');

      // AdmZip 모킹
      const mockZip = {
        readAsText: jest.fn().mockReturnValue(xml),
      };
      (AdmZip as any).mockImplementation(() => mockZip);

      // httpService.get 응답 모킹
      (httpService.get as jest.Mock).mockReturnValueOnce(
        of({ data: mockBuffer }),
      );

      const result = await service.getCorpCode();

      expect(result).toEqual([
        {
          corp_code: 126380,
          corp_name: '삼성전자',
          stock_code: 5930,
          modify_date: 20240621,
        },
      ]);
    });
  });

  describe('getSingleIndex', () => {
    it('should call fnlttSinglIndx.json and return response', async () => {
      const mockResponse = {
        data: {
          status: '000',
          list: [
            {
              corp_code: '00126380',
              thstrm_nm: '2023.12',
              thstrm_amount: '100000',
            },
          ],
        },
      };

      (httpService.get as jest.Mock).mockReturnValueOnce(of(mockResponse));

      const result = await service.getSingleIndex({
        corp_code: '00126380',
        bsns_year: '2023',
        reprt_code: '11013',
        idx_cl_code: 'M230000',
      });

      expect(result).toEqual(mockResponse.data);
    });
  });
});
