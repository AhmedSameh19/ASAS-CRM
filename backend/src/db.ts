import { neon } from '@neondatabase/serverless';

let cachedDb: any = null;
let cachedConnectionString = '';

// In Cloudflare Workers, we use Neon's HTTP client 'neon' for stateless queries.
// We cache the db instance globally so we reuse the connection client across requests,
// avoiding setup overhead while preventing WebSocket shared-state issues.
export const getDb = (connectionString: string) => {
  if (cachedDb && cachedConnectionString === connectionString) {
    return cachedDb;
  }

  const sql = neon(connectionString);
  cachedConnectionString = connectionString;
  cachedDb = {
    query: async (text: string, params?: any[]) => {
      // For conventional function calls with value placeholders ($1, $2, etc.), we use sql.query
      const rows = await sql.query(text, params);
      return {
        rows,
        rowCount: rows.length
      };
    }
  };
  return cachedDb;
};
