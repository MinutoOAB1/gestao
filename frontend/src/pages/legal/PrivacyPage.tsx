import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Download, Lock, Eye, Database, Shield } from 'lucide-react';
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout';

export default function PrivacyPage() {
    const handleDownloadPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text('Política de Privacidade - Advus', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        const content = `1. Compromisso: Proteção de dados em conformidade com a LGPD.\n2. Coleta: Dados cadastrais e de uso para melhoria do serviço.\n3. Finalidade: Operar a plataforma e garantir segurança Multi-tenant.\n4. Armazenamento: Servidores criptografados de alta segurança.\n5. Direitos: Acesso, correção e exclusão garantidos pela lei.`;
        doc.text(doc.splitTextToSize(content, 170), 20, 40);
        doc.save('Privacidade_Advus.pdf');
    };

    const policies = [
        {
            icon: Lock,
            title: 'Isolamento de Dados',
            desc: 'Utilizamos arquitetura Multi-tenant de nível bancário, garantindo que os dados de seu escritório sejam logicamente isolados de qualquer outro usuário.'
        },
        {
            icon: Database,
            title: 'Armazenamento Seguro',
            desc: 'Seus dados são armazenados em infraestrutura de nuvem certificada com redundância global e criptografia em repouso e em trânsito.'
        },
        {
            icon: Eye,
            title: 'Transparência Total',
            desc: 'Coletamos apenas as informações necessárias para a operação da plataforma e nunca vendemos seus dados a terceiros.'
        },
        {
            icon: ShieldCheck,
            title: 'Conformidade LGPD',
            desc: 'Estamos em conformidade integral com a Lei 13.709/2018, garantindo todos os direitos de privacidade aos nossos usuários.'
        }
    ];

    return (
        <InstitutionalLayout 
            title="Política de Privacidade" 
            subtitle="Sua soberania digital e a proteção dos seus dados são as nossas maiores prioridades."
        >
            <div className="space-y-16">
                {/* Intro Section */}
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <div className="lg:w-1/2 space-y-6">
                        <h2 className="text-3xl font-black uppercase tracking-tight text-accent">Privacidade por Design</h2>
                        <p className="text-white/60 leading-relaxed font-medium">
                            Na Advus, acreditamos que a privacidade não é um recurso, mas um direito fundamental. 
                            Nossa plataforma foi construída com o princípio de "Privacy by Design", garantindo que a segurança esteja enraizada em cada linha de código.
                        </p>
                    </div>
                    <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                        {policies.map((p, idx) => (
                            <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-accent/20 transition-all">
                                <p.icon size={24} className="text-accent mb-4" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">{p.title}</h4>
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="border-white/5" />

                {/* Detailed Text */}
                <div className="prose prose-invert max-w-none space-y-12">
                    <section>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-6">1. Coleta de Informações</h3>
                        <p className="text-white/50 leading-relaxed font-medium">
                            Coletamos informações de registro (nome, e-mail corporativo, CNPJ) e dados técnicos de uso para monitorar a saúde da plataforma e prevenir fraudes. 
                            Não coletamos dados sensíveis desnecessários para a prestação do serviço jurídico.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-6">2. Uso dos Dados</h3>
                        <p className="text-white/50 leading-relaxed font-medium">
                            Seus dados são utilizados exclusivamente para:
                        </p>
                        <ul className="list-disc list-inside space-y-4 text-white/40 font-medium ml-4">
                            <li>Processamento de informações judiciais e gestão de prazos;</li>
                            <li>Autenticação de usuários e controle de acesso;</li>
                            <li>Comunicações críticas sobre atualizações e faturamento;</li>
                            <li>Treinamento de nossos modelos de IA (apenas com dados anonimizados e autorizados).</li>
                        </ul>
                    </section>

                    <div className="p-10 bg-gradient-to-br from-primary-dark to-black rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row items-center gap-10">
                        <div className="w-20 h-20 bg-accent/20 rounded-3xl flex items-center justify-center shrink-0 border border-accent/20">
                            <Shield size={40} className="text-accent" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <h3 className="text-xl font-black uppercase tracking-tight">Direitos do Titular (LGPD)</h3>
                            <p className="text-white/40 text-sm leading-relaxed">Você tem o direito de solicitar a confirmação, o acesso, a correção e a exclusão de seus dados a qualquer momento. Nossa equipe jurídica processará qualquer solicitação em até 72 horas úteis.</p>
                        </div>
                        <button 
                            onClick={handleDownloadPDF}
                            className="px-8 py-4 bg-white/5 hover:bg-white hover:text-primary-dark border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shrink-0"
                        >
                            Baixar Política Completa
                        </button>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 text-center">
                    <p className="text-white/30 text-xs font-medium italic">
                        Última atualização: 27 de Abril de 2026. Dúvidas sobre privacidade: <span className="text-accent">dpo@advus.com.br</span>
                    </p>
                </div>
            </div>
        </InstitutionalLayout>
    );
}
