import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import pg from 'pg';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const q = async (t, p = []) => (await db.query(t, p)).rows;

const app = express();

// Secure server with Helmet
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP if it conflicts with local dev/Vite assets, or configure appropriately
}));

// Dynamic CORS origin reflection
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));

// Strong Firewall: Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // limit each IP to 1000 requests per window
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // limit each IP to 20 auth requests per window
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth', authLimiter);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5000000 }
});

// Authentication middleware
const auth = (req, res, next) => {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      token = req.query.authorization || req.query.token;
    }
    if (!token) throw new Error('Missing token');
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication required' });
  }
};

const allow = (...roles) => (req, res, next) => 
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Insufficient permissions' });

// Health Check
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'Values Junior College ERP API' }));

// Login Endpoint
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const body = z.object({
      email: z.string().min(3),
      password: z.string().min(8)
    }).parse(req.body);
    
    const u = (await q('SELECT * FROM users WHERE email=$1 OR username=$1 LIMIT 1', [body.email.toLowerCase()]))[0];
    
    if (!u?.is_active || !(await bcrypt.compare(body.password, u.password_hash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: u.id, role: u.role, name: u.name }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    
    res.json({
      token,
      user: { id: u.id, name: u.name, email: u.email, role: u.role }
    });
  } catch (e) {
    next(e);
  }
});

// Update Profile Endpoint (Direct update if super admin, else request approval)
app.put('/api/auth/profile', auth, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!username && !password) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    if (userRole === 'super_admin') {
      if (username) {
        const existing = await q('SELECT id FROM users WHERE username = $1 AND id <> $2', [username, userId]);
        if (existing.length > 0) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
        await q('UPDATE users SET username = $1 WHERE id = $2', [username, userId]);
      }

      if (password) {
        if (password.length < 5) {
          return res.status(400).json({ message: 'Password must be at least 5 characters long' });
        }
        await q("UPDATE users SET password_hash = crypt($1, gen_salt('bf')) WHERE id = $2", [password, userId]);
      }

      const updated = (await q('SELECT id, username, name, email, role FROM users WHERE id = $1', [userId]))[0];
      const token = jwt.sign(updated, process.env.JWT_SECRET, { expiresIn: '24h' });
      return res.json({ message: 'Profile updated successfully', user: updated, token });
    } else {
      let passwordHash = null;
      if (password) {
        if (password.length < 5) {
          return res.status(400).json({ message: 'Password must be at least 5 characters long' });
        }
        const hashResult = await q("SELECT crypt($1, gen_salt('bf')) as hash", [password]);
        passwordHash = hashResult[0].hash;
      }

      await q(
        `INSERT INTO credential_change_requests(user_id, requested_username, requested_password_hash) 
         VALUES($1, $2, $3)`,
        [userId, username || null, passwordHash]
      );

      return res.json({ message: 'Update request submitted to Super Admin for approval.' });
    }
  } catch (e) {
    next(e);
  }
});

// Admin endpoints for credential change approvals
app.get('/api/admin/credential-requests', auth, allow('super_admin'), async (req, res, next) => {
  try {
    const data = await q(
      `SELECT r.*, u.name as user_name, u.role as user_role 
       FROM credential_change_requests r 
       LEFT JOIN users u ON u.id = r.user_id 
       WHERE r.status = 'pending' 
       ORDER BY r.created_at DESC`
    );
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

app.post('/api/admin/credential-requests/:id/approve', auth, allow('super_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const request = (await q('SELECT * FROM credential_change_requests WHERE id = $1', [id]))[0];
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    if (request.requested_username) {
      const existing = await q('SELECT id FROM users WHERE username = $1 AND id <> $2', [request.requested_username, request.user_id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Requested username is already taken by another user' });
      }
      await q('UPDATE users SET username = $1 WHERE id = $2', [request.requested_username, request.user_id]);
    }

    if (request.requested_password_hash) {
      await q('UPDATE users SET password_hash = $1 WHERE id = $2', [request.requested_password_hash, request.user_id]);
    }

    await q("UPDATE credential_change_requests SET status = 'approved', updated_at = NOW() WHERE id = $1", [id]);

    res.json({ message: 'Credentials request approved and updated successfully.' });
  } catch (e) {
    next(e);
  }
});

app.post('/api/admin/credential-requests/:id/reject', auth, allow('super_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await q("UPDATE credential_change_requests SET status = 'rejected', updated_at = NOW() WHERE id = $1 AND status = 'pending' RETURNING *", [id]);
    if (result.length === 0) {
      return res.status(400).json({ message: 'Request not found or already processed' });
    }
    res.json({ message: 'Credentials request rejected.' });
  } catch (e) {
    next(e);
  }
});

app.post('/api/auth/forgot-password', (_, res) => 
  res.json({ message: 'If the account exists, a reset link has been sent.' })
);

// Special Singleton Route: College Settings
app.get('/api/college-settings', auth, async (req, res, next) => {
  try {
    let s = (await q('SELECT * FROM college_settings WHERE id = 1'))[0];
    if (!s) {
      s = (await q('INSERT INTO college_settings(id, college_name) VALUES(1, $1) ON CONFLICT(id) DO UPDATE SET updated_at=NOW() RETURNING *', ['Values Junior College']))[0];
    }
    res.json(s);
  } catch (e) {
    next(e);
  }
});

app.put('/api/college-settings', auth, allow('super_admin', 'admin_staff'), async (req, res, next) => {
  try {
    const { college_name, address, phone, email, logo_url } = req.body;
    const s = (await q(
      `INSERT INTO college_settings(id, college_name, address, phone, email, logo_url) 
       VALUES(1, $1, $2, $3, $4, $5)
       ON CONFLICT(id) DO UPDATE 
       SET college_name = COALESCE($1, college_settings.college_name),
           address = COALESCE($2, college_settings.address),
           phone = COALESCE($3, college_settings.phone),
           email = COALESCE($4, college_settings.email),
           logo_url = COALESCE($5, college_settings.logo_url),
           updated_at = NOW() 
       RETURNING *`,
      [college_name, address, phone, email, logo_url]
    ))[0];
    res.json(s);
  } catch (e) {
    next(e);
  }
});

// Dynamic Resource Routes definition
const resources = {
  students: ['students', ['admission_number', 'roll_number', 'name', 'photo_url', 'date_of_birth', 'gender', 'mobile', 'email', 'class_id', 'section_id', 'course_id', 'academic_year_id', 'father_name', 'mother_name', 'parent_mobile', 'address']],
  staff: ['staff', ['staff_code', 'name', 'photo_url', 'qualification', 'department', 'subject', 'mobile', 'email', 'address', 'joining_date', 'user_id']],
  classes: ['classes', ['name', 'academic_year_id']],
  sections: ['sections', ['name', 'class_id']],
  subjects: ['subjects', ['name', 'code', 'course_id']],
  fees: ['fees', ['class_id', 'fee_type', 'amount', 'academic_year_id']],
  attendance: ['attendance', ['student_id', 'date', 'status', 'marked_by']],
  exams: ['exams', ['name', 'class_id', 'subject_id', 'maximum_marks', 'exam_date']],
  marks: ['marks', ['exam_id', 'student_id', 'marks_obtained', 'entered_by']],
  transport: ['transport', ['bus_number', 'driver_name', 'driver_mobile', 'route_name', 'stops']],
  messages: ['messages', ['subject', 'body', 'audience_type', 'audience_id', 'sender_id']],
  complaints: ['complaints', ['complaint_code', 'raised_by_type', 'raised_by_id', 'subject', 'description', 'status']],
  academic_years: ['academic_years', ['name', 'start_date', 'end_date', 'is_active']],
  courses: ['courses', ['name', 'code']],
  timetables: ['timetables', ['class_id', 'section_id', 'subject_id', 'teacher_id', 'day_of_week', 'start_time', 'end_time']],
  payments: ['payments', ['student_id', 'allocation_id', 'payment_date', 'amount_paid', 'payment_mode', 'recorded_by']],
  student_fee_allocations: ['student_fee_allocations', ['student_id', 'fee_id', 'total_amount', 'paid_amount', 'due_date']]
};

// Special override endpoint for payments to include student details (Name, Student ID, and Pending Balance)
app.get('/api/payments', auth, async (req, res, next) => {
  try {
    const page = Math.max(1, +req.query.page || 1);
    const limit = Math.min(1000, +req.query.limit || 100);
    const offset = (page - 1) * limit;
    
    const data = await q(
      `SELECT p.*, s.name as student_name, s.student_code,
              COALESCE(
                (SELECT SUM(balance_amount) FROM student_fee_allocations WHERE student_id = p.student_id),
                0
              ) as pending_amount
       FROM payments p 
       LEFT JOIN students s ON s.id = p.student_id 
       ORDER BY p.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ data, page, limit });
  } catch (e) {
    next(e);
  }
});

// Custom override for recording payments to automatically deduct from student fee allocations
app.post('/api/payments', auth, async (req, res, next) => {
  try {
    const { student_id, allocation_id: body_alloc_id, amount_paid, payment_mode, payment_date } = req.body;
    if (!student_id || amount_paid === undefined) {
      return res.status(400).json({ message: 'student_id and amount_paid are required' });
    }

    let allocation_id = body_alloc_id || null;

    if (allocation_id) {
      await q(
        `UPDATE student_fee_allocations 
         SET paid_amount = paid_amount + $1 
         WHERE id = $2`,
        [Number(amount_paid), allocation_id]
      );
    } else {
      const allocations = await q(
        `SELECT * FROM student_fee_allocations 
         WHERE student_id = $1 AND balance_amount > 0 
         ORDER BY due_date ASC, created_at ASC`,
        [student_id]
      );

      let remaining = Number(amount_paid);

      for (const alloc of allocations) {
        if (remaining <= 0) break;
        const bal = Number(alloc.balance_amount);
        const deduct = Math.min(remaining, bal);
        
        await q(
          `UPDATE student_fee_allocations 
           SET paid_amount = paid_amount + $1 
           WHERE id = $2`,
          [deduct, alloc.id]
        );
        
        if (!allocation_id) {
          allocation_id = alloc.id;
        }
        remaining -= deduct;
      }
    }

    const result = (await q(
      `INSERT INTO payments(student_id, allocation_id, amount_paid, payment_mode, payment_date) 
       VALUES($1, $2, $3, $4, $5) RETURNING *`,
      [student_id, allocation_id, amount_paid, payment_mode, payment_date || new Date()]
    ))[0];

    const formatted = (await q(
      `SELECT p.*, s.name as student_name, s.student_code 
       FROM payments p 
       LEFT JOIN students s ON s.id = p.student_id 
       WHERE p.id = $1`,
      [result.id]
    ))[0];

    res.status(201).json(formatted);
  } catch (e) {
    next(e);
  }
});

// Special override endpoint for student_fee_allocations to include student and fee details (Name, Student ID, Fee Type)
app.get('/api/student_fee_allocations', auth, async (req, res, next) => {
  try {
    const page = Math.max(1, +req.query.page || 1);
    const limit = Math.min(1000, +req.query.limit || 100);
    const offset = (page - 1) * limit;
    
    const data = await q(
      `SELECT a.*, s.name as student_name, s.student_code, f.fee_type 
       FROM student_fee_allocations a 
       LEFT JOIN students s ON s.id = a.student_id 
       LEFT JOIN fees f ON f.id = a.fee_id 
       ORDER BY a.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ data, page, limit });
  } catch (e) {
    next(e);
  }
});

for (const [name, [table, fields]] of Object.entries(resources)) {
  // GET resource list
  app.get('/api/' + name, auth, async (req, res, next) => {
    try {
      const page = Math.max(1, +req.query.page || 1);
      const limit = Math.min(1000, +req.query.limit || 100); // Higher limit default for dropdown populations
      const offset = (page - 1) * limit;
      
      const data = await q(
        `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, 
        [limit, offset]
      );
      res.json({ data, page, limit });
    } catch (e) {
      next(e);
    }
  });

  // POST new resource
  app.post('/api/' + name, auth, async (req, res, next) => {
    try {
      const entries = fields.filter(f => req.body[f] !== undefined).map(f => [f, req.body[f] === '' ? null : req.body[f]]);
      if (!entries.length) {
        return res.status(400).json({ message: 'No valid fields' });
      }
      const vals = entries.map(x => x[1]);
      const placeholders = vals.map((_, i) => '$' + (i + 1));
      
      const insertQuery = `INSERT INTO ${table}(${entries.map(x => x[0]).join(', ')}) VALUES(${placeholders.join(', ')}) RETURNING *`;
      const result = (await q(insertQuery, vals))[0];
      
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });

  // PUT update resource
  app.put('/api/' + name + '/:id', auth, async (req, res, next) => {
    try {
      const entries = fields.filter(f => req.body[f] !== undefined).map(f => [f, req.body[f] === '' ? null : req.body[f]]);
      if (!entries.length) {
        return res.status(400).json({ message: 'No valid fields' });
      }
      const vals = entries.map(x => x[1]);
      const setClause = entries.map((x, i) => `${x[0]}=$${i + 1}`).join(', ');
      
      const updateQuery = `UPDATE ${table} SET ${setClause}, updated_at=NOW() WHERE id=$${entries.length + 1} RETURNING *`;
      const result = (await q(updateQuery, [...vals, req.params.id]))[0];
      
      if (!result) {
        return res.status(404).json({ message: 'Record not found' });
      }
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  // DELETE resource
  app.delete('/api/' + name + '/:id', auth, allow('super_admin', 'admin_staff'), async (req, res, next) => {
    try {
      await q(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });
}

// Student Excel Import
app.post('/api/students/import', auth, allow('super_admin', 'admin_staff'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Excel file required' });
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);
    const ws = wb.worksheets[0];
    let imported = 0;
    
    const getCellString = (val, maxLen) => {
      if (!val) return '';
      let str = '';
      if (typeof val === 'object') {
        if (val.text) str = String(val.text).trim();
        else if (val.result) str = String(val.result).trim();
      } else {
        str = String(val).trim();
      }
      return maxLen ? str.substring(0, maxLen) : str;
    };

    for (let i = 2; i <= ws.rowCount; i++) {
      const rowValues = ws.getRow(i).values;
      if (!rowValues) continue;
      
      const name = getCellString(rowValues[1], 140);
      const admission = getCellString(rowValues[2], 50);
      const roll = getCellString(rowValues[3], 30);
      const className = getCellString(rowValues[4], 80);
      const section = getCellString(rowValues[5], 30);
      const mobile = getCellString(rowValues[6], 20);
      const father = getCellString(rowValues[7], 120);
      const mother = getCellString(rowValues[8], 120);
      const parentMobile = getCellString(rowValues[9], 20);
      const address = getCellString(rowValues[10]);
      
      if (!name || !admission) continue;

      let classId = null;
      let sectionId = null;

      if (className) {
        let cls = (await q('SELECT id FROM classes WHERE name = $1 LIMIT 1', [className]))[0];
        if (!cls) {
          cls = (await q('INSERT INTO classes(name) VALUES($1) RETURNING id', [className]))[0];
        }
        classId = cls.id;

        if (section && classId) {
          let sec = (await q('SELECT id FROM sections WHERE name = $1 AND class_id = $2 LIMIT 1', [section, classId]))[0];
          if (!sec) {
            sec = (await q('INSERT INTO sections(name, class_id) VALUES($1, $2) RETURNING id', [section, classId]))[0];
          }
          sectionId = sec.id;
        }
      }
      
      await q(
        `INSERT INTO students(name, admission_number, roll_number, mobile, class_id, section_id, father_name, mother_name, parent_mobile, address) 
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         ON CONFLICT(admission_number) DO NOTHING`,
        [name, admission, roll, mobile, classId, sectionId, father, mother, parentMobile, address || (className + ' / ' + section)]
      );
      imported++;
    }
    res.json({ message: imported + ' rows processed', imported });
  } catch (e) {
    next(e);
  }
});

// Staff Excel Import
app.post('/api/staff/import', auth, allow('super_admin', 'admin_staff'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Excel file required' });
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);
    const ws = wb.worksheets[0];
    let imported = 0;

    const getCellString = (val, maxLen) => {
      if (!val) return '';
      let str = '';
      if (typeof val === 'object') {
        if (val.text) str = String(val.text).trim();
        else if (val.result) str = String(val.result).trim();
      } else {
        str = String(val).trim();
      }
      return maxLen ? str.substring(0, maxLen) : str;
    };

    for (let i = 2; i <= ws.rowCount; i++) {
      const rowValues = ws.getRow(i).values;
      if (!rowValues) continue;

      const staffCode = getCellString(rowValues[1], 30);
      const name = getCellString(rowValues[2], 140);
      const qualification = getCellString(rowValues[3], 120);
      const department = getCellString(rowValues[4], 100);
      const subject = getCellString(rowValues[5], 100);
      const mobile = getCellString(rowValues[6], 20);
      const email = getCellString(rowValues[7], 160);
      const address = getCellString(rowValues[8]);
      const joiningDateVal = rowValues[9];

      if (!staffCode || !name) continue;

      let joiningDate = null;
      if (joiningDateVal) {
        joiningDate = joiningDateVal instanceof Date ? joiningDateVal : new Date(joiningDateVal);
        if (isNaN(joiningDate.getTime())) joiningDate = null;
      }

      await q(
        `INSERT INTO staff(staff_code, name, qualification, department, subject, mobile, email, address, joining_date) 
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         ON CONFLICT(staff_code) DO NOTHING`,
        [staffCode, name, qualification, department, subject, mobile, email, address, joiningDate]
      );
      imported++;
    }
    res.json({ message: imported + ' rows processed', imported });
  } catch (e) {
    next(e);
  }
});

// Student Import Excel Template
app.get('/api/students/import-template', auth, async (req, res, next) => {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Student Template');
    
    ws.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Admission Number', key: 'admission', width: 18 },
      { header: 'Roll Number', key: 'roll', width: 12 },
      { header: 'Class', key: 'className', width: 15 },
      { header: 'Section', key: 'section', width: 10 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Father Name', key: 'father', width: 18 },
      { header: 'Mother Name', key: 'mother', width: 18 },
      { header: 'Parent Mobile', key: 'parentMobile', width: 15 },
      { header: 'Address', key: 'address', width: 25 }
    ];
    
    ws.addRow({
      name: 'Aarav Sharma',
      admission: 'ADM26001',
      roll: '101',
      className: 'Junior Inter',
      section: 'A',
      mobile: '9876543210',
      father: 'Ramesh Sharma',
      mother: 'Sita Sharma',
      parentMobile: '9988776655',
      address: 'Hyderabad, TS, India'
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=values-students-template.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
});

// Staff Import Excel Template
app.get('/api/staff/import-template', auth, async (req, res, next) => {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Staff Template');
    
    ws.columns = [
      { header: 'Staff Code', key: 'staffCode', width: 15 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Qualification', key: 'qualification', width: 15 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Subject', key: 'subject', width: 15 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Email', key: 'email', width: 22 },
      { header: 'Address', key: 'address', width: 25 },
      { header: 'Joining Date', key: 'joiningDate', width: 15 }
    ];
    
    ws.addRow({
      staffCode: 'STF-014',
      name: 'Dr. R. Mehta',
      qualification: 'PhD Physics',
      department: 'Sciences',
      subject: 'Physics',
      mobile: '9849010001',
      email: 'mehta@values.edu',
      address: 'Hyderabad, TS, India',
      joiningDate: '2026-06-15'
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=values-staff-template.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
});

// Student Excel Export
app.get('/api/students/export', auth, async (req, res, next) => {
  try {
    const rows = await q('SELECT student_code, name, admission_number, roll_number, mobile, parent_mobile, address FROM students ORDER BY name');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Students');
    
    ws.columns = Object.keys(rows[0] || { student_code: '' }).map(k => ({
      header: k.replaceAll('_', ' ').toUpperCase(),
      key: k,
      width: 22
    }));
    
    ws.addRows(rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=values-students.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
});

// Fee receipt PDF generation
app.get('/api/payments/:id/receipt', auth, async (req, res, next) => {
  try {
    const p = (await q('SELECT p.*, s.name, s.student_code, s.admission_number FROM payments p JOIN students s ON s.id=p.student_id WHERE p.id=$1', [req.params.id]))[0];
    if (!p) return res.status(404).json({ message: 'Payment not found' });
    
    const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    
    // Draw decorative border
    doc.lineWidth(2)
       .strokeColor('#071b35')
       .rect(15, 15, doc.page.width - 30, doc.page.height - 30)
       .stroke();

    doc.lineWidth(1)
       .strokeColor('#bae6fd')
       .rect(18, 18, doc.page.width - 36, doc.page.height - 36)
       .stroke();

    // Embed logo image at top center
    const logoPath = path.join(__dirname, 'logo.png');
    doc.image(logoPath, (doc.page.width - 160) / 2, 23, { width: 160 });
    
    // Receipt info container
    const leftMargin = 40;
    const startY = 88;
    doc.fontSize(9.5).fillColor('#334155');
    
    doc.font('Helvetica-Bold').text('Receipt Number:', leftMargin, startY);
    doc.font('Helvetica').text(p.receipt_number, leftMargin + 110, startY);
    
    doc.font('Helvetica-Bold').text('Student Name:', leftMargin, startY + 16);
    doc.font('Helvetica').text(p.name, leftMargin + 110, startY + 16);
    
    doc.font('Helvetica-Bold').text('Student ID (Code):', leftMargin, startY + 32);
    doc.font('Helvetica').text(p.student_code || p.admission_number || '-', leftMargin + 110, startY + 32);
    
    doc.font('Helvetica-Bold').text('Payment Date:', leftMargin, startY + 48);
    doc.font('Helvetica').text(new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), leftMargin + 110, startY + 48);
    
    doc.font('Helvetica-Bold').text('Payment Mode:', leftMargin, startY + 64);
    doc.font('Helvetica').text(p.payment_mode, leftMargin + 110, startY + 64);
    
    // Paid Amount box
    doc.rect(leftMargin, startY + 84, doc.page.width - (leftMargin * 2), 30).fillAndStroke('#f0f9ff', '#bae6fd');
    doc.fontSize(11).fillColor('#0369a1').font('Helvetica-Bold').text('Amount Paid: INR ' + Number(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 }), leftMargin + 15, startY + 94);
    
    // Signature lines
    doc.fontSize(8.5).fillColor('#475569');
    
    // Left side: Student / Parent Signature
    doc.font('Helvetica-Oblique').text('Student/Parent Signature', leftMargin, 252);
    doc.font('Helvetica').text('_______________________', leftMargin, 247);
    
    // Right side: Accountant Signature
    doc.font('Helvetica-Bold').text('Authorized Accountant Signature', doc.page.width - leftMargin - 160, 252, { align: 'right', width: 160 });
    doc.font('Helvetica-Oblique').fillColor('#0284c7').text('Jaswanth Narayana', doc.page.width - leftMargin - 160, 232, { align: 'right', width: 160 });
    doc.font('Helvetica').fillColor('#475569').text('_______________________', doc.page.width - leftMargin - 160, 242, { align: 'right', width: 160 });
    
    // Footer notes
    doc.fontSize(7.5).fillColor('#94a3b8').font('Helvetica').text('This is a computer-generated official receipt, validated by the authorized finance department.', leftMargin, doc.page.height - 40, { align: 'center', width: doc.page.width - (leftMargin * 2) });
      
    doc.end();
  } catch (e) {
    next(e);
  }
});

// Dashboard Data
app.get('/api/dashboard', auth, async (req, res, next) => {
  try {
    const [s, st, fc, p, c] = await Promise.all([
      q('SELECT COUNT(*)::int count FROM students'),
      q('SELECT COUNT(*)::int count FROM staff'),
      q('SELECT COALESCE(SUM(amount_paid),0) total FROM payments'),
      q('SELECT COALESCE(SUM(balance_amount),0) total FROM student_fee_allocations'),
      q("SELECT COUNT(*)::int count FROM complaints WHERE status!='Solved'")
    ]);
    res.json({
      students: s[0].count,
      staff: st[0].count,
      feeCollection: fc[0].total,
      pendingFees: p[0].total,
      complaints: c[0].count
    });
  } catch (e) {
    next(e);
  }
});

// Serve static client assets in production
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Error handling - Firewall Check - No stack traces leaking
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.flatten()
    });
  }
  
  if (err.code === '23505') {
    return res.status(409).json({ message: 'Record already exists' });
  }
  
  if (err.message && err.message.includes('Blocked by CORS')) {
    return res.status(403).json({ message: err.message });
  }

  // Strong security policy: generic error response, no server details
  res.status(500).json({ message: 'Internal server firewall / process error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Values ERP API running on port ' + PORT)); // Reloaded server