import path from 'path';
import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('server/.env') });

const runInit = async () => {
  console.log('🔄 Initializing Values College Database...');
  
  const systemUrl = 'postgresql://postgres:1234@localhost:5432/postgres';
  const systemPool = new pg.Pool({ connectionString: systemUrl });
  
  try {
    const client = await systemPool.connect();
    
    // Check if values_college database exists
    const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname='values_college'");
    if (dbCheck.rows.length === 0) {
      console.log('📦 Creating database "values_college"...');
      await client.query("CREATE DATABASE values_college");
      console.log('✅ Database "values_college" created successfully.');
    } else {
      console.log('✅ Database "values_college" already exists.');
    }
    
    client.release();
  } catch (err) {
    console.error('❌ Error creating database:', err.message);
    await systemPool.end();
    process.exit(1);
  } finally {
    await systemPool.end();
  }

  // Connect to "values_college" to run schema.sql
  const targetUrl = 'postgresql://postgres:1234@localhost:5432/values_college';
  const targetPool = new pg.Pool({ connectionString: targetUrl });
  
  try {
    const client = await targetPool.connect();
    console.log('📝 Reading and executing schema.sql...');
    
    const schemaPath = path.resolve('server/database/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the complete schema sql script
    await client.query(sql);
    
    // Insert default fee structures if table is empty
    const feesCheck = await client.query("SELECT COUNT(*)::int count FROM fees");
    if (feesCheck.rows[0].count === 0) {
      console.log('📝 Inserting default fee structures...');
      await client.query(`
        INSERT INTO fees(fee_type, amount) VALUES
        ('Tuition Fee', 45000.00),
        ('Admission Fee', 10000.00),
        ('Exam Fee', 2500.00),
        ('Library & Lab Fee', 5000.00)
      `);
      console.log('✅ Default fee structures inserted.');
    }
    
    // Seed default accountant and teacher if not already present
    const usersCheck = await client.query("SELECT COUNT(*)::int count FROM users");
    if (usersCheck.rows[0].count <= 1) {
      console.log('📝 Seeding additional user accounts with accountant & teacher roles...');
      await client.query(`
        INSERT INTO users(username, name, email, password_hash, role) VALUES
        ('accountant', 'Finance Accountant', 'accountant@values.edu', crypt('Accountant@123', gen_salt('bf')), 'accountant'),
        ('teacher', 'Academic Teacher', 'teacher@values.edu', crypt('Teacher@123', gen_salt('bf')), 'teacher')
        ON CONFLICT DO NOTHING
      `);
      console.log('✅ Accounts accountant@values.edu and teacher@values.edu seeded.');
    }
    
    console.log('🎉 Schema loaded successfully! Admin user created.');
    client.release();
  } catch (err) {
    console.error('❌ Error running schema.sql:', err.message);
    await targetPool.end();
    process.exit(1);
  } finally {
    await targetPool.end();
  }
};

runInit();
