import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, Users, Shield, Award, Zap, ArrowRight } from 'lucide-react';
import { InstitutionalLayout } from '../../components/layout/InstitutionalLayout';
import { BrandLogo } from '../../components/ui/BrandLogo';

export default function AboutPage() {
    const navigate = useNavigate();

    return (
        <InstitutionalLayout 
            title="A Nova Fronteira do Direito" 
            subtitle="Conheça a visão por trás da plataforma que está transformando a advocacia de elite no Brasil."
        >
            <div className="space-y-24">
                {/* Introduction */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black uppercase tracking-tight text-accent">Nossa História</h2>
                        <p className="text-white/60 text-lg leading-relaxed font-medium">
                            A Advus não é apenas um software de gestão. É o resultado de anos de observação da ineficiência tecnológica em grandes escritórios. 
                            Nascemos para entregar o que as ferramentas tradicionais não conseguem: **Performance Real**.
                        </p>
                        <p className="text-white/40 leading-relaxed font-medium">
                            Nossa equipe combina juristas experientes e engenheiros de software de elite para criar um ecossistema onde a tecnologia trabalha para o advogado, e não o contrário.
                        </p>
                    </div>
                    <div className="relative rounded-[2rem] overflow-hidden border border-white/10 aspect-video bg-white/5 flex items-center justify-center">
                        <BrandLogo variant="light" size="lg" className="opacity-20 scale-150" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                </div>

                {/* Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: Zap, title: 'Inovação Radical', desc: 'Não melhoramos o que existe, criamos o que é necessário para o amanhã.' },
                        { icon: Shield, title: 'Confiança Absoluta', desc: 'Sua propriedade intelectual é o nosso bem mais precioso.' },
                        { icon: Users, title: 'Foco no Usuário', desc: 'Design intuitivo que elimina a curva de aprendizado.' }
                    ].map((pill, idx) => (
                        <div key={idx} className="p-8 bg-white/[0.03] rounded-3xl border border-white/5">
                            <pill.icon size={32} className="text-accent mb-6" />
                            <h3 className="text-xl font-black uppercase mb-4">{pill.title}</h3>
                            <p className="text-white/40 text-sm leading-relaxed">{pill.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Mission Statement */}
                <div className="text-center max-w-3xl mx-auto py-12">
                    <Award size={48} className="text-accent mx-auto mb-8 animate-pulse" />
                    <h2 className="text-3xl font-black uppercase mb-6 tracking-tight">Compromisso com a Excelência</h2>
                    <p className="text-white/60 text-xl italic">
                        "Nossa missão é fornecer a inteligência necessária para que cada escritório parceiro se torne uma potência de alta performance e resultados inquestionáveis."
                    </p>
                </div>

                {/* Final CTA */}
                <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div className="text-left">
                        <h3 className="text-2xl font-black uppercase mb-2">Pronto para a evolução?</h3>
                        <p className="text-white/40 text-sm uppercase tracking-widest font-black">Junte-se a +500 escritórios de elite</p>
                    </div>
                    <button 
                        onClick={() => navigate('/register')}
                        className="flex items-center gap-3 px-10 py-5 bg-accent text-white font-black rounded-2xl hover:bg-white hover:text-primary-dark transition-all uppercase tracking-widest text-sm"
                    >
                        Criar Conta Premium
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </InstitutionalLayout>
    );
}
