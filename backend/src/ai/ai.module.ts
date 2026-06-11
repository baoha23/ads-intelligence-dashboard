import { Module } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AnomalyService } from './anomaly.service';
import { ReportService } from './report.service';

@Module({
  imports: [MetricsModule, PrismaModule],
  controllers: [AiController],
  providers: [AiService, AnomalyService, ReportService],
})
export class AiModule {}
