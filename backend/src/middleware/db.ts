import { Context, Next } from 'hono';
import { getDb, Db } from '../db';

/**
 * Attaches the DB client to the Hono context once per request chain.
 * Route handlers access it via c.get('db') — no need to import getDb anywhere else.
 */
export const dbMiddleware = async (c: Context, next: Next) => {
  const db = getDb((c.env as any).DATABASE_URL);
  c.set('db', db);
  await next();
};
