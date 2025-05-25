import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Commune } from './entities/commune.entity';
import { Repository } from 'typeorm';
import { CommuneResponseDto } from './dto/commune-response.dto';

@Injectable()
export class CommunesService {
  constructor(
    @InjectRepository(Commune)
    private readonly communeRepository: Repository<Commune>,
  ) {}

  async findAllSorted(): Promise<CommuneResponseDto[]> {
    const communes = await this.communeRepository.find({
      where: { isActive: true },
      relations: ['region'],
      order: { name: 'ASC' },
    });

    return communes.map((commune) => ({
      id: commune.id,
      name: commune.name.toUpperCase(),
      region: {
        id: commune.region.id,
        name: commune.region.name,
        number: commune.region.number,
        romanNumber: commune.region.romanNumber,
        label: commune.region.label,
      },
    }));
  }
}
