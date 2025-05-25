import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Street } from './entities/street.entity';
import { Repository } from 'typeorm';
import { StreetResponseDto } from './dto/street-response.dto';

@Injectable()
export class StreetsService {
  constructor(
    @InjectRepository(Street)
    private readonly streetRepo: Repository<Street>,
  ) {}

  async findAll({
    page,
    limit,
    communeId,
    regionId,
    search,
  }: {
    page: number;
    limit: number;
    communeId?: string;
    regionId?: string;
    search?: string;
  }) {
    const query = this.streetRepo
      .createQueryBuilder('street')
      .leftJoinAndSelect('street.commune', 'commune')
      .leftJoinAndSelect('commune.region', 'region')
      .where('street.isActive = true');

    if (communeId) {
      query.andWhere('commune.id = :communeId', { communeId });
    }

    if (regionId) {
      query.andWhere('region.id = :regionId', { regionId });
    }

    if (search) {
      query.andWhere('street.normalizedName ILIKE :search', {
        search: `%${search}%`,
      });
    }

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    const transformed: StreetResponseDto[] = data.map((street) => ({
      id: street.id,
      name: street.name,
      normalizedName: street.normalizedName,
      commune: {
        id: street.commune.id,
        name: street.commune.name,
        region: {
          id: street.commune.region.id,
          name: street.commune.region.name,
          number: street.commune.region.number,
          romanNumber: street.commune.region.romanNumber,
          label: street.commune.region.label,
        },
      },
    }));

    return {
      data: transformed,
      meta: { total, page, limit },
    };
  }
}
