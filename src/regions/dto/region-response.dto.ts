import { ApiProperty } from '@nestjs/swagger';

export class RegionResponseDto {
  @ApiProperty({ example: '25d3e671-fd91-4225-95cb-1f1f7d8f30ad' })
  id: string;

  @ApiProperty({ example: 'METROPOLITANA' })
  name: string;

  @ApiProperty({ example: '13' })
  number: number;

  @ApiProperty({ example: 'XIII' })
  romanNumber: string;

  @ApiProperty({ example: 'REGIÓN METROPOLITANA DE SANTIAGO' })
  label: string;
}
