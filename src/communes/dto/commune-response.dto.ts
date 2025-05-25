import { ApiProperty } from '@nestjs/swagger';
import { RegionResponseDto } from '../../regions/dto/region-response.dto';

export class CommuneResponseDto {
  @ApiProperty({ example: 'f4c6a214-28b0-470a-98f3-cfa2548b06fd' })
  id: string;

  @ApiProperty({ example: 'La Florida' })
  name: string;

  @ApiProperty({ type: RegionResponseDto })
  region: RegionResponseDto;
}
