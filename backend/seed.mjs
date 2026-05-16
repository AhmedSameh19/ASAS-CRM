import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = 'postgresql://neondb_owner:npg_YRLDTh3z0gFx@ep-silent-violet-aqdwsns0.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function seed() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('✓ Connected to Neon database');

  const schemaPath = path.join(__dirname, '../schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  console.log('Executing schema.sql (full multi-statement)...\n');
  try {
    // pg client supports the entire file in one query call — handles $$ blocks correctly
    await client.query(schemaContent);
    console.log('✓ All statements executed successfully.');
  } catch (e) {
    // If we get "already exists" errors, that's fine — schema is idempotent with IF NOT EXISTS
    // But if it's a real error, surface it
    if (e.message.includes('already exists')) {
      console.log('ℹ  Some tables/indexes already exist — schema already applied.');
    } else {
      console.error('✗ Error:', e.message);
    }
  }

  await client.end();
  console.log('\nDone.');
}

seed().catch(console.error);
