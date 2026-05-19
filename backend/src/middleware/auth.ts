import { jwt, verify } from 'hono/jwt'
import { Context, Next } from 'hono'

// Wrapper middleware to extract secret from context environment
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  
  // If no Authorization header is present, check if a token is in the query parameters (e.g. for window.open downloads)
  if (!authHeader) {
    const queryToken = c.req.query('token')
    if (queryToken) {
      try {
        const payload = await verify(queryToken, (c.env as any).JWT_SECRET, 'HS256')
        c.set('jwtPayload', payload)
        return next()
      } catch (err) {
        return c.json({ error: 'Unauthorized: Invalid token in query parameter' }, 401)
      }
    }
  }

  const jwtMiddleware = jwt({
    secret: (c.env as any).JWT_SECRET,
    alg: 'HS256'
  })
  return jwtMiddleware(c, next)
}
