import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostalCodesModule } from './postal-codes/postal-codes.module';
import { RegionsModule } from './regions/regions.module';
import { CommunesModule } from './communes/communes.module';
import { StreetsModule } from './streets/streets.module';
import { StreetNumbersModule } from './street-numbers/street-numbers.module';
import { SeedersModule } from './seeders/seeders.module';
import { StatsModule } from './stats/stats.module';
import { BrowserCleanupService } from './common/services/browser-cleanup.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        autoLoadEntities: true,
        logging: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    PostalCodesModule,
    RegionsModule,
    CommunesModule,
    StreetsModule,
    StreetNumbersModule,
    SeedersModule,
    StatsModule,
  ],
  providers: [BrowserCleanupService],
})
export class AppModule {}
