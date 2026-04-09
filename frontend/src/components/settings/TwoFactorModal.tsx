import { useState } from 'react';
import { X, Shield, Smartphone, Check, Copy, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface TwoFactorModalProps {
    isOpen: boolean;
    onClose: () => void;
    isEnabled: boolean;
    onStatusChange: (enabled: boolean) => void;
}

export default function TwoFactorModal({ isOpen, onClose, isEnabled, onStatusChange }: TwoFactorModalProps) {
    const [step, setStep] = useState<'setup' | 'verify' | 'disable'>('setup');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSetup = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/2fa/setup');
            setQrCode(response.data.qrCode);
            setSecret(response.data.secret);
            setStep('verify');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao configurar 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (code.length !== 6) {
            setError('Digite o código de 6 dígitos');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/auth/2fa/verify', { code });
            onStatusChange(true);
            onClose();
            setStep('setup');
            setCode('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Código inválido');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        if (code.length !== 6) {
            setError('Digite o código de 6 dígitos');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/auth/2fa/disable', { code });
            onStatusChange(false);
            onClose();
            setStep('setup');
            setCode('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Código inválido');
        } finally {
            setLoading(false);
        }
    };

    const copySecret = () => {
        if (secret) {
            navigator.clipboard.writeText(secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setStep('setup');
        setCode('');
        setError('');
        setQrCode(null);
        setSecret(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-app-card border border-app-stroke rounded-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-app-stroke">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Shield size={20} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="font-bold text-app-text-main">Autenticação 2FA</h2>
                                <p className="text-xs text-app-text-muted">
                                    {isEnabled ? 'Gerenciar 2FA' : 'Configurar autenticação em duas etapas'}
                                </p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="text-app-text-muted hover:text-app-text-main">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        {isEnabled && step === 'setup' ? (
                            // 2FA is enabled - show disable option
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="text-green-500" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-app-text-main mb-2">2FA Ativo</h3>
                                <p className="text-app-text-muted text-sm mb-6">
                                    Sua conta está protegida com autenticação em duas etapas.
                                </p>

                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                                        <p className="text-sm text-yellow-500 text-left">
                                            Desativar o 2FA reduzirá a segurança da sua conta. Apenas faça isso se for realmente necessário.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep('disable')}
                                    className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl font-medium hover:bg-red-500/20 transition-colors"
                                >
                                    Desativar 2FA
                                </button>
                            </div>
                        ) : step === 'setup' ? (
                            // Setup step
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Smartphone className="text-primary" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-app-text-main mb-2">Proteja sua conta</h3>
                                <p className="text-app-text-muted text-sm mb-6">
                                    Use um aplicativo autenticador como Google Authenticator ou Authy para gerar códigos de verificação.
                                </p>

                                <div className="bg-app-bg rounded-lg p-4 mb-6 text-left">
                                    <h4 className="font-medium text-app-text-main text-sm mb-2">Como funciona:</h4>
                                    <ol className="text-sm text-app-text-muted space-y-2">
                                        <li className="flex gap-2">
                                            <span className="text-primary font-medium">1.</span>
                                            Baixe um app autenticador
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-primary font-medium">2.</span>
                                            Escaneie o QR code
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-primary font-medium">3.</span>
                                            Digite o código gerado
                                        </li>
                                    </ol>
                                </div>

                                <button
                                    onClick={handleSetup}
                                    disabled={loading}
                                    className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Shield size={18} />
                                            Configurar 2FA
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : step === 'verify' ? (
                            // Verify step - show QR code
                            <div className="text-center">
                                <p className="text-app-text-muted text-sm mb-4">
                                    Escaneie o QR code com seu app autenticador
                                </p>

                                {qrCode && (
                                    <div className="bg-white p-4 rounded-xl inline-block mb-4">
                                        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                    </div>
                                )}

                                {secret && (
                                    <div className="mb-4">
                                        <p className="text-xs text-app-text-muted mb-2">Ou digite o código manualmente:</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <code className="bg-app-bg px-3 py-2 rounded-lg text-sm font-mono text-app-text-main">
                                                {secret}
                                            </code>
                                            <button
                                                onClick={copySecret}
                                                className="p-2 hover:bg-app-stroke rounded-lg transition-colors"
                                            >
                                                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-app-text-muted" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-app-text-muted mb-2 text-left">
                                        Digite o código de 6 dígitos
                                    </label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full text-center text-2xl tracking-widest bg-app-bg border border-app-stroke rounded-xl px-4 py-3 text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                                        maxLength={6}
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-400 text-sm mb-4">{error}</p>
                                )}

                                <button
                                    onClick={handleVerify}
                                    disabled={loading || code.length !== 6}
                                    className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Verificando...' : 'Verificar e Ativar'}
                                </button>
                            </div>
                        ) : (
                            // Disable step
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="text-red-500" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-app-text-main mb-2">Desativar 2FA</h3>
                                <p className="text-app-text-muted text-sm mb-4">
                                    Digite o código do seu app autenticador para confirmar.
                                </p>

                                <div className="mb-4">
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full text-center text-2xl tracking-widest bg-app-bg border border-app-stroke rounded-xl px-4 py-3 text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                                        maxLength={6}
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-400 text-sm mb-4">{error}</p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setStep('setup'); setCode(''); setError(''); }}
                                        className="flex-1 py-3 border border-app-stroke text-app-text-main rounded-xl font-medium hover:bg-app-stroke/30 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDisable}
                                        disabled={loading || code.length !== 6}
                                        className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Desativando...' : 'Desativar'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
