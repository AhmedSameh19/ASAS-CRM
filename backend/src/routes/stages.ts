import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
}

const stages = new Hono<{ Bindings: Bindings; Variables: { db: any; jwtPayload: any } }>()

stages.use('*', authMiddleware)

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
    console.error('Check admin error in stages:', err)
    return false
  }
}

// GET /api/workflow-stages - List all stages
stages.get('/', async (c) => {
  const db = c.get('db')
  try {
    const res = await db.query('SELECT * FROM workflow_stages ORDER BY position ASC')
    return c.json({ stages: res.rows })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// POST /api/workflow-stages - Create a new stage
stages.post('/', async (c) => {
  const isAdmin = await checkAdmin(c)
  if (!isAdmin) {
    return c.json({ error: 'Forbidden: Admins only' }, 403)
  }

  const { name, label, color = '#757682', type = 'active' } = await c.req.json()
  if (!name || !label) {
    return c.json({ error: 'Name and Label are required' }, 400)
  }

  const db = c.get('db')
  try {
    // Check if name already exists
    const checkStage = await db.query('SELECT id FROM workflow_stages WHERE LOWER(name) = LOWER($1)', [name])
    if (checkStage.rowCount > 0) {
      return c.json({ error: 'Stage with this name already exists' }, 409)
    }

    // Get max position
    const posRes = await db.query('SELECT COALESCE(MAX(position), -1) as max_pos FROM workflow_stages')
    const nextPos = posRes.rows[0].max_pos + 1

    const res = await db.query(
      `INSERT INTO workflow_stages (name, label, color, position, type) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, label, color, nextPos, type]
    )

    return c.json({ stage: res.rows[0] }, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// PUT /api/workflow-stages/reorder - Bulk reorder stages
stages.put('/reorder', async (c) => {
  const isAdmin = await checkAdmin(c)
  if (!isAdmin) {
    return c.json({ error: 'Forbidden: Admins only' }, 403)
  }

  const { orders } = await c.req.json() as { orders: { id: number; position: number }[] }
  if (!orders || !Array.isArray(orders)) {
    return c.json({ error: 'orders must be an array of { id, position }' }, 400)
  }

  const db = c.get('db')
  try {
    for (const item of orders) {
      await db.query('UPDATE workflow_stages SET position = $1 WHERE id = $2', [item.position, item.id])
    }
    return c.json({ message: 'Stages reordered successfully' })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// PUT /api/workflow-stages/:id - Update a stage
stages.put('/:id', async (c) => {
  const isAdmin = await checkAdmin(c)
  if (!isAdmin) {
    return c.json({ error: 'Forbidden: Admins only' }, 403)
  }

  const id = parseInt(c.req.param('id'), 10)
  const { name, label, color, position, type } = await c.req.json()
  if (!name || !label) {
    return c.json({ error: 'Name and Label are required' }, 400)
  }

  const db = c.get('db')
  try {
    // 1. Get original stage details
    const origRes = await db.query('SELECT name FROM workflow_stages WHERE id = $1', [id])
    const origStage = origRes.rows[0]
    if (!origStage) {
      return c.json({ error: 'Stage not found' }, 404)
    }

    const oldName = origStage.name

    // 2. If name is changing, check uniqueness and update existing prospects' status!
    if (oldName.toLowerCase() !== name.toLowerCase()) {
      const checkStage = await db.query('SELECT id FROM workflow_stages WHERE LOWER(name) = LOWER($1) AND id != $2', [name, id])
      if (checkStage.rowCount > 0) {
        return c.json({ error: 'Another stage with this name already exists' }, 409)
      }

      console.log(`Renaming prospects status from "${oldName}" to "${name}"...`)
      await db.query('UPDATE prospects SET status = $1 WHERE status = $2', [name, oldName])
    }

    // 3. Update the stage
    const res = await db.query(
      `UPDATE workflow_stages 
       SET name = $1, label = $2, color = $3, position = $4, type = $5
       WHERE id = $6
       RETURNING *`,
      [name, label, color, position, type, id]
    )

    return c.json({ stage: res.rows[0] })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// DELETE /api/workflow-stages/:id - Delete a stage
stages.delete('/:id', async (c) => {
  const isAdmin = await checkAdmin(c)
  if (!isAdmin) {
    return c.json({ error: 'Forbidden: Admins only' }, 403)
  }

  const id = parseInt(c.req.param('id'), 10)
  const db = c.get('db')

  try {
    // 1. Get the stage name being deleted
    const stageRes = await db.query('SELECT name FROM workflow_stages WHERE id = $1', [id])
    const stage = stageRes.rows[0]
    if (!stage) {
      return c.json({ error: 'Stage not found' }, 404)
    }

    const deletedName = stage.name

    // 2. Check if there is a fallback stage remaining
    const fallbackRes = await db.query(
      'SELECT name FROM workflow_stages WHERE id != $1 ORDER BY position ASC LIMIT 1',
      [id]
    )
    const fallbackStage = fallbackRes.rows[0]

    // 3. Reassign prospects in this stage to the fallback stage (if exists)
    if (fallbackStage) {
      console.log(`Migrating prospects from deleted stage "${deletedName}" to "${fallbackStage.name}"...`)
      await db.query('UPDATE prospects SET status = $1 WHERE status = $2', [fallbackStage.name, deletedName])
    } else {
      const countRes = await db.query('SELECT COUNT(*) FROM workflow_stages')
      const count = parseInt(countRes.rows[0].count, 10)
      if (count <= 1) {
        return c.json({ error: 'Cannot delete the last remaining stage.' }, 400)
      }
    }

    // 4. Delete the stage
    await db.query('DELETE FROM workflow_stages WHERE id = $1', [id])

    return c.json({ message: 'Stage deleted successfully', deletedStageName: deletedName })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

export default stages
