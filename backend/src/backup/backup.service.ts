import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as xlsx from 'xlsx';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private prisma: PrismaService) {}

  async generateJsonBackup(tenantId: string) {
    this.logger.log(`Generating JSON backup for tenant ${tenantId}`);
    
    // Fetch all relevant data for the tenant
    const [
      tenant,
      clients,
      processes,
      financialRecords,
      events,
      contracts,
      documents
    ] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.client.findMany({ 
        where: { tenantId },
        include: { tags: true, notes: true }
      }),
      this.prisma.process.findMany({ 
        where: { tenantId },
        include: { updates: true, notes: true, labels: true, checklists: { include: { items: true } } }
      }),
      this.prisma.financialRecord.findMany({ where: { tenantId } }),
      this.prisma.event.findMany({ 
        where: { tenantId },
        include: { assignees: true, checklistItems: true }
      }),
      this.prisma.contract.findMany({ where: { tenantId } }),
      this.prisma.document.findMany({ where: { tenantId } })
    ]);

    const backupData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      tenant,
      clients,
      processes,
      financialRecords,
      events,
      contracts,
      documents
    };

    return backupData;
  }

  async generateExcelBackup(tenantId: string): Promise<Buffer> {
    this.logger.log(`Generating Excel backup for tenant ${tenantId}`);
    
    // Create a new workbook
    const wb = xlsx.utils.book_new();

    // 1. Clients Data
    const clients = await this.prisma.client.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
    const clientsSheetData = clients.map(c => ({
      Nome: c.name,
      Documento: c.document,
      Email: c.email,
      Telefone: c.phone,
      Status: c.status,
      Tipo_Demanda: c.demandType,
      Urgencia: c.urgencyLevel,
      'Data Cadastro': c.createdAt.toLocaleDateString('pt-BR')
    }));
    const wsClients = xlsx.utils.json_to_sheet(clientsSheetData);
    xlsx.utils.book_append_sheet(wb, wsClients, 'Clientes');

    // 2. Processes Data
    const processes = await this.prisma.process.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
    const processesSheetData = processes.map(p => ({
      'Número do Processo': p.number,
      Título: p.title,
      Status: p.status,
      Vara_Tribunal: p.court,
      Área: p.area,
      Valor: p.value,
      Fase_Kanban: p.kanbanColumn,
      'Data Cadastro': p.createdAt.toLocaleDateString('pt-BR')
    }));
    const wsProcesses = xlsx.utils.json_to_sheet(processesSheetData);
    xlsx.utils.book_append_sheet(wb, wsProcesses, 'Processos');

    // 3. Financial Data
    const financials = await this.prisma.financialRecord.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' }
    });
    const financialsSheetData = financials.map(f => ({
      Tipo: f.type === 'INCOME' ? 'Receita' : 'Despesa',
      Categoria: f.category,
      Descrição: f.description,
      Valor: f.amount,
      Status: f.status,
      Data: f.date.toLocaleDateString('pt-BR'),
      Recorrente: f.isRecurring ? 'Sim' : 'Não'
    }));
    const wsFinancials = xlsx.utils.json_to_sheet(financialsSheetData);
    xlsx.utils.book_append_sheet(wb, wsFinancials, 'Financeiro');

    // 4. Events Data
    const events = await this.prisma.event.findMany({
      where: { tenantId },
      orderBy: { start: 'desc' }
    });
    const eventsSheetData = events.map(e => ({
      Título: e.title,
      Tipo: e.type,
      Prioridade: e.priority,
      Início: e.start.toLocaleString('pt-BR'),
      Fim: e.end.toLocaleString('pt-BR'),
      Concluído: e.completed ? 'Sim' : 'Não'
    }));
    const wsEvents = xlsx.utils.json_to_sheet(eventsSheetData);
    xlsx.utils.book_append_sheet(wb, wsEvents, 'Agenda');

    // Generate buffer
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buf;
  }
}
