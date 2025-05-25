import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { RegionResponseDto } from './dto/region-response.dto';

@ApiTags('🌍 Locations')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get('with-communes')
  @ApiOperation({
    summary: '🗺️ Get all Chilean regions with their communes',
    description: `**Public endpoint.** Returns the full list of Chilean regions, each including its associated communes.
Useful for building location selectors or validating regional data.`,
  })
  @ApiOkResponse({
    description: 'List of regions with communes retrieved successfully.',
    type: RegionResponseDto,
    isArray: true,
  })
  async findAllWithCommunes(): Promise<RegionResponseDto[]> {
    return this.regionsService.findAllWithCommunes();
  }
}
