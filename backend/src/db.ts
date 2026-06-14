import { neon, NeonQueryFunction } from '@neondatabase/serverless';

export interface Db {
  query: (text: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
}

// One neon SQL client instance per worker isolate lifetime.
// Because Cloudflare Workers persist global state between requests within
// the same isolate, this is effectively a true singleton for the worker's life.
let cachedSql: NeonQueryFunction<false, false> | null = null;
let cachedConnectionString = '';

export function getDb(connectionString: string): Db {
  if (!cachedSql || cachedConnectionString !== connectionString) {
    cachedSql = neon(connectionString);
    cachedConnectionString = connectionString;
  }

  return {
    query: async (text: string, params?: any[]) => {
      const rows = await cachedSql!.query(text, params);
      return { rows, rowCount: rows.length };
    },
  };
}
