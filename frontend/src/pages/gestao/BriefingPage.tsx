import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Workflow, 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Download, 
  Share2, 
  Plus, 
  Trash2, 
  Settings, 
  Database, 
  HelpCircle, 
  AlertCircle,
  Clock,
  User,
  Users,
  Compass,
  FileCode,
  Layout,
  Maximize2,
  Minimize2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// BPMN Node Types
type BpmnNodeType = 'start' | 'task' | 'gateway' | 'datastore' | 'end';

interface BpmnNode {
  id: string;
  type: BpmnNodeType;
  label: string;
  x: number;
  y: number;
  taskType?: 'user' | 'service' | 'script';
}

interface BpmnConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface ProcessDetails {
  objective: string;
  owner: string;
  actors: string;
  rules: string;
  dataCollected: string;
  systemsUsed: string;
  docsGenerated: string;
}

export default function BriefingPage() {
  const { id = 'atendimento' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'bpmn' | 'details' | 'lifecycle' | 'history'>('bpmn');

  // BPMN Canvas State
  const [nodes, setNodes] = useState<BpmnNode[]>([]);
  const [connections, setConnections] = useState<BpmnConnection[]>([]);
  
  // Swimlanes
  const [swimlanes, setSwimlanes] = useState<string[]>([
    'Coordenador de Atendimento ao Cliente',
    'Advogado Responsável'
  ]);
  
  // Form State
  const [details, setDetails] = useState<ProcessDetails>({
    objective: 'Realizar o primeiro contato com potenciais clientes, entendendo suas demandas iniciais e cadastrando no CRM.',
    owner: 'Coordenador de Atendimento / Flatin Sociedade de Advocacia',
    actors: 'Secretária(o), Advogado(a) Plantonista, Inteligência Artificial',
    rules: 'Retornar o contato em no máximo 15 minutos. Caso o lead seja qualificado para cível/trabalhista, agendar reunião.',
    dataCollected: 'Nome Completo, WhatsApp, E-mail, Relato dos Fatos, Documento de Identidade, Comprovante de Residência.',
    systemsUsed: 'CRM LegalDesk, WhatsApp Business API, Google Drive.',
    docsGenerated: 'Ficha de Pré-Cadastro, Ficha de Qualificação do Caso.'
  });

  // History timeline log
  const [historyLogs, setHistoryLogs] = useState<Array<{ id: string; date: string; action: string; author: string }>>([
    { id: 'h1', date: '21/05/2026 19:30', action: 'Fluxo BPMN otimizado com triagem de IA', author: 'Dr. Flatin' },
    { id: 'h2', date: '18/05/2026 14:15', action: 'Atualização de campos de triagem e regras', author: 'Dra. Victória' },
    { id: 'h3', date: '15/05/2026 09:00', action: 'Criação do briefing e mapeamento inicial do setor', author: 'Admin' }
  ]);

  // UI States
  const [zoom, setZoom] = useState(1);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isConnectingMode, setIsConnectingMode] = useState(false);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  
  // AI Loader
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatusText, setAiStatusText] = useState('');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Get localized label for titles
  const getProcessLabel = () => {
    switch (id) {
      case 'triagem': return 'Triagem e Qualificação';
      case 'previdenciario': return 'Assessoria Previdenciária';
      case 'trabalhista': return 'Assessoria Trabalhista';
      case 'fechamento': return 'Fechamento de Contratos';
      case 'financeiro': return 'Financeiro e Custos';
      case 'atendimento': return 'Atendimento ao Cliente';
      default: 
        return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  // Load state from localStorage on mount
  useEffect(() => {
    const savedNodes = localStorage.getItem(`bpmn-nodes-${id}`);
    const savedConns = localStorage.getItem(`bpmn-connections-${id}`);
    const savedDetails = localStorage.getItem(`bpmn-details-${id}`);
    
    if (savedNodes && savedConns) {
      try {
        setNodes(JSON.parse(savedNodes));
        setConnections(JSON.parse(savedConns));
      } catch (e) {}
    } else {
      // Set a perfect default BPMN diagram based on the image
      const initialNodes: BpmnNode[] = [
        { id: 'b_start', type: 'start', label: 'Solicitação de Atendimento Recebida', x: 80, y: 120 },
        { id: 'b_task1', type: 'task', label: 'Registrar Solicitação no CRM', x: 260, y: 100, taskType: 'service' },
        { id: 'b_task2', type: 'task', label: 'Realizar Triagem Inicial e Entrevista', x: 500, y: 100, taskType: 'user' },
        { id: 'b_gateway', type: 'gateway', label: 'Necessidade Identificada?', x: 740, y: 100 },
        { id: 'b_task3', type: 'task', label: 'Elaborar Proposta e Agendar Consulta', x: 880, y: 220, taskType: 'user' },
        { id: 'b_end', type: 'end', label: 'Atendimento Finalizado', x: 1120, y: 240 }
      ];

      const initialConns: BpmnConnection[] = [
        { id: 'bc1', from: 'b_start', to: 'b_task1' },
        { id: 'bc2', from: 'b_task1', to: 'b_task2' },
        { id: 'bc3', from: 'b_task2', to: 'b_gateway' },
        { id: 'bc4', from: 'b_gateway', to: 'b_task3', label: 'Sim' },
        { id: 'bc5', from: 'b_task3', to: 'b_end' }
      ];

      setNodes(initialNodes);
      setConnections(initialConns);
    }

    if (savedDetails) {
      try {
        setDetails(JSON.parse(savedDetails));
      } catch (e) {}
    }
  }, [id]);

  // Save current values to localStorage
  const handleSave = () => {
    localStorage.setItem(`bpmn-nodes-${id}`, JSON.stringify(nodes));
    localStorage.setItem(`bpmn-connections-${id}`, JSON.stringify(connections));
    localStorage.setItem(`bpmn-details-${id}`, JSON.stringify(details));
    
    // Add history entry
    const newLog = {
      id: `h_${Date.now()}`,
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      action: 'Alterações salvas manualmente pelo advogado',
      author: 'Usuário Conectado'
    };
    const updatedLogs = [newLog, ...historyLogs];
    setHistoryLogs(updatedLogs);
    
    alert('Processo e fluxograma BPMN salvos com sucesso!');
  };

  // Add shapes from Toolbox
  const handleSpawnShape = (type: BpmnNodeType) => {
    const uniqueId = `${type}_${Date.now()}`;
    
    let defaultLabel = 'Nova Forma';
    let taskType: BpmnNode['taskType'] = undefined;
    
    switch (type) {
      case 'start': defaultLabel = 'Início do Fluxo'; break;
      case 'task': 
        defaultLabel = 'Nova Atividade'; 
        taskType = 'user';
        break;
      case 'gateway': defaultLabel = 'Decisão?'; break;
      case 'datastore': defaultLabel = 'Armazenar Dados'; break;
      case 'end': defaultLabel = 'Fim do Fluxo'; break;
    }

    const newNode: BpmnNode = {
      id: uniqueId,
      type,
      label: defaultLabel,
      x: 300,
      y: 150,
      taskType
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeId(uniqueId);
  };

  // Pointer drag event handlers for shapes (React 19 compatible)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, node: BpmnNode) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    
    if (isConnectingMode) {
      if (!connectFromId) {
        setConnectFromId(node.id);
      } else if (connectFromId !== node.id) {
        // Connect nodes
        const newConn: BpmnConnection = {
          id: `bc_${Date.now()}`,
          from: connectFromId,
          to: node.id,
          label: ''
        };
        setConnections([...connections, newConn]);
        setConnectFromId(null);
        setIsConnectingMode(false);
      }
      return;
    }

    setActiveDragId(node.id);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, node: BpmnNode) => {
    if (activeDragId !== node.id || !canvasRef.current) return;
    e.stopPropagation();

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - canvasRect.left) / zoom - dragOffset.current.x);
    const y = Math.round((e.clientY - canvasRect.top) / zoom - dragOffset.current.y);

    const updatedNodes = nodes.map(n => 
      n.id === node.id ? { ...n, x: Math.max(20, x), y: Math.max(20, y) } : n
    );
    setNodes(updatedNodes);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>, node: BpmnNode) => {
    if (activeDragId === node.id) {
      e.stopPropagation();
      setActiveDragId(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Edit Node Label on Double Click
  const handleDoubleClickNode = (node: BpmnNode) => {
    const newLabel = prompt('Edite a descrição/título da etapa:', node.label);
    if (newLabel !== null) {
      setNodes(nodes.map(n => n.id === node.id ? { ...n, label: newLabel } : n));
    }
  };

  // Delete selected node
  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Toggle connection mode
  const handleStartConnection = () => {
    setIsConnectingMode(true);
    setConnectFromId(null);
  };

  // "Atualizar com IA" Simulation
  const handleAiUpdate = () => {
    setIsAiProcessing(true);
    setAiStatusText('Agente de Processos IA revisando seu diagrama de fluxo...');
    
    setTimeout(() => {
      setAiStatusText('Identificando gargalos de triagem jurídica...');
    }, 1000);

    setTimeout(() => {
      setAiStatusText('Implementando Gateway de qualificação técnica por IA e base de dados...');
    }, 2000);

    setTimeout(() => {
      // Enhanced BPMN flowchart generated by AI
      const aiNodes: BpmnNode[] = [
        { id: 'b_start', type: 'start', label: 'Solicitação de Atendimento Recebida', x: 80, y: 120 },
        { id: 'b_task1', type: 'task', label: 'Registrar Solicitação no CRM', x: 260, y: 100, taskType: 'service' },
        { id: 'b_task2', type: 'task', label: 'Triagem Técnica com IA Generativa', x: 500, y: 100, taskType: 'service' },
        { id: 'b_gateway', type: 'gateway', label: 'Cliente possui viabilidade jurídica?', x: 760, y: 100 },
        { id: 'b_task3', type: 'task', label: 'Agendar Consulta com Especialista', x: 920, y: 100, taskType: 'user' },
        { id: 'b_task4', type: 'task', label: 'Enviar Informativo e Arquivar Lead', x: 920, y: 260, taskType: 'service' },
        { id: 'b_datastore', type: 'datastore', label: 'Banco de Dados Jurídicos', x: 740, y: 380 },
        { id: 'b_end1', type: 'end', label: 'Lead Encaminhado p/ Fechamento', x: 1160, y: 120 },
        { id: 'b_end2', type: 'end', label: 'Lead Arquivado', x: 1160, y: 280 }
      ];

      const aiConns: BpmnConnection[] = [
        { id: 'bc1', from: 'b_start', to: 'b_task1' },
        { id: 'bc2', from: 'b_task1', to: 'b_task2' },
        { id: 'bc3', from: 'b_task2', to: 'b_gateway' },
        { id: 'bc4', from: 'b_gateway', to: 'b_task3', label: 'Sim' },
        { id: 'bc5', from: 'b_gateway', to: 'b_task4', label: 'Não' },
        { id: 'bc6', from: 'b_task3', to: 'b_end1' },
        { id: 'bc7', from: 'b_task4', to: 'b_end2' },
        { id: 'bc8', from: 'b_task2', to: 'b_datastore', label: 'Salva logs' }
      ];

      setNodes(aiNodes);
      setConnections(aiConns);
      
      // Update form rules with intelligent recommendations
      setDetails({
        ...details,
        objective: 'Triagem e qualificação instantânea com IA generativa para otimizar os tempos de resposta e focar a atuação jurídica.',
        rules: 'Todos os leads de entrada passam pela triagem de IA inicial. Caso a nota de viabilidade técnica seja superior a 7.5/10, o agendamento de consulta de honorários é disparado no calendário do advogado de forma automatizada.',
        systemsUsed: 'CRM LegalDesk, API Gemini Advanced, WhatsApp Bot Automation.'
      });

      // Add to timeline
      const newLog = {
        id: `h_${Date.now()}`,
        date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
        action: 'Fluxograma BPMN otimizado e reestruturado pelo Agente IA',
        author: 'Antigravity AI Agent'
      };
      setHistoryLogs([newLog, ...historyLogs]);

      setIsAiProcessing(false);
    }, 3200);
  };

  // Export mock flow
  const handleExport = (format: 'xml' | 'png' | 'pdf') => {
    alert(`Exportando fluxograma de "${getProcessLabel()}" no formato ${format.toUpperCase()}.\nMock gerado com sucesso!`);
  };

  // Calculate connection arrows
  const drawNodeConnector = (conn: BpmnConnection) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode) return { path: '', textX: 0, textY: 0 };

    // Set connection offsets depending on shape dimensions
    const fromWidth = fromNode.type === 'task' ? 180 : fromNode.type === 'gateway' ? 60 : 40;
    const fromHeight = fromNode.type === 'task' ? 64 : fromNode.type === 'gateway' ? 60 : 40;
    
    const toWidth = toNode.type === 'task' ? 180 : toNode.type === 'gateway' ? 60 : 40;
    const toHeight = toNode.type === 'task' ? 64 : toNode.type === 'gateway' ? 60 : 40;

    const fromX = fromNode.x + fromWidth;
    const fromY = fromNode.y + fromHeight / 2;
    
    const toX = toNode.x;
    const toY = toNode.y + toHeight / 2;

    const controlOffset = Math.abs(toX - fromX) / 2;
    const path = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;

    const textX = (fromX + toX) / 2;
    const textY = (fromY + toY) / 2 - 10;

    return { path, textX, textY };
  };

  return (
    <div className="flex flex-col h-full bg-[#090E17] text-slate-100 select-none overflow-hidden relative">
      
      {/* HEADER BAR */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-white/5 bg-[#0F172A]/70 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/app/gestao/cadeia-valor')}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="Voltar para Cadeia de Valor"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="w-[1px] h-6 bg-white/10" />

          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4F73F5]/10 rounded-xl">
              <Workflow size={18} className="text-[#4F73F5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white">{getProcessLabel()}</h1>
                <span className="text-[8px] font-bold bg-[#4F73F5]/10 text-[#6D8CFF] px-1.5 py-0.5 rounded-md uppercase">Briefing de Processo</span>
              </div>
              <p className="text-[10px] text-slate-400">Flatin Sociedade de Advocacia • Mapeamento estratégico BPMN</p>
            </div>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleAiUpdate}
            disabled={isAiProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/20 text-[#C084FC] rounded-xl text-[11px] font-bold transition-all"
          >
            <Sparkles size={12} className={isAiProcessing ? 'animate-spin' : ''} />
            Atualizar com IA
          </button>

          <div className="w-[1px] h-6 bg-white/10" />

          {/* Exporters */}
          <button 
            onClick={() => handleExport('xml')}
            className="px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 text-[10px] font-bold text-slate-300 rounded-lg transition-all"
          >
            XML
          </button>
          <button 
            onClick={() => handleExport('png')}
            className="px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 text-[10px] font-bold text-slate-300 rounded-lg transition-all"
          >
            PNG
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            className="px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 text-[10px] font-bold text-slate-300 rounded-lg transition-all"
          >
            PDF
          </button>

          <div className="w-[1px] h-6 bg-white/10" />

          <button 
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#4F73F5] hover:bg-[#4062E0] text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Save size={14} />
            Salvar Briefing
          </button>
        </div>
      </div>

      {/* TABS SELECTOR BAR */}
      <div className="flex h-11 border-b border-white/5 bg-[#0B1121] px-6 gap-6 z-25">
        <button 
          onClick={() => setActiveTab('bpmn')}
          className={`h-full text-xs font-bold relative transition-all ${
            activeTab === 'bpmn' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Diagrama BPMN
          {activeTab === 'bpmn' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4F73F5] rounded-t-full" />}
        </button>
        
        <button 
          onClick={() => setActiveTab('details')}
          className={`h-full text-xs font-bold relative transition-all ${
            activeTab === 'details' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Detalhamento do Processo
          {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4F73F5] rounded-t-full" />}
        </button>
        
        <button 
          onClick={() => setActiveTab('lifecycle')}
          className={`h-full text-xs font-bold relative transition-all ${
            activeTab === 'lifecycle' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ciclo de Vida da Inf.
          {activeTab === 'lifecycle' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4F73F5] rounded-t-full" />}
        </button>
        
        <button 
          onClick={() => setActiveTab('history')}
          className={`h-full text-xs font-bold relative transition-all ${
            activeTab === 'history' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Histórico
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4F73F5] rounded-t-full" />}
        </button>
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ==========================================
            TAB: DIAGRAMA BPMN (WHITEBOARD CANVAS)
            ========================================== */}
        {activeTab === 'bpmn' && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left toolbox for shapes */}
            <div className="w-56 border-r border-white/5 bg-[#0B1121] flex flex-col p-4 space-y-4 flex-shrink-0">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Elementos BPMN</h3>
              
              <div className="space-y-2">
                {/* Start Shape */}
                <button 
                  onClick={() => handleSpawnShape('start')}
                  className="w-full flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.04] rounded-xl text-left transition-all"
                >
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-300">Evento de Início</span>
                </button>

                {/* Task Shape */}
                <button 
                  onClick={() => handleSpawnShape('task')}
                  className="w-full flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 hover:border-[#4F73F5]/20 hover:bg-white/[0.04] rounded-xl text-left transition-all"
                >
                  <div className="w-9 h-6 rounded-md border-2 border-[#4F73F5] bg-[#4F73F5]/10 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-300">Tarefa / Atividade</span>
                </button>

                {/* Gateway Decision Shape */}
                <button 
                  onClick={() => handleSpawnShape('gateway')}
                  className="w-full flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 hover:border-yellow-500/20 hover:bg-white/[0.04] rounded-xl text-left transition-all"
                >
                  <div className="w-6 h-6 rotate-45 border-2 border-yellow-500 bg-yellow-500/10 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-300">Gateway (Decisão)</span>
                </button>

                {/* Database Shape */}
                <button 
                  onClick={() => handleSpawnShape('datastore')}
                  className="w-full flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 hover:border-slate-500/20 hover:bg-white/[0.04] rounded-xl text-left transition-all"
                >
                  <Database size={20} className="text-slate-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-300">Banco de Dados</span>
                </button>

                {/* End Shape */}
                <button 
                  onClick={() => handleSpawnShape('end')}
                  className="w-full flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 hover:border-red-500/20 hover:bg-white/[0.04] rounded-xl text-left transition-all"
                >
                  <div className="w-6 h-6 rounded-full border-[3px] double border-red-500 bg-red-500/10 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-300">Evento de Fim</span>
                </button>
              </div>

              <div className="h-[1px] bg-white/5 my-2" />

              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ações do Quadro</h3>
              
              <button 
                onClick={handleStartConnection}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 border rounded-xl text-xs font-bold transition-all ${
                  isConnectingMode 
                    ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' 
                    : 'bg-[#4F73F5]/10 border-[#4F73F5]/20 text-[#6D8CFF] hover:bg-[#4F73F5]/20'
                }`}
              >
                <Workflow size={13} />
                {isConnectingMode ? 'Clique em 2 formas' : 'Criar Link Seta'}
              </button>

              {selectedNodeId && (
                <button 
                  onClick={() => handleDeleteNode(selectedNodeId)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all"
                >
                  <Trash2 size={13} />
                  Excluir Selecionado
                </button>
              )}
            </div>

            {/* WHITEBOARD BPMN CANVAS AREA */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-[#090E17]">
              
              {/* Floating guidance banner */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 p-2.5 rounded-xl bg-[#0F172A]/90 border border-white/5 shadow-2xl backdrop-blur-md max-w-sm">
                <HelpCircle size={15} className="text-[#4F73F5] flex-shrink-0" />
                <p className="text-[9px] text-slate-400 leading-normal">
                  <span className="text-white font-bold">Duplo clique</span> nas formas para renomear. Clique em "Criar Link Seta" para traçar setas direcionais conectando as etapas de fluxo.
                </p>
              </div>

              {/* Zoom adjustments */}
              <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1 p-1 bg-[#0F172A]/90 border border-white/5 rounded-2xl shadow-xl backdrop-blur-md">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 text-slate-400 hover:text-white rounded-lg"><Minimize2 size={12} /></button>
                <span className="text-[9px] font-bold px-2 text-white/50">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 text-slate-400 hover:text-white rounded-lg"><Maximize2 size={12} /></button>
              </div>

              {/* Interactive whiteboard grid layout */}
              <div 
                ref={canvasRef}
                className="flex-1 w-full h-full relative cursor-grab bg-dot-pattern text-slate-700 overflow-hidden"
                style={{ 
                  backgroundColor: '#090E17',
                  color: 'rgba(255, 255, 255, 0.04)'
                }}
              >
                {/* Scaled layer container */}
                <div 
                  className="absolute inset-0 origin-top-left p-12 transition-transform duration-100 ease-out"
                  style={{ transform: `scale(${zoom})` }}
                >
                  
                  {/* SWIMLANES (Raias de atores) */}
                  <div className="absolute top-0 left-0 w-[2000px] pointer-events-none select-none z-0">
                    {swimlanes.map((lane, idx) => (
                      <div 
                        key={idx} 
                        className="h-72 border-b border-white/[0.04] flex items-center relative"
                        style={{ borderTop: idx === 0 ? '1px solid rgba(255, 255, 255, 0.04)' : undefined }}
                      >
                        {/* Swimlane Label Banner */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#0F172A] border-r border-white/5 flex items-center justify-center p-2 text-center">
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 transform -rotate-90 origin-center whitespace-nowrap">
                            {lane}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SVG CONNECTING FLOWS */}
                  <svg className="absolute inset-0 w-[3000px] h-[3000px] pointer-events-none overflow-visible z-5">
                    <defs>
                      <marker
                        id="bpmn-arrow"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4F73F5" />
                      </marker>
                    </defs>

                    {connections.map(conn => {
                      const { path, textX, textY } = drawNodeConnector(conn);
                      if (!path) return null;
                      return (
                        <g key={conn.id} className="group pointer-events-auto cursor-pointer">
                          <path
                            d={path}
                            fill="none"
                            stroke="#4F73F5"
                            strokeWidth={2}
                            markerEnd="url(#bpmn-arrow)"
                            className="transition-all hover:stroke-[#E2B755] hover:stroke-[3px]"
                            onClick={() => {
                              if (confirm('Deseja deletar esta conexão do fluxo?')) {
                                setConnections(connections.filter(c => c.id !== conn.id));
                              }
                            }}
                          />
                          
                          {conn.label && (
                            <>
                              <rect
                                x={textX - (conn.label.length * 3) - 4}
                                y={textY - 8}
                                width={(conn.label.length * 6) + 8}
                                height={14}
                                rx={3}
                                fill="#090E17"
                                stroke="rgba(79, 115, 245, 0.15)"
                              />
                              <text
                                x={textX}
                                y={textY + 2}
                                fill="#94A3B8"
                                fontSize={7}
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                {conn.label}
                              </text>
                            </>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* RENDER DYNAMIC BPMN SHAPES */}
                  {nodes.map(node => {
                    const isSelected = selectedNodeId === node.id;
                    const isConnectionTarget = isConnectingMode && connectFromId === node.id;

                    return (
                      <div
                        key={node.id}
                        onPointerDown={(e) => handlePointerDown(e, node)}
                        onPointerMove={(e) => handlePointerMove(e, node)}
                        onPointerUp={(e) => handlePointerUp(e, node)}
                        onDoubleClick={() => handleDoubleClickNode(node)}
                        className={`absolute flex flex-col items-center justify-center cursor-move text-center select-none z-10 touch-none group ${
                          isSelected 
                            ? 'ring-2 ring-[#4F73F5] shadow-lg shadow-blue-500/10' 
                            : isConnectionTarget 
                            ? 'ring-2 ring-yellow-500 animate-pulse'
                            : ''
                        }`}
                        style={{ 
                          left: node.x, 
                          top: node.y,
                        }}
                      >
                        {/* Event Start (Circle) */}
                        {node.type === 'start' && (
                          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-[#0F172A]/90 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
                          </div>
                        )}

                        {/* Task / Process (Rounded Rectangle) */}
                        {node.type === 'task' && (
                          <div className="w-[180px] h-16 rounded-xl border border-[#4F73F5]/80 bg-[#131B2B]/95 p-3 flex flex-col justify-between items-start shadow-xl">
                            <span className="text-[7px] font-black uppercase text-slate-500 flex items-center gap-1">
                              {node.taskType === 'service' ? 'Engrenagem (Automático)' : 'Usuário (Manual)'}
                            </span>
                            <p className="text-[10px] font-bold text-white leading-snug text-left truncate w-full">{node.label}</p>
                          </div>
                        )}

                        {/* Gateway Decision (Diamond) */}
                        {node.type === 'gateway' && (
                          <div className="w-14 h-14 rotate-45 border border-yellow-500/80 bg-[#131B2B]/90 flex items-center justify-center shadow-xl">
                            <div className="-rotate-45 font-black text-xs text-yellow-500">+</div>
                          </div>
                        )}

                        {/* Data Store (Cylinder) */}
                        {node.type === 'datastore' && (
                          <div className="w-12 h-12 flex flex-col items-center justify-center">
                            <Database size={24} className="text-slate-400 mb-1" />
                          </div>
                        )}

                        {/* End Event (Double Circle) */}
                        {node.type === 'end' && (
                          <div className="w-10 h-10 rounded-full border-[3px] border-red-500 bg-[#0F172A]/90 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-red-500" />
                          </div>
                        )}

                        {/* Node Name/Label below circle/diamond/database nodes */}
                        {node.type !== 'task' && (
                          <span className="absolute -bottom-6 w-36 text-[9px] font-semibold text-slate-300 truncate font-sans">
                            {node.label}
                          </span>
                        )}
                        
                      </div>
                    );
                  })}

                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            TAB: DETALHAMENTO DO PROCESSO
            ========================================== */}
        {activeTab === 'details' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 max-w-4xl mx-auto w-full space-y-6">
            <div className="bg-[#131B2B] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white pb-3 border-b border-white/5 flex items-center gap-2">
                <FileText size={16} className="text-[#4F73F5]" />
                Objetivos e Atores Principais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Objetivo do Processo</label>
                  <textarea
                    rows={4}
                    value={details.objective}
                    onChange={(e) => setDetails({ ...details, objective: e.target.value })}
                    className="w-full bg-[#1C263A] border-white/5 text-white rounded-xl p-3 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Regras de Negócio e SLAs</label>
                  <textarea
                    rows={4}
                    value={details.rules}
                    onChange={(e) => setDetails({ ...details, rules: e.target.value })}
                    className="w-full bg-[#1C263A] border-white/5 text-white rounded-xl p-3 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Dono / Responsável pelo Setor</label>
                  <input
                    type="text"
                    value={details.owner}
                    onChange={(e) => setDetails({ ...details, owner: e.target.value })}
                    className="w-full bg-[#1C263A] border-white/5 text-white rounded-xl p-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Atores Operacionais Envolvidos</label>
                  <input
                    type="text"
                    value={details.actors}
                    onChange={(e) => setDetails({ ...details, actors: e.target.value })}
                    className="w-full bg-[#1C263A] border-white/5 text-white rounded-xl p-3"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#131B2B] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white pb-3 border-b border-white/5 flex items-center gap-2">
                <Settings size={16} className="text-[#4F73F5]" />
                Raias de Organização (Swimlanes)
              </h3>

              <div className="space-y-3 text-xs">
                {swimlanes.map((lane, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={lane}
                      onChange={(e) => {
                        const newLanes = [...swimlanes];
                        newLanes[idx] = e.target.value;
                        setSwimlanes(newLanes);
                      }}
                      className="flex-1 bg-[#1C263A] border-white/5 text-white rounded-xl p-3"
                    />
                    <button 
                      onClick={() => setSwimlanes(swimlanes.filter((_, i) => i !== idx))}
                      className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                      title="Deletar raia"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => setSwimlanes([...swimlanes, 'Novo Ator de Processo'])}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#6D8CFF] hover:text-white transition-colors"
                >
                  <Plus size={12} />
                  Adicionar Raia de Ator
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: CICLO DE VIDA DA INFORMAÇÃO
            ========================================== */}
        {activeTab === 'lifecycle' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 max-w-4xl mx-auto w-full space-y-6">
            <div className="bg-[#131B2B] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white pb-3 border-b border-white/5 flex items-center gap-2">
                <Database size={16} className="text-[#4F73F5]" />
                Variáveis e Integrações do Ciclo de Informações
              </h3>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Dados e Variáveis Coletadas na Entrada</label>
                  <textarea
                    rows={3}
                    value={details.dataCollected}
                    onChange={(e) => setDetails({ ...details, dataCollected: e.target.value })}
                    className="w-full bg-[#1C263A] border-white/5 text-white rounded-xl p-3 resize-none"
                    placeholder="Quais dados são preenchidos nesta etapa?"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Sistemas e APIs Integrados</label>
                  <textarea
                    rows={3}
                    value={details.systemsUsed}
                    onChange={(e) => setDetails({ ...details, systemsUsed: e.target.value })}
                    className="w-full bg-[#1C263A] border-white/5 text-white rounded-xl p-3 resize-none"
                    placeholder="Quais softwares ou integrações são acionados?"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Documentos e Procurações Geradas na Etapa</label>
                  <textarea
                    rows={3}
                    value={details.docsGenerated}
                    onChange={(e) => setDetails({ ...details, docsGenerated: e.target.value })}
                    className="w-full bg-[#1C263A] border-white/5 text-white rounded-xl p-3 resize-none"
                    placeholder="Quais minutas de contratos ou procurações são geradas automáticas?"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: HISTÓRICO DE REVISÕES
            ========================================== */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 max-w-4xl mx-auto w-full">
            <div className="bg-[#131B2B] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
              <h3 className="text-sm font-bold text-white pb-3 border-b border-white/5 flex items-center gap-2">
                <Clock size={16} className="text-[#4F73F5]" />
                Linha do Tempo de Revisões do Setor
              </h3>

              <div className="relative border-l border-white/10 pl-6 ml-2 space-y-6">
                {historyLogs.map(log => (
                  <div key={log.id} className="relative text-xs">
                    {/* Circle Bullet */}
                    <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-[#4F73F5] border-2 border-[#131B2B]" />
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-bold tracking-wide">{log.action}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Editado por: <strong className="text-slate-300 font-medium">{log.author}</strong></p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500">{log.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* AI PROCESSING OVERLAY LAYER */}
      <AnimatePresence>
        {isAiProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#090E17]/90 z-[100] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative mb-6">
              <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent flex items-center justify-center rounded-full animate-spin">
                <div className="w-7 h-7 bg-gradient-to-tr from-[#4F73F5] to-[#7C3AED] rounded-full animate-pulse" />
              </div>
              <Sparkles size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-bounce" />
            </div>

            <h3 className="text-sm font-bold text-white mb-1.5 tracking-tight">Otimizador BPMN IA</h3>
            <p className="text-[11px] text-slate-400 font-medium max-w-xs leading-relaxed animate-pulse">{aiStatusText}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
