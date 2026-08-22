import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import path from 'path';

const dbPath = process.env.DATABASE_URL || path.resolve(process.cwd(), 'dayflow.db');

export const sqlite = new Database(dbPath, { create: true });

// Enable WAL mode & foreign keys
sqlite.run('PRAGMA journal_mode = WAL;');
sqlite.run('PRAGMA foreign_keys = ON;');

// Initialize tables if not exist
sqlite.run(`
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		name TEXT NOT NULL,
		role TEXT NOT NULL DEFAULT 'employee',
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS employees (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		first_name TEXT NOT NULL,
		last_name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		phone TEXT NOT NULL DEFAULT '',
		job_title TEXT NOT NULL,
		department TEXT NOT NULL,
		manager_id TEXT,
		avatar_url TEXT,
		status TEXT NOT NULL DEFAULT 'active',
		join_date TEXT NOT NULL,
		about_bio TEXT NOT NULL DEFAULT '',
		about_passions TEXT NOT NULL DEFAULT '',
		about_hobbies TEXT NOT NULL DEFAULT '',
		skills TEXT NOT NULL DEFAULT '[]',
		certifications TEXT NOT NULL DEFAULT '[]',
		work_history TEXT NOT NULL DEFAULT '[]',
		pan_number TEXT NOT NULL DEFAULT '',
		uan_number TEXT NOT NULL DEFAULT '',
		dob TEXT NOT NULL DEFAULT '',
		gender TEXT NOT NULL DEFAULT 'prefer_not_to_say',
		marital_status TEXT NOT NULL DEFAULT 'single',
		address TEXT NOT NULL DEFAULT '',
		bank_account_number TEXT NOT NULL DEFAULT '',
		bank_ifsc TEXT NOT NULL DEFAULT '',
		bank_name TEXT NOT NULL DEFAULT '',
		monthly_wage REAL NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS attendance (
		id TEXT PRIMARY KEY,
		employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
		date TEXT NOT NULL,
		check_in TEXT,
		check_out TEXT,
		total_work_minutes INTEGER NOT NULL DEFAULT 0,
		total_break_minutes INTEGER NOT NULL DEFAULT 0,
		overtime_minutes INTEGER NOT NULL DEFAULT 0,
		status TEXT NOT NULL DEFAULT 'present',
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS attendance_breaks (
		id TEXT PRIMARY KEY,
		attendance_id TEXT NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
		employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
		start_time TEXT NOT NULL,
		end_time TEXT,
		duration_minutes INTEGER NOT NULL DEFAULT 0,
		reason TEXT,
		created_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS leave_balances (
		id TEXT PRIMARY KEY,
		employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
		year INTEGER NOT NULL,
		paid_time_off_total REAL NOT NULL DEFAULT 24,
		paid_time_off_used REAL NOT NULL DEFAULT 0,
		sick_leave_total REAL NOT NULL DEFAULT 7,
		sick_leave_used REAL NOT NULL DEFAULT 0,
		unpaid_leave_used REAL NOT NULL DEFAULT 0,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS leave_requests (
		id TEXT PRIMARY KEY,
		employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
		leave_type TEXT NOT NULL,
		start_date TEXT NOT NULL,
		end_date TEXT NOT NULL,
		total_days REAL NOT NULL,
		reason TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'pending',
		approved_by TEXT REFERENCES users(id),
		rejection_reason TEXT,
		attachment_url TEXT,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS payslips (
		id TEXT PRIMARY KEY,
		employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
		month INTEGER NOT NULL,
		year INTEGER NOT NULL,
		monthly_wage REAL NOT NULL,
		basic_salary REAL NOT NULL,
		hra REAL NOT NULL,
		standard_allowance REAL NOT NULL,
		performance_bonus REAL NOT NULL,
		lta REAL NOT NULL,
		fixed_allowance REAL NOT NULL,
		gross_salary REAL NOT NULL,
		employee_pf REAL NOT NULL,
		employer_pf REAL NOT NULL,
		professional_tax REAL NOT NULL,
		total_deductions REAL NOT NULL,
		net_salary REAL NOT NULL,
		payable_days REAL NOT NULL,
		total_working_days REAL NOT NULL,
		status TEXT NOT NULL DEFAULT 'draft',
		payment_date TEXT,
		created_at TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS chatter (
		id TEXT PRIMARY KEY,
		entity_type TEXT NOT NULL,
		entity_id TEXT NOT NULL,
		author_id TEXT NOT NULL REFERENCES users(id),
		author_name TEXT NOT NULL,
		author_avatar TEXT,
		message TEXT NOT NULL,
		type TEXT NOT NULL DEFAULT 'note',
		metadata TEXT,
		created_at TEXT NOT NULL
	);
`);

export const db = drizzle(sqlite, { schema });
export default db;
