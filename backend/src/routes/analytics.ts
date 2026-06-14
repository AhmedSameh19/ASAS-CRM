import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
}

const analytics = new Hono<{ Bindings: Bindings; Variables: { db: any; jwtPayload: any } }>()
analytics.use('*', authMiddleware)

analytics.get('/', async (c) => {
  const db = c.get('db')
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
    // 0. Fetch dynamic stages
    const stagesRes = await db.query('SELECT name, label, color, position, type FROM workflow_stages ORDER BY position ASC')
    const stages = stagesRes.rows

    const wonStageNames = stages.filter((s: any) => s.type === 'won').map((s: any) => s.name)
    const lostStageNames = stages.filter((s: any) => s.type === 'lost').map((s: any) => s.name)

    // 1. Pipeline Funnel (Counts by status)
    const pipelineQuery = `
      SELECT status as name, COUNT(*)::integer as count 
      FROM prospects 
      ${whereClause} 
      GROUP BY status
    `
    const pipelineRes = await db.query(pipelineQuery, params)
    const dbCounts = pipelineRes.rows

    // Merge all stages to ensure zero-count stages are returned in correct order
    const pipelineData = stages.map((stage: any) => {
      const match = dbCounts.find((r: any) => r.name.toLowerCase() === stage.name.toLowerCase())
      return {
        name: stage.name,
        label: stage.label,
        color: stage.color,
        type: stage.type,
        count: match ? match.count : 0
      }
    })

    // 2. Industry Breakdown
    const industryQuery = `
      SELECT COALESCE(industry, 'Unknown') as name, COUNT(*)::integer as value
      FROM prospects
      ${whereClause}
      GROUP BY COALESCE(industry, 'Unknown')
    `
    const industryRes = await db.query(industryQuery, params)

    // 3. Key Metrics
    let wonValue = 0
    if (wonStageNames.length > 0) {
      const placeholders = wonStageNames.map((_: any, i: number) => `$${paramCount + i}`).join(', ')
      const wonValueQuery = `
        SELECT COALESCE(SUM(estimated_value), 0)::double precision as won_value 
        FROM prospects 
        ${whereClause} AND status IN (${placeholders})
      `
      const wonValueRes = await db.query(wonValueQuery, [...params, ...wonStageNames])
      wonValue = wonValueRes.rows[0].won_value
    }

    const total = pipelineData.reduce((acc: number, s: any) => acc + s.count, 0)
    const wonCount = pipelineData.filter((s: any) => s.type === 'won').reduce((acc: number, s: any) => acc + s.count, 0)
    const lostCount = pipelineData.filter((s: any) => s.type === 'lost').reduce((acc: number, s: any) => acc + s.count, 0)
    const activeCount = pipelineData.filter((s: any) => s.type === 'active').reduce((acc: number, s: any) => acc + s.count, 0)

    const metrics = {
      total,
      active: activeCount,
      won: wonCount,
      lost: lostCount,
      won_value: wonValue
    }

    // 4. Revenue Growth
    let revenueQuery = ''
    let revenueParams = [...params]
    if (wonStageNames.length > 0) {
      const placeholders = wonStageNames.map((_: any, i: number) => `$${paramCount + i}`).join(', ')
      revenueQuery = `
        SELECT TO_CHAR(created_at, 'Mon') as name, COALESCE(SUM(estimated_value), 0)::double precision as value
        FROM prospects
        ${whereClause} AND status IN (${placeholders})
        GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
        ORDER BY EXTRACT(MONTH FROM created_at)
      `
      revenueParams.push(...wonStageNames)
    } else {
      revenueQuery = `
        SELECT TO_CHAR(created_at, 'Mon') as name, COALESCE(SUM(estimated_value), 0)::double precision as value
        FROM prospects
        ${whereClause} AND status = 'Won'
        GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
        ORDER BY EXTRACT(MONTH FROM created_at)
      `
    }
    const revenueRes = await db.query(revenueQuery, revenueParams)

    // 5. Lead Sources
    const sourceQuery = `
      SELECT COALESCE(source, 'Unknown') as name, COUNT(*)::integer as value
      FROM prospects
      ${whereClause}
      GROUP BY COALESCE(source, 'Unknown')
    `
    const sourceRes = await db.query(sourceQuery, params)

    // 6. Top Performers (Team wide leaderboard)
    let topPerformersQuery = ''
    let topPerformersParams: any[] = []
    if (wonStageNames.length > 0) {
      const placeholders = wonStageNames.map((_: any, i: number) => `$${i + 1}`).join(', ')
      topPerformersQuery = `
        SELECT 
          u.name,
          SUBSTRING(u.name FROM 1 FOR 2) as initials,
          COUNT(p.id)::integer as deals,
          COALESCE(SUM(p.estimated_value), 0)::double precision as value
        FROM users u
        LEFT JOIN prospects p ON u.id = p.assigned_to AND p.status IN (${placeholders})
        GROUP BY u.id, u.name
        ORDER BY value DESC
        LIMIT 3
      `
      topPerformersParams.push(...wonStageNames)
    } else {
      topPerformersQuery = `
        SELECT 
          u.name,
          SUBSTRING(u.name FROM 1 FOR 2) as initials,
          COUNT(p.id)::integer as deals,
          COALESCE(SUM(p.estimated_value), 0)::double precision as value
        FROM users u
        LEFT JOIN prospects p ON u.id = p.assigned_to AND p.status = 'Won'
        GROUP BY u.id, u.name
        ORDER BY value DESC
        LIMIT 3
      `
    }
    const topPerformersRes = await db.query(topPerformersQuery, topPerformersParams)

    return c.json({
      pipelineData,
      industryData: industryRes.rows,
      metrics,
      revenueGrowth: revenueRes.rows,
      leadSources: sourceRes.rows,
      topPerformers: topPerformersRes.rows
    })
  } catch (error: any) {
    console.error('[analytics] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

export default analytics
