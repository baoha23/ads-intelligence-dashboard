import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { AnomalyService } from './anomaly.service';
import { QueryAiDto } from './dto/query-ai.dto';
import { ReportService } from './report.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly anomalies: AnomalyService,
    private readonly reports: ReportService,
  ) {}

  @Post('query')
  query(@Body() dto: QueryAiDto) {
    return this.ai.query(dto);
  }

  @Get('debug')
  async debug() {
    return this.ai.debugConnection();
  }

  @Get('anomalies')
  anomaliesList(@Query('from') from?: string, @Query('to') to?: string) {
    return this.anomalies.detect(normalizeDateRange(from, to));
  }

  @Get('report/weekly')
  weeklyReport(@Query('weekEnd') weekEnd?: string) {
    return this.reports.weeklyReport(weekEnd);
  }
}

function normalizeDateRange(from?: string, to?: string) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end);
  if (!from) start.setDate(end.getDate() - 13);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { from: start, to: end };
}
