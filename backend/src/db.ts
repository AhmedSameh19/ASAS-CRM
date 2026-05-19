import { neon } from '@neondatabase/serverless';

// In Cloudflare Workers, we use Neon's HTTP client 'neon' for stateless queries.
// This completely avoids persistent WebSocket connections being shared across request contexts,
// resolving the "Cannot perform I/O on behalf of a different request" error, while remaining fast.
export const getDb = (connectionString: string) => {
  const sql = neon(connectionString);
  return {
    query: async (text: string, params?: any[]) => {
      // For conventional function calls with value placeholders ($1, $2, etc.), we use sql.query
      const rows = await sql.query(text, params);
      return {
        rows,
        rowCount: rows.length
      };
    }
  };
};
