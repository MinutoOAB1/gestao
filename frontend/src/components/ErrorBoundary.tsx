import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary to catch runtime errors in React component trees.
 * Prevents the entire app from going blank on error.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-app-text-main mb-2">
                        Algo deu errado
                    </h2>
                    <p className="text-sm text-app-text-muted mb-6 max-w-md">
                        Ocorreu um erro inesperado nesta seção. Tente recarregar ou voltar para a página anterior.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                        >
                            <RefreshCw size={16} />
                            Tentar novamente
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-4 py-2 border border-app-stroke text-app-text-main rounded-lg text-sm font-medium hover:bg-app-stroke/30 transition-colors"
                        >
                            Ir para o início
                        </button>
                    </div>
                    {this.state.error && (
                        <details className="mt-6 text-left w-full max-w-lg">
                            <summary className="text-xs text-app-text-muted cursor-pointer hover:text-app-text-main">
                                Detalhes técnicos
                            </summary>
                            <pre className="mt-2 p-3 bg-app-bg border border-app-stroke rounded-lg text-xs text-red-400 overflow-auto max-h-32">
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
