import { Module } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosWrapper } from './axios-wrapper.service';

@Module({
  imports: [HttpService],
  providers: [AxiosWrapper],
  exports: [AxiosWrapper],
})
export class AxiosWrapperModule {}
