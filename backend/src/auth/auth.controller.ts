import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CreateUserInput, UpdateUserDto } from "./dto/auth.dto";
import { AtuhService } from "./auth.service";

@Controller('user')
export class AuthController {
    constructor(private readonly service: AtuhService) {}

    @Get()
    findAll() {
        return this.service.findUserAll();
    }

    @Post()
    create(@Body() dto: CreateUserInput) {
        return this.service.createUser(dto);
    }

    @Patch(':uid')
    update(@Param('uid') uid: string, @Body() updateUserDto: UpdateUserDto) {
        return this.service.updateUser(uid, updateUserDto);
    }

    @Delete(':uid')
    remove(@Param('uid') uid: string) {
        return this.service.userDelete(uid);
    }


}