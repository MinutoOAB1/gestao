import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChangelogService implements OnModuleInit {
    private readonly logger = new Logger(ChangelogService.name);

    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        this.logger.log('Checking and seeding platform changelogs...');
        try {
            const count = await this.prisma.changelog.count();
            if (count === 0) {
                this.logger.log('Seeding initial changelogs into database...');
                
                // Let's create our dates matching May 2026
                const date19 = new Date('2026-05-19T12:00:00Z');
                const date18 = new Date('2026-05-18T12:00:00Z');
                const date15 = new Date('2026-05-15T12:00:00Z');
                const date06 = new Date('2026-05-06T12:00:00Z');
                const date05 = new Date('2026-05-05T12:00:00Z');

                await this.prisma.changelog.createMany({
                    data: [
                        {
                            title: 'Notificações Financeiras Instantâneas e Controle de Acesso Elite',
                            description: '- **Integração Real-Time**: Faturas vencidas ou próximas do vencimento agora disparam alertas visuais e sonoros instantâneos via WebSockets directos no navegador.\n- **Matriz de Permissões**: Restrição ativa de rotas e visibilidade de menus (Financeiro, IA Jurídica, Modelos, Configurações) com base nos perfis de Administrador, Advogado, Estagiário e Parceiro.\n- **Proteção de API**: Hardening de endpoints confidenciais no backend para bloquear acessos indevidos.',
                            version: 'v2.4.0',
                            date: date19,
                        },
                        {
                            title: 'Comparador de Versões e Zoom Independente na IA',
                            description: '- **Zoom Isolado**: Controle individualizado da escala de zoom (+ / -) para o contrato original e a proposta de revisão sugerida pela Inteligência Artificial.\n- **Interface Estendida**: Exibição em tela cheia (Full-Width) removendo as margens globais de centralização do portal para aproveitamento total do painel de comparação.\n- **Sumário Retrátil**: Painel lateral deslizante com resumo executivo do contrato, análise de score de risco e navegação direta por cláusulas.',
                            version: 'v2.3.0',
                            date: date18,
                        },
                        {
                            title: 'Área de trabalho, pasta da equipe e revisão',
                            description: '- **Grupo de Trabalho**: Integração direta ao gerenciamento do time, definindo automaticamente o criador como líder do grupo.\n- **Biblioteca Compartilhada**: Criação automática da pasta do time onde proprietários e administradores podem visualizar e editar itens em comum.\n- **Revisão Dinâmica**: Introdução do botão "Enviar para revisão" com escolha direta de revisores definidos na equipe.',
                            version: 'v2.2.0',
                            date: date15,
                        },
                        {
                            title: 'Carregar arquivos e salvar na biblioteca',
                            description: '- **Contexto de Legislação**: Upload de arquivos de contexto integrados nas minutas geradas pela Inteligência Artificial no topo da aba Legislação.\n- **Salvamento Rápido**: Documentos carregados podem ser salvos na biblioteca com etiquetas descritivas para facilitar futuras consultas.\n- **Etiquetagem Inteligente**: Identificação visual automática com a etiqueta "Manual" para acesso rápido.',
                            version: 'v2.1.0',
                            date: date06,
                        },
                        {
                            title: 'Exportação de PDF diagramado',
                            description: '- **Design Editorial**: Relatórios e documentos exportados para PDF com cabeçalho diagramado de alta definição.\n- **Identidade Institucional**: Suporte a templates corporativos contendo brasão, logotipo e rodapé estilizado.\n- **Sumário Executivo**: Inclusão automática de sumários e linhas de tempo formatadas nos PDFs gerados.',
                            version: 'v2.0.0',
                            date: date05,
                        }
                    ]
                });
                this.logger.log('Initial changelogs seeded successfully!');
            }
        } catch (error) {
            this.logger.error('Failed to seed initial changelogs:', error);
        }
    }

    async findAll() {
        return this.prisma.changelog.findMany({
            orderBy: { date: 'desc' }
        });
    }
}
