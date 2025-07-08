import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

TypeOrmModule.forRootAsync({
    useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT')),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
    })
})