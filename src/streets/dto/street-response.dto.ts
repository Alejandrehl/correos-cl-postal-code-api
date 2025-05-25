import { ApiProperty } from '@nestjs/swagger';
import { CommuneResponseDto } from '../../communes/dto/commune-response.dto';

export class StreetResponseDto {
  @ApiProperty({ example: 'f4c6a214-28b0-470a-98f3-cfa2548b06fd' })
  id: string;

  @ApiProperty({ example: 'Avenida Apoquindo' })
  name: string;

  @ApiProperty({ example: 'AVENIDA APOQUINDO' })
  normalizedName: string;

  @ApiProperty({ type: CommuneResponseDto })
  commune: CommuneResponseDto;
}
