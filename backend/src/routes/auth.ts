import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import * as bcrypt from 'bcryptjs'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
}



const auth = new Hono<{ Bindings: Bindings; Variables: { db: any; jwtPayload: any } }>()

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()
  const db = c.get('db')

  try {
    const result = await db.query('SELECT * FROM users WHERE Lower(email) = Lower($1)', [email])
    const user = result.rows[0]

    // 1. Check if the user exists
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // 2. Verify the password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // 3. Generate JWT
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      requires_password_change: user.requires_password_change,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    }
    const token = await sign(payload, c.env.JWT_SECRET)

    // 4. Return successful response
    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        requires_password_change: user.requires_password_change
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

auth.get('/me', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const db = c.get('db')
  try {
    const result = await db.query(
      'SELECT id, email, name, role, requires_password_change FROM users WHERE id = $1',
      [payload.id]
    )
    const dbUser = result.rows[0]
    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404)
    }
    return c.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      requires_password_change: dbUser.requires_password_change
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

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

    // Retrieve the updated user
    const result = await db.query(
      'SELECT id, email, name, role, requires_password_change FROM users WHERE id = $1',
      [userPayload.id]
    )
    const user = result.rows[0]

    // Re-generate JWT
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      requires_password_change: user.requires_password_change,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    }
    const token = await sign(payload, c.env.JWT_SECRET)

    return c.json({
      message: 'Password changed successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        requires_password_change: user.requires_password_change
      }
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

export default auth
