import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  DollarSign, 
  LogOut, 
  Menu,
  X,
  ChevronRight,
  Settings as SettingsIcon,
  WifiOff
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { isDemoMode } = useStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return <div className="min-h-screen bg-[#F2F2F7] flex flex-col">{children}</div>;
  }

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
    <Link
      to={path}
      onClick={() => setIsMobileMenuOpen(false)}
      className={`group flex items-center justify-between px-4 py-3 mx-4 mb-1 rounded-xl transition-all duration-200 ${
        isActive(path) 
          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
          : 'text-gray-500 hover:bg-white hover:text-gray-900'
      }`}
    >
      <div className="flex items-center">
        <Icon className={`w-5 h-5 mr-3 ${isActive(path) ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
        <span className="font-medium text-[15px]">{label}</span>
      </div>
      {!isActive(path) && <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </Link>
  );

  return (
    <div className="flex h-screen bg-[#F2F2F7] overflow-hidden">
      {/* Mobile Header (Glassmorphism) */}
      <div className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-30 flex justify-between items-center p-4">
        <h1 className="font-bold text-lg text-gray-900">Quark Locações</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-full active:bg-gray-100">
          {isMobileMenuOpen ? <X className="text-gray-900" /> : <Menu className="text-gray-900" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-20 w-[280px] bg-[#F2F2F7] lg:bg-[#F2F2F7] border-r border-gray-200/50 transform transition-transform duration-300 cubic-bezier(0.25, 0.8, 0.25, 1)
        ${isMobileMenuOpen ? 'translate-x-0 bg-white shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-8 pb-4">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quark</h1>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Locações</p>
              </div>
           </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1">
          {user.role === 'ADMIN' ? (
            <>
              <div className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Gestão</div>
              <NavItem path="/" icon={LayoutDashboard} label="Visão Geral" />
              <NavItem path="/orders" icon={ShoppingCart} label="Pedidos (Kanban)" />
              <NavItem path="/inventory" icon={Package} label="Estoque" />
              
              <div className="px-6 py-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administrativo</div>
              <NavItem path="/clients" icon={Users} label="Clientes" />
              <NavItem path="/finance" icon={DollarSign} label="Financeiro" />
              <NavItem path="/settings" icon={SettingsIcon} label="Configurações" />
            </>
          ) : (
            <>
              <NavItem path="/" icon={LayoutDashboard} label="Meu Painel" />
              <NavItem path="/my-orders" icon={ShoppingCart} label="Meus Pedidos" />
              <NavItem path="/contracts" icon={FileText} label="Contratos" />
            </>
          )}
        </nav>

        <div className="p-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 flex items-center gap-3">
             <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full border border-gray-200" />
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</p>
             </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-3 bg-white text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors font-medium text-sm shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Encerrar Sessão
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative pt-16 lg:pt-0">
        {isDemoMode && (
          <div className="bg-amber-100 px-4 py-2 text-amber-800 text-xs font-bold text-center flex items-center justify-center border-b border-amber-200">
             <WifiOff className="w-3 h-3 mr-2" />
             MODO DEMONSTRAÇÃO ATIVO — Os dados estão sendo salvos apenas no seu navegador.
          </div>
        )}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F2F2F7] p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;