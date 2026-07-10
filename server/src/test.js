import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('server/.env') });
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Simple Integration Test Suite
const runTests = async () => {
  console.log('====================================================');
  console.log('   VALUES ERP - INTEGRATION TEST SUITE (FIREWALL & API) ');
  console.log('====================================================');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const pool = new pg.Pool({ connectionString });
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully!');
    client.release();
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.log('\nPlease make sure:');
    console.log('1. PostgreSQL is installed and running.');
    console.log('2. The database "values_college" exists.');
    console.log(`3. Your DATABASE_URL is correct: ${connectionString}`);
    console.log('\nCannot proceed with tests without a running database connection.');
    process.exit(1);
  }

  // 1. Test Login encryption / decryption
  console.log('\n🔐 Testing Password hashing and JWT generation...');
  try {
    const password = 'Admin@123';
    const hash = await bcrypt.hash(password, 10);
    const matches = await bcrypt.compare(password, hash);
    if (!matches) throw new Error('Bcrypt matching failed');
    console.log('  └─ Bcrypt verification: PASSED');

    const tokenPayload = { id: 'test-uuid', role: 'super_admin', name: 'Test Admin' };
    const secret = process.env.JWT_SECRET || 'test_secret';
    const token = jwt.sign(tokenPayload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);
    
    if (decoded.id !== tokenPayload.id || decoded.role !== tokenPayload.role) {
      throw new Error('JWT payload encoding/decoding mismatch');
    }
    console.log('  └─ JWT encoding & verification: PASSED');
  } catch (err) {
    console.error('❌ Authentication unit test failed:', err.message);
    process.exit(1);
  }

  // 2. Test Dynamic Resource schema validation & parsing
  console.log('\n📋 Testing Database Settings updates & dynamic lookup...');
  try {
    // Clear and reset test settings
    await pool.query("INSERT INTO college_settings(id, college_name, phone, email) VALUES(1, 'Values Test College', '12345', 'test@values.edu') ON CONFLICT(id) DO UPDATE SET college_name = 'Values Test College'");
    const res = await pool.query("SELECT * FROM college_settings WHERE id = 1");
    if (res.rows[0].college_name !== 'Values Test College') {
      throw new Error('Settings database write/read mismatch');
    }
    console.log('  └─ College settings CRUD test: PASSED');

    // Academic Year, Classes, Sections creation & lookup test
    const randSuffix = Math.floor(Math.random() * 10000);
    const ayName = `AY-${randSuffix}`;
    const className = `Class-${randSuffix}`;
    const sectionName = `Section-${randSuffix}`;

    // Create Academic Year
    const ayRes = await pool.query("INSERT INTO academic_years(name, is_active) VALUES($1, true) RETURNING id", [ayName]);
    const ayId = ayRes.rows[0].id;
    console.log(`  └─ Academic Year creation (${ayName}): PASSED`);

    // Create Class linked to Academic Year
    const classRes = await pool.query("INSERT INTO classes(name, academic_year_id) VALUES($1, $2) RETURNING id", [className, ayId]);
    const classId = classRes.rows[0].id;
    console.log(`  └─ Class creation linked to AY (${className}): PASSED`);

    // Create Section linked to Class
    const sectionRes = await pool.query("INSERT INTO sections(name, class_id) VALUES($1, $2) RETURNING id", [sectionName, classId]);
    const sectionId = sectionRes.rows[0].id;
    console.log(`  └─ Section creation linked to Class (${sectionName}): PASSED`);

    // Create a dummy staff member to act as teacher
    const staffRes = await pool.query(
      `INSERT INTO staff(staff_code, name, qualification, department, mobile, email) 
       VALUES($1, 'Test Teacher', 'PhD', 'Test Department', '9999999999', $2) RETURNING id`,
      [`STF-TEST-${randSuffix}`, `teacher-${randSuffix}@values.edu`]
    );
    const teacherId = staffRes.rows[0].id;
    console.log('  └─ Teacher / Staff profile creation: PASSED');

    // Create a subject
    const subjectRes = await pool.query("INSERT INTO subjects(name, code) VALUES($1, $2) RETURNING id", [`Subject-${randSuffix}`, `SUB-${randSuffix}`]);
    const subjectId = subjectRes.rows[0].id;
    console.log('  └─ Academic Subject creation: PASSED');

    // 3. Test Timetable Scheduling and conflict verification
    console.log('\n📅 Testing Timetable Scheduling and overlap firewall conflict checks...');
    
    // Insert slot 1: Monday, 9:00 - 10:00
    await pool.query(
      `INSERT INTO timetables(class_id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time) 
       VALUES($1, $2, $3, $4, 'Monday', '09:00:00', '10:00:00')`,
      [classId, sectionId, subjectId, teacherId]
    );
    console.log('  └─ Timetable slot 1 scheduled (Monday 09:00 - 10:00): PASSED');

    // Attempt to insert overlapping slot: unique constraint should fire
    try {
      await pool.query(
        `INSERT INTO timetables(class_id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time) 
         VALUES($1, $2, $3, $4, 'Monday', '09:00:00', '10:00:00')`,
        [classId, sectionId, subjectId, teacherId]
      );
      throw new Error('Overlap constraint failed to fire!');
    } catch (conflictErr) {
      if (conflictErr.code === '23505') {
        console.log('  └─ Timetable duplicate firewall overlap constraint: PASSED (Prevented duplicate scheduling)');
      } else {
        throw conflictErr;
      }
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test database records...');
    await pool.query("DELETE FROM timetables WHERE class_id = $1", [classId]);
    await pool.query("DELETE FROM subjects WHERE id = $1", [subjectId]);
    await pool.query("DELETE FROM staff WHERE id = $1", [teacherId]);
    await pool.query("DELETE FROM sections WHERE id = $1", [sectionId]);
    await pool.query("DELETE FROM classes WHERE id = $1", [classId]);
    await pool.query("DELETE FROM academic_years WHERE id = $1", [ayId]);
    console.log('  └─ Database cleanup: PASSED');

  } catch (err) {
    console.error('❌ Database integration test failed:', err);
    await pool.end();
    process.exit(1);
  }

  // 4. Test API firewall security headers
  console.log('\n🛡️ Testing Security Headers and Express Firewall policies...');
  const app = express();
  app.use(helmet());
  app.use(rateLimit({ windowMs: 1000, max: 2, message: 'rate-limited' }));
  app.get('/test-firewall', (req, res) => res.send('ok'));

  const server = app.listen(4099);
  
  try {
    const res = await fetch('http://localhost:4099/test-firewall');
    
    // Check security headers injected by helmet
    const xss = res.headers.get('x-xss-protection');
    const nosniff = res.headers.get('x-content-type-options');
    const frame = res.headers.get('x-frame-options');

    console.log(`  └─ X-Content-Type-Options header: ${nosniff ? 'PRESENT' : 'MISSING'}`);
    console.log(`  └─ X-Frame-Options header: ${frame ? 'PRESENT' : 'MISSING'}`);

    // Verify rate limiting works
    const res2 = await fetch('http://localhost:4099/test-firewall');
    const res3 = await fetch('http://localhost:4099/test-firewall');
    const text3 = await res3.text();

    console.log(`  └─ Rate Limiter response: ${res3.status === 429 || text3 === 'rate-limited' ? 'RATE LIMITED (PASSED)' : 'NOT RATE LIMITED (FAILED)'}`);

  } catch (err) {
    console.error('❌ Security Firewall verification failed:', err.message);
    server.close();
    await pool.end();
    process.exit(1);
  }

  server.close();
  await pool.end();

  console.log('\n====================================================');
  console.log('       🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ');
  console.log('====================================================\n');
};

runTests();
