import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoginController } from "./login.controller";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [LoginController],
    providers: [LoginService]
})

export class LoginModule {}