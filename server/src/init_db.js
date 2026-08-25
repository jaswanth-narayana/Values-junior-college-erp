import path from 'path';
import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('server/.env') });

const runInit = async () => {
  console.log('🔄 Initializing Values College Database...');
  
  // Resolve target connection URL
  let targetUrl = process.argv[2] || process.env.DATABASE_URL;
  let isHosted = !!targetUrl;

  if (!targetUrl) {
    // Local fallback: create database if not exists
    const systemUrl = 'postgresql://postgres:1234@localhost:5432/postgres';
    const systemPool = new pg.Pool({ connectionString: systemUrl });
    
    try {
      const client = await systemPool.connect();
      const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname='values_college'");
      if (dbCheck.rows.length === 0) {
        console.log('📦 Creating database "values_college" locally...');
        await client.query("CREATE DATABASE values_college");
        console.log('✅ Local database created.');
      }
      client.release();
    } catch (err) {
      console.error('❌ Error creating local database:', err.message);
      await systemPool.end();
      process.exit(1);
    } finally {
      await systemPool.end();
    }
    
    targetUrl = 'postgresql://postgres:1234@localhost:5432/values_college';
  }

  console.log(`🔌 Connecting to target database...`);
  isHosted = targetUrl.includes('render.com') || 
             targetUrl.includes('rlwy.net') || 
             (!targetUrl.includes('localhost') && !targetUrl.includes('127.0.0.1'));

  const targetPool = new pg.Pool({ 
    connectionString: targetUrl,
    ssl: isHosted ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await targetPool.connect();
    console.log('✅ Connected successfully. Loading schema.sql...');
    
    const schemaPath = path.resolve('server/database/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the complete schema sql script
    await client.query(sql);
    console.log('✅ Database schema loaded successfully.');
    
    // Insert default fee structures if table is empty
    const feesCheck = await client.query("SELECT COUNT(*)::int count FROM fees");
    if (feesCheck.rows[0].count === 0) {
      await client.query(`
        INSERT INTO fees(fee_type, amount) VALUES
        ('Tuition Fee', 45000.00),
        ('Admission Fee', 10000.00),
        ('Exam Fee', 2500.00),
        ('Library & Lab Fee', 5000.00),
        ('Transport Fee', 12000.00)
      `);
      console.log('✅ Default fee structures inserted.');
    }
    
    // Seed default accountant and teacher if not already present
    const usersCheck = await client.query("SELECT COUNT(*)::int count FROM users");
    if (usersCheck.rows[0].count <= 1) {
      console.log('📝 Seeding additional user accounts with accountant & vice principal roles...');
      await client.query(`
        INSERT INTO users(username, name, email, password_hash, role) VALUES
        ('accountant', 'Finance Accountant', 'accountant@values.edu', crypt('Accountant@123', gen_salt('bf')), 'accountant'),
        ('vice_principal', 'Vice Principal', 'viceprincipal@values.edu', crypt('VicePrincipal@123', gen_salt('bf')), 'teacher')
        ON CONFLICT DO NOTHING
      `);
      console.log('✅ Accounts accountant@values.edu and viceprincipal@values.edu seeded.');
    }
    
    console.log('🎉 Database initialization complete!');
    client.release();
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    await targetPool.end();
    process.exit(1);
  } finally {
    await targetPool.end();
  }
};

runInit();
