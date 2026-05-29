import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Scale, AlertCircle, Shield, FileText, ChevronRight } from 'lucide-react';
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout';

export default function TermsPage() {
    useEffect(() => {
        document.title = 'Termos de Uso | Advus - Gestão Jurídica';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'Termos de uso e licenciamento da plataforma Advus. Regras de licenciamento SaaS, garantias operacionais (SLA 99.9%), propriedade intelectual e disposições contratuais.');
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', 'https://advus.app/terms');
    }, []);
    const handleDownloadPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('TERMOS DE USO E LICENCIAMENTO - ADVUS', 15, 20);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const content = [
            '1. OBJETO CONTRATUAL: A Advus concede ao licenciado o direito de uso de software (SaaS) na modalidade de subscricao mensal, abrangendo ferramentas de gestao, CRM, Kanban e Inteligencia Artificial.',
            '',
            '2. SEGURANCA E ACESSO: O escritorio contratante e plenamente responsavel pela custodia de suas credenciais de acesso, bem como pelas acoes executadas por seus colaboradores designados no sistema.',
            '',
            '3. DISPONIBILIDADE E SLA: A Advus compromete-se com um indice de disponibilidade da plataforma (SLA) de 99.9% ao ano, excluindo-se janelas de manutencao agendadas comunicadas previamente com no minimo 24h de antecedencia.',
            '',
            '4. PROPRIEDADE INTELECTUAL: Toda e qualquer propriedade sobre o codigo-fonte, metodologias, algoritmos de IA e marcas registradas sao de titularidade exclusiva da Advus. E expressamente proibida qualquer engenharia reversa.',
            '',
            '5. RESCISAO E DEVOLUCAO DE DADOS: O cancelamento pode ser efetuado sem onus mediante aviso previo. Em caso de rescisao, os dados processuais estarao disponiveis para exportacao completa (formato JSON ou CSV) pelo prazo improrrogavel de 30 dias contados do cancelamento.'
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
        
        doc.save('Termos_Uso_Advus.pdf');
    };

    const sections = [
        {
            id: '01',
            title: 'Licenciamento de Software (SaaS)',
            content: 'A Advus outorga ao usuário licenciado uma licença de uso limitada, não exclusiva, temporária, revogável e intransferível de sua plataforma tecnológica de gestão jurídica. O licenciamento dar-se-á por meio de assinatura mensal ou anual ativa, cujo valor é reajustado anualmente conforme as disposições comerciais.'
        },
        {
            id: '02',
            title: 'Políticas de Uso Aceitável e Propriedade',
            content: 'Fica expressamente vedado ao licenciado realizar engenharia reversa, sublicenciamento, cópia não autorizada do design ou códigos da plataforma, ou qualquer uso que sobrecarregue a infraestrutura estável da Advus. Todos os direitos de propriedade intelectual relativos ao código-fonte, algoritmos analíticos e marcas são retidos pela Advus.'
        },
        {
            id: '03',
            title: 'Garantias, SLA e Níveis de Serviço',
            content: 'Buscamos a excelência operacional. A Advus empenha-se em manter um índice de disponibilidade da plataforma (SLA - Service Level Agreement) de 99,9% no regime 24/7/365. Estão excluídas do cálculo do SLA manutenções preventivas programadas realizadas em horários de baixa utilização (geralmente entre 00:00 e 05:00 UTC-3) e falhas decorrentes de instabilidades generalizadas da infraestrutura mundial de internet ou de parceiros de nuvem.'
        },
        {
            id: '04',
            title: 'Responsabilidade pelas Contas e Usuários',
            content: 'O administrador do escritório possui controle pleno sobre o provisionamento e desativação das credenciais de seus colaboradores. O escritório é solidariamente responsável por quaisquer infrações cometidas no âmbito de suas contas credenciadas, inclusive quanto ao vazamento voluntário ou involuntário de credenciais.'
        },
        {
            id: '05',
            title: 'Custódia de Dados e Rescisão Contratual',
            content: 'Caso ocorra o cancelamento voluntário do serviço, o usuário administrador terá o direito de baixar todos os dados cadastrados, incluindo informações de processos, tarefas e logs financeiros, diretamente através da plataforma, ou mediante suporte técnico. Os dados permanecerão guardados de forma segura pelo prazo regulatório de 30 dias contados da rescisão, sendo após isso eliminados definitivamente de todos os bancos de dados ativos e backups.'
        }
    ];

    return (
        <InstitutionalLayout 
            title="Termos de Uso" 
            subtitle="Regras de licenciamento, garantias operacionais (SLA) e disposições contratuais da plataforma jurídica."
        >
            <div className="flex flex-col lg:flex-row gap-16 max-w-5xl mx-auto">
                {/* Navigation (Sticky) */}
                <aside className="lg:w-64 space-y-4 shrink-0 self-start sticky top-32">
                    <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#B89B5E] mb-6">Navegação Contratual</p>
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
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-[#B89B5E] hover:text-primary-dark border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        <Download size={16} /> Baixar PDF Contratual
                    </button>
                </aside>

                {/* Main Content */}
                <div className="flex-1 space-y-16">
                    {sections.map(section => (
                        <section key={section.id} id={`section-${section.id}`} className="scroll-mt-32 group">
                            <div className="flex items-start gap-6">
                                <span className="text-4xl font-black text-white/10 group-hover:text-[#B89B5E]/30 transition-colors font-display leading-none">
                                    {section.id}
                                </span>
                                <div className="space-y-6">
                                    <h2 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-[#B89B5E] transition-colors">
                                        {section.title}
                                    </h2>
                                    <p className="text-white/50 text-sm leading-relaxed font-medium">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </section>
                    ))}

                    <div className="p-8 bg-[#B89B5E]/5 rounded-[2rem] border border-[#B89B5E]/10 flex gap-6 items-center">
                        <AlertCircle className="text-[#B89B5E] shrink-0" size={32} />
                        <div>
                            <h3 className="font-black text-white text-sm uppercase tracking-widest mb-2">Foro de Eleição</h3>
                            <p className="text-white/40 text-xs leading-relaxed font-medium">
                                Para dirimir eventuais controvérsias decorrentes destes Termos de Uso ou do licenciamento da plataforma, fica eleito o Foro da Comarca de São Paulo/SP, com expressa renúncia a qualquer outro, por mais privilegiado que seja.
                            </p>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-white/5 text-center">
                        <p className="text-white/30 text-xs font-medium italic">
                            Última atualização: 23 de Maio de 2026. Consultas jurídicas adicionais: <span className="text-[#B89B5E]">juridico@advus.app</span>
                        </p>
                    </div>
                </div>
            </div>
        </InstitutionalLayout>
    );
}
