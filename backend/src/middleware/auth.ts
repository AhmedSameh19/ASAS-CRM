import { jwt, verify } from 'hono/jwt'
import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'

/**
 * Auth middleware — token resolution priority:
 *  1. HttpOnly cookie `auth_token`  (browsers — XSS-safe)
 *  2. Authorization: Bearer header  (API clients / Postman / curl)
 *  3. ?token= query param           (window.open file downloads)
 */
export const authMiddleware = async (c: Context, next: Next) => {
  const secret = (c.env as any).JWT_SECRET

  // 1. Try HttpOnly cookie first
  const cookieToken = getCookie(c, 'auth_token')
  if (cookieToken) {
    try {
      const payload = await verify(cookieToken, secret, 'HS256')
      c.set('jwtPayload', payload)
      return next()
    } catch {
      // Cookie present but invalid/expired — fall through
    }
  }

  // 2. Try Authorization: Bearer header (API clients / Postman)
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwtMiddleware = jwt({ secret, alg: 'HS256' })
    return jwtMiddleware(c, next)
  }

  // 3. Try ?token= query param (for window.open file downloads)
  const queryToken = c.req.query('token')
  if (queryToken) {
    try {
      const payload = await verify(queryToken, secret, 'HS256')
      c.set('jwtPayload', payload)
      return next()
    } catch {
      return c.json({ error: 'Unauthorized: Invalid token' }, 401)
    }
  }

  return c.json({ error: 'Unauthorized' }, 401)
}
