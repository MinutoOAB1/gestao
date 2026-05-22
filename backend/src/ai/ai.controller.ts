import { Controller, Post, Body, UploadedFile, UseInterceptors, BadRequestException, Request, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('history')
    async getHistory(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.aiService.getHistory(tenantId);
    }

    @Post('analyze')
    async analyze(@Request() req, @Body() body: { contractText: string, expertMode?: string }) {
        console.log('[AI Controller] Recebida análise de texto. Especialista:', body.expertMode || 'Geral');
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id || req.user?.sub;
        if (!tenantId || !userId) throw new UnauthorizedException('Authentication context incomplete');

        try {
            const result = await this.aiService.analyzeContract(body.contractText, tenantId, userId, 'Análise de Texto', body.expertMode);
            console.log('[AI Controller] Análise concluída com sucesso.');
            return result;
        } catch (error: any) {
            console.error('[AI Controller] Erro na análise:', error.message);
            throw new BadRequestException(`Erro na análise: ${error.message}`);
        }
    }

    // NEW: Extract variables from document text using AI
    @Post('extract-variables')
    async extractVariables(@Body() body: { documentText: string }) {
        console.log('[AI Controller] Extraindo variáveis. Tamanho do texto:', body.documentText?.length);
        try {
            const variables = await this.aiService.extractVariables(body.documentText);
            console.log('[AI Controller] Variáveis extraídas:', variables.length);
            return { variables };
        } catch (error: any) {
            console.error('[AI Controller] Erro ao extrair variáveis:', error.message);
            throw new BadRequestException(`Erro ao extrair variáveis: ${error.message}`);
        }
    }

    @Post('analyze-file')
    @UseInterceptors(FileInterceptor('file'))
    async analyzeFile(@Request() req, @UploadedFile() file: any, @Body() body: { expertMode?: string }) {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo enviado');
        }

        const tenantId = req.user?.tenantId;
        const userId = req.user?.id || req.user?.sub;
        if (!tenantId || !userId) throw new UnauthorizedException('Authentication context incomplete');

        console.log('[AI Controller] Recebido arquivo:', file.originalname, 'Tipo:', file.mimetype, 'Tamanho:', file.size);

        let text = '';

        if (file.mimetype === 'text/plain') {
            text = file.buffer.toString('utf-8');
            console.log('[AI Controller] TXT processado. Caracteres:', text.length);
        } else if (file.mimetype === 'application/pdf') {
            try {
                console.log('[AI Controller] Processando PDF com pdf-parse...');
                const pdfParse = require('pdf-parse');
                const pdfData = await pdfParse(file.buffer);
                text = pdfData.text;
                console.log('[AI Controller] PDF processado. Caracteres extraídos:', text.length);

                if (!text || text.trim().length < 50) {
                    throw new BadRequestException(
                        'O PDF parece estar vazio ou ser uma imagem escaneada. Por favor, use um PDF com texto selecionável ou cole o conteúdo diretamente.'
                    );
                }
            } catch (pdfError: any) {
                console.error('[AI Controller] Erro ao processar PDF:', pdfError.message);
                throw new BadRequestException(
                    `Erro ao processar PDF: ${pdfError.message}. Tente copiar o texto e colar diretamente.`
                );
            }
        } else {
            throw new BadRequestException('Formato de arquivo não suportado. Use arquivos .txt ou .pdf');
        }

        try {
            console.log('[AI Controller] Enviando para análise de IA... Especialista:', body.expertMode || 'Geral');
            const result = await this.aiService.analyzeContract(text, tenantId, userId, file.originalname, body.expertMode);
            console.log('[AI Controller] Análise concluída com sucesso.');
            return result;
        } catch (error: any) {
            console.error('[AI Controller] Erro na análise de IA:', error.message);
            throw new BadRequestException(`Erro na análise de IA: ${error.message}`);
        }
    }

    @Post('gestao/cadeia-valor/gerar')
    async gerarCadeiaValor(@Body() body: { officeArea: string, prompt?: string }) {
        console.log('[AI Controller] Gerando cadeia de valor. Área:', body.officeArea);
        try {
            return await this.aiService.generateValueChain(body.officeArea, body.prompt);
        } catch (error: any) {
            console.error('[AI Controller] Erro ao gerar cadeia de valor:', error.message);
            throw new BadRequestException(`Erro ao gerar cadeia de valor: ${error.message}`);
        }
    }

    @Post('gestao/briefing/otimizar')
    async otimizarBriefing(@Body() body: { processId: string, nodes: any[], connections: any[], details: any }) {
        console.log('[AI Controller] Otimizando briefing. ID:', body.processId);
        try {
            return await this.aiService.optimizeBPMNProcess(body.processId, body.nodes, body.connections, body.details);
        } catch (error: any) {
            console.error('[AI Controller] Erro ao otimizar briefing:', error.message);
            throw new BadRequestException(`Erro ao otimizar briefing: ${error.message}`);
        }
    }
}

