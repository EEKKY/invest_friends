import { Module } from '@nestjs/common';
import { AxiosWrapper } from './axios-wrapper.service';

@Module({
  imports: [],
  providers: [AxiosWrapper],
  exports: [AxiosWrapper],
})
export class AxiosWrapperModule {}
