import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Network, 
  Plus, 
  Sparkles, 
  RotateCcw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Trash2, 
  ArrowRight,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface ProcessNode {
  id: string;
  label: string;
  category: 'principal' | 'apoio';
  description: string;
  x: number;
  y: number;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  label: string;
}

const DEFAULT_AVAILABLE_NODES: Omit<ProcessNode, 'x' | 'y'>[] = [
  // Principais
  { id: 'triagem', label: 'Triagem e Qualificação', category: 'principal', description: 'Análise de viabilidade jurídica e qualificação preliminar dos leads de entrada.' },
  { id: 'consulta', label: 'Consultoria Empresarial', category: 'principal', description: 'Assessoria estratégica consultiva voltada a contratos e reestruturações corporativas.' },
  { id: 'trabalhista', label: 'Assessoria Trabalhista', category: 'principal', description: 'Análise preventiva trabalhista e representação judicial em dissídios e defesas.' },
  { id: 'previdenciario', label: 'Assessoria Previdenciária', category: 'principal', description: 'Cálculo de tempo de contribuição, planejamento e requerimento de benefícios previdenciários.' },
  { id: 'atendimento', label: 'Atendimento ao Cliente', category: 'principal', description: 'Realizar o primeiro contato com potenciais clientes, entendendo suas demandas e cadastrando no CRM.' },
  { id: 'fechamento', label: 'Fechamento de Contratos', category: 'principal', description: 'Geração e negociação de propostas comerciais, honorários e coleta de assinaturas digitais.' },
  { id: 'gestao_casos', label: 'Gestão de Casos Jurídicos', category: 'principal', description: 'Acompanhamento de prazos, andamento de processos judiciais e notificações processuais.' },
  { id: 'propostas', label: 'Análise de Propostas e Acordos', category: 'principal', description: 'Estudo de minutas de acordos judiciais e extrajudiciais para otimizar os retornos.' },
  { id: 'relacionamento', label: 'Relacionamento & Pós-Venda', category: 'principal', description: 'Feedback de satisfação, acompanhamento pós-sentença e fidelização jurídica.' },
  // De Apoio
  { id: 'financeiro', label: 'Financeiro e Gestão de Riscos', category: 'apoio', description: 'Faturamento de honorários, controle de fluxo de caixa, pagamentos e planejamento tributário.' },
  { id: 'compliance', label: 'Compliance & Legal Operations', category: 'apoio', description: 'Controle de políticas de dados (LGPD), auditorias internas e parametrizações operacionais.' },
  { id: 'comunicacao', label: 'Comunicação & Marketing', category: 'apoio', description: 'Criação de conteúdos informativos, gestão de redes sociais do escritório e eventos.' }
];

export default function CadeiaValorPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Canvas State
  const [nodes, setNodes] = useState<ProcessNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [availableNodes, setAvailableNodes] = useState<Omit<ProcessNode, 'x' | 'y'>[]>(DEFAULT_AVAILABLE_NODES);
  const [history, setHistory] = useState<{ nodes: ProcessNode[]; connections: Connection[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // New custom node creator state
  const [showNewNodeModal, setShowNewNodeModal] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeCategory, setNewNodeCategory] = useState<'principal' | 'apoio'>('principal');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  
  // New connection creator state
  const [showNewConnModal, setShowNewConnModal] = useState(false);
  const [connFrom, setConnFrom] = useState('');
  const [connTo, setConnTo] = useState('');
  const [connLabel, setConnLabel] = useState('');

  // AI Prompt Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiOfficeArea, setAiOfficeArea] = useState('Direito de Família');
  const [aiPrompt, setAiPrompt] = useState('');

  // UI States
  const [zoom, setZoom] = useState(1);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState('');
  const [draggedItem, setDraggedItem] = useState<Omit<ProcessNode, 'x' | 'y'> | null>(null);
  const [activeDragNodeId, setActiveDragNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Load from localStorage on mount
  useEffect(() => {
    const savedNodes = localStorage.getItem('cadeia-valor-nodes');
    const savedConns = localStorage.getItem('cadeia-valor-connections');
    const savedAvailables = localStorage.getItem('cadeia-valor-availables');
    
    if (savedNodes && savedConns) {
      try {
        setNodes(JSON.parse(savedNodes));
        setConnections(JSON.parse(savedConns));
      } catch (e) {
        console.error('Failed to parse saved Cadeia de Valor:', e);
      }
    } else {
      // Set initial premium layout
      const initialNodes: ProcessNode[] = [
        { id: 'triagem', label: 'Triagem e Qualificação', category: 'principal', description: 'Análise de viabilidade jurídica e qualificação preliminar dos leads de entrada.', x: 150, y: 120 },
        { id: 'previdenciario', label: 'Assessoria Previdenciária', category: 'principal', description: 'Cálculo de tempo de contribuição, planejamento e requerimento de benefícios.', x: 150, y: 340 },
        { id: 'atendimento', label: 'Atendimento ao Cliente', category: 'principal', description: 'Realizar o primeiro contato com potenciais clientes, entendendo suas demandas e cadastrando no CRM.', x: 480, y: 230 },
        { id: 'fechamento', label: 'Fechamento de Contratos', category: 'principal', description: 'Geração e negociação de propostas comerciais, honorários e coleta de assinaturas digitais.', x: 800, y: 230 },
        { id: 'financeiro', label: 'Financeiro e Custos', category: 'apoio', description: 'Faturamento de honorários, controle de fluxo de caixa, pagamentos e planejamento.', x: 480, y: 460 }
      ];
      
      const initialConns: Connection[] = [
        { id: 'c1', from: 'triagem', to: 'atendimento', label: 'Gera leads qualificados' },
        { id: 'c2', from: 'previdenciario', to: 'atendimento', label: 'Filtra clientes de benefício' },
        { id: 'c3', from: 'atendimento', to: 'fechamento', label: 'Direciona para comercial' },
        { id: 'c4', from: 'fechamento', to: 'financeiro', label: 'Fatura e cobra honorários' }
      ];
      
      setNodes(initialNodes);
      setConnections(initialConns);
    }
    
    if (savedAvailables) {
      try {
        setAvailableNodes(JSON.parse(savedAvailables));
      } catch (e) {}
    }
  }, []);

  // Save changes & record history
  const saveState = (newNodes: ProcessNode[], newConns: Connection[]) => {
    setNodes(newNodes);
    setConnections(newConns);
    localStorage.setItem('cadeia-valor-nodes', JSON.stringify(newNodes));
    localStorage.setItem('cadeia-valor-connections', JSON.stringify(newConns));
    
    // Add to history for Undo/Redo
    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, { nodes: newNodes, connections: newConns }]);
    setHistoryIndex(nextHistory.length);
  };

  // Drag & Drop available node to Canvas (HTML5 Drag over & Drop)
  const handleDragStart = (e: React.DragEvent, item: Omit<ProcessNode, 'x' | 'y'>) => {
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || !canvasRef.current) return;

    // Check if node is already on canvas
    if (nodes.some(n => n.id === draggedItem.id)) {
      alert('Este elemento já está posicionado no quadro.');
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left - 150) / zoom); // Centered relative to card width
    const y = Math.round((e.clientY - rect.top - 50) / zoom);

    const newNode: ProcessNode = {
      ...draggedItem,
      x: Math.max(50, x),
      y: Math.max(50, y)
    };

    const updatedNodes = [...nodes, newNode];
    saveState(updatedNodes, connections);
    setDraggedItem(null);
  };

  // Node Dragging inside Canvas (Custom pointer tracking for React 19 compatibility with refs)
  const activeDragNodeIdRef = useRef<string | null>(null);

  const handleNodePointerDown = (e: React.PointerEvent<HTMLDivElement>, node: ProcessNode) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    activeDragNodeIdRef.current = node.id;
    setActiveDragNodeId(node.id);
    
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleNodePointerMove = (e: React.PointerEvent<HTMLDivElement>, node: ProcessNode) => {
    if (activeDragNodeIdRef.current !== node.id || !canvasRef.current) return;
    e.stopPropagation();

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - canvasRect.left) / zoom - dragOffset.current.x);
    const y = Math.round((e.clientY - canvasRect.top) / zoom - dragOffset.current.y);

    setNodes(prevNodes => prevNodes.map(n => 
      n.id === node.id ? { ...n, x: Math.max(20, x), y: Math.max(20, y) } : n
    ));
  };

  const handleNodePointerUp = (e: React.PointerEvent<HTMLDivElement>, node: ProcessNode) => {
    if (activeDragNodeIdRef.current === node.id) {
      e.stopPropagation();
      activeDragNodeIdRef.current = null;
      setActiveDragNodeId(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
      
      // Save final state using functional update to ensure fresh state
      setNodes(currentNodes => {
        saveState(currentNodes, connections);
        return currentNodes;
      });
    }
  };

  // Delete node from Canvas
  const handleDeleteNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja remover este processo da Cadeia de Valor? As conexões vinculadas a ele também serão excluídas.')) {
      const filteredNodes = nodes.filter(n => n.id !== nodeId);
      const filteredConns = connections.filter(c => c.from !== nodeId && c.to !== nodeId);
      saveState(filteredNodes, filteredConns);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    }
  };

  // Create custom process from scratch
  const handleCreateCustomNode = () => {
    if (!newNodeLabel.trim()) return;
    
    const uniqueId = `custom_${Date.now()}`;
    const newAvailable: Omit<ProcessNode, 'x' | 'y'> = {
      id: uniqueId,
      label: newNodeLabel,
      category: newNodeCategory,
      description: newNodeDesc || 'Processo customizado criado pelo escritório de advocacia.'
    };

    const updatedAvailables = [...availableNodes, newAvailable];
    setAvailableNodes(updatedAvailables);
    localStorage.setItem('cadeia-valor-availables', JSON.stringify(updatedAvailables));

    // Reset Form
    setNewNodeLabel('');
    setNewNodeCategory('principal');
    setNewNodeDesc('');
    setShowNewNodeModal(false);
  };

  // Add custom Connection
  const handleCreateConnection = () => {
    if (!connFrom || !connTo || connFrom === connTo) {
      alert('Selecione dois blocos de processos diferentes para conectar.');
      return;
    }

    const uniqueId = `conn_${Date.now()}`;
    const newConn: Connection = {
      id: uniqueId,
      from: connFrom,
      to: connTo,
      label: connLabel.trim() || 'Processa e direciona'
    };

    const updatedConns = [...connections, newConn];
    saveState(nodes, updatedConns);

    // Reset Form
    setConnFrom('');
    setConnTo('');
    setConnLabel('');
    setShowNewConnModal(false);
  };

  // Delete connection
  const handleDeleteConnection = (connId: string) => {
    if (confirm('Deseja remover esta conexão entre os processos?')) {
      const filteredConns = connections.filter(c => c.id !== connId);
      saveState(nodes, filteredConns);
    }
  };

  // AI Agent Mappings using real Llama 3.1 70B Endpoint
  const handleGenerateWithAgent = async () => {
    setIsAiLoading(true);
    setAiStatusMsg('O Llama 3.1 70B está analisando a área selecionada e modelando os processos do escritório...');
    
    try {
      const response = await api.post('/ai/gestao/cadeia-valor/gerar', {
        officeArea: aiOfficeArea || 'Direito de Família',
        prompt: aiPrompt
      });

      const { nodes: aiNodes, connections: aiConns } = response.data;

      const mappedNodes: ProcessNode[] = (aiNodes || []).map((n: any) => ({
        id: n.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        label: n.label || 'Setor Sem Nome',
        category: n.category === 'support' ? 'apoio' : 'principal',
        description: n.description || `Mapeamento operacional da etapa de ${n.label || 'processo'}.`,
        x: Number(n.x) || 200,
        y: Number(n.y) || 200
      }));

      const mappedConns: Connection[] = (aiConns || []).map((c: any) => ({
        id: c.id || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        from: c.from,
        to: c.to,
        label: c.label || 'Direcionamento de fluxo'
      }));

      saveState(mappedNodes, mappedConns);
      setShowAiModal(false);
    } catch (error: any) {
      console.error('[AI Chain Generation Error]', error);
      alert('Falha ao gerar mapeamento estratégico com a IA: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsAiLoading(false);
    }
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const state = history[prevIndex];
      setNodes(state.nodes);
      setConnections(state.connections);
      setHistoryIndex(prevIndex);
      localStorage.setItem('cadeia-valor-nodes', JSON.stringify(state.nodes));
      localStorage.setItem('cadeia-valor-connections', JSON.stringify(state.connections));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      setNodes(state.nodes);
      setConnections(state.connections);
      setHistoryIndex(nextIndex);
      localStorage.setItem('cadeia-valor-nodes', JSON.stringify(state.nodes));
      localStorage.setItem('cadeia-valor-connections', JSON.stringify(state.connections));
    }
  };

  // Calculate SVG connector paths dynamically
  const drawConnectorPath = (conn: Connection) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode) return { path: '', textX: 0, textY: 0 };

    // Cards are 280px wide and ~95px tall
    // Determine connection points (centers or borders)
    const fromX = fromNode.x + 280;
    const fromY = fromNode.y + 47;
    
    const toX = toNode.x;
    const toY = toNode.y + 47;

    // Curved cubic bezier curve
    const controlOffset = Math.abs(toX - fromX) / 2;
    const path = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;

    // Text position (midpoint of curve)
    const textX = (fromX + toX) / 2;
    const textY = (fromY + toY) / 2 - 10;

    return { path, textX, textY };
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#090E17] text-slate-800 dark:text-slate-100 select-none overflow-hidden relative">
      {/* Upper header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0F172A]/70 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4F73F5]/10 rounded-xl">
            <Network size={20} className="text-[#4F73F5]" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-800 dark:text-white">Mapa de Cadeia de Valor</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Configure e visualize toda a cadeia de processos estratégicos do escritório</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI trigger */}
          <button 
            onClick={() => setShowAiModal(true)}
            disabled={isAiLoading}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#4F73F5] to-[#7C3AED] hover:from-[#4062E0] hover:to-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/10 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles size={14} className={isAiLoading ? 'animate-spin' : ''} />
            {isAiLoading ? 'Mapeando com Agente...' : 'Gerar com Agente'}
          </button>
          
          <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10" />

          {/* Undo / Redo */}
          <button 
            onClick={handleUndo} 
            disabled={historyIndex <= 0}
            className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl disabled:opacity-30 transition-all"
            title="Desfazer"
          >
            <RotateCcw size={15} />
          </button>
          <button 
            onClick={handleRedo} 
            disabled={historyIndex >= history.length - 1}
            className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl disabled:opacity-30 transition-all"
            title="Refazer"
          >
            <RotateCw size={15} />
          </button>
        </div>
      </div>

      {/* Main split dashboard area */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Sidebar items */}
        <div className="w-80 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#0B1121] flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-6 flex-shrink-0">
          
          {/* Create custom process model button */}
          <button 
            onClick={() => setShowNewNodeModal(true)}
            className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-700 dark:text-white transition-all group"
          >
            <Plus size={15} className="text-[#4F73F5] group-hover:scale-125 transition-transform" />
            Criar Novo Modelo
          </button>

          {/* Link connections button */}
          <button 
            onClick={() => setShowNewConnModal(true)}
            className="w-full flex items-center justify-center gap-2 p-3 bg-[#4F73F5]/10 hover:bg-[#4F73F5]/20 border border-[#4F73F5]/20 rounded-2xl text-xs font-bold text-[#4F73F5] dark:text-[#6D8CFF] transition-all"
          >
            <Network size={14} />
            Conectar Processos
          </button>

          {/* Principais Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E2B755]" />
              Modelos Principais
            </h3>
            <div className="space-y-2">
              {availableNodes.filter(n => n.category === 'principal').map(item => {
                const onCanvas = nodes.some(n => n.id === item.id);
                return (
                  <div
                    key={item.id}
                    draggable={!onCanvas}
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`p-3 bg-slate-50 dark:bg-[#131B2B] border rounded-xl relative overflow-hidden transition-all group ${
                      onCanvas 
                        ? 'opacity-40 border-slate-100 dark:border-white/5 cursor-not-allowed' 
                        : 'border-slate-200 dark:border-white/5 hover:border-[#E2B755]/30 cursor-grab hover:bg-slate-100/50 dark:hover:bg-[#172238] active:cursor-grabbing'
                    }`}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#E2B755]/70" />
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-white tracking-wide">{item.label}</span>
                      {!onCanvas && (
                        <span className="text-[8px] font-bold text-[#E2B755] bg-[#E2B755]/10 px-1.5 py-0.5 rounded uppercase">Arrastar</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* De Apoio Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F73F5]" />
              Modelos de Apoio
            </h3>
            <div className="space-y-2">
              {availableNodes.filter(n => n.category === 'apoio').map(item => {
                const onCanvas = nodes.some(n => n.id === item.id);
                return (
                  <div
                    key={item.id}
                    draggable={!onCanvas}
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`p-3 bg-slate-50 dark:bg-[#131B2B] border rounded-xl relative overflow-hidden transition-all group ${
                      onCanvas 
                        ? 'opacity-40 border-slate-100 dark:border-white/5 cursor-not-allowed' 
                        : 'border-slate-200 dark:border-white/5 hover:border-[#4F73F5]/30 cursor-grab hover:bg-slate-100/50 dark:hover:bg-[#172238] active:cursor-grabbing'
                    }`}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#4F73F5]/70" />
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-white tracking-wide">{item.label}</span>
                      {!onCanvas && (
                        <span className="text-[8px] font-bold text-[#4F73F5] bg-[#4F73F5]/10 px-1.5 py-0.5 rounded uppercase">Arrastar</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Whiteboard canvas */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#F8FAFC] dark:bg-[#090E17]">
          {/* Instructions banner */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 p-3 rounded-xl bg-white/95 dark:bg-[#0F172A]/90 border border-slate-200 dark:border-white/5 shadow-2xl backdrop-blur-md max-w-sm">
            <BookOpen size={16} className="text-[#4F73F5] flex-shrink-0" />
            <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Arrastando os blocos da lateral, você constrói o mapa estratégico. <strong className="text-slate-800 dark:text-white">Dê um duplo clique</strong> em qualquer bloco no quadro para editar seu Briefing e Fluxo BPMN.
            </p>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1 p-1.5 bg-white/95 dark:bg-[#0F172A]/90 border border-slate-200 dark:border-white/5 rounded-2xl shadow-xl backdrop-blur-md">
            <button 
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[10px] font-bold px-2 text-slate-700 dark:text-white/70 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button 
              onClick={() => setZoom(1)}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
              title="Ajustar"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Connected Links details panel if selected */}
          {selectedNodeId && (
            <div className="absolute top-4 right-4 z-20 w-80 bg-white/95 dark:bg-[#0F172A]/95 border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
              {(() => {
                const node = nodes.find(n => n.id === selectedNodeId);
                if (!node) return null;
                const nodeConns = connections.filter(c => c.from === node.id || c.to === node.id);
                return (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${node.category === 'principal' ? 'bg-[#E2B755]' : 'bg-[#4F73F5]'}`} />
                        <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wide truncate max-w-[170px]">{node.label}</h4>
                      </div>
                      <button 
                        onClick={() => setSelectedNodeId(null)}
                        className="text-[9px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        Fechar
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                      {node.description}
                    </p>

                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Conexões Ativas ({nodeConns.length})</p>
                      {nodeConns.length > 0 ? (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                          {nodeConns.map(conn => {
                            const other = nodes.find(n => n.id === (conn.from === node.id ? conn.to : conn.from));
                            return (
                              <div key={conn.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-lg">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] text-slate-700 dark:text-white truncate font-medium">
                                    {conn.from === node.id ? 'Destino: ' : 'Origem: '}
                                    <span className="text-[#4F73F5] dark:text-[#6D8CFF]">{other?.label || 'Processo'}</span>
                                  </p>
                                  <p className="text-[8px] text-slate-500 dark:text-slate-400 italic truncate">"{conn.label}"</p>
                                </div>
                                <button 
                                  onClick={() => handleDeleteConnection(conn.id)}
                                  className="p-1 hover:text-red-400 text-slate-400 dark:text-slate-500 transition-colors"
                                  title="Remover conexão"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Sem conexões registradas</p>
                      )}
                    </div>

                    <button 
                      onClick={() => navigate(`/app/gestao/briefing/${node.id}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#4F73F5] hover:bg-[#4062E0] text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      Editar Briefing & BPMN
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* GRID CANVAS */}
          <div 
            ref={canvasRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex-1 w-full h-full relative cursor-grab bg-miro-grid overflow-hidden"
            style={{ 
              backgroundColor: isDark ? '#090E17' : '#F8FAFC'
            }}
          >
            {/* Whiteboard Scale Layer */}
            <div 
              className="absolute inset-0 origin-top-left p-12 transition-transform duration-100 ease-out"
              style={{ transform: `scale(${zoom})` }}
            >
              
              {/* SVG CONNECTOR LINES */}
              <svg className="absolute inset-0 w-[4000px] h-[4000px] pointer-events-none overflow-visible z-0">
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={isDark ? '#4F73F5' : '#3B82F6'} />
                  </marker>
                </defs>

                {connections.map(conn => {
                  const { path, textX, textY } = drawConnectorPath(conn);
                  if (!path) return null;
                  return (
                    <g key={conn.id} className="group pointer-events-auto cursor-pointer">
                      <path
                        d={path}
                        fill="none"
                        stroke={isDark ? '#4F73F5' : '#3B82F6'}
                        strokeWidth={2}
                        strokeDasharray="4,4"
                        markerEnd="url(#arrow)"
                        className="transition-all hover:stroke-[#E2B755] hover:stroke-[3px]"
                        onClick={() => {
                          if (confirm('Deseja remover esta conexão?')) {
                            handleDeleteConnection(conn.id);
                          }
                        }}
                      />
                      
                      {/* Connection Label Backdrop */}
                      <rect
                        x={textX - (conn.label.length * 3) - 6}
                        y={textY - 8}
                        width={(conn.label.length * 6) + 12}
                        height={16}
                        rx={4}
                        fill={isDark ? '#0F172A' : '#FFFFFF'}
                        stroke={isDark ? 'rgba(79, 115, 245, 0.2)' : 'rgba(59, 130, 246, 0.2)'}
                        strokeWidth={1}
                        className="group-hover:stroke-[#E2B755]"
                      />
                      {/* Connection Label */}
                      <text
                        x={textX}
                        y={textY + 3}
                        fill={isDark ? '#94A3B8' : '#475569'}
                        fontSize={8}
                        fontWeight="bold"
                        textAnchor="middle"
                        className="group-hover:fill-[#4F73F5] dark:group-hover:fill-white font-sans select-none"
                      >
                        {conn.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* DYNAMIC PROCESS NODES */}
              {nodes.map(node => (
                <div
                  key={node.id}
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onPointerMove={(e) => handleNodePointerMove(e, node)}
                  onPointerUp={(e) => handleNodePointerUp(e, node)}
                  onDoubleClick={() => navigate(`/app/gestao/briefing/${node.id}`)}
                  className={`absolute w-[280px] rounded-2xl p-4 bg-white dark:bg-[#131B2B] border cursor-move transition-shadow z-10 select-none ${
                    selectedNodeId === node.id 
                      ? 'border-[#E2B755] shadow-lg shadow-yellow-500/10' 
                      : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-lg dark:hover:shadow-2xl shadow-black/[0.03] dark:shadow-black/40'
                  }`}
                  style={{ 
                    left: node.x, 
                    top: node.y,
                    touchAction: 'none'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase ${
                      node.category === 'principal' 
                        ? 'bg-[#E2B755]/10 text-[#E2B755]' 
                        : 'bg-[#4F73F5]/10 text-[#4F73F5] dark:text-[#6D8CFF]'
                    }`}>
                      {node.category === 'principal' ? 'Principal' : 'Apoio'}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteNode(e, node.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-slate-400 dark:text-slate-500 transition-all p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md"
                      style={{ opacity: selectedNodeId === node.id ? 1 : undefined }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-1.5 tracking-wide line-clamp-1">{node.label}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-2">{node.description}</p>
                  
                  <div className="flex items-center justify-end text-[9px] font-bold text-[#4F73F5] dark:text-[#6D8CFF] hover:text-slate-800 dark:hover:text-white transition-colors gap-1 pt-1.5 border-t border-slate-100 dark:border-white/[0.04]">
                    <span>Briefing & BPMN</span>
                    <ChevronRight size={10} />
                  </div>
                </div>
              ))}

              {/* Render guidance if canvas is empty */}
              {nodes.length === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-8 bg-white dark:bg-[#131B2B]/60 rounded-3xl border border-slate-200 dark:border-white/5 text-center max-w-sm shadow-xl">
                  <Network size={40} className="text-slate-400 dark:text-slate-500 mb-4 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1.5">Quadro Branco Vazio</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    Arrastar processos do menu lateral para o quadro para desenhar o mapa do seu escritório.
                  </p>
                  <button 
                    onClick={() => setShowAiModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#4F73F5]/20 hover:bg-[#4F73F5]/30 text-[#4F73F5] dark:text-[#6D8CFF] border border-[#4F73F5]/20 rounded-xl text-xs font-bold"
                  >
                    <Sparkles size={13} />
                    Carregar Exemplo com IA
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* AI LOADING INTERLAY */}
      <AnimatePresence>
        {isAiLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/90 dark:bg-[#090E17]/90 z-[100] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent flex items-center justify-center rounded-full animate-spin">
                <div className="w-8 h-8 bg-gradient-to-tr from-[#4F73F5] to-[#7C3AED] rounded-full animate-pulse" />
              </div>
              <Sparkles size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-bounce" />
            </div>

            <h3 className="text-base font-bold text-white mb-2 tracking-tight">Agente IA de Processos</h3>
            <p className="text-xs text-slate-300 dark:text-slate-400 font-medium max-w-xs leading-relaxed animate-pulse">{aiStatusMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: CONFIGURAÇÃO DE IA LLAMA 3.1 */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Gerar com Agente Llama 3.1 70B</h3>
                </div>
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Fechar
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-medium">Área Jurídica do Escritório</label>
                  <input
                    type="text"
                    value={aiOfficeArea}
                    onChange={(e) => setAiOfficeArea(e.target.value)}
                    placeholder="Ex: Direito Trabalhista, Direito Tributário, Cível..."
                    className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-2.5 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-medium">Contexto Adicional (Opcional)</label>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: Foque na automação de petições iniciais, triagem rápida e compliance com a LGPD no pós-venda..."
                    className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-2.5 resize-none focus:ring-1 focus:ring-[#4F73F5] outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateWithAgent}
                className="w-full py-3 bg-gradient-to-r from-[#4F73F5] to-[#7C3AED] hover:from-[#4062E0] hover:to-[#6D28D9] text-white rounded-xl text-xs font-bold transition-all shadow-lg"
              >
                Gerar Cadeia Estratégica Completa
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE CUSTOM PROCESS ELEMENT */}
      <AnimatePresence>
        {showNewNodeModal && (
          <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Criar Novo Modelo de Processo</h3>
                <button 
                  onClick={() => setShowNewNodeModal(false)}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Fechar
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-medium">Nome do Processo / Setor</label>
                  <input
                    type="text"
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    placeholder="Ex: Atendimento Previdenciário"
                    className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-2.5 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-medium">Categoria</label>
                  <select
                    value={newNodeCategory}
                    onChange={(e) => setNewNodeCategory(e.target.value as 'principal' | 'apoio')}
                    className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-2.5 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                  >
                    <option value="principal">Principal (Intake, Contrato, Operação Jurídica)</option>
                    <option value="apoio">De Apoio (Financeiro, TI, Compliance, Marketing)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-medium">Descrição das Atividades</label>
                  <textarea
                    rows={3}
                    value={newNodeDesc}
                    onChange={(e) => setNewNodeDesc(e.target.value)}
                    placeholder="Quais tarefas são realizadas nesta etapa da cadeia do escritório?"
                    className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-2.5 resize-none focus:ring-1 focus:ring-[#4F73F5] outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateCustomNode}
                className="w-full py-3 bg-[#4F73F5] hover:bg-[#4062E0] text-white rounded-xl text-xs font-bold transition-all shadow-lg"
              >
                Salvar no Menu de Modelos
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE CONNECTION */}
      <AnimatePresence>
        {showNewConnModal && (
          <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Conectar Processos no Mapa</h3>
                <button 
                  onClick={() => setShowNewConnModal(false)}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Fechar
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-medium">Processo de Origem (Saída)</label>
                  <select
                    value={connFrom}
                    onChange={(e) => setConnFrom(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-2.5 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                  >
                    <option value="">Selecione o emissor...</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-medium">Processo de Destino (Entrada)</label>
                  <select
                    value={connTo}
                    onChange={(e) => setConnTo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-2.5 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                  >
                    <option value="">Selecione o receptor...</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-medium">Etiqueta da Conexão / Ação</label>
                  <input
                    type="text"
                    value={connLabel}
                    onChange={(e) => setConnLabel(e.target.value)}
                    placeholder="Ex: Direciona clientes de lead cível"
                    className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-2.5 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateConnection}
                className="w-full py-3 bg-[#4F73F5] hover:bg-[#4062E0] text-white rounded-xl text-xs font-bold transition-all shadow-lg"
              >
                Conectar Blocos
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
