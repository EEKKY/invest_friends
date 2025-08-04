import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AxiosWrapper } from './axios-wrapper.service';

@Module({
  imports: [HttpModule], //httpservice에서 모듈로 교체: 모듈 안에 서비스가 들어가 있음
  providers: [AxiosWrapper],
  exports: [AxiosWrapper],
})
export class AxiosWrapperModule {}
