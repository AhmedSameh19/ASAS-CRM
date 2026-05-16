import { jwt } from 'hono/jwt'
import { Context, Next } from 'hono'

// Wrapper middleware to extract secret from context environment
export const authMiddleware = async (c: Context, next: Next) => {
  const jwtMiddleware = jwt({
    secret: (c.env as any).JWT_SECRET,
    alg: 'HS256'
  })
  return jwtMiddleware(c, next)
}
