import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Download, ChevronLeft, Lock, Eye, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo';

export default function PrivacyPage() {
    const navigate = useNavigate();

    const handleDownloadPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.text('Política de Privacidade - Advus', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text('Última atualização: 23 de Abril de 2024', 105, 30, { align: 'center' });
        
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(
            `1. Introdução\nA Advus valoriza sua privacidade e está comprometida em proteger seus dados pessoais em conformidade com a LGPD.\n\n` +
            `2. Dados que Coletamos\nColetamos informações que você fornece ao criar uma conta (nome, e-mail, CNPJ) e dados de uso da plataforma para melhorar nossos serviços.\n\n` +
            `3. Como Usamos seus Dados\nSeus dados são usados para fornecer e manter os serviços da Advus, processar pagamentos, enviar comunicações importantes e garantir a segurança da plataforma.\n\n` +
            `4. Compartilhamento de Dados\nNão vendemos seus dados a terceiros. Podemos compartilhar informações com parceiros que prestam serviços essenciais (como processadores de pagamento), sempre sob estrita confidencialidade.\n\n` +
            `5. Segurança\nImplementamos medidas técnicas e organizacionais avançadas para proteger seus dados contra acesso não autorizado, perda ou alteração.\n\n` +
            `6. Seus Direitos\nVocê tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento, conforme garantido pela LGPD.\n\n` +
            `7. Cookies\nUsamos cookies para melhorar sua experiência de navegação e entender como você usa nossa plataforma.`,
            170
        );
        doc.text(splitText, 20, 45);
        
        doc.save('Politica_de_Privacidade_Advus.pdf');
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
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/10"
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
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Política de Privacidade</h1>
                            <p className="text-sm text-slate-500">Última atualização: 23 de Abril de 2024</p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-700 rounded text-xs">1</span>
                                Introdução
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                A Advus está comprometida com a proteção da sua privacidade e de seus dados pessoais. 
                                Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações 
                                em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-700 rounded text-xs">2</span>
                                Dados que Coletamos
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-sm">
                                        <Lock size={16} /> Informações de Cadastro
                                    </div>
                                    <p className="text-xs text-slate-500">Nome completo, e-mail corporativo, CPF/CNPJ e dados de faturamento.</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-sm">
                                        <Eye size={16} /> Dados de Utilização
                                    </div>
                                    <p className="text-xs text-slate-500">Endereço IP, tipo de navegador, tempo de uso e funcionalidades acessadas.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-700 rounded text-xs">3</span>
                                Finalidade do Tratamento
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                Utilizamos seus dados para:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 mt-2 ml-4">
                                <li>Fornecer e operar os serviços de gestão jurídica;</li>
                                <li>Garantir a segurança e integridade do seu isolamento de dados (Multi-tenancy);</li>
                                <li>Processar pagamentos e assinaturas;</li>
                                <li>Enviar atualizações críticas do sistema e lembretes de prazos;</li>
                                <li>Melhorar continuamente a experiência do usuário através de análises anônimas.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-700 rounded text-xs">4</span>
                                Armazenamento e Segurança
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                Seus dados são armazenados em servidores de alta segurança com criptografia de ponta a ponta. 
                                Adotamos isolamento lógico rigoroso entre diferentes escritórios (Tenants) para garantir que ninguém 
                                consiga acessar dados que não pertençam ao seu próprio escopo autorizado.
                            </p>
                        </section>

                        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4">
                            <Database className="text-emerald-600 shrink-0" size={24} />
                            <div>
                                <h3 className="font-bold text-emerald-900 text-sm mb-1">Seus Direitos (LGPD)</h3>
                                <p className="text-emerald-800 text-xs leading-relaxed">
                                    Você tem o direito de solicitar a confirmação da existência de tratamento, o acesso, 
                                    a correção de dados incompletos, a portabilidade e a exclusão de seus dados pessoais 
                                    de nossa base a qualquer momento.
                                </p>
                            </div>
                        </div>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-700 rounded text-xs">5</span>
                                Compartilhamento com Terceiros
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                Não vendemos nem comercializamos seus dados pessoais. O compartilhamento ocorre apenas com provedores de 
                                infraestrutura essenciais (ex: AWS, Google Cloud, Supabase) e processadores de pagamento (Stripe), 
                                todos operando sob rígidos contratos de confidencialidade.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-slate-100">
                            <p className="text-slate-500 text-sm text-center">
                                Para exercer seus direitos de privacidade, entre em contato com nosso DPO através do e-mail: 
                                <a href="mailto:privacidade@Advus.com.br" className="text-emerald-600 font-medium ml-1">privacidade@Advus.com.br</a>
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
