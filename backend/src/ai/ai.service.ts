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

  private async callOpenRouter(messages: any[], jsonMode: boolean = false, model: string = 'google/gemini-2.0-flash-001') {
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
          model: model,
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
      Você é um Advogado de Elite especializado em Due Diligence e Auditoria Contratual no sistema jurídico brasileiro, com profundo conhecimento da legislação federal vigente (Código Civil, CDC, LGPD, CLT e leis especiais brasileiras).
      Sua missão é realizar uma análise profunda, técnica e "impiedosa" do contrato abaixo, atuando como um especialista de altíssimo nível em ${expertMode}.
      Se o modo for "Geral", use uma visão ampla. Se for específico (ex: Trabalhista, Cível), foque de forma aprofundada nas leis, doutrinas e riscos específicos dessa área.

      DIRETRIZES LEGAIS ESTRITAS PARA PRECISÃO DA ANÁLISE (LEGISLAÇÃO VIGENTE):
      1. Código Civil (CC - Lei 10.406/2002): Avalie a validade dos negócios jurídicos (Art. 104), a proporcionalidade de cláusulas penais e multas (Arts. 408 a 416 - garantindo que a penalidade não exceda a obrigação principal), as regras de resolução por onerosidade excessiva (Arts. 478 a 480) e a exclusão/inclusão de caso fortuito e força maior (Art. 393).
      2. Código de Defesa do Consumidor (CDC - Lei 8.078/1990): Em relações consumeristas ou de adesão, identifique e denuncie cláusulas abusivas que violem o Art. 51 do CDC (como limitação de indenização, perda total de parcelas pagas ou alteração unilateral).
      3. Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018): Exija cláusulas sólidas de tratamento de dados pessoais (Arts. 7º e 11), delimitação clara de responsabilidade entre Controlador e Operador (Art. 42), confidencialidade de dados e planos de mitigação de incidentes de segurança.
      4. Legislação Trabalhista (CLT): Em contratos de prestação de serviços civis ou de representação comercial, certifique-se de mitigar o risco de caracterização de vínculo empregatício oculto (Arts. 2º e 3º da CLT - pessoalidade, subordinação jurídica, onerosidade e habitualidade).
      5. Leis Especiais (Ex: Lei do Inquilinato - Lei 8.245/91): Adeque contratos imobiliários às regras de garantias de locação e renovação.

      OBJETIVOS DA ANÁLISE:
      1. Auditoria Dinâmica: Identifique riscos reais, cláusulas predatórias e omissões críticas, sempre indicando a base legal brasileira exata aplicável.
      2. Compliance Jurídico: Verifique a aderência detalhada à LGPD, regras gerais de direito de contratos, CDC e normas setoriais vigentes.
      3. Poder de Negociação: Calcule quem detém o maior poder prático baseado nas obrigações pactuadas.
      4. Redação Jurídica Otimizada: Sugira uma nova redação "blindada", robusta e perfeitamente ajustada à jurisprudência e à legislação para cada risco apontado.

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

  // NEW: Generate customized Mindmap Value Chain using Llama 3.1 70B
  async generateValueChain(officeArea: string, prompt?: string) {
    const userPrompt = prompt ? `\nContexto adicional fornecido pelo usuário: "${prompt}"` : '';
    const systemPrompt = `
      Você é um Consultor de Engenharia de Processos e IA de Elite, especializado em estruturar fluxos de valor de escritórios de advocacia no Brasil.
      Sua missão é gerar um mapeamento estratégico de Cadeia de Valor completo e altamente detalhado para a área de atuação: "${officeArea}".${userPrompt}

      O usuário solicitou expressamente que a cadeia de valor seja focada em elaborar automaticamente um FLUXO DE ATENDIMENTO COMPLETO DO ZERO para esta área jurídica, contemplando:
      - Recepção e Boas-Vindas do cliente (Primeiro contato e acolhimento)
      - Coleta de Informações Básicas (dados de qualificação e histórico inicial do caso)
      - Coleta de Provas e Documentos Comprobatórios (RG, CPF, contratos, comprovantes de residência)
      - Análise de Questionamentos/Objeções comuns da área jurídica específica (dúvidas frequentes de clientes sobre tempo, custos, riscos)
      - Triagem de Viabilidade Jurídica (análise de requisitos técnicos para a ação)
      - Fechamento Comercial & Contrato (negociação de honorários e assinatura eletrônica de procurações/contratos)
      - Distribuição / Encaminhamento (direcionamento técnico para elaboração da peça inicial)

      Você deve planejar os blocos (nodes) divididos em duas categorias:
      1. "primary" (Atividades-fim do escritório, ex: Recepção e Coleta de Provas, Triagem e Análise de Objeções, Fechamento de Contratos)
      2. "support" (Atividades de apoio, ex: Faturamento Comercial, Controladoria de Prazos, Marketing Jurídico, TI e Assinatura Eletrônica)

      Posicione os blocos no espaço bidimensional (x, y) de forma organizada, espaçada e sequencial para evitar QUALQUER sobreposição:
      - Atividades-fim ("primary") devem fluir sequencialmente na horizontal do início ao fim do processo (ex: y constante em 150, com x iniciando em 100 e incrementando de 350 em 350 pixels para cada bloco: 100, 450, 800, 1150, 1500, 1850, 2200, etc.).
      - Atividades de apoio ("support") devem ser posicionadas logo abaixo na horizontal (ex: y constante em 450, com x distribuído cobrindo as áreas de suporte correspondentes: 300, 750, 1200, 1650, etc.).

      RETORNE APENAS um JSON válido com a seguinte estrutura (sem blocos de código markdown \`\`\`):
      {
        "nodes": [
          { "id": "process_id_unico", "label": "Nome curto legível do setor", "category": "primary" | "support", "description": "Descrição extremamente rica sobre quais questionamentos e dados são coletados e processados nesta etapa", "x": 120, "y": 100 }
        ],
        "connections": [
          { "id": "conn_id_unico", "from": "node_origem", "to": "node_destino", "label": "Fluxo ou transição de dados" }
        ]
      }

      REGRAS:
      - IDs de processos devem ser curtos e legíveis como "atendimento_inicial", "coleta_documentos", "analise_objecoes", "fechamento_contratos", etc.
      - Crie entre 6 e 9 blocos no total para garantir um mapa rico, extremamente profissional e completo de ponta a ponta.
      - As conexões devem representar o fluxo real de trabalho e as transições de arquivos e dados.
      - Responda apenas com o JSON puro, sem textos ou comentários adicionais.
    `;

    const result = await this.callOpenRouter(
      [{ role: 'user', content: systemPrompt }], 
      true, 
      'meta-llama/llama-3.1-70b-instruct'
    );
    let cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(cleanResult);
    } catch (e) {
      this.logger.error('Failed to parse generateValueChain JSON from AI', cleanResult);
      throw new Error('A IA não retornou um formato de Cadeia de Valor válido. Tente novamente.');
    }
  }

  // NEW: Optimize BPMN Process Whiteboard using Llama 3.1 70B
  async optimizeBPMNProcess(processId: string, currentNodes: any[], currentConnections: any[], details: any) {
    const systemPrompt = `
      Você é um Engenheiro de Processos Jurídicos Sênior e Especialista em Automação (BPMN).
      Sua missão é receber um fluxo atual de trabalho de um setor de advocacia, analisá-lo e retornar uma versão OTIMIZADA.
      Você deve propor melhorias práticas inserindo automações por IA, robôs ou integrações automáticas, ajustando regras de negócio e governança.

      PROCESSO ATUAL (ID: ${processId}):
      - Etapas (Nodes): ${JSON.stringify(currentNodes)}
      - Conectores (Connections): ${JSON.stringify(currentConnections)}
      - Detalhes (Details): ${JSON.stringify(details)}

      Você deve otimizar o fluxo e as raias de responsabilidades:
      - Adicione novas etapas se faltar validações críticas (ex: LGPD, integridade cadastral).
      - Transforme etapas manuais repetitivas em tarefas automáticas ("service") executadas por robôs.
      - Insira gateways de decisão se houver bifurcações de sucesso/erro.
      - Mantenha o posicionamento x e y limpo, cobrindo raias (de cima para baixo: Secretaria/Triagem, Advogado, Parceiros/Sistemas, etc. - y variando de 80 a 300).
      
      RETORNE APENAS um JSON válido com esta estrutura exata (sem markdown \`\`\`):
      {
        "nodes": [
          { "id": "string", "type": "start|task|gateway|data|end", "label": "Nome curto", "x": 120, "y": 100, "taskType": "user|service|send|receive" }
        ],
        "connections": [
          { "id": "string", "from": "string", "to": "string", "label": "Rótulo opcional" }
        ],
        "details": {
          "objective": "Objetivo refinado",
          "owner": "Dono do processo",
          "actors": "Atores mapeados",
          "rules": "Regras de negócio e SLAs de tempos de respostas refinados",
          "dataCollected": "Dados coletados (exigidos)",
          "systemsUsed": "Sistemas e APIs sugeridos para automação",
          "docsGenerated": "Documentos e relatórios gerados"
        }
      }

      REGRAS:
      - Todos os nós devem ter coordenadas x e y válidas e do tipo number.
      - O campo type dos nós só aceita: "start", "task", "gateway", "data", "end".
      - O campo taskType (apenas para type: "task") só aceita: "user", "service", "send", "receive".
      - Responda apenas com o JSON puro, sem textos adicionais.
    `;

    const result = await this.callOpenRouter(
      [{ role: 'user', content: systemPrompt }], 
      true, 
      'meta-llama/llama-3.1-70b-instruct'
    );
    let cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(cleanResult);
    } catch (e) {
      this.logger.error('Failed to parse optimizeBPMNProcess JSON from AI', cleanResult);
      throw new Error('A IA não retornou um formato de Processo BPMN otimizado válido. Tente novamente.');
    }
  }
}
