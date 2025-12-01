import React, { useState } from 'react';
import { LOGO_ICON } from '../constants';
import { ArrowRight, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginProps {
    onLogin: (email: string, password: string) => boolean;
    mode: 'admin' | 'client';
    onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, mode, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = onLogin(email, password);
        if (!success) {
            setError('Credenciais inválidas. Verifique e tente novamente.');
        }
    };

    const isAdmin = mode === 'admin';

    return (
        <div className={`min-h-screen flex items-center justify-center relative overflow-hidden font-sans transition-colors duration-500 ${isAdmin ? 'bg-quark-dark' : 'bg-gray-100'}`}>
            
            {/* Back Button */}
            <button onClick={onBack} className={`absolute top-6 left-6 p-3 rounded-full transition-colors z-20 ${isAdmin ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-200'}`}>
                <ArrowLeft size={24} />
            </button>

            {/* Background Accents */}
            <div className={`absolute top-0 right-0 w-full h-2 bg-gradient-to-r ${isAdmin ? 'from-quark-primary to-quark-secondary' : 'from-blue-500 to-blue-400'}`}></div>
            
            <div className={`p-12 rounded-3xl shadow-2xl w-full max-w-md border z-10 animate-scale-in ${isAdmin ? 'bg-quark-card border-white/10' : 'bg-white border-gray-200'}`}>
                <div className="text-center mb-10">
                    <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg ${isAdmin ? 'bg-black/30 border border-white/10' : 'bg-quark-dark'}`}>
                        <img src={LOGO_ICON} alt="Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className={`text-2xl font-extrabold tracking-tight ${isAdmin ? 'text-white' : 'text-gray-900'}`}>
                        {isAdmin ? 'Acesso Administrativo' : 'Portal do Cliente'}
                    </h1>
                    <p className={`mt-2 text-sm font-medium ${isAdmin ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isAdmin ? 'Entre com suas credenciais de gestão.' : 'Acesse para ver orçamentos e contratos.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center text-sm animate-fade-in">
                        <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-xs font-bold uppercase mb-1 ml-1 ${isAdmin ? 'text-gray-400' : 'text-gray-700'}`}>
                                {isAdmin ? 'Usuário' : 'Email Cadastrado'}
                            </label>
                            <div className="relative group">
                                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors ${isAdmin ? 'text-gray-500 group-focus-within:text-quark-primary' : 'text-gray-500 group-focus-within:text-blue-600'}`} size={20} />
                                <input 
                                    type="text" 
                                    className={`w-full pl-12 pr-4 py-4 rounded-xl outline-none border transition-all font-medium ${
                                        isAdmin 
                                        ? 'bg-black/20 border-white/10 text-white focus:border-quark-primary focus:bg-black/40 placeholder-gray-500' 
                                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-500'
                                    }`}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder={isAdmin ? "admin" : "seu@email.com"}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className={`block text-xs font-bold uppercase mb-1 ml-1 ${isAdmin ? 'text-gray-400' : 'text-gray-700'}`}>Senha</label>
                            <div className="relative group">
                                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors ${isAdmin ? 'text-gray-500 group-focus-within:text-quark-primary' : 'text-gray-500 group-focus-within:text-blue-600'}`} size={20} />
                                <input 
                                    type="password" 
                                    className={`w-full pl-12 pr-4 py-4 rounded-xl outline-none border transition-all font-medium ${
                                        isAdmin 
                                        ? 'bg-black/20 border-white/10 text-white focus:border-quark-primary focus:bg-black/40 placeholder-gray-500' 
                                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-500'
                                    }`}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className={`w-full font-bold text-lg py-4 rounded-xl shadow-lg transition-all flex items-center justify-center group active:scale-95 ${
                            isAdmin 
                            ? 'bg-quark-primary text-quark-dark hover:bg-white' 
                            : 'bg-quark-dark text-white hover:bg-black'
                        }`}
                    >
                        Entrar <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;