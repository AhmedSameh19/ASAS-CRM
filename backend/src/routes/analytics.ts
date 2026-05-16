import { Hono } from 'hono'
import { getDb } from '../db'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
}

const analytics = new Hono<{ Bindings: Bindings }>()
analytics.use('*', authMiddleware)

analytics.get('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const { date_range, industry, assigned_to } = c.req.query()
  
  // Build a base WHERE clause based on filters
  let whereClause = 'WHERE 1=1'
  const params: any[] = []
  let paramCount = 1

  if (industry && industry !== 'All') {
    whereClause += ` AND industry = $${paramCount++}`
    params.push(industry)
  }
  if (assigned_to && assigned_to !== 'All') {
    whereClause += ` AND assigned_to = $${paramCount++}`
    params.push(assigned_to)
  }
  
  if (date_range) {
    if (date_range === 'Last 7 days') {
      whereClause += ` AND created_at >= NOW() - INTERVAL '7 days'`
    } else if (date_range === 'Last 30 days') {
      whereClause += ` AND created_at >= NOW() - INTERVAL '30 days'`
    } else if (date_range === 'Last 90 days') {
      whereClause += ` AND created_at >= NOW() - INTERVAL '90 days'`
    }
  }

  try {
    // 1. Pipeline Funnel (Counts by status)
    const pipelineQuery = `
      SELECT status as name, COUNT(*) as count 
      FROM prospects 
      ${whereClause} 
      GROUP BY status
    `
    const pipelineRes = await db.query(pipelineQuery, params)

    // 2. Industry Breakdown
    const industryQuery = `
      SELECT COALESCE(industry, 'Unknown') as name, COUNT(*) as value
      FROM prospects
      ${whereClause}
      GROUP BY COALESCE(industry, 'Unknown')
    `
    const industryRes = await db.query(industryQuery, params)

    // 3. Key Metrics
    const metricsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status NOT IN ('Won', 'Lost')) as active,
        COUNT(*) FILTER (WHERE status = 'Won') as won,
        COUNT(*) FILTER (WHERE status = 'Lost') as lost,
        SUM(estimated_value) FILTER (WHERE status = 'Won') as won_value
      FROM prospects
      ${whereClause}
    `
    const metricsRes = await db.query(metricsQuery, params)

    return c.json({
      pipelineData: pipelineRes.rows,
      industryData: industryRes.rows,
      metrics: metricsRes.rows[0]
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

export default analytics
