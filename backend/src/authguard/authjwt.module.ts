import { Module } from '@nestjs/common';
import { GuardModule } from './authguard.module';

@Module({
  imports: [GuardModule],
  controllers: [],
  providers: [],
})
export class AuthJwtModule {}
