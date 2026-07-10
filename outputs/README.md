# Values Junior College Management System

Modern college ERP built with React, Tailwind CSS, Express, PostgreSQL, JWT authentication, role-based access, Excel import/export and PDF fee receipts.

## Run locally

1. Install Node.js 20+ and PostgreSQL 15+.
2. Create a database named `values_college`.
3. Copy `server/.env.example` to `server/.env` and set a strong JWT secret and database URL.
4. Run `psql -d values_college -f server/database/schema.sql`.
5. Run `npm install`, then `npm run dev`.
6. Open http://localhost:5173.

Demo: `admin@values.edu` / `Admin@123`. Change this immediately outside development.

## Production

Run `npm run build`, serve behind HTTPS, restrict CORS, use a managed PostgreSQL instance, rotate secrets, configure backups, and add your transactional email provider for password resets.
