import React, { useState } from 'react';
import { Mail, Lock, Shield, HelpCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const PortalLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = usePortalAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/portal/login', { email, password });
      login(response.data.token, response.data.client);
      addToast('Login realizado com sucesso.', 'success');
      navigate('/portal');
    } catch (error: any) {
      addToast(error.response?.data?.message || 'E-mail ou senha inválidos.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative background overlay */}
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>
      
      <div className="bg-white w-full max-w-[480px] rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] z-10 p-10 flex flex-col">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2 tracking-tight">LexGuard</h1>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#64748B] uppercase">Portal do Cliente</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#475569]">E-mail Corporativo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#94A3B8]" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@lexguard.com"
                required
                className="w-full pl-10 pr-3 py-3 border border-[#E2E8F0] rounded-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#475569]">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#94A3B8]" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-3 py-3 border border-[#E2E8F0] rounded-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-[#0F172A] rounded-sm border-[#CBD5E1] focus:ring-[#0F172A]" />
              <span className="text-sm text-[#64748B]">Lembrar de mim</span>
            </label>
            <a href="#" className="text-sm font-semibold text-[#0F172A] hover:underline">
              Esqueci minha senha
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold py-3 px-4 rounded-sm transition-colors duration-200 uppercase tracking-wide text-sm flex justify-center items-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Acessar Portal'
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-sm text-[#64748B] mb-4">Não possui uma conta?</p>
          <button className="w-full border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F172A] font-semibold py-2 px-4 rounded-sm transition-colors duration-200 text-sm">
            Solicitar Acesso
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center space-x-6 text-[#94A3B8] z-10">
        <Shield className="w-5 h-5 hover:text-[#64748B] cursor-pointer transition-colors" />
        <HelpCircle className="w-5 h-5 hover:text-[#64748B] cursor-pointer transition-colors" />
        <FileText className="w-5 h-5 hover:text-[#64748B] cursor-pointer transition-colors" />
      </div>
      
      <p className="mt-6 text-xs text-[#94A3B8] font-medium z-10 uppercase tracking-wider">
        © 2024 LEXGUARD LEGAL. TODOS OS DIREITOS RESERVADOS.
      </p>
    </div>
  );
};

export default PortalLogin;
