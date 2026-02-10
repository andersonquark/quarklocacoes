
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { Lock, Save, Trash2, Database, Building } from 'lucide-react';
import { CompanySettings } from '../types';

const Settings = () => {
  const { user } = useAuth();
  const { isDemoMode, resetLocalData, companySettings, updateCompanySettings } = useStore();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Local state for form
  const [formData, setFormData] = useState<CompanySettings>(companySettings);

  useEffect(() => {
      setFormData(companySettings);
  }, [companySettings]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
        alert("A senha deve ter no mínimo 6 caracteres");
        return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
        if (isDemoMode) alert("Em modo demo, a senha não é alterada no banco de dados real.");
        else alert("Erro ao atualizar senha: " + error.message);
    } else {
        alert("Senha atualizada com sucesso!");
        setNewPassword('');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoadingSettings(true);
      await updateCompanySettings(formData);
      setLoadingSettings(false);
      alert("Dados da empresa atualizados!");
  };

  const handleChange = (field: keyof CompanySettings, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (user?.role !== 'ADMIN') return <div>Acesso restrito</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h2>
        
        {/* Company Settings */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600"/> Dados da Empresa
            </h3>
            <p className="text-gray-500 text-sm mb-6">Esses dados aparecerão nos contratos e orçamentos gerados.</p>
            
            <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Fantasia / Razão Social</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CNPJ</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.cnpj} onChange={e => handleChange('cnpj', e.target.value)} />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                    </div>
                     <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail de Contato</label>
                        <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                    </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                     <p className="text-xs font-bold text-gray-400 uppercase mb-4">Endereço da Sede</p>
                     <div className="grid grid-cols-4 gap-4">
                         <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CEP</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.zipCode} onChange={e => handleChange('zipCode', e.target.value)} />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rua</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.street} onChange={e => handleChange('street', e.target.value)} />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Número</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.number} onChange={e => handleChange('number', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bairro</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.neighborhood} onChange={e => handleChange('neighborhood', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cidade</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.city} onChange={e => handleChange('city', e.target.value)} />
                        </div>
                         <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">UF</label>
                            <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.state} onChange={e => handleChange('state', e.target.value)} />
                        </div>
                     </div>
                </div>

                <div className="flex justify-end pt-4">
                     <button disabled={loadingSettings} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
                        {loadingSettings ? 'Salvando...' : 'Salvar Dados da Empresa'}
                    </button>
                </div>
            </form>
        </div>

        {/* Password Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Lock className="w-5 h-5 mr-2 text-gray-600"/> Segurança</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha de Administrador</label>
                    <input 
                        type="password" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                    />
                </div>
                <div className="flex justify-end">
                    <button disabled={loading} className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all">
                        {loading ? 'Salvando...' : 'Atualizar Senha'}
                    </button>
                </div>
            </form>
        </div>
        
        {/* Data Management Section */}
        {isDemoMode && (
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Database className="w-5 h-5 mr-2 text-amber-600"/> Dados Locais (Modo Demo)</h3>
                <p className="text-gray-500 text-sm mb-6">
                    Você está utilizando o modo de demonstração. Todos os pedidos, clientes e alterações de estoque estão salvos no armazenamento do seu navegador.
                </p>
                <div className="flex justify-end">
                    <button 
                        onClick={() => {
                            if(window.confirm("Tem certeza? Todos os dados criados localmente serão apagados e o sistema voltará ao estado inicial.")) {
                                resetLocalData();
                            }
                        }}
                        className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Resetar Dados de Fábrica
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Settings;
