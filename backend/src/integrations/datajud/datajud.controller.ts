import { Controller, Post, Param, Body, UseGuards, Request, Get } from '@nestjs/common';
import { DatajudService } from './datajud.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('datajud')
@UseGuards(AuthGuard('jwt'))
export class DatajudController {
  constructor(private readonly datajudService: DatajudService) {}

  @Post('process/:id/sync')
  async syncProcess(@Request() req, @Param('id') id: string) {
    return this.datajudService.syncProcess(id, req.user.tenantId);
  }

  @Post('process/:id/monitor')
  async toggleMonitoring(
    @Request() req,
    @Param('id') id: string,
    @Body('enable') enable: boolean
  ) {
    return this.datajudService.enableMonitoring(id, req.user.tenantId, enable);
  }
}
