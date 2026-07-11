import path from 'path';
import fs from 'fs';
import pg from 'pg';

const run = async () => {
  const connectionString = process.argv[2];
  if (!connectionString) {
    console.error('❌ Error: Please provide your Railway PostgreSQL connection URL.');
    console.log('Usage: node server/src/init_railway.js "postgresql://..."');
    process.exit(1);
  }

  console.log('🔄 Connecting to Railway PostgreSQL Database...');
  const pool = new pg.Pool({ connectionString });
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully.');
    
    console.log('📝 Reading and executing schema.sql...');
    const schemaPath = path.resolve('server/database/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema.sql
    await client.query(sql);
    console.log('✅ Database schema loaded successfully.');
    
    // Seed default fee structures
    console.log('📝 Inserting default fee structures...');
    await client.query(`
      INSERT INTO fees(fee_type, amount) VALUES
      ('Tuition Fee', 45000.00),
      ('Admission Fee', 10000.00),
      ('Exam Fee', 2500.00),
      ('Library & Lab Fee', 5000.00)
      ON CONFLICT DO NOTHING
    `);
    
    // Seed default accounts
    console.log('📝 Seeding accountant & teacher accounts...');
    await client.query(`
      INSERT INTO users(username, name, email, password_hash, role) VALUES
      ('accountant', 'Finance Accountant', 'accountant@values.edu', crypt('Accountant@123', gen_salt('bf')), 'accountant'),
      ('vice_principal', 'Vice Principal', 'viceprincipal@values.edu', crypt('VP@123', gen_salt('bf')), 'teacher')
      ON CONFLICT DO NOTHING
    `);
    
    console.log('🎉 Railway Database initialization complete!');
    client.release();
  } catch (err) {
    console.error('❌ Error running database init:', err.message);
  } finally {
    await pool.end();
  }
};

run();
