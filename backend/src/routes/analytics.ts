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
  const user = c.get('jwtPayload') as any
  const { date_range, industry } = c.req.query()
  
  // Database Isolation: Scoped base WHERE clause to the authenticated user
  let whereClause = 'WHERE assigned_to = $1'
  const params: any[] = [user.id]
  let paramCount = 2

  if (industry && industry !== 'All') {
    whereClause += ` AND industry = $${paramCount++}`
    params.push(industry)
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
        COALESCE(SUM(estimated_value) FILTER (WHERE status = 'Won'), 0) as won_value
      FROM prospects
      ${whereClause}
    `
    const metricsRes = await db.query(metricsQuery, params)

    // 4. Revenue Growth
    const revenueQuery = `
      SELECT TO_CHAR(created_at, 'Mon') as name, COALESCE(SUM(estimated_value), 0) as value
      FROM prospects
      ${whereClause} AND status = 'Won'
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at)
    `
    const revenueRes = await db.query(revenueQuery, params)

    // 5. Lead Sources
    const sourceQuery = `
      SELECT COALESCE(source, 'Unknown') as name, COUNT(*) as value
      FROM prospects
      ${whereClause}
      GROUP BY COALESCE(source, 'Unknown')
    `
    const sourceRes = await db.query(sourceQuery, params)

    // 6. Top Performers (Team wide leaderboard)
    const topPerformersQuery = `
      SELECT 
        u.name,
        SUBSTRING(u.name FROM 1 FOR 2) as initials,
        COUNT(p.id) as deals,
        COALESCE(SUM(p.estimated_value), 0) as value
      FROM users u
      LEFT JOIN prospects p ON u.id = p.assigned_to AND p.status = 'Won'
      GROUP BY u.id
      ORDER BY value DESC
      LIMIT 3
    `
    const topPerformersRes = await db.query(topPerformersQuery)

    return c.json({
      pipelineData: pipelineRes.rows,
      industryData: industryRes.rows,
      metrics: metricsRes.rows[0],
      revenueGrowth: revenueRes.rows,
      leadSources: sourceRes.rows,
      topPerformers: topPerformersRes.rows
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

export default analytics
