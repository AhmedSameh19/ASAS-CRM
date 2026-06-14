import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { setCookie, deleteCookie } from 'hono/cookie'
import * as bcrypt from 'bcryptjs'
import { authMiddleware } from '../middleware/auth'
import { checkLoginRateLimit, recordFailedAttempt, clearAttempts } from '../middleware/rateLimit'

type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
}

const auth = new Hono<{ Bindings: Bindings; Variables: { db: any; jwtPayload: any } }>()

/** Helper — builds a signed JWT and sets it as an HttpOnly cookie. */
async function setAuthCookie(c: any, user: any, secret: string) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    requires_password_change: user.requires_password_change,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  }
  const token = await sign(payload, secret)

  // Detect if we're running locally (HTTP) so we can omit `secure`
  const isProduction = (c.env as any)?.ENVIRONMENT !== 'development'

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: isProduction,       // Only sent over HTTPS in production
    sameSite: 'Lax',            // Lax allows cross-site top-level navigations (Vercel → CF Worker)
    path: '/',
    maxAge: 60 * 60 * 24 * 7,  // 7 days in seconds
  })

  return token
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  // Rate limit check (per email address)
  const rateLimitKey = (email as string).toLowerCase().trim()
  const rateCheck = checkLoginRateLimit(rateLimitKey)
  if (rateCheck.blocked) {
    return c.json(
      { error: `Too many failed login attempts. Please try again in ${rateCheck.retryAfter} seconds.` },
      429
    )
  }

  const db = c.get('db')

  try {
    const result = await db.query('SELECT * FROM users WHERE Lower(email) = Lower($1)', [email])
    const user = result.rows[0]

    if (!user) {
      recordFailedAttempt(rateLimitKey)
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      recordFailedAttempt(rateLimitKey)
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    clearAttempts(rateLimitKey)

    // Set JWT in HttpOnly cookie — token is NOT returned in the response body
    await setAuthCookie(c, user, c.env.JWT_SECRET)

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        requires_password_change: user.requires_password_change,
      }
    })
  } catch (error: any) {
    console.error('[auth/login] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
auth.post('/logout', (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
  return c.json({ message: 'Logged out successfully' })
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
auth.get('/me', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any
  if (!payload) return c.json({ error: 'Unauthorized' }, 401)

  const db = c.get('db')
  try {
    const result = await db.query(
      'SELECT id, email, name, role, requires_password_change FROM users WHERE id = $1',
      [payload.id]
    )
    const dbUser = result.rows[0]
    if (!dbUser) return c.json({ error: 'User not found' }, 404)

    return c.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      requires_password_change: dbUser.requires_password_change,
    })
  } catch (error: any) {
    console.error('[auth/me] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

// ── POST /api/auth/change-password ───────────────────────────────────────────
auth.post('/change-password', authMiddleware, async (c) => {
  const { newPassword } = await c.req.json()
  const userPayload = c.get('jwtPayload') as any
  const db = c.get('db')

  if (!newPassword || newPassword.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters long' }, 400)
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await db.query(
      'UPDATE users SET password = $1, requires_password_change = false, temp_password = NULL WHERE id = $2',
      [hashedPassword, userPayload.id]
    )

    const result = await db.query(
      'SELECT id, email, name, role, requires_password_change FROM users WHERE id = $1',
      [userPayload.id]
    )
    const user = result.rows[0]

    // Refresh the HttpOnly cookie with updated claims
    await setAuthCookie(c, user, c.env.JWT_SECRET)

    return c.json({
      message: 'Password changed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        requires_password_change: user.requires_password_change,
      }
    })
  } catch (error: any) {
    console.error('[auth/change-password] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

export default auth
