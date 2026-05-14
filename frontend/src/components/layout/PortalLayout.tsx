import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FileText, Mail, HelpCircle, LogOut, Bell, Settings } from 'lucide-react';
import { usePortalAuth } from '../../context/PortalAuthContext';

const PortalLayout = () => {
  const { user, logout } = usePortalAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/portal', icon: LayoutDashboard },
    { name: 'My Cases', path: '/portal/processos', icon: Briefcase },
    { name: 'Documents', path: '/portal/documentos', icon: FileText },
    { name: 'Messages', path: '/portal/mensagens', icon: Mail },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/portal') return 'Dashboard';
    if (location.pathname.startsWith('/portal/processos')) return 'LexGuard Portal';
    return 'LexGuard Portal';
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex text-[#0F172A]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col fixed h-full z-20">
        <div className="p-6">
          <h1 className="text-xl font-bold text-[#0F172A]">LexGuard Legal</h1>
          <p className="text-xs text-[#64748B] mt-1">Secure Client Portal</p>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/portal'}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-sm transition-colors ${
                  isActive
                    ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold border-l-4 border-[#0F172A]'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] border-l-4 border-transparent'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 space-y-1">
          <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-sm transition-colors">
            <HelpCircle className="w-5 h-5 mr-3" />
            Support
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-sm transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-[#F5F7FA] border-b border-[#E2E8F0] flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-[#0F172A]">{getPageTitle()}</h2>
          
          <div className="flex items-center space-x-6">
            <button className="text-[#64748B] hover:text-[#0F172A] transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="text-[#64748B] hover:text-[#0F172A] transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 pl-6 border-l border-[#E2E8F0]">
              <div className="text-right">
                <p className="text-sm font-bold text-[#0F172A]">{user?.name || 'Cliente'}</p>
                <p className="text-xs text-[#64748B]">Premium Member</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0) || 'C'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1 overflow-auto bg-[#F5F7FA]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PortalLayout;
