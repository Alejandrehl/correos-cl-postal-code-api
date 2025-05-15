import { ApiProperty } from '@nestjs/swagger';

export class PostalCodeResponseDto {
  @ApiProperty({ example: 'f4c6a214-28b0-470a-98f3-cfa2548b06fd' })
  id: string;

  @ApiProperty({ example: 'las acacias' })
  street: string;

  @ApiProperty({ example: '7700' })
  number: string;

  @ApiProperty({ example: 'la florida' })
  commune: string;

  @ApiProperty({ example: '8260323' })
  postalCode: string;
}
