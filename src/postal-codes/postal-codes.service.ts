import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostalCode } from './entities/postal-code.entity';
import { PostalCodeSearchDto } from './dto/postal-code-search.dto';
import { AppLogger } from '../common/logger/logger.service';
import { PostalCodeResponseDto } from './dto/postal-code-response.dto';
import { normalizeText } from '../utils/normalize-text.util';
import {
  PostalCodeResult,
  scrapePostalCode,
} from '../utils/postal-code-scraper.util';
import { Commune } from '../communes/entities/commune.entity';
import { Street } from '../streets/entities/street.entity';
import { StreetNumber } from '../street-numbers/entities/street-number.entity';

@Injectable()
export class PostalCodesService {
  constructor(
    @InjectRepository(PostalCode)
    private readonly postalCodeRepository: Repository<PostalCode>,
    @InjectRepository(Commune)
    private readonly communeRepository: Repository<Commune>,
    @InjectRepository(Street)
    private readonly streetRepository: Repository<Street>,
    @InjectRepository(StreetNumber)
    private readonly streetNumberRepository: Repository<StreetNumber>,
    private readonly logger: AppLogger,
  ) {}

  /* ───────────────────────────── findOrScrape ──────────────────────────── */
  async findOrScrape(
    dto: PostalCodeSearchDto,
  ): Promise<PostalCodeResponseDto | { error: string }> {
    /* 1️⃣  Normaliza entrada */
    const communeInput = dto.commune.trim();
    const streetInput = dto.street.trim();
    const numberValue = dto.number.trim();
    if (!numberValue) return { error: 'Número de calle no puede estar vacío' };

    const nCommune = normalizeText(communeInput);
    const nStreet = normalizeText(streetInput);
    this.logger.log(
      `Normalized → '${nCommune}', '${nStreet}', '${numberValue}'`,
      'PostalCodesService',
    );

    /* 2️⃣  Commune */
    const commune = await this.communeRepository.findOne({
      where: { normalizedName: nCommune },
      relations: ['region'],
    });
    if (!commune)
      throw new NotFoundException(`Commune '${communeInput}' not found`);

    /* 3️⃣  Busca cache con todas las relaciones */
    const cached = await this.streetNumberRepository.findOne({
      where: {
        value: numberValue,
        street: {
          normalizedName: nStreet,
          commune: { id: commune.id },
        },
      },
      relations: [
        'postalCode',
        'street',
        'street.commune',
        'street.commune.region',
      ],
    });
    if (cached?.postalCode) {
      this.logger.log(
        `Cache → ${cached.street.name} ${numberValue} ➜ ${cached.postalCode.code}`,
        'PostalCodesService',
      );
      return this.toDto(cached);
    }

    /* 4️⃣  Scrape */
    const result: PostalCodeResult = await scrapePostalCode(
      commune.name,
      streetInput,
      numberValue,
    );
    if ('error' in result) return { error: result.error };

    const scrapedCode = result.postalCode.trim();
    this.logger.log(`Scraper OK → ${scrapedCode}`, 'PostalCodesService');

    /* 5️⃣  Persiste street + postalCode + number */
    const street =
      (await this.streetRepository.findOne({
        where: { normalizedName: nStreet, commune: { id: commune.id } },
      })) ??
      (await this.streetRepository.save(
        this.streetRepository.create({
          name: streetInput.toUpperCase(),
          normalizedName: nStreet,
          commune,
        }),
      ));

    const postalCode =
      (await this.postalCodeRepository.findOne({
        where: { code: scrapedCode },
      })) ??
      (await this.postalCodeRepository.save(
        this.postalCodeRepository.create({ code: scrapedCode }),
      ));

    const numberEntity =
      (await this.streetNumberRepository.findOne({
        where: { value: numberValue, street: { id: street.id } },
      })) ??
      this.streetNumberRepository.create({
        value: numberValue,
        street,
        postalCode,
      });

    if (!numberEntity.postalCode) numberEntity.postalCode = postalCode;
    await this.streetNumberRepository.save(numberEntity);

    /* 6️⃣  Fetch completo para DTO (evita campos undefined) */
    const full = await this.streetNumberRepository.findOneOrFail({
      where: { id: numberEntity.id },
      relations: [
        'postalCode',
        'street',
        'street.commune',
        'street.commune.region',
      ],
    });
    return this.toDto(full);
  }

  /* helper */
  private toDto(sn: StreetNumber): PostalCodeResponseDto {
    return {
      id: sn.postalCode.id,
      street: sn.street.name.toUpperCase(),
      number: sn.value,
      commune: sn.street.commune.name.toUpperCase(),
      region: sn.street.commune.region.label.toUpperCase(),
      postalCode: sn.postalCode.code,
    };
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{
    data: PostalCodeResponseDto[];
    meta: Readonly<{ total: number; page: number; limit: number }>;
  }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    const [postalCodes, total] = await this.postalCodeRepository.findAndCount({
      order: { id: 'ASC' },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
      relations: [
        'streetNumbers',
        'streetNumbers.street',
        'streetNumbers.street.commune',
        'streetNumbers.street.commune.region',
      ],
    });

    const data = postalCodes.flatMap<PostalCodeResponseDto>((pc) =>
      pc.streetNumbers.map<PostalCodeResponseDto>((sn) => ({
        id: pc.id,
        street: sn.street.name.toUpperCase(),
        number: sn.value,
        commune: sn.street.commune.name.toUpperCase(),
        region: sn.street.commune.region.label.toUpperCase(),
        postalCode: pc.code,
      })),
    );

    this.logger.log(
      `findAll → page:${safePage} limit:${safeLimit} returned:${data.length}/${total}`,
      'PostalCodesService',
    );

    return {
      data,
      meta: { total, page: safePage, limit: safeLimit } as const,
    };
  }

  async findByCode(code: string): Promise<PostalCodeResponseDto[]> {
    const trimmed = code.trim();

    if (!trimmed) {
      throw new BadRequestException('Postal code cannot be empty');
    }

    const postal = await this.postalCodeRepository.findOne({
      where: { code: trimmed },
      relations: [
        'streetNumbers',
        'streetNumbers.street',
        'streetNumbers.street.commune',
        'streetNumbers.street.commune.region',
      ],
    });

    if (!postal) {
      this.logger.warn(
        `Postal code not found: ${trimmed}`,
        'PostalCodesService',
      );
      throw new NotFoundException(`Postal code '${trimmed}' not found`);
    }

    const result = postal.streetNumbers.map<PostalCodeResponseDto>((sn) => ({
      id: postal.id,
      street: sn.street.name.toUpperCase(),
      number: sn.value,
      commune: sn.street.commune.name.toUpperCase(),
      region: sn.street.commune.region.label.toUpperCase(),
      postalCode: postal.code,
    }));

    this.logger.log(
      `findByCode '${trimmed}' → ${result.length} address(es)`,
      'PostalCodesService',
    );

    return result;
  }
}
