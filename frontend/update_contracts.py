import re

path = r"c:\Users\victo\OneDrive\Documentos\Antigravi-platadv\frontend\src\pages\contracts\ContractsPage.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add states to ContractsPage
state_import_target = "import { useState, useEffect } from 'react';"
state_import_repl = "import { useState, useEffect, useRef } from 'react';"
content = content.replace(state_import_target, state_import_repl)

state_target = """    const [isNewContractOpen, setIsNewContractOpen] = useState(false);"""
state_repl = """    const [isNewContractOpen, setIsNewContractOpen] = useState(false);
    const [funnelPeriod, setFunnelPeriod] = useState('Mês');
    const [animatedStats, setAnimatedStats] = useState<Stats | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    
    useEffect(() => {
        if (!stats) return;
        const multiplier = funnelPeriod === 'Dia' ? 0.05 : funnelPeriod === 'Semana' ? 0.25 : 1;
        setAnimatedStats({
            initiated: Math.round(stats.initiated * multiplier),
            made: Math.round(stats.made * multiplier),
            signed: Math.round(stats.signed * multiplier),
            closed: Math.round(stats.closed * multiplier),
            cancelled: Math.round(stats.cancelled * multiplier),
            total: Math.max(1, Math.round(stats.total * multiplier)),
            estimatedRevenue: stats.estimatedRevenue * multiplier
        });
    }, [funnelPeriod, stats]);
    
    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);"""
if state_target in content:
    content = content.replace(state_target, state_repl)
    print("States added")

# 2. Update Funnel section
funnel_target = """                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                        <div>
                            <h3 className="font-bold text-app-text-main">Funil de Conversão</h3>
                            <p className="text-xs text-app-text-muted">Eficiência de fechamento de contratos</p>
                        </div>
                        <div className="flex items-center gap-1 bg-app-bg border border-app-stroke rounded-lg p-1">
                            <button className="px-3 py-1 text-xs text-app-text-muted">Dia</button>
                            <button className="px-3 py-1 text-xs text-app-text-muted">Semana</button>
                            <button className="px-3 py-1 text-xs text-app-text-main bg-app-stroke rounded font-medium">Mês</button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <FunnelBar label="Iniciados" value={stats?.initiated || 0} total={stats?.total || 1} color="bg-blue-500" />
                        <FunnelBar label="Feitos" value={stats?.made || 0} total={stats?.total || 1} color="bg-amber-500" />
                        <FunnelBar label="Assinados" value={stats?.signed || 0} total={stats?.total || 1} color="bg-green-500" />
                        <FunnelBar label="Fechados" value={stats?.closed || 0} total={stats?.total || 1} color="bg-purple-500" />
                    </div>"""
funnel_repl = """                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                        <div>
                            <h3 className="font-bold text-app-text-main">Funil de Conversão</h3>
                            <p className="text-xs text-app-text-muted">Eficiência de fechamento de contratos</p>
                        </div>
                        <div className="flex items-center gap-1 bg-app-bg border border-app-stroke rounded-lg p-1">
                            {['Dia', 'Semana', 'Mês'].map(period => (
                                <button 
                                    key={period}
                                    onClick={() => setFunnelPeriod(period)}
                                    className={clsx("px-3 py-1 text-xs rounded transition-colors", funnelPeriod === period ? "text-app-text-main bg-app-stroke font-medium" : "text-app-text-muted hover:text-white")}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-hidden">
                        <motion.div 
                            key={funnelPeriod}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            <FunnelBar label="Iniciados" value={animatedStats?.initiated || 0} total={animatedStats?.total || 1} color="bg-blue-500" />
                            <FunnelBar label="Feitos" value={animatedStats?.made || 0} total={animatedStats?.total || 1} color="bg-amber-500" />
                            <FunnelBar label="Assinados" value={animatedStats?.signed || 0} total={animatedStats?.total || 1} color="bg-green-500" />
                            <FunnelBar label="Fechados" value={animatedStats?.closed || 0} total={animatedStats?.total || 1} color="bg-purple-500" />
                        </motion.div>
                    </div>"""
if funnel_target in content:
    content = content.replace(funnel_target, funnel_repl)
    print("Funnel replaced")

# 3. Handle Dropdown and Mobile Table
table_target = """                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-app-stroke">
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Contrato</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Cliente</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Status</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Valor</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Data</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-stroke">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-app-text-muted text-sm">Carregando contratos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-app-text-muted">
                                        <FileText size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Nenhum contrato encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredContracts.map(contract => (
                                    <tr key={contract.id} className="hover:bg-app-stroke/10 transition-fast touch-manipulation">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-app-stroke/30 flex items-center justify-center">
                                                    <FileText size={18} className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-app-text-main text-sm">{contract.title}</p>
                                                    <p className="text-xs text-app-text-muted">#{contract.number}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-app-stroke flex items-center justify-center text-xs font-medium text-app-text-main">
                                                    {contract.client?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'N/A'}
                                                </div>
                                                <span className="text-sm text-app-text-main">{contract.client?.name || 'Sem cliente'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-xs font-medium",
                                                STATUS_MAP[contract.status]?.color,
                                                STATUS_MAP[contract.status]?.bgColor
                                            )}>
                                                {STATUS_MAP[contract.status]?.label || contract.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-app-text-main font-medium">
                                            {formatCurrency(contract.value)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-app-text-muted">
                                            {formatDate(contract.createdAt)}
                                        </td>
                                        <td className="px-4">
                                            <button className="p-2 text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/30 rounded-lg transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>"""
table_repl = """                {/* Table - Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-app-stroke">
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Contrato</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Cliente</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Status</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Valor</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Data</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-stroke">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-app-text-muted text-sm">Carregando contratos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-app-text-muted">
                                        <FileText size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Nenhum contrato encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredContracts.map(contract => (
                                    <tr key={contract.id} className="hover:bg-app-stroke/10 transition-fast cursor-pointer" onClick={() => setSelectedContract(contract)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-app-stroke/30 flex items-center justify-center">
                                                    <FileText size={18} className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-app-text-main text-sm">{contract.title}</p>
                                                    <p className="text-xs text-app-text-muted">#{contract.number}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-app-stroke flex items-center justify-center text-xs font-medium text-app-text-main">
                                                    {contract.client?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'N/A'}
                                                </div>
                                                <span className="text-sm text-app-text-main">{contract.client?.name || 'Sem cliente'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-xs font-medium",
                                                STATUS_MAP[contract.status]?.color,
                                                STATUS_MAP[contract.status]?.bgColor
                                            )}>
                                                {STATUS_MAP[contract.status]?.label || contract.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-app-text-main font-medium">
                                            {formatCurrency(contract.value)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-app-text-muted">
                                            {formatDate(contract.createdAt)}
                                        </td>
                                        <td className="px-4 relative">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === contract.id ? null : contract.id); }}
                                                className="p-2 text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/30 rounded-lg transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {activeMenuId === contract.id && (
                                                <div className="absolute right-0 top-full mt-1 w-32 bg-app-card border border-app-stroke rounded-lg shadow-xl z-50 overflow-hidden text-sm">
                                                    <button className="w-full text-left px-4 py-2 hover:bg-app-stroke/30 transition-colors text-app-text-main" onClick={(e) => { e.stopPropagation(); setSelectedContract(contract); setActiveMenuId(null); }}>Ver Detalhes</button>
                                                    <button className="w-full text-left px-4 py-2 hover:bg-app-stroke/30 transition-colors text-blue-500" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}>Editar</button>
                                                    <button className="w-full text-left px-4 py-2 hover:bg-app-stroke/30 transition-colors text-red-500" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}>Excluir</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table - Mobile Cards */}
                <div className="md:hidden flex flex-col divide-y divide-app-stroke">
                    {isLoading ? (
                         <div className="text-center py-8">
                             <div className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                             <span className="text-app-text-muted text-sm">Carregando contratos...</span>
                         </div>
                    ) : filteredContracts.length === 0 ? (
                        <div className="text-center py-8 text-app-text-muted">
                            <FileText size={32} className="mx-auto mb-2 opacity-30" />
                            <p>Nenhum contrato encontrado.</p>
                        </div>
                    ) : (
                        filteredContracts.map(contract => (
                            <div key={contract.id} className="p-4 hover:bg-app-stroke/10 transition-fast active:bg-app-stroke/20 cursor-pointer" onClick={() => setSelectedContract(contract)}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-app-stroke/30 flex items-center justify-center">
                                            <FileText size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-app-text-main text-sm">{contract.title}</p>
                                            <p className="text-xs text-app-text-muted">#{contract.number}</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === contract.id ? null : contract.id); }}
                                            className="p-1.5 text-app-text-muted hover:text-white rounded-lg transition-colors"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {activeMenuId === contract.id && (
                                            <div className="absolute right-0 top-full mt-1 w-32 bg-app-card border border-app-stroke rounded-lg shadow-xl z-50 overflow-hidden text-sm">
                                                <button className="w-full text-left px-4 py-2 hover:bg-app-stroke/30 text-app-text-main" onClick={(e) => { e.stopPropagation(); setSelectedContract(contract); setActiveMenuId(null); }}>Ver Detalhes</button>
                                                <button className="w-full text-left px-4 py-2 hover:bg-app-stroke/30 text-red-500" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}>Excluir</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div>
                                        <p className="text-xs text-app-text-muted mb-1">Cliente</p>
                                        <p className="text-xs font-medium text-app-text-main truncate">{contract.client?.name || 'Sem cliente'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-app-text-muted mb-1">Data</p>
                                        <p className="text-xs font-medium text-app-text-main">{formatDate(contract.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-3 border-t border-app-stroke">
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-[10px] font-medium border",
                                        STATUS_MAP[contract.status]?.color,
                                        STATUS_MAP[contract.status]?.bgColor,
                                        STATUS_MAP[contract.status]?.color.replace('text-', 'border-').replace('400', '500/20')
                                    )}>
                                        {STATUS_MAP[contract.status]?.label || contract.status}
                                    </span>
                                    <span className="text-sm text-app-text-main font-bold">
                                        {formatCurrency(contract.value)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>"""
if table_target in content:
    content = content.replace(table_target, table_repl)
    print("Table replaced")

# 4. Add Modals
modal_target = """        </div>
    );
}"""
modal_repl = """            {/* Contract Details Modal */}
            <Modal
                isOpen={!!selectedContract}
                onClose={() => setSelectedContract(null)}
                title="Detalhes do Contrato"
                footer={
                    <button onClick={() => setSelectedContract(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-app-stroke text-app-text-main hover:bg-app-stroke/80 transition-colors">Fechar</button>
                }
            >
                {selectedContract && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-app-text-main">{selectedContract.title}</h3>
                            <span className={clsx(
                                "px-3 py-1 rounded-full text-xs font-medium",
                                STATUS_MAP[selectedContract.status]?.color,
                                STATUS_MAP[selectedContract.status]?.bgColor
                            )}>
                                {STATUS_MAP[selectedContract.status]?.label || selectedContract.status}
                            </span>
                        </div>
                        <p className="text-sm text-app-text-muted break-words">
                            {selectedContract.description || 'Sem descrição.'}
                        </p>
                        <div className="bg-app-bg p-4 rounded-xl border border-app-stroke grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-app-text-muted mb-1">Valor do Contrato</p>
                                <p className="text-sm font-bold text-app-text-main">{formatCurrency(selectedContract.value)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-app-text-muted mb-1">Data de Criação</p>
                                <p className="text-sm font-bold text-app-text-main">{formatDate(selectedContract.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-app-text-muted mb-1">Cliente Vinculado</p>
                                <p className="text-sm font-bold text-app-text-main">{selectedContract.client?.name || 'Nenhum'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-app-text-muted mb-1">ID do Contrato</p>
                                <p className="text-sm font-mono text-app-text-main">#{selectedContract.number}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}"""
if modal_target in content:
    content = content.replace(modal_target, modal_repl)
    print("Modal added")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update script ran.")
