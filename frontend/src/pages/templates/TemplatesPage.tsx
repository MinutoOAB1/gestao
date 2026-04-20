import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, FileText, Eye, Trash2, Upload, X, Sparkles
} from 'lucide-react';
import api from '../../services/api';
import mammoth from 'mammoth';
import { useToast } from '../../context/ToastContext';

interface Template {
    id: string;
    title: string;
    description?: string;
    content: string;
    category: string;
    icon: string;
    iconColor: string;
    variables?: string;
    docxPath?: string;
    createdAt: string;
    updatedAt: string;
}

const CATEGORIES = [
    { key: 'Todos', label: 'Todos' },
    { key: 'CIVIL', label: 'Civil' },
    { key: 'TRABALHISTA', label: 'Trabalhista' },
    { key: 'CONTRATOS', label: 'Contratos' },
    { key: 'FAMILIA', label: 'Família & Sucessões' },
    { key: 'PROCURACOES', label: 'Procurações' },
    { key: 'NOTIFICACOES', label: 'Notificações' },
];

export default function TemplatesPage() {
    const { addToast } = useToast();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todos');
    const [templatePreviews, setTemplatePreviews] = useState<Record<string, string>>({});

    // Upload state
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('PROCURACOES');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTemplates();
    }, [activeCategory, searchTerm]);

    useEffect(() => {
        // Load previews for templates
        loadTemplatePreviews();
    }, [templates]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (activeCategory !== 'Todos') params.append('category', activeCategory);
            if (searchTerm) params.append('search', searchTerm);

            const res = await api.get(`/templates?${params.toString()}`);
            setTemplates(res.data || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTemplatePreviews = async () => {
        const previews: Record<string, string> = {};

        for (const template of templates) {
            if (template.docxPath) {
                try {
                    const response = await api.get(`/templates/${template.id}/file`, {
                        responseType: 'arraybuffer'
                    });
                    const result = await mammoth.convertToHtml(
                        { arrayBuffer: response.data },
                        {
                            convertImage: mammoth.images.imgElement((image) => {
                                return image.read('base64').then((imageBuffer) => ({
                                    src: `data:${image.contentType};base64,${imageBuffer}`
                                }));
                            })
                        }
                    );
                    previews[template.id] = result.value;
                } catch (err) {
                    console.log('Could not load preview for', template.id);
                }
            }
        }

        setTemplatePreviews(previews);
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este modelo?')) return;
        try {
            await api.delete(`/templates/${id}`);
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    // Open editor - Navigate to DocumentEditor page
    const openEditor = (template: Template) => {
        navigate(`/app/modelos/${template.id}`);
    };

    // Handle DOCX file upload
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadFile(file);
        setNewTitle(file.name.replace('.docx', ''));
    };

    const handleUploadTemplate = async () => {
        if (!uploadFile) return;
        setIsUploading(true);
        setUploadStatus('Enviando arquivo...');

        try {
            // 1. Upload DOCX file
            const formData = new FormData();
            formData.append('file', uploadFile);
            const uploadRes = await api.post('/templates/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setUploadStatus('Extraindo texto do documento...');

            // 2. Extract text from file using mammoth
            const arrayBuffer = await uploadFile.arrayBuffer();
            const textResult = await mammoth.extractRawText({ arrayBuffer });
            const documentText = textResult.value;

            setUploadStatus('🤖 IA analisando variáveis...');

            // 3. Call AI to extract variables
            let variables: any[] = [];
            try {
                const aiResponse = await api.post('/ai/extract-variables', {
                    documentText: documentText
                });
                variables = aiResponse.data.variables || [];
                console.log('AI extracted variables:', variables);
            } catch (aiError) {
                console.error('AI variable extraction failed, using fallback', aiError);
                // Fallback: extract {variable} patterns
                const regex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
                let match: RegExpExecArray | null;
                while ((match = regex.exec(documentText)) !== null) {
                    const varName = match[1];
                    if (!variables.find((v: any) => v.name === varName)) {
                        variables.push({
                            name: varName,
                            label: varName.replace(/_/g, ' '),
                            type: 'text',
                            originalValue: '',
                            category: 'outros'
                        });
                    }
                }
            }

            setUploadStatus('Salvando modelo...');

            // 4. Create template record
            await api.post('/templates', {
                title: newTitle,
                description: '',
                content: documentText.substring(0, 500),
                category: newCategory,
                docxPath: uploadRes.data.path,
                variables: JSON.stringify(variables),
            });

            // Reset state
            setIsUploadOpen(false);
            setUploadFile(null);
            setNewTitle('');
            setUploadStatus('');
            fetchTemplates();
        } catch (error) {
            console.error('Error uploading:', error);
            addToast('Erro ao fazer upload', 'error');
        } finally {
            setIsUploading(false);
            setUploadStatus('');
        }
    };

    return (
        <div className="h-full overflow-y-auto pb-10">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-app-text-main mb-1">Modelos de Documentos</h1>
                <p className="text-app-text-muted text-sm">Gerencie e utilize modelos de petições e documentos jurídicos</p>
            </div>

            {/* Search and Upload */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar modelos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-app-card border border-app-stroke rounded-xl text-app-text-main placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors font-medium"
                >
                    <Upload size={18} />
                    Enviar Modelo
                </button>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.key
                            ? 'bg-primary text-white'
                            : 'bg-app-card text-app-text-muted hover:bg-app-stroke/50 border border-app-stroke'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <span className="text-app-text-muted">Carregando...</span>
                </div>
            ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FileText size={48} className="text-app-text-muted mb-4" />
                    <h3 className="text-lg font-semibold text-app-text-main mb-2">Nenhum modelo encontrado</h3>
                    <p className="text-app-text-muted text-sm">Clique em "Enviar Modelo" para adicionar um novo</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {/* New Template Card */}
                    <div
                        onClick={() => setIsUploadOpen(true)}
                        className="group cursor-pointer"
                    >
                        <div className="aspect-[3/4] bg-app-card border-2 border-dashed border-app-stroke rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all">
                            <Plus size={32} className="text-app-text-muted group-hover:text-primary transition-colors" />
                            <span className="text-xs text-app-text-muted group-hover:text-primary transition-colors">Novo Modelo</span>
                        </div>
                    </div>

                    {/* Template Cards */}
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => openEditor(template)}
                            className="group cursor-pointer"
                        >
                            {/* Document Preview */}
                            <div className="aspect-[3/4] bg-white border border-app-stroke rounded-lg shadow-sm overflow-hidden relative group-hover:shadow-lg transition-shadow">
                                {/* HTML Preview */}
                                {templatePreviews[template.id] ? (
                                    <div className="p-2 h-full overflow-hidden">
                                        <div
                                            className="text-[5px] leading-tight text-gray-800 transform scale-[0.35] origin-top-left w-[285%] h-[285%]"
                                            style={{ fontFamily: "'Times New Roman', serif" }}
                                            dangerouslySetInnerHTML={{
                                                __html: templatePreviews[template.id].substring(0, 5000)
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
                                        <FileText size={32} className="text-gray-300 mb-2" />
                                        <span className="text-[10px] text-gray-400 text-center">
                                            Carregando...
                                        </span>
                                    </div>
                                )}

                                {/* Hover actions */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEditor(template); }}
                                        className="p-2 bg-white rounded-full hover:bg-gray-100"
                                    >
                                        <Eye size={18} className="text-gray-700" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                                        className="p-2 bg-white rounded-full hover:bg-gray-100"
                                    >
                                        <Trash2 size={18} className="text-red-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Title */}
                            <p className="mt-3 text-center text-sm font-medium text-app-text-main line-clamp-2">
                                {template.title}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-app-card rounded-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-app-text-main flex items-center gap-2">
                                <Sparkles size={20} className="text-primary" />
                                Enviar Modelo Word
                            </h2>
                            <button onClick={() => setIsUploadOpen(false)} className="text-app-text-muted hover:text-app-text-main">
                                <X size={20} />
                            </button>
                        </div>

                        {/* AI Info Banner */}
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4">
                            <p className="text-xs text-primary font-medium flex items-center gap-2">
                                <Sparkles size={14} />
                                IA detecta automaticamente campos editáveis (nomes, CPF, endereços)
                            </p>
                        </div>

                        {/* DOCX File Drop Zone */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-app-text-muted mb-2">
                                Arquivo Word (.docx) *
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-app-stroke rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
                            >
                                {uploadFile ? (
                                    <div>
                                        <FileText size={32} className="mx-auto mb-2 text-primary" />
                                        <p className="text-sm font-medium text-app-text-main">{uploadFile.name}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload size={32} className="mx-auto mb-2 text-app-text-muted" />
                                        <p className="text-sm text-app-text-muted">
                                            Clique para selecionar arquivo .docx
                                        </p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".docx"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Title Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-app-text-muted mb-1">
                                Título do Modelo
                            </label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-app-stroke rounded-lg bg-app-input text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Nome do modelo"
                            />
                        </div>

                        {/* Category Select */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-app-text-muted mb-1">
                                Categoria
                            </label>
                            <select
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-app-stroke rounded-lg bg-app-input text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                            >
                                {CATEGORIES.filter(c => c.key !== 'Todos').map((cat) => (
                                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Upload Status */}
                        {uploadStatus && (
                            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <p className="text-sm text-blue-400 text-center">{uploadStatus}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsUploadOpen(false)}
                                className="flex-1 py-2.5 border border-app-stroke rounded-lg text-app-text-muted hover:bg-app-stroke/30"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUploadTemplate}
                                disabled={!uploadFile || !newTitle || isUploading}
                                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        Enviar com IA
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
