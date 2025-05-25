import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from './entities/region.entity';
import { RegionWithCommunesResponseDto } from './dto/region-with-communes-response.dto';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
  ) {}

  async findAllWithCommunes(): Promise<RegionWithCommunesResponseDto[]> {
    const regions = await this.regionRepository.find({
      where: { isActive: true },
      relations: ['communes'],
      order: {
        number: 'ASC',
        communes: { name: 'ASC' },
      },
    });

    return regions.map((region) => ({
      id: region.id,
      name: region.name.toUpperCase(),
      number: region.number,
      romanNumber: region.romanNumber,
      label: region.label.toUpperCase(),
      communes: region.communes.map((commune) => ({
        id: commune.id,
        name: commune.name.toUpperCase(),
      })),
    }));
  }
}
