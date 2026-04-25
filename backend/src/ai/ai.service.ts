import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openRouterKey: string | undefined;
  private readonly siteUrl = 'https://advus.com.br';
  private readonly siteName = 'Advus AI Premium';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.openRouterKey = this.configService.get<string>('OPENROUTER_API_KEY');

    if (!this.openRouterKey) {
      this.logger.warn('OPENROUTER_API_KEY not found. AI features will be disabled.');
    }
  }

  async getHistory(tenantId: string) {
    return this.prisma.aiAnalysisLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, avatar: true } } }
    });
  }

  // ... (rest of private methods)

  private async callOpenRouter(messages: any[], jsonMode: boolean = false) {
    if (!this.openRouterKey) {
      throw new Error('AI Service not initialized. Check API Key.');
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.siteName,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: messages,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error(`Error during AI analysis: ${error.message}`);
      throw new Error(`Falha na comunicação com a IA: ${error.message}`);
    }
  }

  // NEW: Extract variables (editable fields) from document text using AI
  async extractVariables(documentText: string) {
    const prompt = `
      Você é um especialista em análise de documentos jurídicos brasileiros.
      Analise o texto abaixo e identifique TODOS os campos que normalmente são preenchidos/alterados em cada documento:

      CAMPOS A IDENTIFICAR:
      - Nomes completos de pessoas (autor, réu, outorgante, outorgado, etc)
      - CPF e RG
      - Endereços completos (Rua, número, bairro, cidade, CEP, estado)
      - Telefones e emails
      - Datas (nascimento, casamento, documento)
      - Valores monetários
      - Números de processos
      - Números de documentos (OAB, CREA, etc)
      - Profissões
      - Estado civil
      - Nacionalidade
      
      TEXTO DO DOCUMENTO:
      ---
      ${documentText.substring(0, 8000)}
      ---

      RETORNE APENAS um JSON válido com esta estrutura (sem markdown, sem \`\`\`):
      {
        "variables": [
          {
            "name": "nome_identificador_unico",
            "label": "Nome legível em português",
            "type": "text|date|cpf|rg|phone|email|address|money|number",
            "originalValue": "valor encontrado no texto",
            "category": "pessoa|endereco|documento|data|valor|contato"
          }
        ]
      }

      REGRAS:
      - Use nomes descritivos tipo "nome_requerente", "cpf_autor", "endereco_completo"
      - Agrupe logicamente (pessoa1, pessoa2, etc se houver múltiplas pessoas)
      - Inclua TODOS os dados pessoais encontrados
      - Se não encontrar campos preenchíveis, retorne {"variables": []}
    `;

    const result = await this.callOpenRouter([{ role: 'user', content: prompt }], true);

    // Cleanup JSON
    let cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanResult);
      return parsed.variables || [];
    } catch (e) {
      this.logger.error('Failed to parse variables JSON from AI', cleanResult);
      // Return empty array on error
      return [];
    }
  }

  async analyzeContract(contractText: string, tenantId?: string, userId?: string, contractName?: string, expertMode: string = 'Geral') {
    const prompt = `
      Você é um Advogado de Elite especializado em Due Diligence e Auditoria Contratual no sistema jurídico brasileiro.
      Sua missão é realizar uma análise profunda e "impiedosa" do contrato abaixo, atuando como um especialista em ${expertMode}.
      Se o modo for "Geral", use uma visão ampla. Se for específico (ex: Trabalhista, Cível), foque bstante nas leis e riscos específicos dessa área.

      OBJETIVOS DA ANÁLISE:
      1. Auditoria Dinâmica: Identifique riscos reais, cláusulas predatórias e omissões críticas.
      2. Compliance Jurídico: Verifique aderência à LGPD, ESG e normas setoriais.
      3. Poder de Negociação: Calcule quem detém o maior poder baseado nos termos.
      4. Redação Jurídica: Sugira uma redação "blindada" e melhorada para cada ponto de risco encontrado.
      
      CONTRATO PARA ANÁLISE:
      ---
      ${contractText}
      ---

      FORMATO DE RESPOSTA (JSON RIGOROSO):
      Retorne APENAS um objeto JSON válido. NÃO use blocos de código markdown (\`\`\`json). O JSON deve ter esta estrutura:
      {
        "executiveSummary": "Resumo tático de 3-4 frases para diretores.",
        "negotiationPower": {
          "score": 0 a 100,
          "analysis": "Explicação curta."
        },
        "overallScore": 0 a 100,
        "analysisGroups": {
          "auditoria": [
            {
              "title": "Nome da Cláusula",
              "risk": "Alto" | "Médio" | "Nenhum",
              "description": "Análise técnica.",
              "suggestedRedaction": "Redação jurídica otimizada.",
              "clauseReference": "Ex: 4.2"
            }
          ],
          "compliance": [
            { "item": "Ex: LGPD", "status": "Conforme" | "Alerta" | "Crítico" }
          ],
          "omissions": [
            { "missingItem": "Ex: Foro", "impact": "Alta" }
          ]
        },
        "healthChecklist": [
          { "item": "Multa Rescisória", "found": true/false },
          { "item": "Foro de Eleição", "found": true/false },
          { "item": "Confidencialidade", "found": true/false }
        ]
      }
    `;

    const result = await this.callOpenRouter([{ role: 'user', content: prompt }], true);

    // Cleanup JSON if needed
    let cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanResult);

      // Save to Database if tenantId is provided
      if (tenantId) {
        try {
          await this.prisma.aiAnalysisLog.create({
            data: {
              contractName: contractName || 'Análise Rápida',
              contractText: contractText.substring(0, 100000), // Limit text size if needed
              analysisResult: JSON.stringify(parsed),
              overallScore: parsed.overallScore || 0,
              tenantId,
              userId
            }
          });
        } catch (dbError) {
          this.logger.error('Failed to save analysis log to DB', dbError);
          // Don't fail the request if saving logs fails
        }
      }

      return parsed;
    } catch (e) {
      this.logger.error('Failed to parse JSON from AI response', cleanResult);
      throw new Error('A IA não retornou um formato válido. Tente novamente.');
    }
  }


  // Generate comprehensive client report using AI - returns structured data for rich frontend rendering
  async generateClientReport(clientData: {
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: string;
    createdAt: string;
    processes: Array<{
      number?: string | null;
      title: string;
      status: string;
      area?: string;
      court?: string;
      updates?: Array<{
        date: string;
        description: string;
        type: string;
      }>;
    }>;
    financialRecords: Array<{
      type: string;
      amount: number;
      description: string;
      status: string;
      date: string;
    }>;
  }) {
    const totalReceitas = clientData.financialRecords
      .filter(r => r.type === 'INCOME')
      .reduce((acc, r) => acc + r.amount, 0);

    const totalDespesas = clientData.financialRecords
      .filter(r => r.type === 'EXPENSE')
      .reduce((acc, r) => acc + r.amount, 0);

    const pendentes = clientData.financialRecords
      .filter(r => r.status === 'PENDING')
      .reduce((acc, r) => acc + r.amount, 0);

    const processosAtivos = clientData.processes.filter(p => p.status === 'OPEN' || p.status === 'ACTIVE').length;
    const processosEncerrados = clientData.processes.filter(p => p.status === 'CLOSED').length;

    // Collect all movements across all processes for timeline
    const allMovements: Array<{ date: string; description: string; type: string; processNumber: string; processTitle: string }> = [];
    clientData.processes.forEach(p => {
      (p.updates || []).forEach(u => {
        allMovements.push({
          date: u.date,
          description: u.description,
          type: u.type,
          processNumber: p.number || 'N/A',
          processTitle: p.title
        });
      });
    });
    // Sort by date descending
    allMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Generate AI summary for each process and overall analysis
    const prompt = `
      Você é um advogado brasileiro experiente criando um RELATÓRIO DE ACOMPANHAMENTO JURÍDICO completo.
      Este relatório será entregue diretamente ao cliente para mantê-lo informado.
      
      DADOS DO CLIENTE:
      - Nome: ${clientData.name}
      - Documento: ${clientData.document || 'Não informado'}
      - Email: ${clientData.email || 'Não informado'}
      - Telefone: ${clientData.phone || 'Não informado'}
      - Cliente desde: ${new Date(clientData.createdAt).toLocaleDateString('pt-BR')}

      PROCESSOS (${clientData.processes.length} total, ${processosAtivos} ativos, ${processosEncerrados} encerrados):
      ${clientData.processes.map(p => `
        - Nº ${p.number || 'N/A'}: ${p.title}
          Status: ${p.status} | Área: ${p.area || 'Cível'} | Vara: ${p.court || 'N/A'}
          Andamentos: ${(p.updates || []).length} registros
          ${p.updates && p.updates.length > 0 ? `Últimos: ${p.updates.slice(0, 5).map(u => `[${new Date(u.date).toLocaleDateString('pt-BR')}] ${u.type}: ${u.description}`).join(' | ')}` : 'Sem movimentações'}
      `).join('\n')}

      FINANCEIRO:
      - Total Honorários Recebidos: R$ ${totalReceitas.toFixed(2)}
      - Custos Processuais: R$ ${totalDespesas.toFixed(2)}
      - Valores Pendentes: R$ ${pendentes.toFixed(2)}

      GERE UM JSON com a seguinte estrutura (SEM markdown, apenas JSON puro):
      {
        "greeting": "Texto de saudação profissional e acolhedora para o cliente (2-3 frases)",
        "overallAnalysis": "Análise geral da situação jurídica do cliente em linguagem acessível (3-5 frases)",
        "processAnalyses": [
          {
            "processNumber": "número do processo ou N/A",
            "summary": "Resumo em linguagem simples do que está acontecendo neste processo (2-3 frases)",
            "nextSteps": "O que o cliente pode esperar como próximos passos (1-2 frases)",
            "riskLevel": "baixo" | "medio" | "alto",
            "phase": "inicial" | "instrucao" | "sentenca" | "recurso" | "execucao" | "arquivado"
          }
        ],
        "recommendations": ["Recomendação 1 para o cliente", "Recomendação 2"],
        "conclusion": "Mensagem de encerramento profissional (1-2 frases)"
      }

      REGRAS:
      - Use linguagem clara e acessível, evite jargão jurídico
      - Seja profissional mas acolhedor
      - Transmita confiança e controle da situação
      - Forneça informações úteis e acionáveis
      - Retorne APENAS o JSON válido, sem blocos de código
    `;

    const result = await this.callOpenRouter([{ role: 'user', content: prompt }], true);

    // Clean up JSON
    let cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();

    let aiAnalysis: any = {};
    try {
      aiAnalysis = JSON.parse(cleanResult);
    } catch (e) {
      this.logger.error('Failed to parse AI report JSON', cleanResult);
      aiAnalysis = {
        greeting: `Prezado(a) ${clientData.name}, é com satisfação que apresentamos o relatório atualizado dos seus processos jurídicos.`,
        overallAnalysis: 'Sua situação jurídica está sendo acompanhada de perto pela nossa equipe.',
        processAnalyses: clientData.processes.map(p => ({
          processNumber: p.number || 'N/A',
          summary: `O processo ${p.title} está ${p.status === 'OPEN' || p.status === 'ACTIVE' ? 'em andamento' : 'encerrado'}.`,
          nextSteps: 'Aguardando próximas movimentações.',
          riskLevel: 'medio',
          phase: 'instrucao'
        })),
        recommendations: ['Mantenha seus documentos atualizados', 'Entre em contato em caso de dúvidas'],
        conclusion: 'Permanecemos à disposição para quaisquer esclarecimentos.'
      };
    }

    // Return structured data for rich frontend rendering
    return {
      generatedAt: new Date().toISOString(),
      client: {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        document: clientData.document,
        address: clientData.address,
        memberSince: clientData.createdAt
      },
      summary: {
        totalProcesses: clientData.processes.length,
        activeProcesses: processosAtivos,
        closedProcesses: processosEncerrados,
        totalMovements: allMovements.length,
        totalReceitas,
        totalDespesas,
        pendentes
      },
      aiAnalysis,
      processes: clientData.processes.map(p => {
        const analysis = aiAnalysis.processAnalyses?.find((a: any) => a.processNumber === p.number) || {};
        return {
          number: p.number || null,
          title: p.title,
          status: p.status,
          area: p.area || 'Cível',
          court: p.court || 'A definir',
          updates: (p.updates || []).map(u => ({
            date: u.date,
            description: u.description,
            type: u.type
          })),
          aiSummary: analysis.summary || '',
          nextSteps: analysis.nextSteps || '',
          riskLevel: analysis.riskLevel || 'medio',
          phase: analysis.phase || 'instrucao'
        };
      }),
      timeline: allMovements.slice(0, 20), // Last 20 movements for timeline
      financialRecords: clientData.financialRecords
    };
  }

  // Copilot Feature: Generate Agenda Tasks based on Process Notes
  async analyzeProcessNoteForTasks(noteContent: string, processContext: any) {
    const prompt = `
      Você é um assistente de IA focado em produtividade jurídica.
      Um advogado adicionou a seguinte anotação ao processo "${processContext.title}" (Nº ${processContext.number}):
      ---
      "${noteContent}"
      ---

      Com base neste texto, existem providências futuras implícitas ou explícitas que dependam de agenda?
      Por exemplo, se a nota diz "Audiência designada para 05/10/2026", gerar uma tarefa de "Audiência".
      Sua função exclusiva é ler o contexto de processos/kanbans ou anotações recém salvas e **decidir** se isso requer alguma ação/tarefa mensurável.
      Leve em consideração que nossa Timezone base é o Brasil (America/Sao_Paulo).
      A data de hoje é: ${new Date().toLocaleString('pt-BR')} (fuso local).
      
      Caso HOUVER tarefa acionável, crie um título curto e claro, e defina uma "suggestedDate".
      Se houver data explícita, retorne o formato ISO sem o "Z" no final para não aplicar conversão UTC (ex: "2026-04-08T14:00:00"). Se não houver, crie a data para o dia seguinte a hoje.

      Sempre retorne APENAS um JSON array válido. Não adicione texto antes ou depois. 
      Formato exigido:
      [
        {
          "title": "Nome da Tarefa/Compromisso sugerida",
          "description": "Explicação breve.",
          "suggestedDate": "2026-04-09T14:00:00",
          "priority": "HIGH"
        }
      ]
    `;

    const result = await this.callOpenRouter([{ role: 'user', content: prompt }], true);
    let cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanResult);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      this.logger.error('Failed to parse suggested tasks from AI', cleanResult);
      return [];
    }
  }
}
