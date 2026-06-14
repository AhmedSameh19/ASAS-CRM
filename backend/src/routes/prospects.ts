import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
}

const prospects = new Hono<{ Bindings: Bindings; Variables: { db: any; jwtPayload: any } }>()

prospects.use('*', authMiddleware)

// GET /api/prospects
prospects.get('/', async (c) => {
  const db = c.get('db')
  const user = c.get('jwtPayload') as any
  const { status, industry, search, sort = 'created_at', order = 'desc' } = c.req.query()

  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = Math.max(1, parseInt(c.req.query('limit') || '10'))
  const offset = (page - 1) * limit

  // 1. Count total records matching filters
  let countQuery = 'SELECT COUNT(*)::integer FROM prospects WHERE assigned_to = $1'
  const countParams: any[] = [user.id]
  let countParamCount = 2

  if (status) {
    countQuery += ` AND status = $${countParamCount++}`
    countParams.push(status)
  }
  if (industry) {
    countQuery += ` AND industry = $${countParamCount++}`
    countParams.push(industry)
  }
  if (search) {
    countQuery += ` AND (company_name ILIKE $${countParamCount} OR contact_person ILIKE $${countParamCount} OR phone ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`
    countParams.push(`%${search}%`)
    countParamCount++
  }

  // 2. Fetch paginated records matching filters
  let query = 'SELECT * FROM prospects WHERE assigned_to = $1'
  const params: any[] = [user.id]
  let paramCount = 2

  if (status) {
    query += ` AND status = $${paramCount++}`
    params.push(status)
  }
  if (industry) {
    query += ` AND industry = $${paramCount++}`
    params.push(industry)
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
  query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`
  params.push(limit, offset)

  try {
    const countRes = await db.query(countQuery, countParams)
    const total = countRes.rows[0].count || 0

    const result = await db.query(query, params)
    return c.json({
      prospects: result.rows,
      total,
      page,
      limit
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// GET /api/prospects/:id
prospects.get('/:id', async (c) => {
  const db = c.get('db')
  const user = c.get('jwtPayload') as any
  const id = c.req.param('id')

  try {
    // Database Isolation: Only allow fetching prospects assigned to the logged-in user
    const prospectRes = await db.query('SELECT * FROM prospects WHERE id = $1 AND assigned_to = $2', [id, user.id])
    if (prospectRes.rowCount === 0) return c.json({ error: 'Not found or unauthorized' }, 404)

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
  const db = c.get('db')
  const user = c.get('jwtPayload') as any
  const body = await c.req.json()
  const { company_name, contact_person, phone, email, industry, company_size, source, status, estimated_value, expected_close_date, priority, notes } = body

  try {
    const flexible_phone_number = '%' + phone;
    const prospect = await db.query('Select company_name from prospects where email ILIKE $1 and phone LIKE $2', [email, flexible_phone_number])
    if (prospect.rows[0]) {
      return c.json({ error: "This lead is already available", prospect: prospect.rows[0] }, 409)
    }

    // Get default status if not provided
    let initialStatus = status
    if (!initialStatus) {
      const defaultStageRes = await db.query('SELECT name FROM workflow_stages ORDER BY position ASC LIMIT 1')
      initialStatus = defaultStageRes.rows[0]?.name || 'New Lead'
    }

    // Database Isolation: Automatically assign new prospects to the authenticated user
    const query = `
      INSERT INTO prospects (
        company_name, contact_person, phone, email, industry, company_size, 
        source, status, estimated_value, expected_close_date, priority, assigned_to, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `
    const values = [
      company_name, contact_person, phone, email, industry, company_size,
      source, initialStatus, estimated_value, expected_close_date, priority || 'Medium', user.id, notes
    ]
    const result = await db.query(query, values)
    return c.json({ prospect: result.rows[0] })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// PUT /api/prospects/:id
prospects.put('/:id', async (c) => {
  const db = c.get('db')
  const user = c.get('jwtPayload') as any
  const id = c.req.param('id')
  const body = await c.req.json()

  try {
    // Database Isolation: Verify prospect ownership before modification
    const checkRes = await db.query('SELECT * FROM prospects WHERE id = $1 AND assigned_to = $2', [id, user.id])
    if (checkRes.rowCount === 0) return c.json({ error: 'Not found or unauthorized' }, 404)

    // Build dynamic SET clause for partial updates
    const setKeys = Object.keys(body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at' && k !== 'assigned_to')
    if (setKeys.length === 0) return c.json({ error: 'No fields to update' }, 400)

    let setClause = setKeys.map((k, i) => `${k} = $${i + 2}`).join(', ')
    const values = [id, ...setKeys.map(k => body[k])]

    const result = await db.query(
      `UPDATE prospects SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    )
    return c.json({ prospect: result.rows[0] })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// DELETE /api/prospects/:id
prospects.delete('/:id', async (c) => {
  const db = c.get('db')
  const user = c.get('jwtPayload') as any
  const id = c.req.param('id')

  try {
    // Database Isolation: Verify prospect ownership before deletion
    const result = await db.query('DELETE FROM prospects WHERE id = $1 AND assigned_to = $2 RETURNING *', [id, user.id])
    if (result.rowCount === 0) return c.json({ error: 'Not found or unauthorized' }, 404)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

export default prospects
