import codecs
import re

path = 'frontend/src/pages/clients/ClientDetailPage.tsx'
try:
    with codecs.open(path, 'r', 'utf-8') as f:
        text = f.read()
except Exception as e:
    print(f"Error reading file: {e}")
    exit(1)

def extract_block(start_marker, end_marker):
    start = text.find(start_marker)
    if start == -1: 
        print(f"Warning: Could not find start marker: {start_marker}")
        return ""
    end = text.find(end_marker, start)
    if end == -1:
        print(f"Warning: Could not find end marker: {end_marker}")
        return ""
    return text[start:end].strip()

# Remove tabs state
text = re.sub(r'const tabs = \[.*?\];\n', '', text, flags=re.DOTALL)
text = re.sub(r'const \[activeTab, setActiveTab\] = useState<TabType>\(\'overview\'\);\n', '', text)
text = re.sub(r'const \[activeTab, setActiveTab\] = useState.*?;\n', '', text) # fallback

# Find the header region
header_start = text.find('        <div className="flex flex-col lg:flex-row gap-6')
header_end = text.find('{/* Tabs */}')
if header_start == -1 or header_end == -1:
    print("Error finding header")
    exit(1)

header_content = text[header_start:header_end]
# We need to change the root wrapper of header
header_content = header_content.replace(
    '<div className="flex flex-col lg:flex-row gap-6 h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-theme(spacing.20))]">',
    '<div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">'
)
header_content = header_content.replace(
    '<main className="flex-1 flex flex-col min-w-0">',
    ''
)
header_content = header_content.replace(
    '<div className="bg-app-card border border-app-stroke rounded-2xl p-6 mb-6">',
    '<div className="bg-app-card border-b border-app-stroke p-4 lg:p-6 shrink-0 w-full shadow-sm z-10">\n                <div className="max-w-[1600px] mx-auto w-full">'
)

# Extract content blocks
stats = extract_block('{/* Stats */}', '{/* Personal Data */}')
personal_data = extract_block('{/* Personal Data */}', '{/* Urgent & Deadline Alerts */}')
alerts = extract_block('{/* Urgent & Deadline Alerts */}', '{/* Lead Info */}')
lead_info = extract_block('{/* Lead Info */}', '{/* Extended Personal Data */}')
extended_data = extract_block('{/* Extended Personal Data */}', '{/* Demand Info */}')
demand_info = extract_block('{/* Demand Info */}', '{/* Timeline (Linha do Tempo) */}')
timeline = extract_block('{/* Timeline (Linha do Tempo) */}', '{/* Lead Tracking */}')
lead_tracking = extract_block('{/* Lead Tracking */}', '{/* Processes with Andamentos */}')

processes_full = extract_block("{activeTab === 'processes' && (", "{activeTab === 'documents' && (")
# Remove the wrapper
processes_full = re.sub(r"\{activeTab === 'processes' && \(\s*<div", "<div", processes_full)
processes_full = re.sub(r"\)\}\s*$", "", processes_full).strip()

documents = extract_block("{activeTab === 'documents' && (", "{activeTab === 'financial' && (")
documents = re.sub(r"\{activeTab === 'documents' && \(\s*<div", "<div", documents)
documents = re.sub(r"\)\}\s*$", "", documents).strip()

financial = extract_block("{activeTab === 'financial' && (", "{/* Notes Tab */}")
financial = re.sub(r"\{activeTab === 'financial' && \(\s*<div", "<div", financial)
financial = re.sub(r"\)\}\s*$", "", financial).strip()

notes = extract_block("{/* Add Note Form */}", "</main>")

quick_actions = extract_block('{/* Right Sidebar - Quick Actions */}', '{/* Report Modal - Slide-in Panel */}')
# Quick actions has an <aside> wrapper, we'll replace it with a div
quick_actions = re.sub(r'<aside className=".*?">', '<div className="flex flex-col gap-6">', quick_actions)
quick_actions = re.sub(r'</aside>', '</div>', quick_actions)

# Assemble the new Dashboard Grid
new_grid = (
    "                </div>\n"
    "            </div>\n\n"
    "            {/* Main Dashboard Area */}\n"
    "            <div className=\"flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 w-full\">\n"
    "                <div className=\"max-w-[1600px] mx-auto w-full\">\n"
    "                    \n"
    "                    " + alerts + "\n\n"
    "                    <div className=\"grid grid-cols-1 xl:grid-cols-12 gap-6 pb-20 mt-6\">\n"
    "                        {/* COLUMN 1: Jurídico & Info Pessoal (span 4) */}\n"
    "                        <div className=\"xl:col-span-4 flex flex-col gap-6\">\n"
    "                            " + personal_data + "\n"
    "                            " + timeline + "\n"
    "                            " + lead_info + "\n"
    "                            " + extended_data + "\n"
    "                            " + demand_info + "\n"
    "                            " + lead_tracking + "\n"
    "                        </div>\n\n"
    "                        {/* COLUMN 2: Operacional - Processos e Tarefas (span 4) */}\n"
    "                        <div className=\"xl:col-span-4 flex flex-col gap-6\">\n"
    "                            " + stats + "\n"
    "                            " + processes_full + "\n"
    "                            " + notes + "\n"
    "                        </div>\n\n"
    "                        {/* COLUMN 3: Administrativo - Financeiro, Docs, Ações Rápidas (span 4) */}\n"
    "                        <div className=\"xl:col-span-4 flex flex-col gap-6\">\n"
    "                            " + quick_actions + "\n"
    "                            " + financial + "\n"
    "                            " + documents + "\n"
    "                        </div>\n"
    "                    </div>\n"
    "                </div>\n"
    "            </div>\n"
)

# Now stitch it all back together
pre_text = text[:header_start]
post_text_start = text.find('{/* Report Modal - Slide-in Panel */}')
if post_text_start == -1:
    print("Error finding Report Modal")
    exit(1)
post_text = text[post_text_start:]

final_content = pre_text + header_content + new_grid + "\n            " + post_text

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(final_content)

print("Successfully rewrote ClientDetailPage to full-width dashboard!")
