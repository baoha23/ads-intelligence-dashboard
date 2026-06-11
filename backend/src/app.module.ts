import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ExportModule } from './export/export.module';
import { MetricsModule } from './metrics/metrics.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MetricsModule, CampaignsModule, ExportModule, AiModule, SeedModule],
})
export class AppModule {}
