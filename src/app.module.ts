import { ExecutionContext, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostalCodesModule } from './postal-codes/postal-codes.module';
import { RegionsModule } from './regions/regions.module';
import { CommunesModule } from './communes/communes.module';
import { StreetsModule } from './streets/streets.module';
import { StreetNumbersModule } from './street-numbers/street-numbers.module';
import { SeedersModule } from './seeders/seeders.module';
import { StatsModule } from './stats/stats.module';
import { HealthCheckModule } from './health-check/health-check.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { getClientIp, getOrigin } from './utils/http.util';
import { FastifyRequest } from 'fastify';

const WHITELISTED_ORIGINS = [
  'https://micodigopostal.io',
  'https://micodigopostal.fun',
  'http://localhost:3000',
];

const WHITELISTED_IPS = ['127.0.0.1', '::1', '181.42.163.82'];

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
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 100,
        },
      ],
      skipIf: (context: ExecutionContext): boolean => {
        const req = context.switchToHttp().getRequest<FastifyRequest>();
        const origin = getOrigin(req);
        const ip = getClientIp(req);
        return (
          WHITELISTED_ORIGINS.includes(origin) || WHITELISTED_IPS.includes(ip)
        );
      },
      getTracker: (req: FastifyRequest): string => {
        return getClientIp(req);
      },
    }),
    HealthCheckModule,
    PostalCodesModule,
    RegionsModule,
    CommunesModule,
    StreetsModule,
    StreetNumbersModule,
    StatsModule,
    SeedersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
