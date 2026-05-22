import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Workflow, 
  Play, 
  CheckSquare, 
  HelpCircle, 
  Database, 
  Square,
  Sparkles,
  Download,
  FileCode,
  Image as ImageIcon,
  FileText,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Settings,
  ListTodo,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  Clock,
  History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface BpmnNode {
  id: string;
  type: 'start' | 'task' | 'gateway' | 'data' | 'end';
  label: string;
  x: number;
  y: number;
  taskType?: 'user' | 'service' | 'send' | 'receive';
}

interface BpmnConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface DetailState {
  objective: string;
  owner: string;
  actors: string;
  rules: string;
  dataCollected: string;
  systemsUsed: string;
  docsGenerated: string;
}

// Interface for the process template
interface BpmnTemplate {
  nodes: BpmnNode[];
  connections: BpmnConnection[];
  details: DetailState;
}

// Function to serve contextual BPMN process templates based on Mindmap ID
const getDefaultBPMNData = (processId: string): BpmnTemplate => {
  switch (processId) {
    case 'triagem':
      return {
        nodes: [
          { id: 't_start', type: 'start', label: 'Lead Recebido', x: 80, y: 120 },
          { id: 't_task1', type: 'task', label: 'Verificar Score Cadastral via API', x: 230, y: 100, taskType: 'service' },
          { id: 't_task2', type: 'task', label: 'Validar Conflito de Interesses', x: 450, y: 100, taskType: 'user' },
          { id: 't_gateway', type: 'gateway', label: 'Score Aprovado?', x: 670, y: 100 },
          { id: 't_task3', type: 'task', label: 'Agendar Entrevista com Advogado', x: 800, y: 100, taskType: 'user' },
          { id: 't_task4', type: 'task', label: 'Recusar Lead via WhatsApp', x: 800, y: 250, taskType: 'service' },
          { id: 't_end1', type: 'end', label: 'Fim: Lead Triado', x: 1050, y: 120 },
          { id: 't_end2', type: 'end', label: 'Fim: Lead Negado', x: 1050, y: 270 }
        ],
        connections: [
          { id: 'tc1', from: 't_start', to: 't_task1' },
          { id: 'tc2', from: 't_task1', to: 't_task2' },
          { id: 'tc3', from: 't_task2', to: 't_gateway' },
          { id: 'tc4', from: 't_gateway', to: 't_task3', label: 'Sim' },
          { id: 'tc5', from: 't_gateway', to: 't_task4', label: 'Não' },
          { id: 'tc6', from: 't_task3', to: 't_end1' },
          { id: 'tc7', from: 't_task4', to: 't_end2' }
        ],
        details: {
          objective: 'Realizar a primeira triagem técnica, comercial e de compliance dos leads que entram no escritório.',
          owner: 'Setor de Admissões (Intake)',
          actors: 'Secretária de Triagem, Dr. Renato Lemos, Robô de Score cadastral',
          rules: 'Todos os leads novos devem passar pela consulta de score em menos de 15 minutos úteis. Demandas fora da área do escritório devem ser sumariamente recusadas.',
          dataCollected: 'Nome do interessado, CPF/CNPJ, E-mail, Resumo do caso, Score cadastral.',
          systemsUsed: 'CRM Interno, WhatsApp Business Sandbox, API Receita Federal.',
          docsGenerated: 'Relatório Preliminar de Triagem de Caso, Termo de Declínio.'
        }
      };
    case 'previdenciario':
      return {
        nodes: [
          { id: 'p_start', type: 'start', label: 'Requerente Previdenciário Recebido', x: 80, y: 120 },
          { id: 'p_task1', type: 'task', label: 'Importar CNIS do Portal Meu INSS', x: 230, y: 100, taskType: 'service' },
          { id: 'p_task2', type: 'task', label: 'Calcular Tempo de Contribuição', x: 450, y: 100, taskType: 'user' },
          { id: 'p_gateway', type: 'gateway', label: 'Atingiu Direito Adquirido?', x: 670, y: 100 },
          { id: 'p_task3', type: 'task', label: 'Elaborar Requerimento INSS', x: 800, y: 100, taskType: 'user' },
          { id: 'p_task4', type: 'task', label: 'Simular Regras de Transição', x: 800, y: 250, taskType: 'user' },
          { id: 'p_end1', type: 'end', label: 'Protocolo de Benefício Efetuado', x: 1050, y: 120 },
          { id: 'p_end2', type: 'end', label: 'Parecer Planejamento Concluído', x: 1050, y: 270 }
        ],
        connections: [
          { id: 'pc1', from: 'p_start', to: 'p_task1' },
          { id: 'pc2', from: 'p_task1', to: 'p_task2' },
          { id: 'pc3', from: 'p_task2', to: 'p_gateway' },
          { id: 'pc4', from: 'p_gateway', to: 'p_task3', label: 'Sim' },
          { id: 'pc5', from: 'p_gateway', to: 'p_task4', label: 'Não' },
          { id: 'pc6', from: 'p_task3', to: 'p_end1' },
          { id: 'pc7', from: 'p_task4', to: 'p_end2' }
        ],
        details: {
          objective: 'Estruturar o requerimento administrativo de aposentadoria ou benefício no INSS de forma 100% qualificada.',
          owner: 'Setor de Direito Previdenciário',
          actors: 'Advogado Previdenciário Sênior, Assistente de Cálculos, Portal Meu INSS',
          rules: 'Nenhum requerimento de aposentadoria por tempo de contribuição deve ser feito sem a planilha de cálculo de transição anexada ao prontuário.',
          dataCollected: 'CPF do segurado, Senha GOV.br, Períodos especiais de trabalho (PPP), CNIS completo.',
          systemsUsed: 'Portal Meu INSS, Calculadora de Tempo Previdenciário, Plataforma Integrada.',
          docsGenerated: 'Petição Administrativa de Aposentadoria, Parecer de Planejamento Previdenciário.'
        }
      };
    case 'financeiro':
      return {
        nodes: [
          { id: 'f_start', type: 'start', label: 'Contrato Assinado com Cliente', x: 80, y: 120 },
          { id: 'f_task1', type: 'task', label: 'Gerar Fatura Recorrente no Asaas', x: 230, y: 100, taskType: 'service' },
          { id: 'f_task2', type: 'task', label: 'Conciliar Entrada com Fluxo de Caixa', x: 450, y: 100, taskType: 'user' },
          { id: 'f_gateway', type: 'gateway', label: 'Fatura Liquidada?', x: 670, y: 100 },
          { id: 'f_task3', type: 'task', label: 'Emitir Recibo de Quitação Aut.', x: 800, y: 100, taskType: 'service' },
          { id: 'f_task4', type: 'task', label: 'Acionar Régua de Cobrança (CRM)', x: 800, y: 250, taskType: 'service' },
          { id: 'f_end1', type: 'end', label: 'Honorários Liquidados', x: 1050, y: 120 },
          { id: 'f_end2', type: 'end', label: 'Fluxo em Atraso Gerenciado', x: 1050, y: 270 }
        ],
        connections: [
          { id: 'fc1', from: 'f_start', to: 'f_task1' },
          { id: 'fc2', from: 'f_task1', to: 'f_task2' },
          { id: 'fc3', from: 'f_task2', to: 'f_gateway' },
          { id: 'fc4', from: 'f_gateway', to: 'f_task3', label: 'Sim' },
          { id: 'fc5', from: 'f_gateway', to: 'f_task4', label: 'Não' },
          { id: 'fc6', from: 'f_task3', to: 'f_end1' },
          { id: 'fc7', from: 'f_task4', to: 'f_end2' }
        ],
        details: {
          objective: 'Processar pagamentos de honorários advocatícios contratados, faturando-os pelo Asaas e quitando as pendências.',
          owner: 'Controladoria e Financeiro',
          actors: 'Analista Financeiro, API de Cobranças Asaas, Gerente de Conta',
          rules: 'O faturamento deve ser gerado no mesmo dia da assinatura. Guias judiciais levantadas devem ter repasse em até 48 horas úteis.',
          dataCollected: 'Dados de cobrança do cliente, valor do contrato, conta bancária de destino, datas de vencimento.',
          systemsUsed: 'Asaas Pagamentos, Software de Gestão Desk, Planilha de Custos do Processo.',
          docsGenerated: 'Fatura Bancária, Recibo de Quitação de Honorários, Extrato de Repasse de Valores.'
        }
      };
    default:
      // Default fallback template: Atendimento ao Cliente
      return {
        nodes: [
          { id: 'start_1', type: 'start', label: 'Início: Novo Cliente', x: 80, y: 120 },
          { id: 'task_1', type: 'task', label: 'Coleta de Fatos e Documentos', x: 230, y: 100, taskType: 'user' },
          { id: 'task_2', type: 'task', label: 'Elaboração do Parecer Técnico', x: 450, y: 100, taskType: 'user' },
          { id: 'gateway_1', type: 'gateway', label: 'Viabilidade Favorável?', x: 670, y: 100 },
          { id: 'task_3', type: 'task', label: 'Minuta de Ação Judicial', x: 800, y: 100, taskType: 'user' },
          { id: 'task_4', type: 'task', label: 'Comunicação de Parecer Contrário', x: 800, y: 250, taskType: 'send' },
          { id: 'end_1', type: 'end', label: 'Fim: Caso Distribuído', x: 1050, y: 120 },
          { id: 'end_2', type: 'end', label: 'Fim: Processo Encerrado', x: 1050, y: 270 }
        ],
        connections: [
          { id: 'conn_1', from: 'start_1', to: 'task_1' },
          { id: 'conn_2', from: 'task_1', to: 'task_2' },
          { id: 'conn_3', from: 'task_2', to: 'gateway_1' },
          { id: 'conn_4', from: 'gateway_1', to: 'task_3', label: 'Sim' },
          { id: 'conn_5', from: 'gateway_1', to: 'task_4', label: 'Não' },
          { id: 'conn_6', from: 'task_3', to: 'end_1' },
          { id: 'conn_7', from: 'task_4', to: 'end_2' }
        ],
        details: {
          objective: 'Coletar relatos de potenciais clientes cíveis/trabalhistas para estruturar o parecer de admissibilidade técnico.',
          owner: 'Departamento Cível e Operações',
          actors: 'Advogado Geral, Estagiário Técnico, Consultor Associado',
          rules: 'Todos os pareceres de viabilidade devem ser validados por um advogado sênior antes da resposta comercial final.',
          dataCollected: 'RG/CPF, comprovante de residência, documentos comprobatórios, relato escrito dos fatos.',
          systemsUsed: 'Plataforma Geral, Pasta no Workspace do Cliente, Editor de Minutas.',
          docsGenerated: 'Parecer Jurídico de Admissibilidade, Ficha Cadastral do Cliente.'
        }
      };
  }
};

export default function BriefingPage() {
  const { id = 'atendimento' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Whiteboard Canvas State
  const [nodes, setNodes] = useState<BpmnNode[]>([]);
  const [connections, setConnections] = useState<BpmnConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeDragNodeId, setActiveDragNodeId] = useState<string | null>(null);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  
  // Custom swimlanes
  const [swimlanes, setSwimlanes] = useState<string[]>(['Secretaria / Triagem', 'Advogado Associado', 'Parceiros / Sistemas']);

  // Tabs & Forms
  const [activeTab, setActiveTab] = useState<'bpmn' | 'details' | 'lifecycle' | 'history'>('bpmn');
  const [details, setDetails] = useState<DetailState>({
    objective: '',
    owner: '',
    actors: '',
    rules: '',
    dataCollected: '',
    systemsUsed: '',
    docsGenerated: ''
  });

  // History timeline log
  const [historyLogs, setHistoryLogs] = useState<Array<{ time: string; author: string; action: string }>>([]);

  // Zoom / Offset
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Load state on mount or id changes
  useEffect(() => {
    const savedNodes = localStorage.getItem(`bpmn-nodes-${id}`);
    const savedConns = localStorage.getItem(`bpmn-connections-${id}`);
    const savedDetails = localStorage.getItem(`bpmn-details-${id}`);
    const savedHistory = localStorage.getItem(`bpmn-history-${id}`);
    const savedLanes = localStorage.getItem(`bpmn-lanes-${id}`);
    
    // Load dynamic contextual templates if no localStorage data exists yet
    if (savedNodes && savedConns) {
      try {
        setNodes(JSON.parse(savedNodes));
        setConnections(JSON.parse(savedConns));
      } catch (e) {}
    } else {
      const template = getDefaultBPMNData(id);
      setNodes(template.nodes);
      setConnections(template.connections);
      setDetails(template.details);
    }
    
    if (savedDetails) {
      try {
        setDetails(JSON.parse(savedDetails));
      } catch (e) {}
    } else if (savedNodes && savedConns) {
      // Just fallback details if custom data but details missing
      const template = getDefaultBPMNData(id);
      setDetails(template.details);
    }

    if (savedLanes) {
      try {
        setSwimlanes(JSON.parse(savedLanes));
      } catch (e) {}
    } else {
      setSwimlanes(['Secretaria / Triagem', 'Advogado Associado', 'Parceiros / Sistemas']);
    }

    if (savedHistory) {
      try {
        setHistoryLogs(JSON.parse(savedHistory));
      } catch (e) {}
    } else {
      setHistoryLogs([
        { time: 'Há 1 dia', author: 'Dr. Renato Lemos', action: 'Mapeou o fluxo estratégico inicial da cadeia' },
        { time: 'Há 5 horas', author: 'Sistema (MinutaAI)', action: 'Mapeamento automatizado via prompt do advogado' }
      ]);
    }
  }, [id]);

  // Save current state
  const saveState = (updatedNodes: BpmnNode[], updatedConns: BpmnConnection[], updatedDetails?: DetailState) => {
    setNodes(updatedNodes);
    setConnections(updatedConns);
    localStorage.setItem(`bpmn-nodes-${id}`, JSON.stringify(updatedNodes));
    localStorage.setItem(`bpmn-connections-${id}`, JSON.stringify(updatedConns));
    
    if (updatedDetails) {
      setDetails(updatedDetails);
      localStorage.setItem(`bpmn-details-${id}`, JSON.stringify(updatedDetails));
    }
  };

  const logRevision = (action: string) => {
    const newLog = {
      time: 'Agora mesmo',
      author: 'Você (Advogado)',
      action
    };
    const updatedLogs = [newLog, ...historyLogs];
    setHistoryLogs(updatedLogs);
    localStorage.setItem(`bpmn-history-${id}`, JSON.stringify(updatedLogs));
  };

  // Node Dragging inside Canvas (React 19 PointerEvents)
  const handleNodePointerDown = (e: React.PointerEvent<HTMLDivElement>, node: BpmnNode) => {
    if (connectingNodeId) {
      e.stopPropagation();
      // Handle click-to-connect instead of dragging
      if (connectingNodeId !== node.id) {
        const uniqueId = `bpmn_conn_${Date.now()}`;
        const newConn: BpmnConnection = {
          id: uniqueId,
          from: connectingNodeId,
          to: node.id
        };
        const updated = [...connections, newConn];
        saveState(nodes, updated);
        logRevision(`Conectou o bloco "${nodes.find(n => n.id === connectingNodeId)?.label}" ao bloco "${node.label}"`);
      }
      setConnectingNodeId(null);
      return;
    }

    e.stopPropagation();
    setSelectedNodeId(node.id);
    setActiveDragNodeId(node.id);
    
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleNodePointerMove = (e: React.PointerEvent<HTMLDivElement>, node: BpmnNode) => {
    if (activeDragNodeId !== node.id || !canvasRef.current) return;
    e.stopPropagation();

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - canvasRect.left) / zoom - dragOffset.current.x);
    const y = Math.round((e.clientY - canvasRect.top) / zoom - dragOffset.current.y);

    const updated = nodes.map(n => 
      n.id === node.id ? { ...n, x: Math.max(20, x), y: Math.max(20, y) } : n
    );
    setNodes(updated);
  };

  const handleNodePointerUp = (e: React.PointerEvent<HTMLDivElement>, node: BpmnNode) => {
    if (activeDragNodeId === node.id) {
      e.stopPropagation();
      setActiveDragNodeId(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
      saveState(nodes, connections);
    }
  };

  // Add new shape to Canvas (from toolbox click)
  const handleAddBpmnShape = (type: 'start' | 'task' | 'gateway' | 'data' | 'end') => {
    const idStr = `bpmn_${type}_${Date.now()}`;
    let label = 'Nova Etapa';
    if (type === 'start') label = 'Início: Novo Caso';
    if (type === 'gateway') label = 'Decisão?';
    if (type === 'data') label = 'Base de Dados';
    if (type === 'end') label = 'Fim do Fluxo';

    const newNode: BpmnNode = {
      id: idStr,
      type,
      label,
      x: 150,
      y: 180,
      taskType: type === 'task' ? 'user' : undefined
    };

    const updated = [...nodes, newNode];
    saveState(updated, connections);
    setSelectedNodeId(idStr);
    logRevision(`Adicionou a forma BPMN do tipo "${type.toUpperCase()}" ao quadro`);
  };

  // Delete node from Canvas
  const handleDeleteNode = (nodeId: string) => {
    if (confirm('Deseja remover esta etapa do diagrama BPMN?')) {
      const filteredNodes = nodes.filter(n => n.id !== nodeId);
      const filteredConns = connections.filter(c => c.from !== nodeId && c.to !== nodeId);
      saveState(filteredNodes, filteredConns);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      logRevision('Excluiu um elemento e suas conexões associadas do quadro');
    }
  };

  // Edit node label
  const handleEditLabel = (nodeId: string, newLabel: string) => {
    const updated = nodes.map(n => n.id === nodeId ? { ...n, label: newLabel } : n);
    saveState(updated, connections);
  };

  // Toggle task type
  const handleToggleTaskType = (nodeId: string, type: 'user' | 'service' | 'send' | 'receive') => {
    const updated = nodes.map(n => n.id === nodeId ? { ...n, taskType: type } : n);
    saveState(updated, connections);
  };

  // Trigger AI layout refactoring simulator
  const [isAiLoading, setIsAiLoading] = useState(false);
  const handleOptimizeWithAi = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      // Create a premium optimized flow with gateways and automated tasks
      const optimizedNodes: BpmnNode[] = [
        { id: 'start_opt', type: 'start', label: 'Início: Novo Lead Previdenciário', x: 80, y: 120 },
        { id: 'task_opt1', type: 'task', label: 'Validação de CPF por API do Governo', x: 230, y: 100, taskType: 'service' },
        { id: 'task_opt2', type: 'task', label: 'Análise de Vínculos Trabalhistas', x: 450, y: 100, taskType: 'user' },
        { id: 'gate_opt', type: 'gateway', label: 'Requisitos Cumpridos?', x: 670, y: 100 },
        { id: 'task_opt3', type: 'task', label: 'Minuta Gerada Automaticamente', x: 800, y: 100, taskType: 'service' },
        { id: 'task_opt4', type: 'task', label: 'Enviar Relatório de Inelegibilidade', x: 800, y: 250, taskType: 'send' },
        { id: 'end_opt1', type: 'end', label: 'Sucesso: Caso Distribuído', x: 1050, y: 120 },
        { id: 'end_opt2', type: 'end', label: 'Fim: Recusado por Falta de Requisitos', x: 1050, y: 270 }
      ];

      const optimizedConns: BpmnConnection[] = [
        { id: 'c_opt1', from: 'start_opt', to: 'task_opt1' },
        { id: 'c_opt2', from: 'task_opt1', to: 'task_opt2' },
        { id: 'c_opt3', from: 'task_opt2', to: 'gate_opt' },
        { id: 'c_opt4', from: 'gate_opt', to: 'task_opt3', label: 'Sim' },
        { id: 'c_opt5', from: 'gate_opt', to: 'task_opt4', label: 'Não' },
        { id: 'c_opt6', from: 'task_opt3', to: 'end_opt1' },
        { id: 'c_opt7', from: 'task_opt4', to: 'end_opt2' }
      ];

      const newDetails = {
        ...details,
        objective: 'Faturamento de honorários advocatícios de forma 100% automatizada com score inteligente.',
        rules: 'Tempo máximo de resposta de 2 horas. Gateways validados por IA sênior no Asaas/Desk.'
      };

      saveState(optimizedNodes, optimizedConns, newDetails);
      logRevision('Refatorou o diagrama BPMN usando Inteligência Artificial de Processos');
      setIsAiLoading(false);
    }, 2800);
  };

  // Exporter Simulators
  const [exporterMsg, setExporterMsg] = useState<string | null>(null);
  const triggerExport = (format: 'XML' | 'PNG' | 'PDF') => {
    setExporterMsg(`Exportando diagrama como arquivo ${format}...`);
    setTimeout(() => {
      setExporterMsg(`Sucesso! O download do seu arquivo ${format} foi iniciado no sandbox.`);
      setTimeout(() => setExporterMsg(null), 3000);
    }, 1200);
  };

  // Draw dynamic path between circular/diamond BPMN shapes
  const drawBpmnConnection = (conn: BpmnConnection) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode) return { path: '', textX: 0, textY: 0 };

    // Standard widths: circular (54px), rectangular (170px), diamond (60px)
    const getAnchorX = (node: BpmnNode, isSource: boolean) => {
      if (node.type === 'task') return isSource ? node.x + 170 : node.x;
      if (node.type === 'gateway') return isSource ? node.x + 60 : node.x;
      return isSource ? node.x + 54 : node.x;
    };

    const getAnchorY = (node: BpmnNode) => {
      if (node.type === 'task') return node.y + 35;
      if (node.type === 'gateway') return node.y + 30;
      return node.y + 27;
    };

    const fromX = getAnchorX(fromNode, true);
    const fromY = getAnchorY(fromNode);
    
    const toX = getAnchorX(toNode, false);
    const toY = getAnchorY(toNode);

    // Dynamic S-curve/ortho lines
    const controlOffset = Math.abs(toX - fromX) / 2;
    const path = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;

    const textX = (fromX + toX) / 2;
    const textY = (fromY + toY) / 2 - 8;

    return { path, textX, textY };
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#090E17] text-slate-800 dark:text-slate-100 select-none overflow-hidden relative">
      {/* Top Header Panel */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0F172A]/70 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/app/gestao/cadeia-valor')}
            className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
            title="Voltar ao Mapa da Cadeia de Valor"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <Workflow size={20} className="text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-800 dark:text-white capitalize">Briefing de Processo: {id.replace('_', ' ')}</h1>
              <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">BPMN Whiteboard</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Modelagem operacional do fluxo de raias, SLAs e ciclo de vida documental</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 dark:bg-[#131B2B] p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('bpmn')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bpmn' 
                ? 'bg-white dark:bg-[#1C263A] text-[#4F73F5] dark:text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Diagrama BPMN
          </button>
          <button 
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'details' 
                ? 'bg-white dark:bg-[#1C263A] text-[#4F73F5] dark:text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Detalhamento do Setor
          </button>
          <button 
            onClick={() => setActiveTab('lifecycle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'lifecycle' 
                ? 'bg-white dark:bg-[#1C263A] text-[#4F73F5] dark:text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Ciclo de Vida
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history' 
                ? 'bg-white dark:bg-[#1C263A] text-[#4F73F5] dark:text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Histórico
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {activeTab === 'bpmn' && (
            <button 
              onClick={handleOptimizeWithAi}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles size={13} className={isAiLoading ? 'animate-spin' : ''} />
              Otimizar com IA
            </button>
          )}

          <button 
            onClick={() => {
              localStorage.setItem(`bpmn-nodes-${id}`, JSON.stringify(nodes));
              localStorage.setItem(`bpmn-connections-${id}`, JSON.stringify(connections));
              localStorage.setItem(`bpmn-details-${id}`, JSON.stringify(details));
              logRevision('Salvou as alterações manualmente');
              alert('Fluxo e formulários salvos com sucesso!');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#4F73F5] hover:bg-[#4062E0] text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Save size={13} />
            Salvar
          </button>
        </div>
      </div>

      {/* Main split work space */}
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: BPMN WHITEBOARD */}
          {activeTab === 'bpmn' && (
            <motion.div 
              key="bpmn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex overflow-hidden"
            >
              {/* Whiteboard toolbox left sidebar */}
              <div className="w-64 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#0B1121] flex flex-col p-5 space-y-4 flex-shrink-0">
                <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Formas BPMN</p>
                
                <button 
                  onClick={() => handleAddBpmnShape('start')}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:border-emerald-500/20"
                >
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-500/10">
                    <Play size={10} className="text-emerald-500 translate-x-[0.5px]" />
                  </div>
                  Início (Start Event)
                </button>

                <button 
                  onClick={() => handleAddBpmnShape('task')}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:border-[#4F73F5]/20"
                >
                  <div className="w-8 h-6 rounded border border-slate-400 dark:border-[#4F73F5] flex items-center justify-center bg-white dark:bg-[#131B2B] text-[8px] font-bold text-slate-500 dark:text-[#4F73F5]">
                    Task
                  </div>
                  Tarefa (User/Service)
                </button>

                <button 
                  onClick={() => handleAddBpmnShape('gateway')}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:border-yellow-500/20"
                >
                  <div className="w-6 h-6 border-2 border-yellow-500 rotate-45 flex items-center justify-center bg-yellow-500/10">
                    <span className="text-[10px] text-yellow-500 -rotate-45 font-black">?</span>
                  </div>
                  Decisão (Gateway)
                </button>

                <button 
                  onClick={() => handleAddBpmnShape('data')}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:border-blue-500/20"
                >
                  <Database size={15} className="text-blue-500" />
                  Base de Dados
                </button>

                <button 
                  onClick={() => handleAddBpmnShape('end')}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:border-red-500/20"
                >
                  <div className="w-6 h-6 rounded-full border-4 border-red-500 flex items-center justify-center bg-red-500/10">
                    <Square size={8} className="text-red-500" />
                  </div>
                  Fim (End Event)
                </button>

                <div className="border-t border-slate-200 dark:border-white/5 my-2 pt-4 space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Exportar Diagrama</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button 
                      onClick={() => triggerExport('XML')}
                      className="flex flex-col items-center gap-1 p-2 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <FileCode size={14} className="text-amber-500" />
                      <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400">XML</span>
                    </button>
                    
                    <button 
                      onClick={() => triggerExport('PNG')}
                      className="flex flex-col items-center gap-1 p-2 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <ImageIcon size={14} className="text-[#4F73F5]" />
                      <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400">PNG</span>
                    </button>

                    <button 
                      onClick={() => triggerExport('PDF')}
                      className="flex flex-col items-center gap-1 p-2 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <FileText size={14} className="text-rose-500" />
                      <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400">PDF</span>
                    </button>
                  </div>
                </div>

                {selectedNodeId && (
                  <div className="border-t border-slate-200 dark:border-white/5 my-2 pt-4 space-y-3 bg-slate-50 dark:bg-[#131B2B]/40 p-3 rounded-2xl border">
                    {(() => {
                      const selectedNode = nodes.find(n => n.id === selectedNodeId);
                      if (!selectedNode) return null;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-[#4F73F5] uppercase tracking-wider">Ajustar Etapa</span>
                            <button 
                              onClick={() => handleDeleteNode(selectedNode.id)}
                              className="text-red-400 hover:text-red-500 transition-colors"
                              title="Remover"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">Rótulo / Nome</label>
                            <input
                              type="text"
                              value={selectedNode.label}
                              onChange={(e) => handleEditLabel(selectedNode.id, e.target.value)}
                              className="w-full bg-white dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-[11px] text-slate-800 dark:text-white rounded-lg p-2 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                            />
                          </div>

                          {selectedNode.type === 'task' && (
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">Tipo de Execução</label>
                              <select
                                value={selectedNode.taskType || 'user'}
                                onChange={(e) => handleToggleTaskType(selectedNode.id, e.target.value as any)}
                                className="w-full bg-white dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-[11px] text-slate-800 dark:text-white rounded-lg p-2 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                              >
                                <option value="user">Manual / Advogado</option>
                                <option value="service">Automática / Robô de IA</option>
                                <option value="send">Enviar Comunicação</option>
                                <option value="receive">Receber Comunicação</option>
                              </select>
                            </div>
                          )}

                          <button 
                            onClick={() => {
                              setConnectingNodeId(selectedNode.id);
                              alert('Clique em outra forma no quadro para criar um conector.');
                            }}
                            className="w-full py-1.5 bg-[#4F73F5]/10 hover:bg-[#4F73F5]/20 text-[#4F73F5] dark:text-[#6D8CFF] border border-[#4F73F5]/20 rounded-xl text-[10px] font-bold transition-all"
                          >
                            Ligar a outro bloco
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Whiteboard BPMN Canvas Grid */}
              <div className="flex-grow relative overflow-hidden bg-[#F8FAFC] dark:bg-[#090E17]">
                
                {/* Swimlane lane descriptors (Raias de atores) */}
                <div className="absolute left-0 top-0 bottom-0 w-[40px] flex flex-col z-10 pointer-events-none">
                  {swimlanes.map((lane, index) => (
                    <div 
                      key={index}
                      className="flex-1 flex items-center justify-center border-b border-slate-200 dark:border-white/[0.04] bg-slate-100 dark:bg-[#0F172A] border-r border-slate-200 dark:border-white/5"
                    >
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest -rotate-90 whitespace-nowrap">
                        {lane}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Exporter Sandbox notifications */}
                {exporterMsg && (
                  <div className="absolute top-4 left-6 z-20 p-3 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg animate-bounce">
                    {exporterMsg}
                  </div>
                )}

                <div 
                  ref={canvasRef}
                  className="w-full h-full relative cursor-grab bg-dot-pattern overflow-hidden pl-[40px]"
                  style={{ 
                    backgroundColor: isDark ? '#090E17' : '#F8FAFC',
                    color: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'
                  }}
                >
                  {/* Outer container of lanes inside canvas */}
                  <div className="absolute inset-0 flex flex-col z-0 pointer-events-none origin-top-left pl-[40px]">
                    {swimlanes.map((_, index) => (
                      <div key={index} className="flex-1 border-b border-slate-200 dark:border-white/[0.04]" />
                    ))}
                  </div>

                  {/* SVG CONNECTORS */}
                  <svg className="absolute inset-0 w-[4000px] h-[4000px] pointer-events-none overflow-visible z-0 pl-[40px]">
                    <defs>
                      <marker
                        id="bpmn_arrow"
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
                      const { path, textX, textY } = drawBpmnConnection(conn);
                      if (!path) return null;
                      return (
                        <g key={conn.id} className="group pointer-events-auto cursor-pointer">
                          <path
                            d={path}
                            fill="none"
                            stroke={isDark ? '#4F73F5' : '#3B82F6'}
                            strokeWidth={2}
                            markerEnd="url(#bpmn_arrow)"
                            className="transition-all hover:stroke-red-500"
                            onClick={() => {
                              if (confirm('Deseja deletar esta conexão BPMN?')) {
                                const filtered = connections.filter(c => c.id !== conn.id);
                                saveState(nodes, filtered);
                                logRevision('Removeu um conector de fluxo');
                              }
                            }}
                          />
                          
                          {conn.label && (
                            <>
                              <rect
                                x={textX - (conn.label.length * 3) - 4}
                                y={textY - 7}
                                width={(conn.label.length * 6) + 8}
                                height={14}
                                rx={3}
                                fill={isDark ? '#090E17' : '#FFFFFF'}
                                stroke={isDark ? 'rgba(79, 115, 245, 0.15)' : 'rgba(59, 130, 246, 0.15)'}
                                strokeWidth={1}
                              />
                              <text
                                x={textX}
                                y={textY + 3}
                                fill={isDark ? '#94A3B8' : '#475569'}
                                fontSize={7}
                                fontWeight="bold"
                                textAnchor="middle"
                                className="font-sans select-none"
                              >
                                {conn.label}
                              </text>
                            </>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* BPMN NODES RENDERING */}
                  {nodes.map(node => {
                    const isSelected = selectedNodeId === node.id;
                    return (
                      <div
                        key={node.id}
                        onPointerDown={(e) => handleNodePointerDown(e, node)}
                        onPointerMove={(e) => handleNodePointerMove(e, node)}
                        onPointerUp={(e) => handleNodePointerUp(e, node)}
                        style={{ left: node.x, top: node.y, touchAction: 'none' }}
                        className={`absolute z-10 select-none cursor-move ${
                          isSelected ? 'ring-2 ring-[#4F73F5] ring-offset-2 dark:ring-offset-[#090E17] rounded-xl' : ''
                        }`}
                      >
                        {/* 1. START SHAPE */}
                        {node.type === 'start' && (
                          <div className="flex flex-col items-center w-14">
                            <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-white dark:bg-[#0F172A] flex items-center justify-center shadow-lg shadow-emerald-500/10">
                              <Play size={12} className="text-emerald-500 translate-x-[0.5px]" />
                            </div>
                            <span className="text-[8px] font-bold text-center text-slate-600 dark:text-slate-300 mt-1.5 w-24 line-clamp-2">
                              {node.label}
                            </span>
                          </div>
                        )}

                        {/* 2. TASK EVENT SHAPE */}
                        {node.type === 'task' && (
                          <div className="w-[170px] bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-[#4F73F5] rounded-xl p-3 shadow-md relative group hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[7px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                {node.taskType === 'service' ? 'Serviço / IA' : 'Usuário / Manual'}
                              </span>
                              <div className="w-1.5 h-1.5 rounded-full bg-[#4F73F5]" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-800 dark:text-white leading-normal pr-2 select-text">{node.label}</p>
                          </div>
                        )}

                        {/* 3. GATEWAY DECISION SHAPE */}
                        {node.type === 'gateway' && (
                          <div className="flex flex-col items-center w-16">
                            <div className="w-10 h-10 border-2 border-yellow-500 rotate-45 bg-white dark:bg-[#131B2B] flex items-center justify-center shadow-lg">
                              <span className="text-xs font-black text-yellow-500 -rotate-45">?</span>
                            </div>
                            <span className="text-[8px] font-bold text-center text-slate-600 dark:text-slate-300 mt-2.5 w-24 line-clamp-2">
                              {node.label}
                            </span>
                          </div>
                        )}

                        {/* 4. DATA STORE SHAPE */}
                        {node.type === 'data' && (
                          <div className="flex flex-col items-center w-16">
                            <div className="w-10 h-10 rounded border border-slate-300 dark:border-blue-500/30 bg-white dark:bg-[#131B2B] flex items-center justify-center shadow-md">
                              <Database size={16} className="text-blue-500" />
                            </div>
                            <span className="text-[8px] font-bold text-center text-slate-600 dark:text-slate-300 mt-1.5 w-24 line-clamp-2">
                              {node.label}
                            </span>
                          </div>
                        )}

                        {/* 5. END SHAPE */}
                        {node.type === 'end' && (
                          <div className="flex flex-col items-center w-14">
                            <div className="w-10 h-10 rounded-full border-4 border-red-500 bg-white dark:bg-[#0F172A] flex items-center justify-center shadow-lg">
                              <Square size={8} className="text-red-500 fill-red-500" />
                            </div>
                            <span className="text-[8px] font-bold text-center text-slate-600 dark:text-slate-300 mt-1.5 w-24 line-clamp-2">
                              {node.label}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: DETAILED STRATEGY FORM */}
          {activeTab === 'details' && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-[#0B1121]"
            >
              <div className="max-w-3xl mx-auto bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.04] pb-4">
                  <ListTodo size={18} className="text-[#4F73F5]" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Detalhamento Operacional e Regras de SLA</h3>
                </div>

                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase">Objetivo Geral do Processo</label>
                    <textarea
                      rows={3}
                      value={details.objective}
                      onChange={(e) => setDetails({ ...details, objective: e.target.value })}
                      placeholder="Qual o valor e o resultado esperado deste setor estratégico?"
                      className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-3 resize-none focus:ring-1 focus:ring-[#4F73F5] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase">Líder e Dono do Processo (Owner)</label>
                    <input
                      type="text"
                      value={details.owner}
                      onChange={(e) => setDetails({ ...details, owner: e.target.value })}
                      placeholder="Ex: Dra. Flávia Albuquerque (Sênior)"
                      className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-3 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 text-xs pt-2">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase">Atores Intermediários (Cargos)</label>
                    <input
                      type="text"
                      value={details.actors}
                      onChange={(e) => setDetails({ ...details, actors: e.target.value })}
                      placeholder="Ex: Secretária, Estagiário de Intake, Calculista"
                      className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-3 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase">Regras de Negócio e SLAs (Prazos)</label>
                    <textarea
                      rows={3}
                      value={details.rules}
                      onChange={(e) => setDetails({ ...details, rules: e.target.value })}
                      placeholder="Ex: Prazos máximos, travas de validação técnica, fluxos de contingência."
                      className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-3 resize-none focus:ring-1 focus:ring-[#4F73F5] outline-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: INFORMATION LIFECYCLE (DATA GOVERNANCE) */}
          {activeTab === 'lifecycle' && (
            <motion.div 
              key="lifecycle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-[#0B1121]"
            >
              <div className="max-w-3xl mx-auto bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.04] pb-4">
                  <ShieldAlert size={18} className="text-[#4F73F5]" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Governança e Ciclo de Vida da Informação (LGPD)</h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase">1. Variáveis e Dados Coletados na Etapa</label>
                    <input
                      type="text"
                      value={details.dataCollected}
                      onChange={(e) => setDetails({ ...details, dataCollected: e.target.value })}
                      placeholder="Ex: CPF, NIT do INSS, Comprovantes de Vínculo, Histórico de Fatos"
                      className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-3 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase">2. Sistemas Integrados e APIs Acionadas</label>
                    <input
                      type="text"
                      value={details.systemsUsed}
                      onChange={(e) => setDetails({ ...details, systemsUsed: e.target.value })}
                      placeholder="Ex: Portal Meu INSS (API), Asaas Faturamento, Drive de Armazenamento"
                      className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-3 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase">3. Documentos Finais e Minutas Geradas</label>
                    <input
                      type="text"
                      value={details.docsGenerated}
                      onChange={(e) => setDetails({ ...details, docsGenerated: e.target.value })}
                      placeholder="Ex: Contrato de Honorários, Petição de Requerimento Administrativo"
                      className="w-full bg-slate-50 dark:bg-[#1C263A] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-3 focus:ring-1 focus:ring-[#4F73F5] outline-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: REVISION HISTORY TIMELINE */}
          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-[#0B1121]"
            >
              <div className="max-w-xl mx-auto bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.04] pb-4">
                  <HistoryIcon size={18} className="text-[#4F73F5]" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Linha do Tempo de Revisões do Fluxo</h3>
                </div>

                <div className="relative border-l border-slate-200 dark:border-white/10 pl-6 space-y-6 text-xs">
                  {historyLogs.map((log, index) => (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[30px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-100 dark:bg-[#131B2B] border-2 border-[#4F73F5]" />
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-black text-slate-800 dark:text-white">{log.action}</p>
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold">{log.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Efetuado por: <span className="font-semibold text-slate-700 dark:text-slate-300">{log.author}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* AI PROCESSING OVERLAY SCREEN */}
      <AnimatePresence>
        {isAiLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/90 dark:bg-[#090E17]/90 z-[100] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent flex items-center justify-center rounded-full animate-spin">
                <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-full animate-pulse" />
              </div>
              <Sparkles size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-bounce" />
            </div>

            <h3 className="text-base font-bold text-white mb-2 tracking-tight">Otimizando com Inteligência de Processos</h3>
            <p className="text-xs text-slate-300 dark:text-slate-400 font-medium max-w-xs leading-relaxed animate-pulse">
              O agente está conectando gateways de decisão, inserindo chamadas automáticas de APIs e estruturando SLAs do setor...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
