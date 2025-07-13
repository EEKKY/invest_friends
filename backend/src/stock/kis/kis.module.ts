import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { KisService } from './kis.service';
import { KisController } from './kis.controller';

@Module({
  imports: [HttpModule],
  providers: [KisService],
  controllers: [KisController],
})
export class KisModule {}
