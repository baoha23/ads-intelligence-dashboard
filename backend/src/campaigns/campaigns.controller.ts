import { Controller, Delete, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  list(
    @Query('adType') adType?: string,
    @Query('upstream') upstream?: string,
    @Query('downstream') downstream?: string,
  ) {
    return this.campaigns.list({ adType, upstream, downstream });
  }

  @Get(':id')
  async detail(@Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string) {
    const campaign = await this.campaigns.detail(id, { from, to });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.campaigns.delete(id);
    if (!result.deleted) throw new NotFoundException('Campaign not found');
    return result;
  }
}
