import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, ChevronLeft, ShieldCheck, Scale, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo';

export default function TermsPage() {
    const navigate = useNavigate();

    const handleDownloadPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.text('Termos de Uso - LegalFlow', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text('Última atualização: 23 de Abril de 2024', 105, 30, { align: 'center' });
        
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(
            `1. Aceitação dos Termos\nAo acessar e usar a plataforma LegalFlow, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.\n\n` +
            `2. Descrição do Serviço\nA LegalFlow fornece uma plataforma de gestão para escritórios de advocacia, incluindo gestão de processos, clientes, documentos e automação de tarefas.\n\n` +
            `3. Cadastro e Segurança\nPara usar certas funcionalidades, você deve criar uma conta. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta.\n\n` +
            `4. Propriedade Intelectual\nTodo o conteúdo, design e software da plataforma são de propriedade exclusiva da LegalFlow ou de seus licenciadores.\n\n` +
            `5. Limitação de Responsabilidade\nA LegalFlow não será responsável por quaisquer danos indiretos, incidentais ou consequentes resultantes do uso ou da incapacidade de usar a plataforma.\n\n` +
            `6. Privacidade\nO uso da plataforma também é regido por nossa Política de Privacidade, que descreve como coletamos e usamos seus dados.\n\n` +
            `7. Alterações nos Termos\nReservamo-nos o direito de modificar estes termos a qualquer momento. O uso continuado da plataforma após tais alterações constitui sua aceitação dos novos termos.`,
            170
        );
        doc.text(splitText, 20, 45);
        
        doc.save('Termos_de_Uso_LegalFlow.pdf');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <BrandLogo variant="dark" />
                    </div>
                    <button 
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/10"
                    >
                        <Download size={16} />
                        Baixar PDF
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <Scale size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Termos de Uso</h1>
                            <p className="text-sm text-slate-500">Última atualização: 23 de Abril de 2024</p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-slate-100 rounded text-xs">1</span>
                                Aceitação dos Termos
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                Ao acessar e usar a plataforma LegalFlow, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                                Estes termos regem o relacionamento entre você (usuário) e a LegalFlow (prestadora do serviço). 
                                Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-slate-100 rounded text-xs">2</span>
                                Descrição do Serviço
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                A LegalFlow fornece uma plataforma de gestão baseada em nuvem para advogados e escritórios de advocacia. 
                                Nossos serviços incluem, mas não se limitam a: gestão de processos judiciais, controle de prazos, 
                                armazenamento de documentos, gestão financeira e ferramentas de inteligência jurídica.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-slate-100 rounded text-xs">3</span>
                                Cadastro e Segurança da Conta
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                Para acessar certas funcionalidades, você deve criar uma conta corporativa. Você declara que as informações 
                                fornecidas são verdadeiras e completas. Você é o único responsável por manter a segurança de suas credenciais 
                                e por todas as atividades que ocorrem sob sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-slate-100 rounded text-xs">4</span>
                                Uso Aceitável
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                Você concorda em não usar a plataforma para qualquer finalidade ilegal ou proibida por estes Termos. 
                                É proibido tentar violar a segurança da plataforma, acessar dados de outros usuários ou interferir no 
                                funcionamento normal do sistema.
                            </p>
                        </section>

                        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                            <AlertCircle className="text-blue-600 shrink-0" size={24} />
                            <div>
                                <h3 className="font-bold text-blue-900 text-sm mb-1">Nota Importante</h3>
                                <p className="text-blue-800 text-xs leading-relaxed">
                                    O descumprimento de qualquer uma destas regras poderá resultar na suspensão imediata de sua conta 
                                    e cancelamento dos serviços, sem prejuízo de eventuais medidas judiciais cabíveis.
                                </p>
                            </div>
                        </div>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-slate-100 rounded text-xs">5</span>
                                Propriedade Intelectual
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                Todo o software, design, logotipos, textos e tecnologias utilizadas na LegalFlow são protegidos por 
                                leis de direitos autorais e propriedade intelectual. Você recebe uma licença de uso limitada, não exclusiva 
                                e revogável para operar o sistema durante a vigência de seu plano.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-slate-100 rounded text-xs">6</span>
                                Limitação de Responsabilidade
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                A LegalFlow empenha-se em manter o sistema estável e seguro, porém não garante que a plataforma estará 
                                livre de erros ou interrupções. Não nos responsabilizamos por perdas financeiras decorrentes de falhas 
                                técnicas, perda de dados ou decisões tomadas com base em informações geradas pelo sistema.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-slate-100">
                            <p className="text-slate-500 text-sm text-center">
                                Se tiver dúvidas sobre estes termos, entre em contato através do e-mail: 
                                <a href="mailto:suporte@legalflow.com.br" className="text-blue-600 font-medium ml-1">suporte@legalflow.com.br</a>
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
