import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

const DATAJUD_API_KEY = process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';

@Injectable()
export class DatajudService {
  private readonly logger = new Logger(DatajudService.name);

  constructor(private prisma: PrismaService) {}

  private getTribunalPrefix(cnj: string): string | null {
    const cleanCnj = cnj.replace(/\D/g, '');
    if (cleanCnj.length !== 20) return null;
    const j = cleanCnj.substring(13, 14);
    const tr = cleanCnj.substring(14, 16);
    
    if (j === '8') {
       const tjs: Record<string, string> = {
         '01': 'tjac', '02': 'tjal', '03': 'tjap', '04': 'tjam', '05': 'tjba',
         '06': 'tjce', '07': 'tjdft', '08': 'tjes', '09': 'tjgo', '10': 'tjma',
         '11': 'tjmt', '12': 'tjms', '13': 'tjmg', '14': 'tjpa', '15': 'tjpb',
         '16': 'tjpr', '17': 'tjpe', '18': 'tjpi', '19': 'tjrj', '20': 'tjrn',
         '21': 'tjrs', '22': 'tjro', '23': 'tjrr', '24': 'tjsc', '25': 'tjse',
         '26': 'tjsp', '27': 'tjto'
       };
       return tjs[tr] || null;
    }
    if (j === '4') return `trf${parseInt(tr, 10)}`;
    if (j === '5') return `trt${parseInt(tr, 10)}`;
    
    return null;
  }

  async syncProcess(processId: string, tenantId: string) {
    const process = await this.prisma.process.findFirst({
      where: { id: processId, tenantId }
    });

    if (!process) throw new BadRequestException('Processo não encontrado');
    if (!process.number) throw new BadRequestException('Processo não possui numeração CNJ');

    const tribunal = this.getTribunalPrefix(process.number);
    if (!tribunal) throw new BadRequestException('Não foi possível identificar o tribunal a partir do número CNJ');

    try {
      const response = await fetch(`https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`, {
        method: 'POST',
        headers: {
          'Authorization': `APIKey ${DATAJUD_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: {
            match: {
              numeroProcesso: process.number.replace(/\D/g, '')
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Datajud API error: ${response.status}`);
      }

      const data = await response.json();
      const hits = data.hits?.hits;
      
      if (!hits || hits.length === 0) {
        return { success: false, message: 'Processo não encontrado no Datajud' };
      }

      const source = hits[0]._source;
      const movimentacoes = source.movimentos || [];

      // Get existing updates to avoid duplicates
      const existingUpdates = await this.prisma.processUpdate.findMany({
        where: { processId: process.id },
        select: { description: true, date: true }
      });

      let newUpdatesCount = 0;

      for (const mov of movimentacoes) {
        const movDate = new Date(mov.dataHora);
        const movDesc = mov.nome || 'Movimentação atualizada';

        // Check if this update already exists (matching date and description approx)
        const exists = existingUpdates.some(eu => 
          eu.description === movDesc && 
          eu.date.toISOString().split('T')[0] === movDate.toISOString().split('T')[0]
        );

        if (!exists) {
          await this.prisma.processUpdate.create({
            data: {
              processId: process.id,
              description: movDesc,
              date: movDate,
              type: 'MOVIMENTO'
            }
          });
          newUpdatesCount++;
        }
      }

      // Update process sync status
      await this.prisma.process.update({
        where: { id: process.id },
        data: { lastSyncAt: new Date(), isMonitored: true }
      });

      return { 
        success: true, 
        message: `Sincronização concluída. ${newUpdatesCount} novas movimentações.`,
        newUpdatesCount
      };

    } catch (error: any) {
      this.logger.error(`Error syncing process ${process.number}: ${error.message}`);
      throw new BadRequestException('Erro ao comunicar com a API do Datajud');
    }
  }

  async enableMonitoring(processId: string, tenantId: string, enable: boolean) {
    if (enable) {
       // Check limit of 5
       const monitoredCount = await this.prisma.process.count({
         where: { tenantId, isMonitored: true }
       });
       
       if (monitoredCount >= 5) {
         throw new BadRequestException('Limite de 5 processos monitorados atingido. Faça upgrade para monitorar mais processos.');
       }
    }

    await this.prisma.process.updateMany({
      where: { id: processId, tenantId },
      data: { isMonitored: enable }
    });

    if (enable) {
      // Sync immediately when enabled
      try {
        await this.syncProcess(processId, tenantId);
      } catch (e) {
        // Ignore initial sync error but keep it monitored
      }
    }

    return { success: true };
  }

  // Runs every day at 3 AM
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron() {
    this.logger.debug('Starting daily Datajud sync...');
    const monitoredProcesses = await this.prisma.process.findMany({
      where: { isMonitored: true }
    });

    for (const process of monitoredProcesses) {
      try {
        await this.syncProcess(process.id, process.tenantId);
        // Sleep to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        this.logger.error(`Failed to sync process ${process.id}: ${error.message}`);
      }
    }
    this.logger.debug('Daily Datajud sync completed.');
  }
}
