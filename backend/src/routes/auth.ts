import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { getDb } from '../db'
import * as bcrypt from 'bcryptjs'

type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
}

const auth = new Hono<{ Bindings: Bindings }>()

// Hardcoded users for fallback/seed
const hardcodedUsers = [
  { email: 'AhmedHany@asas.com', password: 'Admin123', name: 'Ahmed Hany' },
  { email: 'AhmedSakr@asas.com', password: 'Admin123', name: 'Ahmed Sakr' }
]

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()
  const db = getDb(c.env.DATABASE_URL)
  
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
    let user = result.rows[0]

    // Fallback: If no users exist, check if it's one of the hardcoded users and seed them
    if (!user) {
      const hcUser = hardcodedUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
      if (hcUser && hcUser.password === password) {
        // Hash password and insert
        const hashed = await bcrypt.hash(hcUser.password, 10)
        const insertRes = await db.query(
          'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *',
          [hcUser.email, hashed, hcUser.name]
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
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    }
    const token = await sign(payload, c.env.JWT_SECRET)

    return c.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

auth.get('/me', async (c) => {
  // This endpoint relies on the JWT middleware being applied before it
  const user = c.get('jwtPayload') as any
  return c.json({ id: user.id, email: user.email, name: user.name })
})

export default auth
