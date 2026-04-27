import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, User, Mail, ArrowLeft, CheckCircle2, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function SignaturePage() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    
    const [uploading, setUploading] = useState(false);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [signatureData, setSignatureData] = useState({
        title: '',
        signerName: '',
        signerEmail: ''
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSignatureFile(file);
            if (!signatureData.title) {
                setSignatureData(prev => ({ ...prev, title: file.name.split('.')[0] }));
            }
        }
    };

    const handleManualSignature = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signatureFile || !signatureData.signerEmail || !signatureData.title) {
            addToast('Preencha todos os campos e selecione um arquivo.', 'error');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', signatureFile);
        formData.append('title', signatureData.title);
        formData.append('signerName', signatureData.signerName);
        formData.append('signerEmail', signatureData.signerEmail);

        try {
            await api.post('/contracts/upload-signature', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            addToast('Documento enviado para assinatura!', 'success');
            navigate('/app/contratos');
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Erro ao processar assinatura.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen pb-20 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-1">
                    <button 
                        onClick={() => navigate('/app/contratos')}
                        className="flex items-center gap-2 text-app-text-muted hover:text-app-text-main transition-colors mb-4 group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold uppercase tracking-wider">Voltar para Contratos</span>
                    </button>
                    <h1 className="text-4xl font-black text-app-text-main tracking-tight flex items-center gap-4">
                        Nova Assinatura Digital
                        <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                            <span className="text-xs text-primary font-black uppercase tracking-widest">Premium</span>
                        </div>
                    </h1>
                    <p className="text-app-text-muted max-w-2xl font-medium leading-relaxed">
                        Envie documentos para assinatura digital de forma rápida e segura através da integração oficial com a Autentique.
                    </p>
                </div>
                
                <div className="hidden lg:flex items-center gap-4 p-4 bg-app-card/30 border border-app-stroke/50 rounded-2xl backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-app-text-main uppercase tracking-wider">Conformidade Legal</p>
                        <p className="text-[10px] text-app-text-muted font-bold">Assinaturas válidas juridicamente (ICP-Brasil)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Form & Upload */}
                <div className="lg:col-span-7 space-y-8">
                    <form onSubmit={handleManualSignature} className="space-y-8">
                        {/* 1. Upload Section */}
                        <div className="bg-app-card/40 border border-app-stroke/40 rounded-3xl p-1 overflow-hidden shadow-2xl">
                            <div className={clsx(
                                "relative border-2 border-dashed rounded-[1.4rem] p-12 transition-all duration-500 flex flex-col items-center justify-center gap-6 group overflow-hidden",
                                signatureFile 
                                    ? "border-emerald-500/50 bg-emerald-500/5" 
                                    : "border-app-stroke hover:border-primary/50 hover:bg-primary/5 shadow-inner"
                            )}>
                                {/* Animated background accent */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />

                                <AnimatePresence mode="wait">
                                    {signatureFile ? (
                                        <motion.div 
                                            key="file-selected"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex flex-col items-center gap-4 text-center z-20"
                                        >
                                            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                                                <CheckCircle2 size={40} className="drop-shadow-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xl font-black text-app-text-main line-clamp-1">{signatureFile.name}</p>
                                                <p className="text-sm text-app-text-muted font-bold uppercase tracking-widest">
                                                    {(signatureFile.size / 1024 / 1024).toFixed(2)} MB • Clique para trocar
                                                </p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="no-file"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex flex-col items-center gap-4 text-center z-20"
                                        >
                                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10 border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                                                <Upload size={40} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xl font-black text-app-text-main tracking-tight">Arraste o arquivo ou clique para selecionar</p>
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="px-2 py-0.5 bg-app-stroke/50 rounded text-[10px] font-black text-app-text-muted uppercase">PDF</span>
                                                    <span className="px-2 py-0.5 bg-app-stroke/50 rounded text-[10px] font-black text-app-text-muted uppercase">DOCX</span>
                                                    <span className="px-2 py-0.5 bg-app-stroke/50 rounded text-[10px] font-black text-app-text-muted uppercase">Máx 10MB</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* 2. Form Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Título do Documento</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-primary transition-colors">
                                        <FileText size={18} />
                                    </div>
                                    <input 
                                        type="text"
                                        value={signatureData.title}
                                        onChange={(e) => setSignatureData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Ex: Contrato de Honorários - João Silva"
                                        className="w-full bg-app-card/40 border border-app-stroke/60 rounded-2xl pl-12 pr-4 py-4 text-app-text-main focus:border-primary outline-none transition-all font-bold placeholder:text-app-text-muted/50 shadow-inner"
                                        disabled={uploading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Nome do Signatário</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-primary transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input 
                                        type="text"
                                        value={signatureData.signerName}
                                        onChange={(e) => setSignatureData(prev => ({ ...prev, signerName: e.target.value }))}
                                        placeholder="Nome completo do cliente"
                                        className="w-full bg-app-card/40 border border-app-stroke/60 rounded-2xl pl-12 pr-4 py-4 text-app-text-main focus:border-primary outline-none transition-all font-bold placeholder:text-app-text-muted/50 shadow-inner"
                                        disabled={uploading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">E-mail do Signatário</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-primary transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input 
                                        type="email"
                                        value={signatureData.signerEmail}
                                        onChange={(e) => setSignatureData(prev => ({ ...prev, signerEmail: e.target.value }))}
                                        placeholder="cliente@email.com"
                                        className="w-full bg-app-card/40 border border-app-stroke/60 rounded-2xl pl-12 pr-4 py-4 text-app-text-main focus:border-primary outline-none transition-all font-bold placeholder:text-app-text-muted/50 shadow-inner"
                                        disabled={uploading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Actions */}
                        <div className="flex items-center gap-4 pt-4">
                            <button 
                                type="button"
                                onClick={() => navigate('/app/contratos')}
                                className="px-8 py-4 rounded-2xl text-sm font-black text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/30 transition-all uppercase tracking-widest"
                                disabled={uploading}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                disabled={uploading || !signatureFile}
                                className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-4 text-sm font-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase tracking-[0.2em] group relative overflow-hidden"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                                        Iniciar Assinatura Digital
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Column: Instructions / Benefits */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-app-card/40 border border-app-stroke/40 rounded-3xl p-8 backdrop-blur-md">
                        <h3 className="text-xl font-black text-app-text-main mb-6 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            Como funciona?
                        </h3>
                        
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-app-stroke/50 flex items-center justify-center text-xs font-black text-app-text-main flex-shrink-0">1</div>
                                <div>
                                    <p className="font-bold text-app-text-main text-sm">Upload do Documento</p>
                                    <p className="text-xs text-app-text-muted mt-1 leading-relaxed">O arquivo é enviado de forma criptografada para nossos servidores e depois para a Autentique.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-app-stroke/50 flex items-center justify-center text-xs font-black text-app-text-main flex-shrink-0">2</div>
                                <div>
                                    <p className="font-bold text-app-text-main text-sm">Notificação do Cliente</p>
                                    <p className="text-xs text-app-text-muted mt-1 leading-relaxed">Seu cliente receberá um e-mail com um link único e seguro para realizar a assinatura.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-app-stroke/50 flex items-center justify-center text-xs font-black text-app-text-main flex-shrink-0">3</div>
                                <div>
                                    <p className="font-bold text-app-text-main text-sm">Rastreamento em Tempo Real</p>
                                    <p className="text-xs text-app-text-muted mt-1 leading-relaxed">Você será notificado assim que o documento for assinado e o status será atualizado automaticamente.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 p-6 bg-primary/5 border border-primary/10 rounded-2xl border-dashed">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Dica de Especialista</p>
                            <p className="text-xs text-app-text-muted leading-relaxed">
                                Certifique-se de que o nome do signatário está correto conforme o documento de identidade para facilitar a verificação pela Autentique.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 border border-app-stroke/30 rounded-3xl flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-app-text-main uppercase tracking-wider">Limite de Assinaturas</p>
                            <p className="text-[10px] text-app-text-muted font-bold mt-1">Seu plano permite até 10 envios/mês</p>
                        </div>
                        <div className="w-16 h-16 relative">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-app-stroke" />
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175.9} strokeDashoffset={175.9 * (1 - 0.1)} className="text-primary transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-black text-app-text-main">10%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
