import { createClient } from '@supabase/supabase-js';

// Credenciais fornecidas pelo usuário
const PROVIDED_URL = 'https://rcprgoraoenkivljyexp.supabase.co';
const PROVIDED_KEY = 'sb_publishable_2x7LMH3h7LEGdTY4_qWmBQ_jFEWJ69i';

// Tenta pegar as chaves do LocalStorage (caso você queira sobrescrever via UI)
const storedUrl = localStorage.getItem('quark_supabase_url');
const storedKey = localStorage.getItem('quark_supabase_key');

// Helper para ler variáveis de ambiente de forma segura
const getEnv = (key: string) => {
  try {
    return typeof process !== 'undefined' ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

const envUrl = getEnv('REACT_APP_SUPABASE_URL');
const envKey = getEnv('REACT_APP_SUPABASE_ANON_KEY');

// Define a URL e Key finais.
// Ordem de prioridade: LocalStorage > Variáveis de Ambiente > Hardcoded (Suas chaves)
const supabaseUrl = storedUrl || envUrl || PROVIDED_URL;
const supabaseKey = storedKey || envKey || PROVIDED_KEY;

// Verifica se as chaves são válidas
const isUrlValid = supabaseUrl && supabaseUrl.includes('supabase.co');
// Verifica comprimento mínimo e se não é o placeholder antigo
const isKeyValid = supabaseKey && supabaseKey.length > 20 && supabaseKey !== 'Insira-Sua-Chave-Anon-Public-Aqui-Comeca-Com-eyJ';

export const isSupabaseConfigured = isUrlValid && isKeyValid;

// Cria o cliente Supabase
export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);