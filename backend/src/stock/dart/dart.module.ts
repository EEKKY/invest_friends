import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DartController } from './dart.controller';
import { DartService } from './dart.service';
import { CorpCode } from '../entities/corp-code.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([CorpCode])],
  controllers: [DartController],
  providers: [DartService],
  exports: [DartService],
})
export class DartModule {}
