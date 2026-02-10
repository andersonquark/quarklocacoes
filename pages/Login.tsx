import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { Shield, User, Lock, Mail, Phone, ArrowRight, FileText, AlertCircle, Info, Settings, Database, Save, X } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'ADMIN'>('CLIENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');

  useEffect(() => {
      // Load existing config if any
      setConfigUrl(localStorage.getItem('quark_supabase_url') || '');
      setConfigKey(localStorage.getItem('quark_supabase_key') || '');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if(identifier) {
        setLoading(true);
        try {
            await login(identifier, password, activeTab);
        } catch (e: any) {
            console.error(e);
            let msg = e.message || "Erro desconhecido";
            
            if (msg.includes('Invalid login credentials')) {
                msg = 'Credenciais inválidas. Verifique e-mail e senha.';
            } else if (msg.includes('Email not confirmed')) {
                msg = 'E-mail não confirmado.';
            } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
                msg = 'Erro de conexão com o servidor. Verifique sua internet ou as chaves de API.';
            } else if (msg.includes('apikey')) {
                msg = 'Chave de API inválida. Verifique as configurações.';
            }

            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    } else {
        setErrorMsg("Por favor, preencha suas credenciais.");
    }
  };

  const saveConfig = () => {
      if (!configUrl || !configKey) {
          alert("Preencha ambos os campos.");
          return;
      }
      localStorage.setItem('quark_supabase_url', configUrl.trim());
      localStorage.setItem('quark_supabase_key', configKey.trim());
      window.location.reload(); // Reload to apply new connection
  };

  const clearConfig = () => {
      localStorage.removeItem('quark_supabase_url');
      localStorage.removeItem('quark_supabase_key');
      localStorage.removeItem('quark_admin_local_session');
      localStorage.removeItem('quark_client_session');
      window.location.reload();
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F2F2F7] relative overflow-hidden">
      {/* Settings Button */}
      <button 
        onClick={() => setShowSettings(true)}
        className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-blue-600 hover:rotate-90 transition-all z-20"
        title="Configurar Conexão"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-10 z-10 mx-4 border border-gray-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30">
             <span className="text-white font-bold text-2xl">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bem-vindo</h1>
          <p className="mt-2 text-gray-500 text-sm">
             {isSupabaseConfigured ? 'Acesse com sua conta cadastrada' : 'Configuração Necessária'}
          </p>
        </div>

        {/* Custom Segmented Control */}
        <div className="grid grid-cols-2 bg-gray-100 p-1.5 rounded-xl mb-8">
             <button 
                onClick={() => { setActiveTab('CLIENT'); setIdentifier(''); setPassword(''); setErrorMsg(''); }}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'CLIENT' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                Sou Cliente
             </button>
             <button 
                onClick={() => { setActiveTab('ADMIN'); setIdentifier(''); setPassword(''); setErrorMsg(''); }}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'ADMIN' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                Administrador
             </button>
        </div>

        {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
              <label className="block text-[13px] font-semibold text-gray-600 mb-2 ml-1">
                  {activeTab === 'CLIENT' ? 'SEU CPF' : 'EMAIL CORPORATIVO'}
              </label>
              <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      {activeTab === 'CLIENT' ? <FileText className="h-5 w-5"/> : <Mail className="h-5 w-5"/>}
                  </div>
                  <input 
                      type={activeTab === 'CLIENT' ? "text" : "email"}
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium" 
                      placeholder={activeTab === 'CLIENT' ? "000.000.000-00" : "admin@quark.com"}
                      value={identifier}
                      onChange={e => {
                          const val = e.target.value;
                          setIdentifier(activeTab === 'CLIENT' ? formatCPF(val) : val);
                      }}
                  />
              </div>
          </div>

          {activeTab === 'ADMIN' && (
              <div className="animate-slide-up">
                  <label className="block text-[13px] font-semibold text-gray-600 mb-2 ml-1">SENHA</label>
                  <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                          <Lock className="h-5 w-5"/>
                      </div>
                      <input 
                          type="password" 
                          className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium" 
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                      />
                  </div>
              </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-500/30 text-[15px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'} <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </form>
        
        {/* Status Indicator */}
        <div className="mt-8 text-center">
            {isSupabaseConfigured ? (
                 <p className="text-xs text-green-600 flex items-center justify-center gap-1.5 font-medium">
                    <Database className="w-3.5 h-3.5" /> Conectado ao Supabase
                </p>
            ) : (
                <p className="text-xs text-amber-600 flex items-center justify-center gap-1.5 font-medium cursor-pointer hover:underline" onClick={() => setShowSettings(true)}>
                    <AlertCircle className="w-3.5 h-3.5" /> Configure a conexão para entrar
                </p>
            )}
        </div>
      </div>

      {/* Connection Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <Database className="w-5 h-5 mr-2 text-blue-600"/> Configurar Conexão
                      </h3>
                      <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                          Configure manualmente se desejar usar um projeto diferente do padrão.
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Supabase Project URL</label>
                          <input 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" 
                            placeholder="https://xyz.supabase.co"
                            value={configUrl}
                            onChange={e => setConfigUrl(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Supabase Anon Key</label>
                          <input 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" 
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            value={configKey}
                            onChange={e => setConfigKey(e.target.value)}
                          />
                      </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between gap-4">
                      <button onClick={clearConfig} className="px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors text-sm">
                          Restaurar Padrão
                      </button>
                      <button onClick={saveConfig} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors flex items-center justify-center">
                          <Save className="w-4 h-4 mr-2" /> Salvar e Conectar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Login;