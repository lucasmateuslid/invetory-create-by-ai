import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Cria uma instância do cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam variáveis de ambiente do Supabase. Verifique o arquivo .env');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);