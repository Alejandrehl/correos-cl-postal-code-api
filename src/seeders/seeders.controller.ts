// import { Controller, Post, Body } from '@nestjs/common';
// import { SeedersService } from './seeders.service';
// import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { validatePasswordOrThrow } from '../utils/validate-password.util';
// import { SecureQueryDto } from '../common/dto/secure-query.dto';

// @ApiTags('🛠️ Internal Tools')
// @Controller('seeders')
// export class SeedersController {
//   constructor(private readonly seedersService: SeedersService) {}

//   @Post('regions')
//   @ApiOperation({
//     summary: '🛡️ Seed Chilean regions',
//     description: `**Protected endpoint.** Inserts all Chilean regions into the database.
// Requires a secure password and is intended for internal use only during initial setup or recovery.`,
//   })
//   @ApiResponse({ status: 201, description: 'Regions seeded successfully' })
//   @ApiResponse({
//     status: 418,
//     description: 'Unauthorized attempt with joke message',
//   })
//   async seedRegions(@Body() body: SecureQueryDto) {
//     validatePasswordOrThrow(body.password);
//     return this.seedersService.seedRegions();
//   }

//   @Post('communes')
//   @ApiOperation({
//     summary: '🛡️ Seed Chilean communes',
//     description: `**Protected endpoint.** Inserts all Chilean communes, associating each with its corresponding region.
// Requires a secure password and is intended for internal setup or data restoration.`,
//   })
//   @ApiResponse({ status: 201, description: 'Communes seeded successfully' })
//   @ApiResponse({
//     status: 418,
//     description: 'Unauthorized attempt with joke message',
//   })
//   async seedCommunes(@Body() body: SecureQueryDto) {
//     validatePasswordOrThrow(body.password);
//     return this.seedersService.seedCommunes();
//   }

//   @Post('normalize')
//   @ApiOperation({
//     summary: '🛡️ Normalize database records',
//     description: `**Protected endpoint.** Cleans and standardizes data across communes, streets, and postal codes:
// - Trims names
// - Updates normalized fields
// - Merges duplicates
// Requires a secure password. Intended for internal maintenance and data consistency.`,
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Normalization completed successfully',
//   })
//   @ApiResponse({
//     status: 418,
//     description: 'Unauthorized attempt with joke message',
//   })
//   async normalize(@Body() body: SecureQueryDto) {
//     validatePasswordOrThrow(body.password);
//     return this.seedersService.normalizeDatabase(true);
//   }

//   @Post('all')
//   @ApiOperation({
//     summary: '🛡️ Full seed and normalization process',
//     description: `**Protected endpoint.** Runs the complete setup routine:
// - Seeds Chilean regions and communes
// - Normalizes data (trims, merges, standardizes names)

// Use only for initial deployment or full data refresh. Requires a secure password.`,
//   })
//   @ApiResponse({
//     status: 201,
//     description: 'All seeding completed successfully',
//   })
//   @ApiResponse({
//     status: 418,
//     description: 'Unauthorized attempt with joke message',
//   })
//   async seedAll(@Body() body: SecureQueryDto) {
//     validatePasswordOrThrow(body.password);

//     const regionsResult = await this.seedersService.seedRegions();
//     const communesResult = await this.seedersService.seedCommunes();
//     const normalizationResult =
//       await this.seedersService.normalizeDatabase(true);

//     return {
//       regions: regionsResult.message,
//       communes: communesResult.message,
//       normalization: normalizationResult.message,
//       message: '🌱 Full seeding and normalization completed successfully!',
//     };
//   }
// }
