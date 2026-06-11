import { Body, Controller, Post } from '@nestjs/common';
import { SampleDataOptions, SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seed: SeedService) {}

  @Post('sample')
  sample(@Body() options: SampleDataOptions = {}) {
    return this.seed.generateSampleData(options);
  }
}
