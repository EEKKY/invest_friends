import { Module } from "@nestjs/common";
import { AxiosFilterService } from "./axios-filter.service";

@Module({
    imports: [],
    providers: [AxiosFilterService],
    exports: [AxiosFilterService]
})
export class AxiosFilterModule{}