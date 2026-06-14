import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { getDb } from '../db'
import * as bcrypt from 'bcryptjs'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
}

const auth = new Hono<{ Bindings: Bindings }>()

// Hardcoded users for fallback/seed
const hardcodedUsers = [
  { email: 'AhmedHany@asas.com', password: 'Admin123', name: 'Ahmed Hany', role: 'user' },
  { email: 'AhmedSakr@asas.com', password: 'Admin123', name: 'Ahmed Sakr', role: 'admin' }
]

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()
  const db = getDb(c.env.DATABASE_URL)

  try {
    const result = await db.query('SELECT * FROM users WHERE Lower(email) = Lower($1)', [email])
    let user = result.rows[0]

    // Fallback: If no users exist, check if it's one of the hardcoded users and seed them
    if (!user) {
      const hcUser = hardcodedUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
      if (hcUser && hcUser.password === password) {
        // Hash password and insert
        const hashed = await bcrypt.hash(hcUser.password, 10)
        const insertRes = await db.query(
          'INSERT INTO users (email, password, name, role, requires_password_change) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [hcUser.email, hashed, hcUser.name, hcUser.role, false]
        )
        user = insertRes.rows[0]
      } else {
        return c.json({ error: 'Invalid credentials' }, 401)
      }
    } else {
      // Verify password
      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return c.json({ error: 'Invalid credentials' }, 401)
      }
    }

    // Generate JWT
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      requires_password_change: user.requires_password_change,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    }
    const token = await sign(payload, c.env.JWT_SECRET)

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
  const db = getDb(c.env.DATABASE_URL)
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
  const db = getDb(c.env.DATABASE_URL)

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

