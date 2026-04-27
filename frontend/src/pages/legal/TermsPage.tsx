import React from 'react';
import { motion } from 'framer-motion';
import { Download, Scale, AlertCircle, Shield, FileText, ChevronRight } from 'lucide-react';
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout';

export default function TermsPage() {
    const handleDownloadPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text('Termos de Uso - Advus', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        const content = `1. Aceitação: Ao usar a Advus, você concorda com estes termos.\n2. Serviços: Plataforma de gestão jurídica multi-tenant.\n3. Segurança: Você é responsável por suas credenciais.\n4. Propriedade: Todo software Advus é protegido por leis de PI.\n5. Responsabilidade: A Advus não responde por perdas indiretas.`;
        doc.text(doc.splitTextToSize(content, 170), 20, 40);
        doc.save('Termos_Advus.pdf');
    };

    const sections = [
        {
            id: '01',
            title: 'Aceitação dos Termos',
            content: 'Ao acessar e usar a plataforma Advus, você concorda em cumprir e estar vinculado a estes Termos de Uso. Estes termos regem o relacionamento entre você (usuário) e a Advus. Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.'
        },
        {
            id: '02',
            title: 'Descrição do Serviço',
            content: 'A Advus fornece uma plataforma de gestão baseada em nuvem para advogados e escritórios de advocacia. Nossos serviços incluem gestão de processos, controle de prazos, armazenamento de documentos e ferramentas de inteligência jurídica.'
        },
        {
            id: '03',
            title: 'Cadastro e Segurança',
            content: 'Para acessar certas funcionalidades, você deve criar uma conta corporativa. Você é o único responsável por manter a segurança de suas credenciais e por todas as atividades que ocorrem sob sua conta.'
        },
        {
            id: '04',
            title: 'Propriedade Intelectual',
            content: 'Todo o software, design, logotipos e tecnologias utilizadas na Advus são protegidos por leis de direitos autorais. Você recebe uma licença de uso limitada e não exclusiva durante a vigência de seu plano.'
        },
        {
            id: '05',
            title: 'Limitação de Responsabilidade',
            content: 'A Advus empenha-se em manter o sistema estável, porém não garante que a plataforma estará livre de erros. Não nos responsabilizamos por perdas decorrentes de falhas técnicas ou decisões baseadas em dados do sistema.'
        }
    ];

    return (
        <InstitutionalLayout 
            title="Termos de Uso" 
            subtitle="As diretrizes que regem sua experiência na plataforma mais sofisticada do mercado jurídico."
        >
            <div className="flex flex-col md:flex-row gap-16">
                {/* Navigation (Sticky) */}
                <aside className="md:w-64 space-y-4 shrink-0 self-start sticky top-32">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-6">Navegação</p>
                        <nav className="space-y-4">
                            {sections.map(s => (
                                <a key={s.id} href={`#section-${s.id}`} className="block text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-wider">
                                    {s.id}. {s.title}
                                </a>
                            ))}
                        </nav>
                    </div>
                    <button 
                        onClick={handleDownloadPDF}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-accent hover:text-primary-dark border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        <Download size={16} /> Baixar PDF
                    </button>
                </aside>

                {/* Main Content */}
                <div className="flex-1 space-y-16">
                    {sections.map(section => (
                        <section key={section.id} id={`#section-${section.id}`} className="scroll-mt-32 group">
                            <div className="flex items-start gap-6">
                                <span className="text-4xl font-black text-white/10 group-hover:text-accent/20 transition-colors font-display leading-none">
                                    {section.id}
                                </span>
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-accent transition-colors">
                                        {section.title}
                                    </h2>
                                    <p className="text-white/50 leading-relaxed font-medium">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </section>
                    ))}

                    <div className="p-8 bg-accent/5 rounded-[2rem] border border-accent/10 flex gap-6 items-center">
                        <AlertCircle className="text-accent shrink-0" size={32} />
                        <div>
                            <h3 className="font-black text-white text-sm uppercase tracking-widest mb-2">Nota Importante</h3>
                            <p className="text-white/40 text-xs leading-relaxed font-medium">
                                Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso continuado da plataforma após tais alterações constitui sua aceitação dos novos termos.
                            </p>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-white/5 text-center">
                        <p className="text-white/30 text-xs font-medium italic">
                            Última atualização: 27 de Abril de 2026. Em caso de dúvidas, contate <span className="text-accent">juridico@advus.com.br</span>
                        </p>
                    </div>
                </div>
            </div>
        </InstitutionalLayout>
    );
}
