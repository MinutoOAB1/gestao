import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronDown, Sparkles, X, Maximize2, Download, Printer, FileText, File, 
    Bold, Italic, Underline, Baseline, AlignLeft, AlignCenter, AlignRight, 
    AlignJustify, List, ListOrdered, IndentDecrease, IndentIncrease, Search, 
    Trash2, MessageSquare, Send, Undo, Redo, ZoomIn, ZoomOut, User, Users, 
    History, Gavel, Calendar as CalendarIcon, MapPin, AlertTriangle, 
    ChevronLeft, ChevronRight, Pause, Play, Check, Edit3, Plus
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../../components/ui/Avatar';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// New imports for high-fidelity DOCX handling
import { renderAsync } from 'docx-preview';
import PizZip from 'pizzip';

import { motion, AnimatePresence } from 'framer-motion';

interface Template {
    id: string;
    title: string;
    description?: string;
    content: string;
    category: string;
    variables?: string;
    docxPath?: string;
}

interface AIVariable {
    name: string;
    label: string;
    type: string;
    originalValue: string;
    category: string;
}

interface VariableGroup {
    name: string;
    icon: React.ReactNode;
    fields: AIVariable[];
}

export default function DocumentEditorPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const editorRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [docxArrayBuffer, setDocxArrayBuffer] = useState<ArrayBuffer | null>(null);
    const [activeTab, setActiveTab] = useState<'variables' | 'comments'>('variables');
    const [searchField, setSearchField] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [aiVariables, setAiVariables] = useState<AIVariable[]>([]);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // Group AI variables by category
    const VARIABLE_GROUPS: VariableGroup[] = useMemo(() => {
        const groups: Record<string, AIVariable[]> = {};

        aiVariables.forEach(v => {
            const cat = v.category || 'outros';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(v);
        });

        const categoryIcons: Record<string, React.ReactNode> = {
            'pessoa': <User size={14} />,
            'endereco': <Users size={14} />,
            'documento': <FileText size={14} />,
            'data': <History size={14} />,
            'valor': <Gavel size={14} />,
            'contato': <User size={14} />,
            'outros': <Plus size={14} />,
        };

        const categoryLabels: Record<string, string> = {
            'pessoa': 'DADOS PESSOAIS',
            'endereco': 'ENDEREÇO',
            'documento': 'DOCUMENTOS',
            'data': 'DATAS',
            'valor': 'VALORES',
            'contato': 'CONTATO',
            'outros': 'OUTROS',
        };

        return Object.entries(groups).map(([cat, fields]) => ({
            name: categoryLabels[cat] || cat.toUpperCase(),
            icon: categoryIcons[cat] || <Plus size={14} />,
            fields
        }));
    }, [aiVariables]);

    useEffect(() => {
        // Initialize all groups as expanded by default
        const initialExpanded: Record<string, boolean> = {};
        VARIABLE_GROUPS.forEach(g => {
            initialExpanded[g.name] = true;
        });
        setExpandedGroups(initialExpanded);
    }, [VARIABLE_GROUPS]);

    // Auto-resize variable textareas
    useEffect(() => {
        if (activeTab === 'variables') {
            // Use a small timeout to ensure DOM is updated
            const timer = setTimeout(() => {
                const textareas = document.querySelectorAll('.variable-textarea');
                textareas.forEach((ta) => {
                    const el = ta as HTMLTextAreaElement;
                    el.style.height = 'auto';
                    el.style.height = `${el.scrollHeight}px`;
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeTab, variableValues, expandedGroups]);

    useEffect(() => {
        if (id) {
            loadTemplate(id);
            fetchComments();
        }
    }, [id]);

    const fetchComments = async () => {
        if (!id) return;
        try {
            const response = await api.get(`/documents/${id}/comments`);
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !id) return;
        setIsPostingComment(true);
        try {
            const response = await api.post(`/documents/${id}/comments`, { content: newComment });
            setComments([...comments, response.data]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            addToast('Erro ao adicionar comentário', 'error');
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await api.delete(`/documents/comments/${commentId}`);
            setComments(comments.filter(c => c.id !== commentId));
            addToast('Comentário removido', 'success');
        } catch (error) {
            console.error('Error deleting comment:', error);
            addToast('Erro ao remover comentário', 'error');
        }
    };



    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const loadTemplate = useCallback(async (templateId: string) => {
        try {
            setLoading(true);

            const response = await api.get(`/templates/${templateId}`);
            const templateData = response.data;
            setTemplate(templateData);

            // Parse AI variables from template
            if (templateData.variables) {
                try {
                    const vars = JSON.parse(templateData.variables);
                    if (Array.isArray(vars)) {
                        setAiVariables(vars);
                        // Initialize variable values with original values
                        const initialValues: Record<string, string> = {};
                        vars.forEach((v: AIVariable) => {
                            initialValues[v.name] = v.originalValue || '';
                        });
                        setVariableValues(initialValues);
                    }
                } catch (e) {
                    console.log('Could not parse variables', e);
                }
            }

            let arrayBuffer: ArrayBuffer | null = null;

            if (templateData.docxPath) {
                try {
                    const fileResponse = await api.get(`/templates/${templateId}/file`, {
                        responseType: 'arraybuffer'
                    });
                    arrayBuffer = fileResponse.data;
                } catch (err) {
                    console.log('Could not load from backend');
                }
            }

            if (arrayBuffer) {
                setDocxArrayBuffer(arrayBuffer);
                await generateHtmlPreview(arrayBuffer);
            }

        } catch (error) {
            console.error('Error loading template:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const generateHtmlPreview = async (buffer: ArrayBuffer) => {
        if (!editorRef.current) return;
        
        try {
            // High fidelity rendering preserving styles, fonts and letterheads
            await renderAsync(buffer, editorRef.current, undefined, {
                className: "docx-preview-container",
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                renderHeaders: true,
                renderFooters: true,
                useBase64URL: true,   // Essential for images
                experimental: true,   // Essential for complex shapes/backgrounds
            });
            
            // Success rendering
            console.log('Document rendered with docx-preview');
        } catch (error) {
            console.error('Error generating high-fidelity preview:', error);
            addToast('Aviso: Erro na renderização fiel. Verificando integridade...', 'warning');
        }
    };

    const escapeXml = (unsafe: string) => {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    };

    const applyReplacementsToDocx = async (buffer: ArrayBuffer, replacements: Record<string, string>) => {
        try {
            const zip = new PizZip(buffer);
            
            // Identify all XML files that might contain text
            const filesToProcess = [
                'word/document.xml',
                ...Object.keys(zip.files).filter(name => 
                    name.startsWith('word/header') || name.startsWith('word/footer')
                )
            ];

            filesToProcess.forEach(filePath => {
                const content = zip.file(filePath)?.asText();
                if (content) {
                    let updatedContent = content;
                    aiVariables.forEach(v => {
                        const rawNewValue = replacements[v.name];
                        if (v.originalValue && rawNewValue !== undefined) {
                            const newValue = escapeXml(rawNewValue);
                            // Extremely safe replacement: handle text nodes that might be split by formatting
                            // BUT NEVER match across an image or shape tag to prevent deleting letterheads/images
                            const escapedChars = Array.from(v.originalValue).map(char => 
                                char.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')
                            );
                            
                            // Safe XML pattern that ignores formatting tags but stops at any media/shape structural tags
                            const safeInnerXml = '(?:<(?!w:drawing\\\\b|/?w:drawing\\\\b|w:pict\\\\b|/?w:pict\\\\b|v:shape\\\\b|/?v:shape\\\\b|wp:inline\\\\b|/?wp:inline\\\\b)[^>]*>)*';
                            const pattern = escapedChars.join(safeInnerXml);
                            const regex = new RegExp(pattern, 'g');
                            
                            updatedContent = updatedContent.replace(regex, newValue);
                        }
                    });
                    zip.file(filePath, updatedContent);
                }
            });

            return zip.generate({ type: 'arraybuffer' });
        } catch (error) {
            console.error('Error applying replacements to DOCX ZIP:', error);
            throw error;
        }
    };

    const handleVariableChange = (key: string, value: string) => {
        setVariableValues(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerateDocument = async () => {
        if (!docxArrayBuffer || aiVariables.length === 0) return;

        setSaving(true);
        try {
            // Apply replacements directly to the DOCX buffer (preserves pattern and letterhead)
            const updatedBuffer = await applyReplacementsToDocx(docxArrayBuffer, variableValues);
            
            // Update state with new buffer
            setDocxArrayBuffer(updatedBuffer);
            
            // Re-render the faithful preview
            await generateHtmlPreview(updatedBuffer);

            addToast('Documento atualizado com sucesso!', 'success');
        } catch (error: any) {
            console.error('Error generating document:', error);
            addToast('Erro ao atualizar documento: ' + (error.message || 'Erro de processamento'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadDocx = () => {
        if (!template || !docxArrayBuffer) return;

        const blob = new Blob([docxArrayBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        saveAs(blob, `${template.title}.docx`);
    };

    const handleDownloadPdf = async () => {
        if (!editorRef.current || !template) return;

        try {
            const canvas = await html2canvas(editorRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Load logo
            try {
                const logoImg = new Image();
                logoImg.src = '/Advus.png';
                await new Promise((resolve) => logoImg.onload = resolve);

                const logoH = 15;
                const logoRatio = logoImg.width / logoImg.height;
                const logoW = logoH * logoRatio;

                // Add logo at top left
                pdf.addImage(logoImg, 'PNG', 10, 10, logoW, logoH);

                // Add header details
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text(template.title, 10 + logoW + 5, 18);

                // Shift content down? 
                // Currently content captures the WHOLE document page. 
                // If we want to overlay logo ON TOP of the document content?
                // Or push content down?
                // DocumentEditor usually WYSIWYG. The logo should probably be IN the document if user wants it.
                // But USER REQUEST: "em todo relatório ... use a imagem".
                // So I will force add it to header.

                // Add content image shifted down
                const startY = 30;

                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - startY - 10) / imgHeight);

                pdf.addImage(imgData, 'PNG', 10, startY, imgWidth * ratio, imgHeight * ratio);

            } catch (e) {
                // Fallback if logo fails or just standard print
                console.warn('Logo load failed, printing standard', e);
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
            }

            pdf.save(`${template.title}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            addToast('Erro ao gerar PDF', 'error');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Re-render when fullscreen toggles to update the ref
    useEffect(() => {
        if (docxArrayBuffer) {
            generateHtmlPreview(docxArrayBuffer);
        }
    }, [isFullscreen]);

    const toggleEditing = () => {
        setIsEditing(!isEditing);
    };

    const handleFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        // Ensure the editor stays in focus after command execution
        editorRef.current?.focus();
    };

    const handleAddClause = () => {
        const clauseHtml = '<p style="margin-top: 1em;"><strong>[Nova Cláusula]</strong>: Insira o texto desta cláusula aqui.</p>';
        document.execCommand('insertHTML', false, clauseHtml);
        editorRef.current?.focus();
    };



    const filteredGroups = VARIABLE_GROUPS.map(group => ({
        ...group,
        fields: group.fields.filter(field =>
            searchField === '' ||
            field.label.toLowerCase().includes(searchField.toLowerCase()) ||
            field.name.toLowerCase().includes(searchField.toLowerCase())
        )
    })).filter(group => group.fields.length > 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-app-bg">
                <div className="text-app-text-muted">Carregando documento...</div>
            </div>
        );
    }

    return (
        <div className={clsx(
            "flex flex-col h-full overflow-hidden transition-all duration-500",
            isFullscreen ? "fixed inset-0 z-[100] bg-app-bg p-0 gap-0" : "bg-[#F5F5F7] dark:bg-[#121212] p-4 gap-4"
        )}>
            {/* Soft Top Header */}
            <header className={clsx(
                "flex items-center justify-between border border-app-stroke bg-white/80 dark:bg-app-card/80 backdrop-blur-md px-6 py-4 shrink-0 transition-all duration-500",
                isFullscreen ? "rounded-none border-x-0 border-t-0 bg-white dark:bg-app-card" : "z-20 rounded-[2rem] shadow-sm"
            )}>
                <div className="flex items-center gap-2 text-app-text-muted text-sm font-medium pl-16">
                    <button onClick={() => navigate('/app/modelos')} className="hover:text-primary transition-colors">
                        Modelos
                    </button>
                    <span className="text-app-text-label">/</span>
                    <span className="text-app-text-muted">{template?.category || 'Petição'}</span>
                    <span className="text-app-text-label">/</span>
                    <span className="text-app-text-main font-bold bg-app-stroke/50 px-2.5 py-1 rounded-md">Edição Final</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullscreen}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl border border-app-stroke transition-all text-sm font-medium",
                            isFullscreen 
                                ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20" 
                                : "text-app-text-muted hover:bg-app-stroke/30 hover:text-app-text-main"
                        )}
                    >
                        {isFullscreen ? <X size={16} /> : <Maximize2 size={16} />}
                        {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-app-stroke text-app-text-muted hover:bg-app-stroke/30 hover:text-app-text-main transition-colors text-sm font-medium"
                    >
                        <Printer size={16} />
                        Imprimir
                    </button>

                    {/* Export dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-app-stroke text-app-text-muted hover:bg-app-stroke/30 hover:text-app-text-main transition-colors text-sm font-medium"
                        >
                            <Download size={16} />
                            Exportar
                        </button>
                        {showExportMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 bg-app-card border border-app-stroke rounded-2xl shadow-2xl z-50 min-w-[180px] overflow-hidden">
                                    <button
                                        onClick={() => { handleDownloadDocx(); setShowExportMenu(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-app-text-main hover:bg-app-stroke/30 transition-colors"
                                    >
                                        <FileText size={16} className="text-blue-500" />
                                        Baixar DOCX
                                    </button>
                                    <button
                                        onClick={() => { handleDownloadPdf(); setShowExportMenu(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-app-text-main hover:bg-app-stroke/30 transition-colors border-t border-app-stroke"
                                    >
                                        <File size={16} className="text-red-500" />
                                        Baixar PDF
                                    </button>
                                </div>
                            </>
                        )}
                    </div>



                    <button
                        onClick={handleGenerateDocument}
                        disabled={saving || aiVariables.length === 0}
                        className="relative overflow-hidden group flex items-center gap-2 px-8 py-3 rounded-[1.25rem] bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all text-sm font-black disabled:opacity-50 disabled:grayscale"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <Sparkles size={18} className={clsx("relative z-10", saving && "animate-spin")} />
                        <span className="relative z-10 uppercase tracking-tighter">Aplicar Alterações</span>
                    </button>
                </div>
            </header>
            <div className={clsx(
                "flex flex-1 overflow-hidden relative transition-all duration-500",
                isFullscreen ? "p-0 gap-0 bg-white dark:bg-black" : "p-4 gap-4 bg-[#F5F5F7] dark:bg-[#0A0A0A]"
            )}>
                {/* Main Content Area (Paper) */}
                <div className={clsx(
                    "flex-1 flex flex-col h-full min-w-0 relative bg-white dark:bg-[#111111] border-app-stroke transition-all duration-500",
                    isFullscreen ? "rounded-none border-none" : "rounded-[2.5rem] border shadow-sm overflow-hidden"
                )}>
                    {/* Fixed Standard Toolbar (Word Style) */}
                    <div className="w-full bg-white/50 dark:bg-app-card/50 backdrop-blur-sm border-b border-gray-100 dark:border-app-stroke px-6 py-3 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0 z-10">
                        <div className="flex items-center gap-1 shrink-0">
                            <button 
                                onMouseDown={(e) => { e.preventDefault(); handleFormat('undo'); }}
                                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors tooltip" title="Desfazer"
                            >
                                <Undo size={16} />
                            </button>
                            <button 
                                onMouseDown={(e) => { e.preventDefault(); handleFormat('redo'); }}
                                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors tooltip" title="Refazer"
                            >
                                <Redo size={16} />
                            </button>
                            <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                            
                            <select 
                                onChange={(e) => handleFormat('formatBlock', e.target.value)}
                                className="bg-transparent text-sm text-gray-700 dark:text-gray-300 font-bold focus:outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-3 py-2 transition-colors appearance-none min-w-[140px] border border-gray-100 dark:border-gray-800"
                            >
                                <option value="P">Texto Normal</option>
                                <option value="H1">Título 1</option>
                                <option value="H2">Título 2</option>
                                <option value="H3">Título 3</option>
                            </select>
                            <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>

                            {/* Font Formatting */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button onMouseDown={(e) => { e.preventDefault(); handleFormat('bold'); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors tooltip" title="Negrito"><Bold size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); handleFormat('italic'); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors tooltip" title="Itálico"><Italic size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); handleFormat('underline'); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors tooltip" title="Sublinhado"><Underline size={16} /></button>
                                
                                {/* Color Picker Wrapper */}
                                <div className="relative flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 tooltip" title="Cor da Fonte">
                                    <Baseline size={16} className="text-gray-700 dark:text-gray-300" />
                                    <input 
                                        type="color" 
                                        onChange={(e) => handleFormat('foreColor', e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="absolute bottom-1.5 left-2.5 right-2.5 h-[3px] bg-primary rounded-full pointer-events-none"></div>
                                </div>
                            </div>
                            <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                            
                            {/* Alignment */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyLeft'); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors tooltip" title="Alinhar à Esquerda"><AlignLeft size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyCenter'); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors tooltip" title="Centralizar"><AlignCenter size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyRight'); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors tooltip" title="Alinhar à Direita"><AlignRight size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyFull'); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors tooltip" title="Justificar"><AlignJustify size={16} /></button>
                            </div>
                            <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>

                            {/* Lists and Indentation */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button onMouseDown={(e) => { e.preventDefault(); handleFormat('insertUnorderedList'); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors tooltip" title="Marcadores"><List size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); handleFormat('insertOrderedList'); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors tooltip" title="Numeração"><ListOrdered size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); handleFormat('outdent'); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors tooltip" title="Diminuir Recuo"><IndentDecrease size={16} /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); handleFormat('indent'); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors tooltip" title="Aumentar Recuo"><IndentIncrease size={16} /></button>
                            </div>
                            <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    className={clsx("p-2 rounded-xl transition-all tooltip flex items-center gap-2 px-4 shadow-sm text-sm font-bold cursor-pointer", isEditing ? "bg-primary text-white scale-105" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100")}
                                    onClick={toggleEditing}
                                    title={isEditing ? "Travar Edição" : "Habilitar Edição Livre"}
                                >
                                    <Edit3 size={16} />
                                    {isEditing ? "Modo Edição" : "Modo Leitura"}
                                </button>
                                
                                <button 
                                    onClick={handleAddClause}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-black text-sm hover:bg-primary/20 transition-all shrink-0"
                                >
                                    <Plus size={16} />
                                    Cláusula
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Zoom Widget */}
                    <div className="absolute right-8 bottom-8 z-30 flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-1 shadow-[0_8px_32px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800">
                        <button onClick={() => setZoom(prev => Math.min(prev + 10, 200))} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-primary transition-colors"><ZoomIn size={18} /></button>
                        <div className="flex items-center justify-center h-8 text-[11px] font-black text-gray-400 select-none tracking-tighter">{zoom}%</div>
                        <button onClick={() => setZoom(prev => Math.max(prev - 10, 50))} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-primary transition-colors"><ZoomOut size={18} /></button>
                    </div>

                    {/* Document Preview (Floating Paper) */}
                    <div className="flex-1 overflow-auto p-12 lg:p-16 flex justify-center print:p-0 print:bg-white custom-scrollbar relative pb-32">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: zoom / 100 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            ref={editorRef}
                            className={clsx(
                                "bg-white rounded-sm outline-none transition-shadow",
                                isEditing && "shadow-[0_0_0_2px_rgba(59,130,246,0.5)] cursor-text"
                            )}
                            contentEditable={isEditing}
                            suppressContentEditableWarning={true}
                            style={{ 
                                width: '210mm', 
                                minHeight: '297mm',
                                transformOrigin: 'top center',
                                boxShadow: isEditing 
                                    ? '0 20px 60px -15px rgba(0,0,0,0.15), 0 0 0 2px rgba(59,130,246,0.5)' 
                                    : '0 20px 60px -15px rgba(0,0,0,0.15), 0 0 1px 1px rgba(0,0,0,0.05)',
                                overflow: 'hidden'
                            }}
                        />
                    </div>
                </div>

                {/* Sidebar Premium */}
                {!isFullscreen && (
                    <aside className="w-85 bg-white dark:bg-app-card border border-app-stroke flex flex-col shrink-0 print:hidden relative z-40 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    {/* Animated Tabs */}
                    <div className="flex p-3 gap-1 bg-gray-50/50 dark:bg-black/20 shrink-0 border-b border-gray-100 dark:border-app-stroke relative">
                        {['variables', 'comments'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={clsx(
                                    "flex-1 py-2.5 text-xs font-black rounded-xl transition-colors relative z-10 capitalize tracking-wide",
                                    activeTab === tab ? "text-primary" : "text-app-text-muted hover:text-app-text-main"
                                )}
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTabBubble"
                                        className="absolute inset-0 bg-white dark:bg-app-card rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 -z-10"
                                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                    />
                                )}
                                {tab === 'variables' ? <><Sparkles size={12} className="inline mr-1" /> Variáveis</> : 'Comentários'}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
                        {activeTab === 'variables' ? (
                            <>
                                {/* Elegant Search */}
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Procurar campo mágico..."
                                        value={searchField}
                                        onChange={(e) => setSearchField(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent rounded-[1.25rem] pl-11 pr-4 py-3 text-sm text-app-text-main placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-black focus:border-primary/30 transition-all shadow-inner"
                                    />
                                </div>

                                {/* Accordion List */}
                                {filteredGroups.length > 0 ? (
                                    <AnimatePresence>
                                        {filteredGroups.map((group, groupIndex) => (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: groupIndex * 0.05 }}
                                                key={groupIndex} 
                                                className="flex flex-col border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-app-card shadow-sm"
                                            >
                                                <button 
                                                    onClick={() => toggleGroup(group.name)}
                                                    className="flex flex-row items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors w-full text-left"
                                                >
                                                    <h4 className="text-[11px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                                        <div className="p-1 rounded bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400">{group.icon}</div>
                                                        {group.name}
                                                    </h4>
                                                    <ChevronDown size={14} className={clsx("text-gray-400 transition-transform duration-300", expandedGroups[group.name] ? "rotate-180" : "rotate-0")} />
                                                </button>
                                                
                                                <AnimatePresence>
                                                    {expandedGroups[group.name] && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="flex flex-col gap-3 p-3 max-h-[500px] overflow-y-auto custom-scrollbar pb-8">
                                                                {group.fields.map((field) => (
                                                                    <div key={field.name} className="relative group/input pt-5 pb-1">
                                                                        <label className={clsx(
                                                                            "absolute left-3 text-[10px] uppercase font-bold tracking-wide transition-all duration-200 pointer-events-none z-10 bg-white dark:bg-app-card px-1",
                                                                            variableValues[field.name] 
                                                                                ? "-top-1 text-primary" 
                                                                                : "top-5 text-gray-400 group-focus-within:-top-1 group-focus-within:text-primary"
                                                                        )}>
                                                                            {field.label}
                                                                        </label>
                                                                        <textarea
                                                                            rows={1}
                                                                            value={variableValues[field.name] || ''}
                                                                            onChange={(e) => handleVariableChange(field.name, e.target.value)}
                                                                            onInput={(e) => {
                                                                                const target = e.target as HTMLTextAreaElement;
                                                                                target.style.height = 'auto';
                                                                                target.style.height = `${target.scrollHeight}px`;
                                                                            }}
                                                                            placeholder={variableValues[field.name] ? "" : field.originalValue || ""}
                                                                            className="w-full bg-transparent border-2 border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary/40 hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm resize-none overflow-hidden min-h-[46px] variable-textarea"
                                                                            style={{ height: 'auto' }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                ) : (
                                    <div className="text-center text-app-text-muted text-sm py-12 flex flex-col items-center justify-center opacity-60">
                                        <Sparkles size={32} className="mx-auto mb-3 text-app-text-label animate-pulse" />
                                        <p className="font-medium">Nenhuma variável mágica detectada.</p>
                                        <p className="text-xs mt-1 max-w-[200px]">A Inteligência Artificial analisa o documento no momento do upload original.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4">
                                    {comments.length > 0 ? (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl relative group/comment">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Avatar
                                                        src={comment.user?.avatar}
                                                        name={comment.user?.name}
                                                        size="sm"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-app-text-main">{comment.user?.name}</span>
                                                        <span className="text-[10px] text-app-text-muted">{new Date(comment.createdAt).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-app-text-muted leading-relaxed">{comment.content}</p>
                                                <button 
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover/comment:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 opacity-50">
                                            <MessageSquare size={32} className="mb-2" />
                                            <p className="text-sm">Nenhum comentário por aqui.</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <textarea
                                        placeholder="Escreva um comentário..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-sm focus:outline-none focus:border-primary/30 transition-all resize-none h-24"
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={isPostingComment || !newComment.trim()}
                                        className="w-full mt-2 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Send size={16} />
                                        {isPostingComment ? 'Enviando...' : 'Comentar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'variables' && aiVariables.length > 0 && (
                            <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-white via-white dark:from-app-card dark:via-app-card border-t border-transparent mt-auto -mx-4 px-4">
                                <button
                                    onClick={handleGenerateDocument}
                                    disabled={saving}
                                    className="w-full py-3.5 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl text-sm font-black tracking-wide transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12" />
                                    <Sparkles size={16} className={clsx(saving ? "animate-spin" : "animate-pulse")} />
                                    {saving ? 'Transcrevendo Magia...' : 'Aplicar Alterações na Tela'}
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
                )}
            </div>
        </div>
    );
}
