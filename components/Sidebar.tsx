
import React from 'react';
import { LayoutDashboard, Package, Users, FileText, LogOut, Settings, ClipboardList } from 'lucide-react';
import { ViewState, AppSettings, RentalOrder, RentalStatus } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  settings: AppSettings;
  rentals: RentalOrder[]; 
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, settings, rentals, onLogout }) => {
  // Calculate notifications for Pending Approval (Quotes)
  const pendingCount = rentals.filter(r => r.status === RentalStatus.PENDING_APPROVAL).length;

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'quotes', label: 'Orçamentos', icon: ClipboardList, badge: pendingCount },
    { id: 'rentals', label: 'Aluguéis', icon: FileText },
    { id: 'inventory', label: 'Equipamentos', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="w-72 h-full bg-quark-dark flex flex-col shadow-2xl overflow-hidden relative">
       {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-quark-gradient opacity-100"></div>
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-quark-primary blur-[100px] opacity-10 rounded-full pointer-events-none"></div>

      <div className="p-8 flex items-center space-x-4 mb-4 z-10">
        <div className="w-12 h-12 relative bg-white/5 rounded-xl p-2 border border-white/10 overflow-hidden flex-shrink-0">
            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col min-w-0">
            <span className="font-bold text-xl text-white tracking-tight truncate">{settings.companyName.split(' ')[0]}</span>
            <span className="text-[10px] text-quark-primary uppercase tracking-[0.2em] font-bold">Locações</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-3 overflow-y-auto custom-scrollbar z-10">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'text-quark-dark bg-white shadow-[0_0_25px_rgba(255,255,255,0.2)] scale-[1.02]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-quark-gradient rounded-full"></div>}
              <Icon size={20} className={isActive ? 'text-quark-dark' : 'text-gray-500 group-hover:text-quark-primary transition-colors'} strokeWidth={isActive ? 2.5 : 2} />
              <span className="flex-1 text-left">{item.label}</span>
              
              {/* Notification Badge */}
              {item.badge && item.badge > 0 ? (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse absolute right-4">
                      {item.badge}
                  </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto z-10">
        <div 
            onClick={onLogout}
            className="glass-panel bg-white/5 rounded-2xl p-4 border-white/10 hover:border-quark-primary/50 transition-colors group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-quark-primary to-quark-secondary flex items-center justify-center text-quark-dark font-bold text-sm shadow-lg shrink-0">
              ADM
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white group-hover:text-quark-primary transition-colors truncate">Administrador</span>
              <span className="text-[10px] text-gray-500">Sair do Sistema</span>
            </div>
            <LogOut size={16} className="ml-auto text-gray-600 hover:text-red-400 transition-colors" />
          </div>
        </div>
        <p className="text-center text-[9px] text-gray-600 mt-4 tracking-widest opacity-50">QUARK SYSTEM V2.2</p>
      </div>
    </div>
  );
};

export default Sidebar;
