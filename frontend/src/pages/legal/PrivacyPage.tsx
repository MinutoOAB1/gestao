import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Download, Lock, Eye, Database, Shield, FileText, CheckCircle2 } from 'lucide-react';
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout';

export default function PrivacyPage() {
    useEffect(() => {
        document.title = 'Política de Privacidade | Advus - Gestão Jurídica';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'Política de privacidade da Advus. Transparência sobre coleta de dados, segurança AES-256, conformidade LGPD e diretrizes éticas na gestão de escritórios de advocacia.');
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', 'https://advus.app/privacy');
    }, []);
    const handleDownloadPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('POLÍTICA DE PRIVACIDADE E SEGURANÇA DA INFORMAÇÃO - ADVUS', 15, 20);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const content = [
            '1. COMPROMISSO DE PRIVACIDADE: A Advus estabelece esta politica em estrita conformidade com a Lei Geral de Protecao de Dados Pessoais (LGPD - Lei 13.709/18). Nosso compromisso e assegurar o isolamento logico absoluto dos dados do seu escritorio.',
            '',
            '2. COLETA E FINALIDADE: Coletamos dados cadastrais corporativos (como nome, e-mail institucional, CNPJ, telefone) e metadados de uso da plataforma. Estes dados sao utilizados para a autenticacao de usuarios, faturamento de servicos e otimizacao do desempenho da plataforma.',
            '',
            '3. INTEGRACOES E MODELOS DE INTELIGENCIA ARTIFICIAL: As interacoes analiticas de Inteligencia Artificial sao processadas sob acordos estritos de nao-retencao (Zero Data Retention). Nenhum dado contido nos processos ou documentos de seu escritorio e utilizado para fins de treinamento de modelos globais.',
            '',
            '4. ARMAZENAMENTO E INFRAESTRUTURA: Os dados sao custodiados em servidores de nuvem de alta redundancia (AWS regiao Sao Paulo). A criptografia e obrigatoria em repouso (AES-256) e em transito (TLS 1.3).',
            '',
            '5. DIREITOS E CONTATO: Como titular ou Controlador, o escritorio possui canal direto de solicitacao de exclusao definitiva, portabilidade ou retificacao de dados. Contato do Encarregado de Dados (DPO): dpo@advus.app.'
        ];
        
        let y = 35;
        content.forEach(line => {
            const splitLines = doc.splitTextToSize(line, 180);
            splitLines.forEach((sLine: string) => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(sLine, 15, y);
                y += 6;
            });
            y += 4;
        });
        
        doc.save('Politica_Privacidade_Advus.pdf');
    };

    const policies = [
        {
            icon: Lock,
            title: 'Isolamento de Dados',
            desc: 'Utilizamos arquitetura Multi-tenant física e lógica de alto padrão, isolando os dados de cada escritório de maneira absoluta.'
        },
        {
            icon: Database,
            title: 'Armazenamento Seguro',
            desc: 'Dados hospedados em servidores de nuvem criptografados com redundância e monitoramento de tráfego 24 horas por dia.'
        },
        {
            icon: Eye,
            title: 'Transparência de Finalidade',
            desc: 'Sem venda ou mercantilização de dados. Suas informações são tratadas estritamente para a finalidade operacional do ecossistema.'
        },
        {
            icon: ShieldCheck,
            title: 'Conformidade Rigorosa',
            desc: 'Aderência integral à LGPD com suporte ativo ao exercício de todos os direitos dos titulares.'
        }
    ];

    return (
        <InstitutionalLayout 
            title="Política de Privacidade" 
            subtitle="Transparência jurídica, soberania de dados e diretrizes éticas na gestão do seu escritório."
        >
            <div className="space-y-16 max-w-5xl mx-auto">
                {/* Intro Section */}
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <div className="lg:w-1/2 space-y-6">
                        <h2 className="text-3xl font-black uppercase tracking-tight text-[#B89B5E]">Segurança por Princípio</h2>
                        <p className="text-white/60 leading-relaxed font-medium">
                            A presente Política de Privacidade regula o tratamento de dados pessoais realizado pela Advus na prestação de seus serviços de gestão de processos, contratos e inteligência jurídica.
                        </p>
                        <p className="text-white/40 leading-relaxed font-medium">
                            A privacidade está enraizada em nossa cultura de desenvolvimento. Nossos sistemas são atualizados continuamente sob auditoria técnica independente, garantindo proteção contra ameaças modernas.
                        </p>
                    </div>
                    <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                        {policies.map((p, idx) => (
                            <div key={idx} className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-[#B89B5E]/30 transition-all">
                                <p.icon size={24} className="text-[#B89B5E] mb-4" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">{p.title}</h4>
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="border-white/5" />

                {/* Detailed Text */}
                <div className="prose prose-invert max-w-none space-y-12">
                    <section>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-6">1. Coleta e Abrangência dos Dados</h3>
                        <p className="text-white/50 leading-relaxed font-medium mb-4">
                            Para operar nossa plataforma e garantir a entrega de recursos como briefing de processos, CRM de entrada, controle de prazos e relatórios de inteligência artificial, a Advus coleta os seguintes tipos de informações:
                        </p>
                        <div className="space-y-4">
                            <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                                <h5 className="font-bold text-white text-xs uppercase mb-2">Dados de Cadastro do Usuário:</h5>
                                <p className="text-white/40 text-xs leading-relaxed">Nome completo, e-mail institucional, cargo, senha criptografada (hash unidirecional bcrypt) e telefone para autenticação em dois fatores.</p>
                            </div>
                            <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                                <h5 className="font-bold text-white text-xs uppercase mb-2">Dados de Negócio (Tratamento sob Custódia):</h5>
                                <p className="text-white/40 text-xs leading-relaxed">Petições, contratos, informações processuais, dados de clientes do escritório e relatórios estratégicos inseridos pelo Controlador no sistema. Esses dados pertencem única e exclusivamente ao cliente.</p>
                            </div>
                            <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                                <h5 className="font-bold text-white text-xs uppercase mb-2">Dados Técnicos de Navegação:</h5>
                                <p className="text-white/40 text-xs leading-relaxed">Endereço IP, tipo de navegador, registros de auditoria de login (logs de acesso) e logs de execução de tarefas críticas, visando auditoria e prevenção a fraudes de segurança.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-6">2. Destinação e Finalidade do Tratamento</h3>
                        <p className="text-white/50 leading-relaxed font-medium">
                            Os dados sob nosso tratamento são destinados exclusivamente às seguintes finalidades:
                        </p>
                        <ul className="list-disc list-inside space-y-3 text-white/40 font-medium ml-4 mt-4">
                            <li>Prover o ecossistema integrado de gestão jurídica e automação operacional;</li>
                            <li>Realizar a conferência automática e atualização de prazos judiciais;</li>
                            <li>Permitir o uso privado de inteligência artificial na análise contextual e resumo de contratos;</li>
                            <li>Envio de notificações cruciais do sistema, faturamento e suporte técnico contratual;</li>
                            <li>Cumprimento de obrigações legais, regulatórias ou ordens judiciais emitidas por autoridades brasileiras.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-6">3. Transferência e Compartilhamento de Dados</h3>
                        <p className="text-white/50 leading-relaxed font-medium">
                            A Advus <strong>não realiza a venda ou cessão de dados pessoais</strong> sob qualquer circunstância. O compartilhamento ocorre exclusivamente com parceiros de infraestrutura homologados (provedores de hospedagem em nuvem e APIs de inteligência artificial corporativa) sob rígidos contratos de sigilo e não-retenção.
                        </p>
                    </section>

                    <div className="p-10 bg-[#B89B5E]/5 rounded-[2.5rem] border border-[#B89B5E]/20 flex flex-col lg:flex-row items-center gap-10">
                        <div className="w-20 h-20 bg-[#B89B5E]/10 rounded-3xl flex items-center justify-center shrink-0 border border-[#B89B5E]/20">
                            <Shield size={40} className="text-[#B89B5E]" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <h3 className="text-xl font-black uppercase tracking-tight text-white">Canal Direto do DPO (Encarregado)</h3>
                            <p className="text-white/40 text-xs leading-relaxed">
                                Nomeamos um Encarregado pelo Tratamento de Dados Pessoais de acordo com a LGPD. Para esclarecer dúvidas técnicas sobre privacidade, exercer direitos ou solicitar relatórios de auditoria, entre em contato diretamente pelo e-mail formal de conformidade.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                            <button 
                                onClick={handleDownloadPDF}
                                className="px-6 py-4 bg-white/5 hover:bg-white hover:text-primary-dark border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Baixar PDF Completo
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 text-center">
                    <p className="text-white/30 text-xs font-medium italic">
                        Última revisão em vigor: 23 de Maio de 2026. Encarregado pelo tratamento de dados (DPO): <span className="text-[#B89B5E]">dpo@advus.app</span>
                    </p>
                </div>
            </div>
        </InstitutionalLayout>
    );
}
