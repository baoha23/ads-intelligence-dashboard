import { Controller, Get, Header, Query } from '@nestjs/common';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="daily-records.csv"')
  csv(@Query('from') from?: string, @Query('to') to?: string) {
    return this.exportService.dailyRecordsCsv(normalizeDateRange(from, to));
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
