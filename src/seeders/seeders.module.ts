import { Module } from '@nestjs/common';
import { SeedersService } from './seeders.service';
// import { SeedersController } from './seeders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from '../regions/entities/region.entity';
import { Commune } from '../communes/entities/commune.entity';
import { Street } from '../streets/entities/street.entity';
import { StreetNumber } from '../street-numbers/entities/street-number.entity';
import { PostalCode } from '../postal-codes/entities/postal-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Region,
      Commune,
      Street,
      StreetNumber,
      PostalCode,
    ]),
  ],
  // controllers: [SeedersController],
  providers: [SeedersService],
})
export class SeedersModule {}
