import { createClient, SupabaseClient } from '@supabase/supabase-js';

let envLoaded = false;

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

function loadEnv(): void {
  if (envLoaded || (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)) {
    return;
  }

  try {
    require('dotenv').config();
    envLoaded = true;
  } catch {
    // dotenv not available
  }
}

function getSupabaseCredentials(): SupabaseCredentials {
  loadEnv();

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('请配置 SUPABASE_URL 环境变量');
  }
  if (!anonKey) {
    throw new Error('请配置 SUPABASE_ANON_KEY 环境变量');
  }

  return { url, anonKey };
}

function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();

  if (token) {
    return createClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      db: {
        timeout: 60000,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient(url, anonKey, {
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { loadEnv, getSupabaseCredentials, getSupabaseClient };
