import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { Lock, Save, Trash2, Database } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { isDemoMode, resetLocalData } = useStore();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  if (user?.role !== 'ADMIN') return <div>Acesso restrito</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h2>
        
        {/* Password Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Lock className="w-5 h-5 mr-2 text-blue-600"/> Segurança</h3>
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
                    <button disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
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
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Dados da Empresa</h3>
            <p className="text-gray-500 text-sm">Esses dados aparecem nos contratos gerados.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 opacity-50 pointer-events-none">
                <input value="Quark Locações" readOnly className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl"/>
                <input value="CNPJ: 00.000.000/0001-00" readOnly className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl"/>
            </div>
            <p className="text-xs text-orange-500 mt-2">Em desenvolvimento</p>
        </div>
    </div>
  );
};

export default Settings;