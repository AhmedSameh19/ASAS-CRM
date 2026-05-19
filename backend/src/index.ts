import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import prospects from './routes/prospects'
import activities from './routes/activities'
import { documents, documentOperations } from './routes/documents'
import analytics from './routes/analytics'
import { getDb } from './db'
import { authMiddleware } from './middleware/auth'

type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
  R2_PUBLIC_URL: string
  BUCKET?: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.get('/', (c) => {
  return c.json({ message: 'ASAS CRM API is running' })
})

// Mount routes
app.route('/api/auth', auth)
app.route('/api/prospects', prospects)
app.route('/api/activities', activities)
app.route('/api/analytics', analytics)
app.route('/api/documents', documentOperations)

// Special route for getting/posting activities under a prospect, mounted at root
const nestedActivities = new Hono<{ Bindings: Bindings }>()
nestedActivities.use('*', authMiddleware)
nestedActivities.get('/:id/activities', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const id = c.req.param('id')
  try {
    const activitiesRes = await db.query('SELECT * FROM activities WHERE prospect_id = $1 ORDER BY activity_date DESC', [id])
    return c.json({ activities: activitiesRes.rows })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})
nestedActivities.route('/:id/documents', documents)
app.route('/api/prospects', nestedActivities)

export default app
