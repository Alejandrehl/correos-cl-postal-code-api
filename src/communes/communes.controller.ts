import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommunesService } from './communes.service';
import { CommuneResponseDto } from './dto/commune-response.dto';

@ApiTags('🌍 Locations')
@Controller('communes')
export class CommunesController {
  constructor(private readonly communesService: CommunesService) {}

  @Get('all')
  @ApiOperation({
    summary: '🏘️ Get all Chilean communes',
    description: `**Public endpoint.** Returns the complete list of Chilean communes, ordered alphabetically by name.
Useful for building dropdowns, filters, or validating addresses.`,
  })
  @ApiOkResponse({
    description: 'List of communes retrieved successfully.',
    type: CommuneResponseDto,
    isArray: true,
  })
  async findAll(): Promise<CommuneResponseDto[]> {
    return this.communesService.findAllSorted();
  }
}
