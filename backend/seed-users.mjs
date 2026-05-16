import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const DATABASE_URL = 'postgresql://neondb_owner:npg_YRLDTh3z0gFx@ep-silent-violet-aqdwsns0.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';

const USERS = [
  { email: 'AhmedHany@asas.com',  name: 'Ahmed Hany',  password: 'Admin123' },
  { email: 'AhmedSakr@asas.com',  name: 'Ahmed Sakr',  password: 'Admin123' },
];

async function seedUsers() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('✓ Connected to Neon\n');

  for (const user of USERS) {
    const hash = await bcrypt.hash(user.password, 10);
    try {
      const res = await client.query(
        `INSERT INTO users (email, password, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name
         RETURNING id, email, name`,
        [user.email, hash, user.name]
      );
      console.log(`✓ Upserted user: ${res.rows[0].email} (id=${res.rows[0].id})`);
    } catch (e) {
      console.error(`✗ Failed for ${user.email}:`, e.message);
    }
  }

  await client.end();
  console.log('\nDone.');
}

seedUsers().catch(console.error);
