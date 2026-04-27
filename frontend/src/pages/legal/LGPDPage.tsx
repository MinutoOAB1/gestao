import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, Lock, UserCheck, FileSearch, HelpCircle } from 'lucide-react';
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout';

export default function LGPDPage() {
    return (
        <InstitutionalLayout 
            title="Conformidade LGPD" 
            subtitle="Segurança jurídica e proteção de dados de acordo com a Lei 13.709/2018."
        >
            <div className="space-y-16">
                {/* Intro */}
                <div className="flex flex-col md:flex-row gap-12 items-center">
                    <div className="md:w-1/3">
                        <div className="w-full aspect-square bg-accent/10 rounded-[2.5rem] border border-accent/20 flex items-center justify-center relative overflow-hidden">
                            <Shield size={120} className="text-accent opacity-20 absolute" />
                            <Lock size={64} className="text-accent z-10" />
                        </div>
                    </div>
                    <div className="md:w-2/3 space-y-6">
                        <h2 className="text-3xl font-black uppercase tracking-tight text-accent">Compromisso com a Lei</h2>
                        <p className="text-white/60 text-lg leading-relaxed font-medium">
                            A Advus nasceu em plena era da proteção de dados. Diferente de sistemas legados que tentam se adaptar, nossa arquitetura foi concebida sob os preceitos da LGPD desde o primeiro dia.
                        </p>
                        <p className="text-white/40 leading-relaxed font-medium">
                            Garantimos que cada bit de informação processado em nossa plataforma siga as diretrizes de segurança, finalidade e necessidade exigidas pela legislação brasileira.
                        </p>
                    </div>
                </div>

                <hr className="border-white/5" />

                {/* Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        { icon: UserCheck, title: 'Direitos do Titular', desc: 'Ferramentas integradas para que o titular dos dados possa exercer seus direitos de acesso e exclusão.' },
                        { icon: FileSearch, title: 'Transparência de Uso', desc: 'Registros claros sobre qual dado está sendo tratado e para qual finalidade específica.' },
                        { icon: Shield, title: 'Minimização de Dados', desc: 'Coletamos apenas o estritamente necessário para a operação do seu escritório.' },
                        { icon: CheckCircle2, title: 'Segurança por Padrão', desc: 'Protocolos de criptografia e auditoria contínua em todos os níveis do sistema.' }
                    ].map((p, idx) => (
                        <div key={idx} className="p-8 bg-white/[0.03] rounded-3xl border border-white/5 flex gap-6 items-start group hover:bg-white/[0.05] transition-all">
                            <p.icon size={28} className="text-accent shrink-0 group-hover:scale-110 transition-transform" />
                            <div>
                                <h3 className="text-lg font-black uppercase mb-3 text-white">{p.title}</h3>
                                <p className="text-white/40 text-sm leading-relaxed">{p.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FAQ Style Section */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-10">Perguntas Frequentes</h2>
                    <div className="grid grid-cols-1 gap-6">
                        {[
                            { q: 'Onde os dados são armazenados?', a: 'Utilizamos servidores globais com redundância no Brasil e EUA, operando sob as mais rígidas certificações de segurança (SOC2, ISO 27001).' },
                            { q: 'Quem tem acesso aos dados do escritório?', a: 'O acesso é estritamente limitado ao seu tenant. Nem mesmo a equipe da Advus possui acesso aos dados de seus processos, a menos que autorizado para suporte técnico.' },
                            { q: 'Como a Advus protege contra vazamentos?', a: 'Implementamos Web Application Firewalls (WAF), monitoramento 24/7 e isolamento lógico absoluto entre as bases de dados de cada cliente.' }
                        ].map((faq, idx) => (
                            <div key={idx} className="p-8 bg-white/5 rounded-[1.5rem] border border-white/5">
                                <h4 className="flex items-center gap-3 text-white font-bold mb-4 uppercase tracking-wider text-xs">
                                    <HelpCircle size={16} className="text-accent" /> {faq.q}
                                </h4>
                                <p className="text-white/40 text-sm leading-relaxed ml-7">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 text-center">
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">
                        Advus Global Compliance Unit • 2026
                    </p>
                </div>
            </div>
        </InstitutionalLayout>
    );
}
