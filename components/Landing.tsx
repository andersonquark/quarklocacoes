
import React from 'react';
import { LOGO_ICON } from '../constants';
import { User, ShieldCheck, ArrowRight } from 'lucide-react';
import { AppSettings } from '../types';

interface LandingProps {
    settings: AppSettings;
    onSelectMode: (mode: 'client' | 'admin') => void;
}

const Landing: React.FC<LandingProps> = ({ settings, onSelectMode }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F2F7] relative overflow-hidden font-sans p-6">
            
            <div className="text-center mb-12 animate-scale-in z-10">
                <div className="w-24 h-24 bg-quark-dark rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                    <img src={settings.logoUrl || LOGO_ICON} alt="Logo" className="w-14 h-14 object-contain" />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{settings.companyName}</h1>
                <p className="text-gray-500 font-medium">Selecione como deseja acessar</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl z-10">
                
                {/* Client Card */}
                <button 
                    onClick={() => onSelectMode('client')}
                    className="group bg-white p-8 rounded-[2rem] shadow-lg hover:shadow-2xl border border-gray-100 transition-all duration-300 hover:-translate-y-1 text-left relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <User size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Sou Cliente</h3>
                        <p className="text-gray-500 text-sm mb-6">Acesse seus orçamentos, assine contratos e veja seu histórico.</p>
                        <div className="flex items-center font-bold text-blue-600 group-hover:translate-x-2 transition-transform">
                            Entrar no Portal <ArrowRight className="ml-2" size={18} />
                        </div>
                    </div>
                </button>

                {/* Admin Card */}
                <button 
                    onClick={() => onSelectMode('admin')}
                    className="group bg-quark-dark p-8 rounded-[2rem] shadow-xl hover:shadow-2xl border border-gray-800 transition-all duration-300 hover:-translate-y-1 text-left relative overflow-hidden"
                >
                     <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-tr-full -ml-8 -mb-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/10 text-quark-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-quark-primary group-hover:text-quark-dark transition-colors">
                            <ShieldCheck size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Administrador</h3>
                        <p className="text-gray-400 text-sm mb-6">Gestão completa de inventário, aluguéis e configurações.</p>
                        <div className="flex items-center font-bold text-quark-primary group-hover:translate-x-2 transition-transform">
                            Acesso Restrito <ArrowRight className="ml-2" size={18} />
                        </div>
                    </div>
                </button>
            </div>

            <div className="mt-12 text-center opacity-40 text-xs text-gray-500 font-medium tracking-widest uppercase">
                Sistema Seguro • Versão 2.1
            </div>
        </div>
    );
};

export default Landing;