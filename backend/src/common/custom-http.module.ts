import { HttpModule } from "@nestjs/axios";
import { CustomHttpService } from "./custom-http.service";
import { AxiosFilterModule } from "./axios/axios-filter.module";
import { Module } from "@nestjs/common";

@Module({
    imports: [HttpModule, AxiosFilterModule],
    providers: [CustomHttpService],
    exports: [CustomHttpService],
})
export class CustomHttpModule{}