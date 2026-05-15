import { useState } from 'react';
import { HelpCircle, ChevronRight } from 'lucide-react';
import Modal from './Modal';

interface PageDisclaimerProps {
    title?: string;
    description: string;
    helpContent?: React.ReactNode; 
}

export default function PageDisclaimer({ 
    title = "Como usar esta página?", 
    description, 
    helpContent 
}: PageDisclaimerProps) {
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    return (
        <>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                    <HelpCircle size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">{title}</h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-400/80 mt-0.5">{description}</p>
                </div>
            </div>
            
            <button 
                className="shrink-0 flex items-center gap-1 px-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors"
                onClick={() => {
                    if (helpContent) setIsHelpOpen(true);
                    else alert("O tutorial desta página será disponibilizado em breve!");
                }}
            >
                Se ainda tiver dúvidas, basta clicar Aqui <ChevronRight size={16} />
            </button>
        </div>

        {helpContent && (
            <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Guia Rápido de Uso" size="md">
                <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                    <p className="text-sm text-slate-500 mb-4">{description}</p>
                    {helpContent}
                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={() => setIsHelpOpen(false)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors"
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            </Modal>
        )}
        </>
    );
}
