import { Hono } from 'hono'
import { getDb } from '../db'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
}

const activities = new Hono<{ Bindings: Bindings }>()

activities.use('*', authMiddleware)

// GET /api/activities?prospect_id=X (Alternative route structure, or just /api/prospects/:id/activities handled in index)
// POST /api/activities

activities.post('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const body = await c.req.json()
  const { prospect_id, activity_type, activity_date, duration, notes, outcome, next_steps } = body
  const user = c.get('jwtPayload') as any // From authMiddleware

  try {
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

activities.put('/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const id = c.req.param('id')
  const body = await c.req.json()
  
  const setKeys = Object.keys(body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'created_by' && k !== 'prospect_id')
  if (setKeys.length === 0) return c.json({ error: 'No fields to update' }, 400)
  
  let setClause = setKeys.map((k, i) => `${k} = $${i + 2}`).join(', ')
  const values = [id, ...setKeys.map(k => body[k])]

  try {
    const result = await db.query(
      `UPDATE activities SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    )
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404)
    return c.json({ activity: result.rows[0] })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

activities.delete('/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const id = c.req.param('id')
  
  try {
    const result = await db.query('DELETE FROM activities WHERE id = $1 RETURNING *', [id])
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

export default activities
