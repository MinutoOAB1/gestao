import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const PortalLayout = () => {
  const { user, logout } = usePortalAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/portal', icon: LayoutDashboard },
    { name: 'Meus Processos', path: '/portal/processos', icon: Briefcase },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/portal') return 'Visão Geral';
    if (location.pathname === '/portal/processos') return 'Meus Processos';
    if (location.pathname.startsWith('/portal/processos/')) return 'Detalhes do Processo';
    return 'Portal do Cliente';
  };

  return (
    <div className="min-h-screen flex bg-[#0B1121]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-[#0F172A] border-r border-white/5 flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3">
          <img src="/Logo-pwa2.png" alt="Advus" className="h-8 w-auto rounded-xl shadow-sm" draggable={false} />
          <div className="flex items-baseline tracking-[-0.05em] font-black text-2xl leading-none">
            <span className="text-white">ADV</span>
            <span className="text-white/60">US</span>
          </div>
        </div>

        {/* User Card */}
        <div className="mx-3 mb-4 p-3 rounded-xl bg-white/[0.06] border border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10">
                {user?.name?.charAt(0) || 'C'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0F172A] rounded-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white truncate">{user?.name || 'Cliente'}</p>
              <p className="text-[10px] text-white/40 truncate uppercase tracking-wider font-medium">Portal do Cliente</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-2 py-2 space-y-0.5">
          <p className="px-4 text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Navegação</p>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/portal'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full" />}
                  <div className={`p-1 rounded-lg transition-all duration-200 ${isActive ? 'bg-white/10' : 'group-hover:bg-white/5'}`}>
                    <item.icon size={18} className={`transition-all duration-200 ${isActive ? 'text-white' : 'text-white/50'}`} />
                  </div>
                  <span className={`font-medium text-[13px] tracking-wide ${isActive ? 'text-white' : 'text-white/60'}`}>
                    {item.name}
                  </span>
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-40" />}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom section */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/5 transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium text-[13px]">Sair do Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen bg-[#0F172A]">
        {/* Mobile Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-5 z-50 sticky top-0 bg-[#0F172A] border-b border-white/5">
          <div className="flex items-center gap-2">
            <img src="/Logo-pwa2.png" alt="Advus" className="h-7 w-auto rounded-lg shadow-sm" draggable={false} />
            <div className="flex items-baseline tracking-[-0.05em] font-black text-xl leading-none">
              <span className="text-white">ADV</span>
              <span className="text-white/60">US</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="md:hidden fixed right-0 top-0 bottom-0 w-64 bg-[#0F172A] z-50 p-4 border-l border-white/10"
              >
                <div className="flex justify-end mb-6">
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white/40 hover:text-white rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      end={item.path === '/portal'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      <item.icon size={18} />
                      {item.name}
                    </NavLink>
                  ))}
                </div>
                <div className="mt-8 border-t border-white/10 pt-4">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-white/5 transition-colors w-full"
                  >
                    <LogOut size={18} />
                    Sair do Portal
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Header */}
        <header className="hidden md:flex h-20 items-center justify-between px-8 z-20 flex-shrink-0 bg-[#0F172A] border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white">{getPageTitle()}</h2>
            <p className="text-xs text-white/40 mt-0.5">Portal do Cliente</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-2">
              <p className="text-sm font-semibold text-white">{user?.name || 'Cliente'}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Cliente</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10">
              {user?.name?.charAt(0) || 'C'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0B1121] md:rounded-tl-[40px]">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PortalLayout;
