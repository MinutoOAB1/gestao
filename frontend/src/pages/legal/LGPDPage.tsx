import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, Lock, UserCheck, FileSearch, HelpCircle, Scale, Eye, Cpu, Database } from 'lucide-react';
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout';

export default function LGPDPage() {
    useEffect(() => {
        document.title = 'Conformidade LGPD | Advus - Segurança e Proteção de Dados';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'Conformidade LGPD da plataforma Advus. Privacy by Design, criptografia AES-256, isolamento multi-tenant e proteção de dados pessoais para escritórios de advocacia.');
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', 'https://advus.app/lgpd');
    }, []);
    return (
        <InstitutionalLayout 
            title="Conformidade LGPD & Segurança Jurídica" 
            subtitle="Segurança digital, proteção de dados e privacidade sob a égide da Lei nº 13.709/2018."
        >
            <div className="space-y-16 max-w-5xl mx-auto">
                {/* Intro */}
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <div className="lg:w-1/3">
                        <div className="w-full aspect-square bg-[#B89B5E]/10 rounded-[2.5rem] border border-[#B89B5E]/20 flex items-center justify-center relative overflow-hidden">
                            <Shield size={120} className="text-[#B89B5E] opacity-20 absolute animate-pulse" />
                            <Lock size={64} className="text-[#B89B5E] z-10" />
                        </div>
                    </div>
                    <div className="lg:w-2/3 space-y-6">
                        <h2 className="text-3xl font-black uppercase tracking-tight text-[#B89B5E]">Privacidade por Concepção (Privacy by Design)</h2>
                        <p className="text-white/80 text-lg leading-relaxed font-medium">
                            A plataforma Advus foi concebida sob as melhores práticas internacionais de segurança da informação e as diretrizes estritas da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                        </p>
                        <p className="text-white/50 leading-relaxed font-medium">
                            Como provedores de um ecossistema de alta performance para a gestão de processos, contratos e inteligência analítica para escritórios de advocacia, garantimos a integridade, confidencialidade e disponibilidade dos dados pessoais sob nosso tratamento.
                        </p>
                    </div>
                </div>

                <hr className="border-white/5" />

                {/* Role Demarcation Section (Extremely Robust Legal Grounding) */}
                <div className="p-8 bg-white/[0.02] rounded-[2rem] border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                        <Scale className="text-[#B89B5E]" size={24} />
                        <h3 className="text-xl font-black uppercase tracking-tight text-white">Relação Jurídica: Controlador vs. Operador</h3>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Nos termos do Artigo 5º da LGPD, a definição de papéis é fundamental para estabelecer as responsabilidades civis e técnicas. Na operação do ecossistema Advus:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <h4 className="font-bold text-[#B89B5E] text-xs uppercase tracking-wider mb-2">1. O Escritório de Advocacia (Controlador)</h4>
                            <p className="text-white/40 text-xs leading-relaxed">
                                Compete ao escritório de advocacia (cliente contratante) a tomada de decisões referentes ao tratamento de dados pessoais de seus clientes, colaboradores e terceiros. O Controlador é o legítimo detentor da base jurídica de tratamento (como o consentimento, cumprimento de obrigação legal ou legítimo interesse).
                            </p>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <h4 className="font-bold text-[#B89B5E] text-xs uppercase tracking-wider mb-2">2. A Advus (Operadora)</h4>
                            <p className="text-white/40 text-xs leading-relaxed">
                                A Advus atua estritamente como <strong>Operadora</strong>, realizando o tratamento dos dados em nome e sob as instruções do Controlador. Não tomamos decisões autônomas sobre os dados dos processos, limitando-nos a fornecer a infraestrutura tecnológica para a execução das atividades contratuais.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pillars Grid */}
                <div className="space-y-8">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-6">Nossos Pilares de Segurança Técnica</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { 
                                icon: UserCheck, 
                                title: 'Gestão de Direitos dos Titulares', 
                                desc: 'Facilitamos o atendimento célere aos direitos previstos no Art. 18 da LGPD. O painel administrativo permite exportar relatórios completos de dados, realizar correções imediatas e executar a exclusão definitiva ou anonimização de registros de forma simplificada.' 
                            },
                            { 
                                icon: FileSearch, 
                                title: 'Tratamento Finalístico e Adequação', 
                                desc: 'Toda coleta e processamento de informações cadastrais e de processos atende estritamente à finalidade contratual acordada. Impedimos cruzamento de bases ou compartilhamento de dados sem autorização expressa.' 
                            },
                            { 
                                icon: Shield, 
                                title: 'Segurança e Confidencialidade', 
                                desc: 'Uso de criptografia de ponta a ponta (AES-256 para dados armazenados e TLS 1.3 em trânsito). O sistema dispõe de controle de acesso baseado em papéis (RBAC) e auditoria granular de todas as ações de leitura ou gravação efetuadas na base.' 
                            },
                            { 
                                icon: Cpu, 
                                title: 'Tratamento de Dados por Inteligência Artificial', 
                                desc: 'Nossas ferramentas de IA processam documentos e geram relatórios sob rigorosos critérios de privacidade. Nenhum dado de processo inserido em seu tenant é compartilhado ou utilizado para o retreinamento de modelos de linguagem globais.' 
                            }
                        ].map((p, idx) => (
                            <div key={idx} className="p-8 bg-white/[0.02] rounded-3xl border border-white/5 flex gap-6 items-start group hover:bg-white/[0.04] transition-all">
                                <p.icon size={28} className="text-[#B89B5E] shrink-0 group-hover:scale-110 transition-transform" />
                                <div>
                                    <h3 className="text-sm font-black uppercase mb-3 text-white tracking-wider">{p.title}</h3>
                                    <p className="text-white/40 text-xs leading-relaxed">{p.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* IA Security Detail */}
                <div className="p-8 bg-gradient-to-br from-[#0F172A] to-[#090E17] rounded-[2rem] border border-white/10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-16 h-16 bg-[#B89B5E]/10 rounded-2xl flex items-center justify-center shrink-0 border border-[#B89B5E]/20">
                        <Database size={32} className="text-[#B89B5E]" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <h4 className="text-base font-black uppercase tracking-tight text-white">Retenção de Arquivos e Backups</h4>
                        <p className="text-white/40 text-xs leading-relaxed">
                            Mantemos rotinas rigorosas de backup redundante geograficamente distribuído em servidores AWS na região América do Sul. Os backups são criptografados e destruídos de forma segura após o término do período legal de guarda, assegurando conformidade com o <i>direito ao esquecimento</i> e políticas corporativas de governança de dados.
                        </p>
                    </div>
                </div>

                {/* FAQ Style Section */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">Perguntas Frequentes sobre a LGPD na Advus</h2>
                    <div className="grid grid-cols-1 gap-6">
                        {[
                            { 
                                q: 'Como a Advus garante o isolamento lógico das informações dos escritórios?', 
                                a: 'Operamos um modelo multi-tenant rigoroso no nível do banco de dados. Cada requisição é acompanhada por tokens criptográficos validados em tempo de execução, garantindo que o tenant atual acesse única e exclusivamente os seus registros. Não há qualquer hipótese de cruzamento acidental de consultas.' 
                            },
                            { 
                                q: 'Os dados processados pelas ferramentas de IA da Advus saem do Brasil?', 
                                a: 'Nossos clusters de processamento analítico residem em servidores homologados. Toda interação de IA é submetida a gateways privados de criptografia que limpam os metadados de identificação. Nossos provedores de modelos de linguagem (como OpenAI e Azure OpenAI) operam sob acordos de não-retenção (Zero Data Retention) e conformidade LGPD/GDPR.' 
                            },
                            { 
                                q: 'O que a Advus faz em caso de suspeita de incidentes de segurança?', 
                                a: 'Possuímos um plano integrado de resposta a incidentes sob supervisão direta do nosso Comitê de Segurança da Informação. Em caso de eventos que representem risco relevante aos direitos dos titulares, notificaremos o Controlador contratante em até 48 horas úteis, fornecendo subsídios técnicos robustos para a notificação à Autoridade Nacional de Proteção de Dados (ANPD).' 
                            }
                        ].map((faq, idx) => (
                            <div key={idx} className="p-8 bg-white/[0.02] rounded-[1.5rem] border border-white/5">
                                <h4 className="flex items-center gap-3 text-white font-bold mb-4 uppercase tracking-wider text-xs">
                                    <HelpCircle size={16} className="text-[#B89B5E]" /> {faq.q}
                                </h4>
                                <p className="text-white/40 text-xs leading-relaxed ml-7">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 text-center">
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">
                        Advus Compliance, Security & Data Protection Office • Versão 2.1 (2026)
                    </p>
                </div>
            </div>
        </InstitutionalLayout>
    );
}
