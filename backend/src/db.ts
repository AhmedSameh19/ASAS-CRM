import { Pool } from '@neondatabase/serverless';

// Create a connection pool to Neon
// In Cloudflare Workers, we instantiate the pool per request or in the handler
// to utilize the environment variables properly.
export const getDb = (connectionString: string) => {
  const pool = new Pool({ connectionString });
  return pool;
};
