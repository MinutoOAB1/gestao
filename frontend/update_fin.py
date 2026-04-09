import re
import os

path = r'c:\Users\victo\OneDrive\Documentos\Antigravi-platadv\frontend\src\pages\financial\FinancialListPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update filter logic
target_logic = """            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'pending' && r.status === 'PENDING') ||
                (statusFilter === 'paid' && r.status === 'PAID') ||
                (statusFilter === 'overdue' && r.status === 'PENDING' && isOverdue(r.date, r.status));
            return matchesSearch && matchesStatus;"""

repl_logic = """            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'pending' && r.status === 'PENDING') ||
                (statusFilter === 'paid' && r.status === 'PAID') ||
                (statusFilter === 'overdue' && r.status === 'PENDING' && isOverdue(r.date, r.status));
            
            let matchesDate = true;
            if (dateFilterStart || dateFilterEnd) {
                const rDate = new Date(r.date);
                if (dateFilterStart) {
                    const start = new Date(dateFilterStart);
                    start.setHours(0,0,0,0);
                    if (rDate < start) matchesDate = false;
                }
                if (dateFilterEnd) {
                    const end = new Date(dateFilterEnd);
                    end.setHours(23,59,59,999);
                    if (rDate > end) matchesDate = false;
                }
            }
                
            return matchesSearch && matchesStatus && matchesDate;"""

if target_logic in content:
    content = content.replace(target_logic, repl_logic)
    print("Logic added")
else:
    print("Logic target not found")

# 2. Update search query input to add Date Pickers
target_search = """                                        className="pl-9 pr-4 py-2 bg-app-bg border border-app-stroke rounded-lg text-sm text-app-text-main outline-none focus:border-primary transition-colors w-48"
                                    />
                                </div>
                                <select"""

repl_search = """                                        className="pl-9 pr-4 py-2 bg-app-bg border border-app-stroke rounded-lg text-sm text-app-text-main outline-none focus:border-primary transition-colors w-40 sm:w-48"
                                    />
                                </div>
                                <div className="flex items-center gap-1 bg-app-bg border border-app-stroke rounded-lg px-2 py-1">
                                    <input 
                                        type="date" 
                                        value={dateFilterStart}
                                        onChange={e => setDateFilterStart(e.target.value)}
                                        className="bg-transparent text-sm text-app-text-main outline-none w-[110px]"
                                        title="Data Inicial"
                                    />
                                    <span className="text-app-text-muted text-xs">até</span>
                                    <input 
                                        type="date" 
                                        value={dateFilterEnd}
                                        onChange={e => setDateFilterEnd(e.target.value)}
                                        className="bg-transparent text-sm text-app-text-main outline-none w-[110px]"
                                        title="Data Final"
                                    />
                                </div>
                                <select"""

if target_search in content:
    content = content.replace(target_search, repl_search)
    print("Search input modified")
else:
    print("Search target not found")


# 3. Add Limpar button
target_btn = """                                <button className="flex items-center gap-2 px-3 py-2 bg-app-bg border border-app-stroke rounded-lg text-sm text-app-text-muted hover:text-app-text-main transition-colors">
                                    <Filter size={14} />
                                    Filtros
                                </button>"""

repl_btn = """                                <button 
                                    onClick={() => { setDateFilterStart(''); setDateFilterEnd(''); setStatusFilter('all'); setSearchQuery(''); }}
                                    className="flex items-center gap-2 px-3 py-2 bg-app-bg border border-app-stroke rounded-lg text-sm text-app-text-muted hover:text-app-text-main transition-colors"
                                    title="Limpar todos os filtros"
                                >
                                    Limpar
                                </button>
                                <button className="flex items-center gap-2 px-3 py-2 bg-app-bg border border-app-stroke rounded-lg text-sm text-app-text-muted hover:text-app-text-main transition-colors">
                                    <Filter size={14} />
                                    Filtros
                                </button>"""

if target_btn in content:
    content = content.replace(target_btn, repl_btn)
    print("Clear button added")
else:
    print("Clear button target not found")

# 4. Summary cards gradients
content = content.replace(
    '''(stats?.balance || 0) >= 0 ? "border-green-500/30 shadow-lg shadow-green-500/10" : "border-red-500/30 shadow-lg shadow-red-500/10"''',
    '''(stats?.balance || 0) >= 0 ? "bg-gradient-to-br from-green-500/10 to-app-card border-green-500/30 shadow-lg shadow-green-500/10" : "bg-gradient-to-br from-red-500/10 to-app-card border-red-500/30 shadow-lg shadow-red-500/10"'''
)
content = content.replace(
    '''"bg-app-card border rounded-2xl p-5 relative overflow-hidden transition-all",''',
    '''"border rounded-2xl p-5 relative overflow-hidden transition-all",'''
) # apply generically to all 4 cards to remove the opaque background
content = content.replace(
    '''(stats?.pendingIncome || 0) > 0 ? "border-blue-500/30 shadow-lg shadow-blue-500/10" : "border-app-stroke"''',
    '''(stats?.pendingIncome || 0) > 0 ? "bg-gradient-to-br from-blue-500/10 to-app-card border-blue-500/30 shadow-lg shadow-blue-500/10" : "bg-app-card border-app-stroke"'''
)
content = content.replace(
    '''(stats?.pendingExpense || 0) > 0 ? "border-red-500/30 shadow-lg shadow-red-500/10" : "border-app-stroke"''',
    '''(stats?.pendingExpense || 0) > 0 ? "bg-gradient-to-br from-red-500/10 to-app-card border-red-500/30 shadow-lg shadow-red-500/10" : "bg-app-card border-app-stroke"'''
)
content = content.replace(
    '''currentMonthBalance >= 0 ? "border-emerald-500/30 shadow-lg shadow-emerald-500/10" : "border-rose-500/30 shadow-lg shadow-rose-500/10"''',
    '''currentMonthBalance >= 0 ? "bg-gradient-to-br from-emerald-500/10 to-app-card border-emerald-500/30 shadow-lg shadow-emerald-500/10" : "bg-gradient-to-br from-rose-500/10 to-app-card border-rose-500/30 shadow-lg shadow-rose-500/10"'''
)

# 5. Table styles
content = content.replace('<td className="w-1 px-5 py-3">', '<td className="w-1 px-5 py-4">')
content = content.replace('<td className="px-5 py-3 whitespace-nowrap">', '<td className="px-5 py-4 whitespace-nowrap">')
content = content.replace('<td className="px-5 py-3 text-center">', '<td className="px-5 py-4 text-center">')
content = content.replace('<td className="px-5 py-3 text-right whitespace-nowrap">', '<td className="px-5 py-4 text-right whitespace-nowrap">')
content = content.replace('<td className="px-5 py-3">', '<td className="px-5 py-4">')

# 6. Table Avatar
table_desc_target = """                <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-app-text-main flex items-center gap-2 flex-wrap">"""

table_desc_repl = """                <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        {!isGroup && (
                            <div className={clsx(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                record.type === 'INCOME' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                            )}>
                                {record.type === 'INCOME' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-semibold text-app-text-main flex items-center gap-2 flex-wrap">"""

content = content.replace(table_desc_target, table_desc_repl)
content = content.replace('                    {record.client && <p className="text-xs text-app-text-muted mt-0.5 max-w-[200px] truncate">Cli: {record.client.name}</p>}\n                </td>', '                    {record.client && <p className="text-xs text-app-text-muted mt-0.5 max-w-[200px] truncate">Cli: {record.client.name}</p>}\n                        </div>\n                    </div>\n                </td>')


with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated completely.")
