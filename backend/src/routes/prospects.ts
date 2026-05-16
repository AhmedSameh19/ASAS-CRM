import { Hono } from 'hono'
import { getDb } from '../db'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
}

const prospects = new Hono<{ Bindings: Bindings }>()

prospects.use('*', authMiddleware)

// GET /api/prospects
prospects.get('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const { status, industry, assigned_to, search, sort = 'created_at', order = 'desc' } = c.req.query()
  
  let query = 'SELECT * FROM prospects WHERE 1=1'
  const params: any[] = []
  let paramCount = 1

  if (status) {
    query += ` AND status = $${paramCount++}`
    params.push(status)
  }
  if (industry) {
    query += ` AND industry = $${paramCount++}`
    params.push(industry)
  }
  if (assigned_to) {
    query += ` AND assigned_to = $${paramCount++}`
    params.push(assigned_to)
  }
  if (search) {
    query += ` AND (company_name ILIKE $${paramCount} OR contact_person ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR email ILIKE $${paramCount})`
    params.push(`%${search}%`)
    paramCount++
  }

  // Prevent SQL injection on sort columns
  const allowedSortCols = ['created_at', 'updated_at', 'estimated_value', 'expected_close_date', 'company_name']
  const sortCol = allowedSortCols.includes(sort) ? sort : 'created_at'
  const sortDir = order.toLowerCase() === 'asc' ? 'asc' : 'desc'

  query += ` ORDER BY ${sortCol} ${sortDir}`

  try {
    const result = await db.query(query, params)
    return c.json({ prospects: result.rows, total: result.rowCount })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// GET /api/prospects/:id
prospects.get('/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const id = c.req.param('id')
  
  try {
    const prospectRes = await db.query('SELECT * FROM prospects WHERE id = $1', [id])
    if (prospectRes.rowCount === 0) return c.json({ error: 'Not found' }, 404)
    
    const activitiesRes = await db.query('SELECT * FROM activities WHERE prospect_id = $1 ORDER BY activity_date DESC', [id])
    const documentsRes = await db.query('SELECT * FROM documents WHERE prospect_id = $1 ORDER BY uploaded_at DESC', [id])

    return c.json({
      prospect: prospectRes.rows[0],
      activities: activitiesRes.rows,
      documents: documentsRes.rows
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// POST /api/prospects
prospects.post('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const body = await c.req.json()
  const { company_name, contact_person, phone, email, industry, company_size, source, status, estimated_value, expected_close_date, priority, assigned_to, notes } = body
  
  try {
    const query = `
      INSERT INTO prospects (
        company_name, contact_person, phone, email, industry, company_size, 
        source, status, estimated_value, expected_close_date, priority, assigned_to, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `
    const values = [
      company_name, contact_person, phone, email, industry, company_size,
      source, status || 'New Lead', estimated_value, expected_close_date, priority || 'Medium', assigned_to, notes
    ]
    const result = await db.query(query, values)
    return c.json({ prospect: result.rows[0] })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// PUT /api/prospects/:id
prospects.put('/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const id = c.req.param('id')
  const body = await c.req.json()
  
  // Build dynamic SET clause for partial updates
  const setKeys = Object.keys(body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at')
  if (setKeys.length === 0) return c.json({ error: 'No fields to update' }, 400)
  
  let setClause = setKeys.map((k, i) => `${k} = $${i + 2}`).join(', ')
  const values = [id, ...setKeys.map(k => body[k])]

  try {
    const result = await db.query(
      `UPDATE prospects SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    )
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404)
    return c.json({ prospect: result.rows[0] })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// DELETE /api/prospects/:id
prospects.delete('/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const id = c.req.param('id')
  // Note: documents physical deletion from R2 should be handled here or in a background task
  // Since it's Phase 1, we just do DB delete. Documents in R2 will be done in Phase 2.
  try {
    const result = await db.query('DELETE FROM prospects WHERE id = $1 RETURNING *', [id])
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

export default prospects
