
import React, { useState, useRef } from 'react';
import { AppSettings, SystemData, FirebaseConfig } from '../types';
import { Save, Building, Phone, MapPin, Lock, FileText, Image as ImageIcon, Download, Upload, Database, Server, Cloud, Wifi, CheckCircle, AlertCircle } from 'lucide-react';
import { validateConnection } from '../services/firebase';

interface SettingsProps {
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
    onExportData: () => void;
    onImportData: (data: SystemData) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave, onExportData, onImportData }) => {
    const [formData, setFormData] = useState<AppSettings>(settings);
    const [activeTab, setActiveTab] = useState<'general' | 'data' | 'cloud'>('general');
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const backupInputRef = useRef<HTMLInputElement>(null);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        alert('Configurações salvas com sucesso!');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    if (json.rentals && json.customers) {
                        if(window.confirm('ATENÇÃO: Isso substituirá todos os dados atuais pelos dados do backup. Deseja continuar?')) {
                            onImportData(json);
                        }
                    } else {
                        alert('Arquivo de backup inválido.');
                    }
                } catch (err) {
                    alert('Erro ao ler arquivo de backup.');
                }
            };
            reader.readAsText(file);
        }
    };

    const updateFirebaseConfig = (key: keyof FirebaseConfig, value: string) => {
        setFormData(prev => ({
            ...prev,
            firebaseConfig: {
                ...prev.firebaseConfig!,
                [key]: value
            }
        }));
    };

    const handleTestConnection = async () => {
        setTestStatus('loading');
        const success = await validateConnection();
        setTestStatus(success ? 'success' : 'error');
        setTimeout(() => setTestStatus('idle'), 3000);
    };

    return (
        <div className="p-8 animate-fade-in pb-20 max-w-4xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Configurações</h2>
                    <p className="text-gray-500 mt-1">Personalize a identidade, dados e nuvem.</p>
                </div>
                <div className="flex space-x-2 bg-white p-1 rounded-xl border border-gray-200 mt-4 md:mt-0">
                    <button 
                        onClick={() => setActiveTab('general')} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-quark-dark text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Geral
                    </button>
                    <button 
                        onClick={() => setActiveTab('cloud')} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'cloud' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Nuvem (Cloud)
                    </button>
                    <button 
                        onClick={() => setActiveTab('data')} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'data' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Backup
                    </button>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                
                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Building className="mr-2 text-quark-dark" size={24}/> Identidade Visual
                        </h3>
                        
                        <div className="flex items-center space-x-8 mb-8">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-32 h-32 rounded-full bg-gray-50 border-4 border-white shadow-xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform overflow-hidden relative group"
                            >
                                <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ImageIcon className="text-white" size={24}/>
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            <div>
                                <p className="font-bold text-gray-900">Logotipo da Empresa</p>
                                <p className="text-sm text-gray-500">Clique para alterar. Formatos: PNG, JPG.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Empresa</label>
                                <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-quark-dark" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CNPJ</label>
                                <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-quark-dark" value={formData.companyDocument} onChange={e => setFormData({...formData, companyDocument: e.target.value})} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Endereço Completo</label>
                                <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-quark-dark" value={formData.companyAddress} onChange={e => setFormData({...formData, companyAddress: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone</label>
                                <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-quark-dark" value={formData.companyPhone} onChange={e => setFormData({...formData, companyPhone: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Lock className="mr-2 text-red-500" size={24}/> Segurança
                        </h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha do Administrador</label>
                            <input 
                                type="text" 
                                className="w-full p-3 bg-red-50 rounded-xl border border-red-100 outline-none focus:ring-2 focus:ring-red-500 font-mono text-red-800" 
                                value={formData.adminPassword} 
                                onChange={e => setFormData({...formData, adminPassword: e.target.value})} 
                            />
                            <p className="text-xs text-gray-400 mt-2">Esta é a senha utilizada para o login principal (admin).</p>
                        </div>
                    </div>
                    </>
                )}

                {/* CLOUD / FIREBASE TAB */}
                {activeTab === 'cloud' && (
                    <div className="bg-blue-50 p-8 rounded-3xl shadow-sm border border-blue-100 animate-fade-in">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-blue-900 mb-2 flex items-center">
                                    <Cloud className="mr-2" size={24}/> Sincronização em Tempo Real (Firebase)
                                </h3>
                                <p className="text-sm text-blue-700 max-w-lg">
                                    Conecte ao Google Firebase para sincronizar seus dados automaticamente entre dispositivos (PC, Celular, Tablet).
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-full text-xs font-bold ${formData.firebaseConfig?.apiKey ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-200 text-gray-500'}`}>
                                {formData.firebaseConfig?.apiKey ? 'CONECTADO' : 'DESCONECTADO'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'].map((field) => (
                                <div key={field} className={field === 'apiKey' || field === 'databaseURL' ? 'md:col-span-2' : ''}>
                                    <label className="block text-xs font-bold text-blue-400 uppercase mb-1">{field}</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 bg-white rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs text-blue-900"
                                        placeholder={`Cole o ${field} aqui`}
                                        value={(formData.firebaseConfig as any)?.[field] || ''}
                                        onChange={e => updateFirebaseConfig(field as keyof FirebaseConfig, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-blue-100">
                            <div className="text-xs text-gray-500">
                                <strong>Status: </strong> 
                                {testStatus === 'loading' && 'Testando conexão...'}
                                {testStatus === 'success' && <span className="text-green-600 font-bold">Conexão OK! Gravação funcionando.</span>}
                                {testStatus === 'error' && <span className="text-red-600 font-bold">Falha na conexão. Verifique as chaves.</span>}
                                {testStatus === 'idle' && 'Aguardando teste.'}
                            </div>
                            <button 
                                type="button"
                                onClick={handleTestConnection}
                                disabled={testStatus === 'loading'}
                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center ${testStatus === 'success' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                {testStatus === 'success' ? <CheckCircle size={16} className="mr-2"/> : <Wifi size={16} className="mr-2"/>}
                                {testStatus === 'success' ? 'Sucesso' : 'Testar Conexão'}
                            </button>
                        </div>
                    </div>
                )}

                {/* DATA TAB */}
                {activeTab === 'data' && (
                    <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-lg border border-gray-800 relative overflow-hidden animate-fade-in">
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                        
                        <h3 className="text-xl font-bold mb-6 flex items-center relative z-10">
                            <Server className="mr-2 text-quark-primary" size={24}/> Backup Local (Arquivo)
                        </h3>
                        <p className="text-sm text-gray-400 mb-6 max-w-lg relative z-10">
                            Se não utilizar a nuvem, faça backups manuais baixando o arquivo JSON.
                        </p>
                        
                        <div className="flex flex-col md:flex-row gap-4 relative z-10">
                            <button 
                                type="button"
                                onClick={onExportData}
                                className="flex-1 py-4 bg-white/10 text-white font-bold rounded-xl border border-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-colors"
                            >
                                <Download className="mr-2" size={20}/> Baixar Backup Completo
                            </button>
                            
                            <button 
                                type="button"
                                onClick={() => backupInputRef.current?.click()}
                                className="flex-1 py-4 bg-quark-primary text-quark-dark font-bold rounded-xl border border-quark-primary hover:bg-white flex items-center justify-center transition-colors"
                            >
                                <Upload className="mr-2" size={20}/> Restaurar Backup
                            </button>
                            <input type="file" ref={backupInputRef} className="hidden" accept=".json" onChange={handleBackupUpload} />
                        </div>
                    </div>
                )}

                <button type="submit" className="w-full py-4 bg-quark-dark text-white font-bold text-lg rounded-2xl shadow-xl hover:bg-black transition-transform active:scale-95 flex items-center justify-center">
                    <Save className="mr-2" size={20} /> Salvar Configurações
                </button>
            </form>
        </div>
    );
};

export default Settings;
