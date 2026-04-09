import { Controller, Get, Res, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Response } from 'express';

@Controller('backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('export/json')
  async exportJson(@Req() req: any, @Res() res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const data = await this.backupService.generateJsonBackup(tenantId);
      
      const fileName = `backup_${tenantId}_${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      return res.status(HttpStatus.OK).send(data);
    } catch (error) {
      throw new HttpException('Failed to generate JSON backup', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('export/excel')
  async exportExcel(@Req() req: any, @Res() res: Response) {
    try {
      const tenantId = req.user.tenantId;
      const buffer = await this.backupService.generateExcelBackup(tenantId);
      
      const fileName = `backup_${tenantId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      return res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      throw new HttpException('Failed to generate Excel backup', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
