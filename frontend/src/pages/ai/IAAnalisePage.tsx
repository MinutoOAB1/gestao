import React, { useState, useRef, useEffect } from 'react';
import {
    Shield,
    Plus,
    Download,
    Search,
    Play,
    CheckCircle2,
    AlertTriangle,
    Star,
    FileText,
    ArrowRight,
    Maximize2,
    RefreshCw,
    Send,
    Zap,
    History,
    X,
    Check,
    ChevronRight,
    Menu,
    Minimize2,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import api from '../../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    HeadingLevel, 
    AlignmentType 
} from 'docx';

// Types for the AI Analysis
interface AnalysisResult {
    executiveSummary: string;
    negotiationPower: {
        score: number;
        analysis: string;
    };
    overallScore: number;
    analysisGroups: {
        auditoria: Array<{
            title: string;
            originalText: string;
            risk: 'Alto' | 'Médio' | 'Nenhum';
            description: string;
            businessImpact: string;
            suggestedRedaction: string;
            clauseReference: string;
            status?: 'resolvido' | 'pendente';
        }>;
        compliance: Array<{
            item: string;
            status: 'Conforme' | 'Alerta' | 'Crítico';
            observation: string;
        }>;
        omissions: Array<{
            missingItem: string;
            impact: string;
            suggestion: string;
        }>;
    };
    healthChecklist: Array<{
        item: string;
        found: boolean;
    }>;
}

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export default function IAAnalisePage() {
    const [contractText, setContractText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [selectedClause, setSelectedClause] = useState<any | null>(null);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [activeTab, setActiveTab] = useState<'riscos' | 'compliance' | 'sugestoes'>('riscos');
    const [hoveredClause, setHoveredClause] = useState<string | null>(null);
    
    // New Feature States
    const [expertMode, setExpertMode] = useState('Geral');
    const [analysisStep, setAnalysisStep] = useState<'idle' | 'scanning' | 'auditing' | 'redacting' | 'done'>('idle');
    const [isSplitView, setIsSplitView] = useState(false);
    const [draftText, setDraftText] = useState('');

    // History/Version Control State
    const [analysisHistory, setAnalysisHistory] = useState<Array<{
        id: string;
        timestamp: Date;
        contractText: string;
        analysis: AnalysisResult;
        label: string;
    }>>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load history from API on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/ai/history');
                if (response.data) {
                    const mappedHistory = response.data.map((log: any) => ({
                        id: log.id,
                        timestamp: new Date(log.createdAt),
                        contractText: log.contractText,
                        analysis: JSON.parse(log.analysisResult),
                        label: log.contractName || 'Análise'
                    }));
                    setAnalysisHistory(mappedHistory);
                }
            } catch (error) {
                console.error('Failed to load history from API:', error);

                // Fallback to local storage
                const savedHistory = localStorage.getItem('ia-analysis-history');
                if (savedHistory) {
                    try {
                        const parsed = JSON.parse(savedHistory);
                        const historyWithDates = parsed.map((entry: any) => ({
                            ...entry,
                            timestamp: new Date(entry.timestamp)
                        }));
                        setAnalysisHistory(historyWithDates);
                    } catch (e) { }
                }
            }
        };

        fetchHistory();
    }, []);

    // Auto-adjust zoom for Split View
    useEffect(() => {
        if (isSplitView) {
            setZoomLevel(70); 
        } else {
            setZoomLevel(100);
        }
    }, [isSplitView]);

    // No need to save history to localStorage anymore as it's saved in DB on analyze


    const documentRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);


    // Load document from sidebar when clicked - poll for changes
    useEffect(() => {
        const checkForDocument = () => {
            const loadDocument = localStorage.getItem('ia-load-document');
            if (loadDocument) {
                try {
                    const doc = JSON.parse(loadDocument);
                    setContractText(doc.contractText);
                    setAnalysis(doc.analysis);
                    localStorage.removeItem('ia-load-document');
                } catch (e) {
                    console.error('Failed to load document:', e);
                }
            }
        };

        // Check immediately
        checkForDocument();

        // Also poll every 500ms in case we're already on the page
        const interval = setInterval(checkForDocument, 500);
        return () => clearInterval(interval);
    }, []);

    const [showFeedback, setShowFeedback] = useState(false);
    const [rating, setRating] = useState(0);

    const handleAnalyze = async () => {
        if (!contractText && !fileToUpload) return;
        setIsAnalyzing(true);
        setAnalysisStep('scanning');

        try {
            // Simulated visual progress for better UX
            setTimeout(() => setAnalysisStep('auditing'), 1500);
            setTimeout(() => setAnalysisStep('redacting'), 3000);

            let response;
            if (fileToUpload) {
                const formData = new FormData();
                formData.append('file', fileToUpload);
                formData.append('expertMode', expertMode);
                response = await api.post('/ai/analyze-file', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                response = await api.post('/ai/analyze', { contractText, expertMode });
            }

            const newAnalysis = response.data;
            setAnalysis(newAnalysis);
            setDraftText(contractText); // Initialize draft with original text
            setUploadOpen(false);
            setAnalysisStep('done');

            // Save to version history (for revert functionality)
            const historyEntry = {
                id: Date.now().toString(),
                timestamp: new Date(),
                contractText,
                analysis: newAnalysis,
                label: `Análise [${expertMode}] v${analysisHistory.length + 1}`
            };
            setAnalysisHistory(prev => [...prev, historyEntry]);

            // Save to document analyses (for sidebar display)
            const documentEntry = {
                id: Date.now().toString(),
                timestamp: new Date(),
                contractText,
                analysis: newAnalysis,
                score: newAnalysis.overallScore,
                label: fileToUpload?.name || `Documento ${new Date().toLocaleDateString('pt-BR')}`
            };
            const existingDocs = localStorage.getItem('ia-document-analyses');
            const docs = existingDocs ? JSON.parse(existingDocs) : [];
            docs.push(documentEntry);
            localStorage.setItem('ia-document-analyses', JSON.stringify(docs));
        } catch (error: any) {
            console.error('Falha na análise:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
            alert(`Erro na análise: ${errorMessage}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Revert to a previous version
    const revertToVersion = (historyEntry: typeof analysisHistory[0]) => {
        setContractText(historyEntry.contractText);
        setAnalysis(historyEntry.analysis);
        setShowHistory(false);
        setSelectedClause(null);
    };


    const applySuggestedRedaction = (clause: any) => {
        if (!analysis) return;

        // Save current version to history BEFORE making changes
        const versionEntry = {
            id: Date.now().toString(),
            timestamp: new Date(),
            contractText,
            analysis,
            label: `Versão ${analysisHistory.length + 1} - Antes de editar ${clause.clauseReference}`
        };
        setAnalysisHistory(prev => [...prev, versionEntry]);

        // Logic to replace text in the contract
        const newText = contractText.replace(clause.originalText, clause.suggestedRedaction);
        setContractText(newText);

        // Update clause status locally
        const updatedAuditoria = analysis.analysisGroups.auditoria.map(a =>
            a.clauseReference === clause.clauseReference ? { ...a, status: 'resolvido' as const } : a
        );

        setAnalysis({
            ...analysis,
            analysisGroups: {
                ...analysis.analysisGroups,
                auditoria: updatedAuditoria
            },
            overallScore: Math.min(100, (analysis.overallScore || 0) + 5)
        });

        setSelectedClause(null);
    };

    // Zoom controls
    const handleZoomIn = () => setZoomLevel(prev => Math.min(200, prev + 25));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(50, prev - 25));

    // Scroll to clause in document
    const scrollToClause = (clauseRef: string) => {
        const element = documentRef.current?.querySelector(`[data-clause="${clauseRef}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleExportReport = async () => {
        if (!analysis) return;

        try {
            // Load logo
            const logoImg = new Image();
            logoImg.src = '/Logo-advus.png';
            await new Promise((resolve, reject) => {
                logoImg.onload = resolve;
                logoImg.onerror = reject;
            });

            // Target the paper element for better capture
            const elementToCapture = documentRef.current?.firstChild as HTMLElement;
            if (!elementToCapture) return;

            const canvas = await html2canvas(elementToCapture, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();


            // Add Logo Header
            const logoH = 15;
            const logoRatio = logoImg.width / logoImg.height;
            const logoW = logoH * logoRatio;

            pdf.addImage(logoImg, 'PNG', 10, 10, logoW, logoH);

            // Add Title
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Relatório de Análise Jurídica', 10 + logoW + 5, 20);

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 10 + logoW + 5, 25);

            // Add Analysis Content
            // Calculate height to fit width
            const contentWidth = pdfWidth - 20;
            const contentHeight = (canvas.height * contentWidth) / canvas.width;

            // Add image below header
            pdf.addImage(imgData, 'PNG', 10, 35, contentWidth, contentHeight);

            // Save
            pdf.save(`Relatorio_Analise_${new Date().getTime()}.pdf`);

        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            alert('Erro ao gerar PDF do relatório.');
        }
    };

    const handleExportDocx = async () => {
        if (!analysis) return;
        try {
            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({ 
                            text: "Relatório de Análise Jurídica - Elite AI", 
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({ text: "" }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Resumo Executivo:", bold: true }),
                                new TextRun({ text: `\n${analysis.executiveSummary}`, break: 1 }),
                            ]
                        }),
                        new Paragraph({ text: "" }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Contrato Revisado (Rascunho):", bold: true }),
                                new TextRun({ text: `\n${draftText || contractText}`, break: 1 }),
                            ]
                        }),
                    ],
                }],
            });
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `Analise_Elite_${new Date().getTime()}.docx`);
        } catch (e) {
            console.error(e);
            alert('Erro ao exportar Word');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] w-full max-w-full overflow-hidden">
            {/* Header Section (Matching Image 0) */}
            <header className="flex-none mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                            {analysis ? 'Contrato Prestação de Serviços - v2.pdf' : 'IA Jurídica'}
                        </h1>
                        {analysis && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 text-[9px] font-black uppercase ring-1 ring-amber-500/30">
                                Em Revisão
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono">
                            {analysis ? 'Última análise gerada pela IA há 12 minutos' : 'Auditória Dinâmica e Auditoria Contratual de Elite.'}
                        </p>

                        {/* History Dropdown - Only show when analysis exists */}
                        {analysis && analysisHistory.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                                >
                                    <History size={14} />
                                    Histórico ({analysisHistory.length})
                                    <ChevronRight size={12} className={clsx("transition-transform", showHistory && "rotate-90")} />
                                </button>

                                <AnimatePresence>
                                    {showHistory && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                                        >
                                            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Histórico de Versões</h4>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                                {analysisHistory.map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 last:border-b-0 cursor-pointer group transition-colors"
                                                        onClick={() => revertToVersion(entry)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{entry.label}</p>
                                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                                    {entry.timestamp.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                                </p>
                                                                <p className="text-[9px] text-slate-400 mt-1 truncate max-w-[180px]">
                                                                    Score: {entry.analysis.overallScore}%
                                                                </p>
                                                            </div>
                                                            <button className="px-2 py-1 text-[9px] font-bold uppercase bg-primary/10 text-primary rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white">
                                                                Reverter
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Visible Revert Button when analysis is present */}
                        {analysis && analysisHistory.length > 1 && (
                            <button
                                onClick={() => revertToVersion(analysisHistory[analysisHistory.length - 2])}
                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
                            >
                                <RefreshCw size={12} />
                                Reverter Última Versão
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFeedback(true)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-white transition-colors"
                        title="Avaliar IA"
                    >
                        <Star size={16} />
                    </button>
                    <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-800 transition-all cursor-pointer">
                        <input
                            type="file"
                            accept=".txt,.pdf"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setFileToUpload(file);
                                    if (file.type === 'text/plain') {
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            setContractText(e.target?.result as string);
                                            setUploadOpen(true);
                                        };
                                        reader.readAsText(file);
                                    } else if (file.type === 'application/pdf') {
                                        setContractText(`[Arquivo PDF selecionado: ${file.name}]\nO conteúdo será extraído durante a análise.`);
                                        setUploadOpen(true);
                                    }
                                }
                            }}
                        />
                        <Plus size={16} /> Novo Upload
                    </label>
                    <button
                        onClick={handleExportDocx}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                        <FileText size={16} /> Word (.docx)
                    </button>
                    <button
                        onClick={handleExportReport}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Download size={16} /> PDF
                    </button>
                </div>
            </header>

            {!analysis && !isAnalyzing && !uploadOpen ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-[32px] p-12 text-center relative overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="relative z-10 space-y-8 max-w-2xl">
                        <div className="w-24 h-24 bg-primary/20 rounded-[32px] flex items-center justify-center text-primary mb-8 mx-auto shadow-2xl shadow-primary/20 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                            <Shield size={48} fill="currentColor" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-tight italic">
                            "A Inteligência Artificial que pensa <br /> como um sócio sênior."
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium max-w-lg mx-auto leading-relaxed">
                            Identificamos cláusulas predatórias, omissões críticas e falhas de compliance em segundos com precisão jurídica absoluta.
                        </p>
                        <div className="pt-4 flex justify-center">
                            <button
                                onClick={() => setUploadOpen(true)}
                                className="group/btn flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-primary/30 relative overflow-hidden"
                            >
                                <Plus size={18} />
                                Começar Nova Auditoria
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-12">
                            {[
                                { icon: Shield, label: 'Due Diligence Profunda' },
                                { icon: Zap, label: 'Sugestões de Redação' },
                            ].map((feat, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500">
                                        <feat.icon size={20} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{feat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Upload View */}
            <AnimatePresence>
                {uploadOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex-1 min-h-[500px] bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl"
                    >
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-whiteTracking-tight">Auditória Dinâmica: Novo Contrato</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Selecione o modo de análise especializada</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <select 
                                    value={expertMode}
                                    onChange={(e) => setExpertMode(e.target.value)}
                                    className="bg-slate-100 dark:bg-[#0c0e17] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Geral">📜 Geral (Equilibrado)</option>
                                    <option value="Trabalhista">👷 Trabalhista (CLT/Justiça)</option>
                                    <option value="Cível">⚖️ Cível Geral</option>
                                    <option value="Empresarial">🏢 Empresarial (B2B)</option>
                                    <option value="LGPD">🛡️ Privacidade/LGPD</option>
                                </select>
                                <button onClick={() => setUploadOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X /></button>
                            </div>
                        </div>
                        <textarea
                            className="flex-1 p-6 bg-slate-50 dark:bg-[#0c0e17] border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none font-mono text-sm leading-relaxed"
                            placeholder="Cole o texto do contrato aqui ou faça upload de um arquivo .txt..."
                            value={contractText}
                            onChange={(e) => setContractText(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setUploadOpen(false)}
                                className="px-6 py-2 rounded-xl text-app-text-muted hover:bg-app-stroke"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAnalyze}
                                disabled={!contractText || isAnalyzing}
                                className={clsx(
                                    "flex items-center gap-3 px-8 py-2 rounded-xl text-white font-bold transition-all disabled:opacity-50 min-w-[240px] justify-center",
                                    isAnalyzing ? "bg-amber-600" : "bg-primary"
                                )}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={20} /> 
                                        <span className="uppercase text-[10px] tracking-widest">
                                            {analysisStep === 'scanning' && 'Varrendo Arquivo...'}
                                            {analysisStep === 'auditing' && 'Mapeando Riscos...'}
                                            {analysisStep === 'redacting' && 'Blindando Cláusulas...'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={20} fill="currentColor" /> Iniciar Auditoria Especializada
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Analysis Content (Matching Image 0/1/2) */}
            <AnimatePresence>
                {analysis && !isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex gap-6 min-h-0 relative items-stretch"
                    >
                        {/* Middle Column: Premium Document Viewer (PDF Style) */}
                        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-full">
                            {/* PDF Toolbar */}
                            <div className="h-14 bg-white dark:bg-[#1c2237] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 flex-none text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-6">
                                    <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><Menu size={16} /></button>
                                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-800" />
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                        Página 1 de 12
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-slate-100 dark:bg-[#0c0e17] rounded-lg border border-slate-300 dark:border-slate-800 px-2 py-1 gap-3">
                                        <button onClick={handleZoomOut} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><Minimize2 size={12} /></button>
                                        <span className="text-[10px] font-bold text-slate-700 dark:text-white min-w-[40px] text-center">{zoomLevel}%</span>
                                        <button onClick={handleZoomIn} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><Plus size={12} /></button>
                                    </div>
                                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-800" />
                                    <button 
                                        onClick={() => setIsSplitView(!isSplitView)}
                                        className={clsx(
                                            "flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                                            isSplitView ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                        )}
                                    >
                                        <RefreshCw size={12} className={isSplitView ? "animate-spin-slow" : ""} />
                                        {isSplitView ? "Fechar Comparação" : "Comparar Versões"}
                                    </button>
                                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-800" />
                                    <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><Search size={16} /></button>
                                    <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><Maximize2 size={16} /></button>
                                </div>
                            </div>

                            {/* Paper Surface */}
                            <div className="flex-1 overflow-auto custom-scrollbar bg-slate-100 dark:bg-[#0c0e17] p-8" ref={documentRef}>
                                <div className={clsx(
                                    "flex gap-12 transition-all duration-500 min-h-[1100px]",
                                    isSplitView ? "justify-start w-max px-12 mx-0" : "justify-center w-full max-w-full mx-auto"
                                )}>
                                    {/* ORIGINAL COLUMN */}
                                    <div 
                                        className={clsx(
                                            "bg-white text-slate-800 p-6 md:p-12 lg:p-16 shadow-xl font-serif text-[15px] leading-[2] relative transition-all duration-500 border border-slate-200 dark:border-transparent",
                                            isSplitView ? "w-[794px] flex-shrink-0" : "w-full"
                                        )}
                                        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: isSplitView ? 'top left' : 'top center' }}
                                    >
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-8 border-b pb-2">Contrato Original</h4>
                                        <div className="whitespace-pre-wrap">
                                            {(() => {
                                                // Render the full contract text with clause highlighting
                                                const fullText = contractText;
                                                const highlights: Array<{ start: number, end: number, clause: any }> = [];

                                                // Find all clauses that need highlighting
                                                if (analysis?.analysisGroups?.auditoria) {
                                                    analysis.analysisGroups.auditoria.forEach((a) => {
                                                        if (a.clauseReference && a.status !== 'resolvido') {
                                                            const searchPatterns = [
                                                                `Cláusula ${a.clauseReference}`,
                                                                `cláusula ${a.clauseReference}`,
                                                                `Parágrafo ${a.clauseReference}`,
                                                                a.clauseReference
                                                            ];

                                                            for (const pattern of searchPatterns) {
                                                                const idx = fullText.toLowerCase().indexOf(pattern.toLowerCase());
                                                                if (idx !== -1) {
                                                                    let endIdx = fullText.indexOf('\n\n', idx);
                                                                    if (endIdx === -1 || endIdx - idx > 500) {
                                                                        endIdx = Math.min(idx + 300, fullText.length);
                                                                    }
                                                                    highlights.push({ start: idx, end: endIdx, clause: a });
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                    });
                                                }

                                                // Sort highlights by position
                                                highlights.sort((a, b) => a.start - b.start);

                                                // Build the content with highlights
                                                const elements: React.ReactNode[] = [];
                                                let lastEnd = 0;

                                                highlights.forEach((h, idx) => {
                                                    if (h.start > lastEnd) {
                                                        elements.push(
                                                            <span key={`text-${idx}`}>{fullText.slice(lastEnd, h.start)}</span>
                                                        );
                                                    }

                                                    const highlightText = fullText.slice(h.start, h.end);
                                                    elements.push(
                                                        <span
                                                            key={`clause-${idx}`}
                                                            data-clause={h.clause.clauseReference}
                                                            onClick={() => {
                                                                setSelectedClause(h.clause);
                                                                setIsSplitView(true);
                                                            }}
                                                            className={clsx(
                                                                "cursor-pointer transition-all py-1 px-0.5 rounded",
                                                                h.clause.risk === 'Alto'
                                                                    ? "bg-red-100 border-l-4 border-red-500 text-red-900"
                                                                    : "bg-amber-100 border-l-4 border-amber-500 text-amber-900",
                                                                hoveredClause === h.clause.clauseReference && "ring-2 ring-blue-500 bg-blue-100"
                                                            )}
                                                        >
                                                            {highlightText}
                                                        </span>
                                                    );

                                                    lastEnd = h.end;
                                                });

                                                if (lastEnd < fullText.length) {
                                                    elements.push(<span key="text-end">{fullText.slice(lastEnd)}</span>);
                                                }

                                                return elements.length > 0 ? elements : fullText;
                                            })()}
                                        </div>

                                        {/* Focus indicator */}
                                        {selectedClause && (
                                            <div className="absolute left-0 w-1 bg-red-500 h-full top-0 opacity-30" />
                                        )}
                                    </div>

                                    {/* DRAFT COLUMN (SIDE-BY-SIDE) */}
                                    {isSplitView && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="w-[794px] flex-shrink-0 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-6 md:p-12 lg:p-16 shadow-2xl font-serif text-[15px] leading-[2] relative border-2 border-primary/30"
                                            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                                        >
                                            <div className="absolute top-0 right-0 p-4">
                                                <button onClick={() => setIsSplitView(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase text-primary mb-8 border-b border-primary/20 pb-2 flex items-center gap-2">
                                                <Zap size={12} fill="currentColor"/> Sugestão de Revisão Elite
                                            </h4>
                                            
                                            <div className="whitespace-pre-wrap italic text-slate-600 dark:text-slate-400">
                                                {(() => {
                                                    if (selectedClause) {
                                                        const parts = contractText.split(selectedClause.originalText);
                                                        if (parts.length >= 2) {
                                                            return (
                                                                <>
                                                                    {parts[0]}
                                                                    <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-1 rounded font-bold not-italic underline decoration-green-500 decoration-2">
                                                                        {selectedClause.suggestedRedaction}
                                                                    </span>
                                                                    {parts.slice(1).join(selectedClause.originalText)}
                                                                </>
                                                            );
                                                        }
                                                    }
                                                    return draftText || contractText;
                                                })()}
                                            </div>
                                            
                                            {selectedClause && (
                                                <div className="mt-12 p-6 bg-[#1053ff]/5 border border-[#1053ff]/20 rounded-2xl flex flex-col gap-4 shadow-inner">
                                                    <div className="flex items-center gap-2">
                                                        <Shield size={16} className="text-[#1053ff]" />
                                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Ação Sugerida pela Elite AI</p>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Blindar este trecho com redação jurídica otimizada?
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                applySuggestedRedaction(selectedClause);
                                                            }}
                                                            className="flex-1 px-4 py-2.5 bg-[#1053ff] text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                                                        >
                                                            Aplicar Mudança
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedClause(null);
                                                            }}
                                                            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                                                        >
                                                            Ignorar
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Intelligence & Selection Detail (Image 0/1 States) */}
                        {!isSplitView && (
                            <div className="w-[380px] flex flex-col gap-4 h-full overflow-hidden">
                            <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
                                {!selectedClause ? (
                                    <>
                                        {/* GENERAL STATE (Image 0) */}
                                        <div className="bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-lg flex-none">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Score de Segurança</h3>
                                            <div className="flex items-center gap-6">
                                                <div className="relative w-24 h-24">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                                                        <motion.circle
                                                            cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                            strokeDasharray={263.89}
                                                            initial={{ strokeDashoffset: 263.89 }}
                                                            animate={{ strokeDashoffset: 263.89 - (263.89 * analysis.overallScore / 100) }}
                                                            className="text-[#1053ff]"
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-3xl font-black text-slate-900 dark:text-white">{analysis.overallScore}</span>
                                                        <span className="text-[8px] font-bold text-slate-500 uppercase">/100</span>
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 border-4 border-white dark:border-[#161b2c] flex items-center justify-center text-white dark:text-[#161b2c]">
                                                        <AlertTriangle size={14} fill="currentColor" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            {analysis.analysisGroups.auditoria.filter(a => a.risk === 'Alto').length} Riscos Altos
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            {analysis.analysisGroups.auditoria.filter(a => a.risk === 'Médio').length} Pontos de Atenção
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tabs (Image 0) */}
                                        <div className="flex gap-1 p-1 bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-2xl flex-none">
                                            <button
                                                onClick={() => setActiveTab('riscos')}
                                                className={clsx(
                                                    "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all",
                                                    activeTab === 'riscos'
                                                        ? "bg-[#1053ff] text-white shadow-lg shadow-blue-500/20"
                                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                                )}
                                            >
                                                <Shield size={14} /> Riscos
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('compliance')}
                                                className={clsx(
                                                    "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all",
                                                    activeTab === 'compliance'
                                                        ? "bg-[#1053ff] text-white shadow-lg shadow-blue-500/20"
                                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                                )}
                                            >
                                                <CheckCircle2 size={14} /> Compliance
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('sugestoes')}
                                                className={clsx(
                                                    "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all",
                                                    activeTab === 'sugestoes'
                                                        ? "bg-[#1053ff] text-white shadow-lg shadow-blue-500/20"
                                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                                )}
                                            >
                                                <Zap size={14} /> Sugestões
                                            </button>
                                        </div>

                                        {/* Tab Content */}
                                        {activeTab === 'riscos' && (
                                            <div className="space-y-4">
                                                {analysis.analysisGroups.auditoria.map((clause, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setSelectedClause(clause)}
                                                        onMouseEnter={() => {
                                                            setHoveredClause(clause.clauseReference);
                                                            scrollToClause(clause.clauseReference);
                                                        }}
                                                        onMouseLeave={() => setHoveredClause(null)}
                                                        className="bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-[#1053ff]/50 transition-all cursor-pointer group relative overflow-hidden shadow-sm"
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={clsx("w-3 h-3 rounded-full", clause.risk === 'Alto' ? 'bg-red-500' : 'bg-amber-500')} />
                                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{clause.title}</h4>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cláusula {clause.clauseReference}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">
                                                            {clause.description}
                                                        </p>
                                                        <div className="mt-6 flex gap-3">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); scrollToClause(clause.clauseReference); }}
                                                                className="flex-1 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-xl hover:bg-red-500/20 transition-all"
                                                            >
                                                                Ver no documento
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedClause(clause); }}
                                                                className="flex-1 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <Zap size={12} className="text-[#1053ff]" /> Sugerir Redação
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === 'compliance' && (
                                            <div className="space-y-4">
                                                {analysis.analysisGroups.compliance?.length > 0 ? (
                                                    analysis.analysisGroups.compliance.map((item, idx) => (
                                                        <div key={idx} className="bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{item.item}</h4>
                                                                <span className={clsx(
                                                                    "px-2 py-1 rounded-lg text-[9px] font-black uppercase",
                                                                    item.status === 'Conforme' && "bg-emerald-500/10 text-emerald-500",
                                                                    item.status === 'Alerta' && "bg-amber-500/10 text-amber-500",
                                                                    item.status === 'Crítico' && "bg-red-500/10 text-red-500"
                                                                )}>
                                                                    {item.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                                {item.observation || 'Sem observações adicionais.'}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-slate-500">
                                                        <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
                                                        <p className="text-xs">Nenhum item de compliance identificado.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'sugestoes' && (
                                            <div className="space-y-4">
                                                {analysis.analysisGroups.omissions?.length > 0 ? (
                                                    analysis.analysisGroups.omissions.map((item, idx) => (
                                                        <div key={idx} className="bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                                                    <AlertTriangle size={16} className="text-amber-500" />
                                                                </div>
                                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{item.missingItem}</h4>
                                                            </div>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                                                                <strong>Impacto:</strong> {item.impact}
                                                            </p>
                                                            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                                                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                                                    <strong>Sugestão:</strong> {item.suggestion || 'Incluir cláusula específica para este item.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-slate-500">
                                                        <Zap size={32} className="mx-auto mb-2 opacity-50" />
                                                        <p className="text-xs">Nenhuma omissão identificada no contrato.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Health Checklist */}
                                        <div className="bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 font-mono">Checklist de Saúde</h3>
                                            <div className="space-y-4">
                                                {analysis.healthChecklist.map((check, i) => (
                                                    <div key={i} className="flex items-center justify-between group">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:translate-x-1 transition-transform">{check.item}</span>
                                                        {check.found ? (
                                                            <Check size={14} className="text-emerald-500" />
                                                        ) : (
                                                            <AlertTriangle size={14} className="text-red-500" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Business Strategy Card */}
                                        <div className="bg-gradient-to-br from-[#1053ff]/10 to-transparent border border-[#1053ff]/20 rounded-3xl p-6">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1053ff] mb-4">Estratégia de Negócio</h3>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-[1.8]">
                                                {analysis.executiveSummary}
                                            </p>
                                            <button
                                                onClick={() => setShowHistory(!showHistory)}
                                                className="w-full mt-6 py-4 bg-[#1053ff] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
                                            >
                                                <History size={16} /> {showHistory ? 'Fechar Histórico' : 'Abrir Histórico de Versões'}
                                            </button>
                                        </div>

                                        {/* History Panel */}
                                        <AnimatePresence>
                                            {showHistory && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg overflow-hidden"
                                                >
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                                                        <History size={14} /> Histórico de Análises
                                                    </h3>
                                                    {analysisHistory.length > 0 ? (
                                                        <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                                                            {analysisHistory.map((entry) => (
                                                                <div
                                                                    key={entry.id}
                                                                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-colors cursor-pointer group"
                                                                    onClick={() => revertToVersion(entry)}
                                                                >
                                                                    <div>
                                                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{entry.label}</p>
                                                                        <p className="text-[10px] text-slate-500">
                                                                            {entry.timestamp.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                                        </p>
                                                                    </div>
                                                                    <button className="px-3 py-1 text-[9px] font-bold uppercase bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        Reverter
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-500 text-center py-4">Nenhuma versão anterior salva.</p>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
                                ) : (
                                    <>
                                        {/* SELECTION STATE (Image 1) */}
                                        <button
                                            onClick={() => setSelectedClause(null)}
                                            className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-2 transition-colors"
                                        >
                                            <ChevronRight size={14} className="rotate-180" /> Voltar para visão geral
                                        </button>

                                        <div className="bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-8 shadow-lg">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 ring-1 ring-red-500/20">
                                                        <X size={24} />
                                                    </div>
                                                    <div>
                                                        <span className="px-2 py-0.5 rounded bg-red-500 text-white text-[9px] font-black uppercase mr-2">Risco Alto</span>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cláusula {selectedClause.clauseReference}</span>
                                                        <h3 className="text-xl font-black text-white mt-1">{selectedClause.title}</h3>
                                                    </div>
                                                </div>
                                                <button className="text-slate-600 hover:text-white"><Plus className="rotate-45" /></button>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <Search size={14} /> ANÁLISE DA IA
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                                    {selectedClause.description}
                                                </p>
                                            </div>

                                            {/* Suggestion Widget (Image 1) */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1053ff]">
                                                        <Zap size={14} fill="currentColor" /> SUGESTÃO DE REDAÇÃO
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button className="text-slate-500 hover:text-slate-900 dark:text-slate-600 dark:hover:text-white"><Download size={12} /></button>
                                                        <button className="text-slate-500 hover:text-slate-900 dark:text-slate-600 dark:hover:text-white"><RefreshCw size={12} /></button>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-[#0c0e17] border border-[#1053ff]/30 rounded-3xl p-6 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white underline">Editar Manualmente</button>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-[8px] font-bold text-slate-600 mb-4 uppercase">
                                                        <span className="text-red-500 line-through">...não implicará em multa e...</span>
                                                        <ArrowRight size={10} />
                                                        <span className="text-emerald-500">Nova Redação</span>
                                                    </div>

                                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-serif overflow-y-auto max-h-[150px] custom-scrollbar pr-2">
                                                        {selectedClause.suggestedRedaction}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => setSelectedClause(null)}
                                                    className="flex-1 py-4 bg-slate-100 dark:bg-[#1c2237] text-slate-600 dark:text-slate-300 text-xs font-black uppercase rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <X size={16} /> Descartar
                                                </button>
                                                <button
                                                    onClick={() => applySuggestedRedaction(selectedClause)}
                                                    className="flex-1 py-4 bg-[#1053ff] text-white text-xs font-black uppercase rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                                                >
                                                    <Check size={16} /> Aceitar Redação
                                                </button>
                                            </div>

                                            {/* Legal Base (Image 1) */}
                                            <div className="p-6 bg-slate-50 dark:bg-[#0c0e17] border border-slate-200 dark:border-slate-800 rounded-3xl flex gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-900 flex items-center justify-center text-[#1053ff]">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="text-[10px] font-black text-slate-800 dark:text-slate-200">Base Legal: Art. 408 a 416 do CC</h5>
                                                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                                        A cláusula penal serve como pré-fixação de perdas e danos, dispensando a prova do prejuízo.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>
                    )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback Modal (Image 3) */}
            <AnimatePresence>
                {showFeedback && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0c0e17]/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#161b2c] border border-slate-800 w-full max-w-[560px] p-10 rounded-[40px] shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowFeedback(false)}
                                className="absolute top-8 right-8 text-slate-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-14 h-14 bg-[#1053ff] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-500/20">
                                <Star size={28} fill="currentColor" />
                            </div>

                            <h2 className="text-2xl font-black text-white mb-2">Avalie a Análise da IA</h2>
                            <p className="text-slate-500 text-xs leading-relaxed mb-8 max-w-[300px] mx-auto">
                                Sua opinião é fundamental para calibrar nossos algoritmos e melhorar a precisão jurídica.
                            </p>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4">Precisão da Análise</h3>
                                    <div className="flex justify-center gap-3 text-slate-800">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setRating(s)}
                                                className={clsx("transition-all", s <= rating ? "text-amber-500 scale-110" : "hover:text-amber-500/50")}
                                            >
                                                <Star size={32} fill={s <= rating ? "currentColor" : "none"} />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-[8px] font-bold text-slate-700 uppercase tracking-[0.2em]">Selecione de 1 a 5 estrelas</p>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 text-left">As sugestões de reescrita foram úteis?</h3>
                                    <div className="flex gap-3">
                                        <button className="flex-1 py-3.5 bg-[#0c0e17] border border-slate-800 rounded-2xl text-[11px] font-bold text-slate-300 flex items-center justify-center gap-2 hover:border-[#1053ff]/50 transition-all">
                                            <ThumbsUp size={14} /> Sim, úteis
                                        </button>
                                        <button className="flex-1 py-3.5 bg-[#0c0e17] border border-slate-800 rounded-2xl text-[11px] font-bold text-slate-300 flex items-center justify-center gap-2 hover:border-[#1053ff]/50 transition-all">
                                            <ThumbsDown size={14} /> Não ajudaram
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 text-left">Comentários (Opcional)</h3>
                                    <textarea
                                        className="w-full bg-[#0c0e17] border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-700 focus:border-[#1053ff]/50 outline-none resize-none h-24"
                                        placeholder="Conte-nos o que a IA acertou ou errou..."
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <button onClick={() => setShowFeedback(false)} className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-all">Pular</button>
                                    <button
                                        onClick={() => setShowFeedback(false)}
                                        className="px-8 py-4 bg-[#1053ff] text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-600 transition-all"
                                    >
                                        <Send size={14} /> Enviar Feedback
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-800/50">
                                <div className="bg-[#0c0e17] px-3 py-1.5 rounded-lg inline-flex items-center gap-2 border border-slate-800">
                                    <FileText size={12} className="text-red-500" />
                                    <span className="text-[9px] font-bold text-slate-500">Contrato Prestação de Serviços - v2.pdf</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
