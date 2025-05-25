import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Street } from './entities/street.entity';
import { LoggerModule } from '../common/logger/logger.module';
import { StreetsController } from './streets.controller';
import { StreetsService } from './streets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Street]), LoggerModule],
  controllers: [StreetsController],
  providers: [StreetsService],
  exports: [TypeOrmModule],
})
export class StreetsModule {}
