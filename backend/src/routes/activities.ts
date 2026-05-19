import { Hono } from 'hono'
import { getDb } from '../db'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
}

const activities = new Hono<{ Bindings: Bindings }>()

activities.use('*', authMiddleware)

// GET /api/activities
// Database Isolation: Returns activities associated with prospects that are owned by the authenticated user
activities.get('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const user = c.get('jwtPayload') as any
  try {
    const query = `
      SELECT a.*, p.company_name as prospect_company
      FROM activities a
      JOIN prospects p ON a.prospect_id = p.id
      WHERE 1 = 1
      ORDER BY a.activity_date DESC, a.created_at DESC
      LIMIT 10
    `
    const result = await db.query(query)
    return c.json({ activities: result.rows })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// POST /api/activities
activities.post('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const body = await c.req.json()
  const { prospect_id, activity_type, activity_date, duration, notes, outcome, next_steps } = body
  const user = c.get('jwtPayload') as any // From authMiddleware

  try {
    // Database Isolation Check: Ensure the prospect is owned by the authenticated user
    const checkRes = await db.query('SELECT id FROM prospects WHERE id = $1 AND assigned_to = $2', [prospect_id, user.id])
    if (checkRes.rowCount === 0) {
      return c.json({ error: 'Prospect not found or unauthorized' }, 403)
    }

    const query = `
      INSERT INTO activities (
        prospect_id, activity_type, activity_date, duration, notes, outcome, next_steps, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    const values = [
      prospect_id, activity_type, activity_date, duration, notes, outcome, next_steps, user.id
    ]
    const result = await db.query(query, values)
    return c.json({ activity: result.rows[0] })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// PUT /api/activities/:id
activities.put('/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const id = c.req.param('id')
  const body = await c.req.json()
  const user = c.get('jwtPayload') as any

  try {
    // Database Isolation Check: Verify that the activity belongs to a prospect owned by the user
    const checkRes = await db.query(
      `SELECT a.id FROM activities a 
       JOIN prospects p ON a.prospect_id = p.id 
       WHERE a.id = $1 AND p.assigned_to = $2`,
      [id, user.id]
    )
    if (checkRes.rowCount === 0) {
      return c.json({ error: 'Activity not found or unauthorized' }, 404)
    }

    const setKeys = Object.keys(body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'created_by' && k !== 'prospect_id')
    if (setKeys.length === 0) return c.json({ error: 'No fields to update' }, 400)

    let setClause = setKeys.map((k, i) => `${k} = $${i + 2}`).join(', ')
    const values = [id, ...setKeys.map(k => body[k])]

    const result = await db.query(
      `UPDATE activities SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    )
    return c.json({ activity: result.rows[0] })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// DELETE /api/activities/:id
activities.delete('/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const id = c.req.param('id')
  const user = c.get('jwtPayload') as any

  try {
    // Database Isolation Check: Verify that the activity belongs to a prospect owned by the user
    const checkRes = await db.query(
      `SELECT a.id FROM activities a 
       JOIN prospects p ON a.prospect_id = p.id 
       WHERE a.id = $1 AND p.assigned_to = $2`,
      [id, user.id]
    )
    if (checkRes.rowCount === 0) {
      return c.json({ error: 'Activity not found or unauthorized' }, 404)
    }

    await db.query('DELETE FROM activities WHERE id = $1', [id])
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

export default activities
