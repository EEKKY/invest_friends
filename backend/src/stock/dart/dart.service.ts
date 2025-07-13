import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SinglIndxRequest, SinglIndxResponse } from './dto/singl-indx.dto';
import * as AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import { firstValueFrom } from 'rxjs';
import { CorpCodeDto } from './dto/corp-code.dto';

@Injectable()
export class DartService {
  private readonly crtfcKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.crtfcKey = this.config.get<string>('DART_API_KEY');
  }

  async getCorpCode(): Promise<CorpCodeDto[]> {
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
    const corpList = Array.isArray(list) ? list : [list];

    return corpList;
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
}
