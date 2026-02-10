import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password?: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Fallback: Check for Local Admin Session (Dev Mode) - always check this first
        const storedAdmin = localStorage.getItem('quark_admin_local_session');
        const storedClient = localStorage.getItem('quark_client_session');

        if (storedAdmin) {
           setUser(JSON.parse(storedAdmin));
           setLoading(false);
           return;
        }
        
        if (storedClient) {
            setUser(JSON.parse(storedClient));
            setLoading(false);
            return;
        }

        // Only try Supabase if configured, otherwise invalid key throws error
        if (isSupabaseConfigured) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
            setUser({
                id: session.user.id,
                name: session.user.user_metadata?.name || 'Administrador',
                email: session.user.email || '',
                role: 'ADMIN',
                avatar: `https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff`
            });
            }
        }
      } catch (err) {
        console.error("Erro ao verificar sessão (Silencioso em Demo):", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (identifier: string, password?: string, role: UserRole = 'CLIENT') => {
    setLoading(true);
    try {
      if (role === 'ADMIN') {
        // --- FALLBACK / DEV MODE LOGIN LOGIC ---
        // Checks local credentials first or if Supabase is down/unconfigured
        const isHardcodedAdmin = identifier === 'admin@quarklocacoes.com' && password === '@Quarklocacoes!';
        
        if (!isSupabaseConfigured || isHardcodedAdmin) {
             if (isHardcodedAdmin) {
                console.log("Login Admin Local realizado com sucesso.");
                const localAdmin: User = {
                    id: 'local-admin-id',
                    name: 'Administrador (Demo)',
                    email: identifier,
                    role: 'ADMIN',
                    avatar: `https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff`
                };
                setUser(localAdmin);
                localStorage.setItem('quark_admin_local_session', JSON.stringify(localAdmin));
                setLoading(false);
                return;
             } else if (!isSupabaseConfigured) {
                 throw new Error('Modo Demo: Use o login admin@quarklocacoes.com / @Quarklocacoes!');
             }
        }

        // Real Supabase Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password: password || ''
        });

        if (error) throw error;

        if (data.user) {
          setUser({
            id: data.user.id,
            name: 'Administrador',
            email: data.user.email || '',
            role: 'ADMIN',
            avatar: `https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff`
          });
          // Clear local session if real session works
          localStorage.removeItem('quark_admin_local_session');
        }
      } else {
        // Client Login Logic (Lookup by CPF)
        const cleanCpf = identifier.replace(/\D/g, '');
        
        // Local Client Lookup if not configured
        if (!isSupabaseConfigured) {
            const storedClientsStr = localStorage.getItem('quark_clients');
            // Try to find in local storage or use mock list import (would need import, but let's assume local storage from StoreContext init)
            // Simplified: Allow any CPF in demo mode if it matches a format
            if (cleanCpf.length === 11 || cleanCpf.length === 14) {
                 const clientUser: User = {
                    id: 'demo-client-id',
                    name: 'Cliente Demo',
                    email: 'cliente@demo.com',
                    role: 'CLIENT',
                    avatar: `https://ui-avatars.com/api/?name=Cliente&background=10b981&color=fff`
                };
                localStorage.setItem('quark_client_session', JSON.stringify(clientUser));
                setUser(clientUser);
                setLoading(false);
                return;
            }
        }

        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .or(`document.eq.${identifier},document.eq.${cleanCpf}`) 
          .single();

        if (error) {
           throw new Error('Cliente não encontrado.');
        }
        if (!data) {
          throw new Error('Cliente não cadastrado.');
        }

        const clientUser: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: 'CLIENT',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=10b981&color=fff`
        };

        localStorage.setItem('quark_client_session', JSON.stringify(clientUser));
        setUser(clientUser);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
        await supabase.auth.signOut();
    }
    localStorage.removeItem('quark_client_session');
    localStorage.removeItem('quark_admin_local_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};