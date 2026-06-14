import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import prospects from './routes/prospects'
import activities from './routes/activities'
import { documents, documentOperations } from './routes/documents'
import analytics from './routes/analytics'
import users from './routes/users'
import stages from './routes/stages'
import { authMiddleware } from './middleware/auth'
import { dbMiddleware } from './middleware/db'

type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
  R2_PUBLIC_URL: string
  BUCKET?: R2Bucket
}

const app = new Hono<{ Bindings: Bindings; Variables: { db: any; jwtPayload: any } }>()

// ── Global middleware ──────────────────────────────────────────────────────────

app.use(
  '*',
  cors({
    origin: ['https://asas-crm-two.vercel.app', 'http://localhost:3000'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
)

// Initialize DB once for the entire request chain
app.use('*', dbMiddleware)

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/', (c) => {
  return c.json({ message: 'ASAS CRM API is running' })
})

app.get('/health', async (c) => {
  const db = c.get('db')
  const startTime = Date.now()
  try {
    await db.query('SELECT 1')
    const latency = Date.now() - startTime
    return c.json({
      status: 'healthy',
      database: 'connected',
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    }, 200)
  } catch (error: any) {
    return c.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Mount routes
app.route('/api/auth', auth)
app.route('/api/prospects', prospects)
app.route('/api/activities', activities)
app.route('/api/analytics', analytics)
app.route('/api/documents', documentOperations)
app.route('/api/users', users)
app.route('/api/workflow-stages', stages)

// Nested: GET /:id/activities  +  /:id/documents
const nestedActivities = new Hono<{ Bindings: Bindings; Variables: { db: any; jwtPayload: any } }>()
nestedActivities.use('*', authMiddleware)
nestedActivities.get('/:id/activities', async (c) => {
  const db = c.get('db')
  const user = c.get('jwtPayload') as any
  const id = c.req.param('id')
  try {
    // Ownership check: verify the prospect belongs to the requesting user
    const ownerCheck = await db.query(
      'SELECT id FROM prospects WHERE id = $1 AND assigned_to = $2',
      [id, user.id]
    )
    if (ownerCheck.rowCount === 0) {
      return c.json({ error: 'Not found or unauthorized' }, 404)
    }

    const activitiesRes = await db.query(
      'SELECT * FROM activities WHERE prospect_id = $1 ORDER BY activity_date DESC',
      [id]
    )
    return c.json({ activities: activitiesRes.rows })
  } catch (error: any) {
    console.error('[activities] nested error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})
nestedActivities.route('/:id/documents', documents)
app.route('/api/prospects', nestedActivities)

export default app
