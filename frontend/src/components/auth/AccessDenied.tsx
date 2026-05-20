import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AccessDenied() {
    const navigate = useNavigate();
    
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[65vh] p-6 text-center animate-fade-in">
            <div className="bg-white dark:bg-app-card border border-gray-100 dark:border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-xl dark:shadow-2xl flex flex-col items-center gap-6 backdrop-blur-xl transition-all">
                {/* Glowing Shield Icon */}
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400 animate-bounce">
                    <ShieldAlert size={36} />
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 font-display">
                        Acesso Restrito
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Seu perfil de acesso atual não possui permissão para visualizar ou gerenciar esta seção do sistema. Entre em contato com o administrador caso precise de privilégios.
                    </p>
                </div>
                
                <button
                    onClick={() => navigate('/app')}
                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                    <ArrowLeft size={14} /> Voltar ao Início
                </button>
            </div>
        </div>
    );
}
