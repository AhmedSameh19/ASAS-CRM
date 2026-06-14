import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
  BUCKET?: R2Bucket
  R2_PUBLIC_URL: string
}

const documents = new Hono<{ Bindings: Bindings; Variables: { db: any; jwtPayload: any } }>()
documents.use('*', authMiddleware)

// POST /api/prospects/:id/documents
documents.post('/', async (c) => {
  const db = c.get('db')
  const prospect_id = c.req.param('id')
  const user = c.get('jwtPayload') as any

  try {
    if (!c.env.BUCKET) {
      return c.json({ 
        error: 'Cloudflare R2 is not active or enabled on this account. Please go to the Cloudflare Dashboard -> R2 and enable/activate it, or check your wrangler.toml configuration.' 
      }, 400)
    }
    const formData = await c.req.parseBody()
    const file = formData['file'] as File
    const document_type = formData['document_type'] as string
    const description = (formData['description'] as string) || ''

    if (!file) {
      return c.json({ error: 'File is required' }, 400)
    }

    // Generate unique file key
    const fileExtension = file.name.split('.').pop()
    const fileKey = `prospects/${prospect_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`

    // Upload to R2
    await c.env.BUCKET.put(fileKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type }
    })

    // Save to DB
    const query = `
      INSERT INTO documents (
        prospect_id, file_name, file_key, file_size, document_type, description, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    const values = [
      prospect_id, file.name, fileKey, file.size, document_type, description, user.id
    ]
    const result = await db.query(query, values)

    return c.json({ document: result.rows[0] })
  } catch (error: any) {
    console.error('[documents] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

// GET /api/prospects/:id/documents
documents.get('/', async (c) => {
  const db = c.get('db')
  const prospect_id = c.req.param('id')

  try {
    const result = await db.query('SELECT * FROM documents WHERE prospect_id = $1 ORDER BY uploaded_at DESC', [prospect_id])
    return c.json({ documents: result.rows })
  } catch (error: any) {
    console.error('[documents] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

// The download and delete endpoints don't need prospect_id in the URL if they are mounted at /api/documents
const documentOperations = new Hono<{ Bindings: Bindings; Variables: { db: any; jwtPayload: any } }>()
documentOperations.use('*', authMiddleware)

documentOperations.get('/:id/download', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  try {
    const result = await db.query('SELECT * FROM documents WHERE id = $1', [id])
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404)

    const doc = result.rows[0]
    
    const authHeader = c.req.header('Authorization')
    const token = authHeader ? authHeader.replace(/bearer\s+/i, '') : ''

    const origin = new URL(c.req.url).origin
    const fileUrl = `${origin}/api/documents/${id}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`
    return c.json({ url: fileUrl, file_name: doc.file_name })
  } catch (error: any) {
    console.error('[documents] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

documentOperations.get('/:id/file', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  try {
    const result = await db.query('SELECT * FROM documents WHERE id = $1', [id])
    if (result.rowCount === 0) return c.text('Not Found', 404)

    const doc = result.rows[0]

    if (c.env.BUCKET) {
      const fileObj = await c.env.BUCKET.get(doc.file_key)
      if (fileObj) {
        c.header('Content-Type', fileObj.httpMetadata?.contentType || 'application/octet-stream')
        c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.file_name)}"`)
        return c.body(fileObj.body)
      }
    }

    // Fallback redirect if bucket is not loaded or file wasn't found in current bucket
    const publicUrl = `${c.env.R2_PUBLIC_URL}/${doc.file_key}`
    return c.redirect(publicUrl)
  } catch (error: any) {
    console.error('[documents/file] error:', error)
    return c.text('An internal server error occurred', 500)
  }
})

documentOperations.delete('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  try {
    if (!c.env.BUCKET) {
      return c.json({ 
        error: 'Cloudflare R2 is not active or enabled on this account. Please go to the Cloudflare Dashboard -> R2 and enable/activate it, or check your wrangler.toml configuration.' 
      }, 400)
    }
    const result = await db.query('SELECT * FROM documents WHERE id = $1', [id])
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404)

    const doc = result.rows[0]

    // Delete from R2
    await c.env.BUCKET.delete(doc.file_key)

    // Delete from DB
    await db.query('DELETE FROM documents WHERE id = $1', [id])

    return c.json({ success: true })
  } catch (error: any) {
    console.error('[documents] error:', error)
    return c.json({ error: 'An internal server error occurred' }, 500)
  }
})

export { documents, documentOperations }
