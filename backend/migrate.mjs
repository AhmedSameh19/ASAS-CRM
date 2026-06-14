import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgresql://neondb_owner:npg_YRLDTh3z0gFx@ep-silent-violet-aqdwsns0.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';

const DEFAULT_STAGES = [
  { name: 'New Lead', label: 'New Lead', color: '#757682', position: 0, type: 'active' },
  { name: 'MR Scheduled', label: 'MR Scheduled', color: '#00236f', position: 1, type: 'active' },
  { name: 'MR Completed', label: 'MR Completed', color: '#4059aa', position: 2, type: 'active' },
  { name: 'Demo Scheduled', label: 'Demo Scheduled', color: '#855300', position: 3, type: 'active' },
  { name: 'Demo Done', label: 'Demo Done', color: '#fea619', position: 4, type: 'active' },
  { name: 'Proposal Sent', label: 'Proposal Sent', color: '#6e2c00', position: 5, type: 'active' },
  { name: 'Negotiation', label: 'Negotiation', color: '#1e3a8a', position: 6, type: 'active' },
  { name: 'Won', label: 'Won ✓', color: '#059669', position: 7, type: 'won' },
  { name: 'Lost', label: 'Lost ✗', color: '#ba1a1a', position: 8, type: 'lost' }
];

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('✓ Connected to Neon database.');

  try {
    // 1. Alter users table
    console.log('Altering users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT FALSE;
    `);
    console.log('✓ Users table columns added (if they did not exist).');

    // 2. Set AhmedSakr@asas.com as admin
    console.log('Setting AhmedSakr@asas.com as admin...');
    await client.query(`
      UPDATE users 
      SET role = 'admin' 
      WHERE LOWER(email) = 'ahmedsakr@asas.com';
    `);
    console.log('✓ Admin role assigned to AhmedSakr@asas.com.');

    // 3. Create workflow_stages table
    console.log('Creating workflow_stages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS workflow_stages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        label VARCHAR(100) NOT NULL,
        color VARCHAR(20) NOT NULL DEFAULT '#757682',
        position INTEGER NOT NULL DEFAULT 0,
        type VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ workflow_stages table created (if it did not exist).');

    // 4. Ensure type column exists (if table already existed without it)
    console.log('Checking for type column in workflow_stages...');
    await client.query(`
      ALTER TABLE workflow_stages 
      ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'active';
    `);
    console.log('✓ type column ensured.');

    // 5. Seed / Update workflow_stages table
    console.log('Seeding/updating workflow stages...');
    for (const stage of DEFAULT_STAGES) {
      // Check if exists
      const checkRes = await client.query('SELECT id FROM workflow_stages WHERE name = $1', [stage.name]);
      if (checkRes.rowCount === 0) {
        await client.query(
          `INSERT INTO workflow_stages (name, label, color, position, type)
           VALUES ($1, $2, $3, $4, $5)`,
          [stage.name, stage.label, stage.color, stage.position, stage.type]
        );
        console.log(`✓ Seeded stage: ${stage.name}`);
      } else {
        // Update type and position to ensure correct defaults
        await client.query(
          `UPDATE workflow_stages 
           SET type = $1, position = $2, label = $3
           WHERE name = $4`,
          [stage.type, stage.position, stage.label, stage.name]
        );
      }
    }
    console.log('✓ Seeded/updated default workflow stages.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
    console.log('Done.');
  }
}

runMigration().catch(console.error);
