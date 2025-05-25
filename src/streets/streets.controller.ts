import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { StreetsService } from './streets.service';

@ApiTags('🌍 Locations')
@Controller('streets')
export class StreetsController {
  constructor(private readonly streetsService: StreetsService) {}

  @Get()
  @ApiOperation({
    summary: '📍 Get paginated list of streets',
    description: `Returns a paginated list of streets in Chile.
You can filter by communeId, regionId, and perform text search.`,
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'communeId', required: false })
  @ApiQuery({ name: 'regionId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiOkResponse({
    description: 'Paginated list of streets',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            name: 'AVENIDA APOQUINDO',
            commune: {
              id: 'uuid',
              name: 'LAS CONDES',
              region: {
                id: '13',
                name: 'REGIÓN METROPOLITANA',
              },
            },
          },
        ],
        meta: { total: 12234, page: 1, limit: 20 },
      },
    },
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('communeId') communeId?: string,
    @Query('regionId') regionId?: string,
    @Query('search') search?: string,
  ) {
    return this.streetsService.findAll({
      page,
      limit,
      communeId,
      regionId,
      search,
    });
  }
}
