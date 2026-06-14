import { Hono } from 'hono'
import * as bcrypt from 'bcryptjs'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
}

const users = new Hono<{ Bindings: Bindings; Variables: { db: any; jwtPayload: any } }>()

users.use('*', authMiddleware)

// Helper: check if authenticated user is admin
async function checkAdmin(c: any) {
  const userPayload = c.get('jwtPayload') as any
  if (!userPayload) return false
  
  const db = c.get('db')
  try {
    const res = await db.query('SELECT role FROM users WHERE id = $1', [userPayload.id])
    const user = res.rows[0]
    return user && user.role === 'admin'
  } catch (err) {
    console.error('Check admin error:', err)
    return false
  }
}

// GET /api/users - List all users
users.get('/', async (c) => {
  const isAdmin = await checkAdmin(c)
  if (!isAdmin) {
    return c.json({ error: 'Forbidden: Admins only' }, 403)
  }

  const db = c.get('db')
  try {
    const res = await db.query(
      'SELECT id, email, name, role, requires_password_change, temp_password, created_at FROM users ORDER BY created_at DESC'
    )
    return c.json({ users: res.rows })
  } catch (error: any) {
    console.error('[users/list] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

// POST /api/users - Create a new user with random password
users.post('/', async (c) => {
  const isAdmin = await checkAdmin(c)
  if (!isAdmin) {
    return c.json({ error: 'Forbidden: Admins only' }, 403)
  }

  const { email, name, role = 'user' } = await c.req.json()
  if (!email || !name) {
    return c.json({ error: 'Email and Name are required' }, 400)
  }
  if (!['user', 'admin'].includes(role)) {
    return c.json({ error: 'Invalid role. Must be "user" or "admin"' }, 400)
  }

  // Generate cryptographically secure random password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const randomBytes = new Uint32Array(12)
  crypto.getRandomValues(randomBytes)
  const tempPassword = Array.from(randomBytes).map(n => chars[n % chars.length]).join('')


  const db = c.get('db')
  try {
    // Check if user already exists
    const checkUser = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email])
    if (checkUser.rowCount > 0) {
      return c.json({ error: 'User with this email already exists' }, 409)
    }

    const hashedPassword = await bcrypt.hash(tempPassword, 10)
    const res = await db.query(
      `INSERT INTO users (email, password, name, role, requires_password_change, temp_password) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, name, role, requires_password_change, temp_password, created_at`,
      [email.toLowerCase(), hashedPassword, name, role, true, tempPassword]
    )

    return c.json({
      message: 'User created successfully',
      user: res.rows[0],
      tempPassword // Return plain text password for admin to copy
    }, 201)
  } catch (error: any) {
    console.error('[users/create] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

// PUT /api/users/profile - Update own profile and/or change password
users.put('/profile', async (c) => {
  const userPayload = c.get('jwtPayload') as any
  if (!userPayload) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const userId = userPayload.id
  const { name, currentPassword, newPassword } = await c.req.json()

  if (!name) {
    return c.json({ error: 'Name is required' }, 400)
  }

  const db = c.get('db')
  try {
    const userRes = await db.query('SELECT password, role FROM users WHERE id = $1', [userId])
    const user = userRes.rows[0]
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    let hashedPassword = user.password
    if (newPassword) {
      if (!currentPassword) {
        return c.json({ error: 'Current password is required to set a new password' }, 400)
      }
      
      const isMatch = await bcrypt.compare(currentPassword, user.password)
      if (!isMatch) {
        return c.json({ error: 'Incorrect current password' }, 400)
      }

      if (newPassword.length < 6) {
        return c.json({ error: 'New password must be at least 6 characters long' }, 400)
      }

      hashedPassword = await bcrypt.hash(newPassword, 10)
    }

    const updateRes = await db.query(
      `UPDATE users 
       SET name = $1, password = $2
       WHERE id = $3 
       RETURNING id, email, name, role, created_at`,
      [name, hashedPassword, userId]
    )

    return c.json({
      message: 'Profile updated successfully',
      user: updateRes.rows[0]
    })
  } catch (error: any) {
    console.error('[users/profile] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

// DELETE /api/users/:id - Delete a user
users.delete('/:id', async (c) => {
  const isAdmin = await checkAdmin(c)
  if (!isAdmin) {
    return c.json({ error: 'Forbidden: Admins only' }, 403)
  }

  const targetId = parseInt(c.req.param('id'), 10)
  const userPayload = c.get('jwtPayload') as any

  if (targetId === userPayload.id) {
    return c.json({ error: 'Cannot delete yourself' }, 400)
  }

  const db = c.get('db')
  try {
    // Reassign prospects to NULL or handle foreign key relations
    await db.query('UPDATE prospects SET assigned_to = NULL WHERE assigned_to = $1', [targetId])
    await db.query('UPDATE activities SET created_by = NULL WHERE created_by = $1', [targetId])
    await db.query('UPDATE documents SET uploaded_by = NULL WHERE uploaded_by = $1', [targetId])

    const deleteRes = await db.query('DELETE FROM users WHERE id = $1 RETURNING id, email', [targetId])
    if (deleteRes.rowCount === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ message: 'User deleted successfully', deletedUser: deleteRes.rows[0] })
  } catch (error: any) {
    console.error('[users/delete] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

export default users
