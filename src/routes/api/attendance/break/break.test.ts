import { describe, it, expect, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from '$lib/server/db/schema';
import {
	calculateBreakDuration,
	getBreakElapsedSeconds,
	isBreakExceededThreshold,
	formatStopwatch,
	formatDurationHuman,
	BREAK_PRESETS,
	BREAK_THRESHOLD_MINUTES
} from '$lib/utils/break';
import {
	_startBreak as startBreak,
	_endBreak as endBreak,
	_recordBreakInterval as recordBreakInterval,
	_getActiveBreak as getActiveBreak,
	_recalculateTotalBreakMinutes as recalculateTotalBreakMinutes,
	_getOrCreateAttendanceRecord as getOrCreateAttendanceRecord,
	POST,
	GET
} from './+server';

describe('Break Management & Attendance System', () => {
	// =========================================================================
	// 1. PURE LOGIC & DURATION UTILITIES
	// =========================================================================
	describe('Break Utilities', () => {
		describe('calculateBreakDuration', () => {
			it('should return 0 for identical start and end timestamps', () => {
				const time = '2026-08-22T10:00:00.000Z';
				expect(calculateBreakDuration(time, time)).toBe(0);
			});

			it('should calculate 15 minutes accurately for coffee break', () => {
				const start = '2026-08-22T10:00:00.000Z';
				const end = '2026-08-22T10:15:00.000Z';
				expect(calculateBreakDuration(start, end)).toBe(15);
			});

			it('should calculate 45 minutes accurately for lunch break', () => {
				const start = '2026-08-22T13:00:00.000Z';
				const end = '2026-08-22T13:45:00.000Z';
				expect(calculateBreakDuration(start, end)).toBe(45);
			});

			it('should calculate multi-hour break durations accurately', () => {
				const start = '2026-08-22T12:00:00.000Z';
				const end = '2026-08-22T13:30:00.000Z'; // 90 minutes
				expect(calculateBreakDuration(start, end)).toBe(90);
			});

			it('should round sub-minute durations properly', () => {
				const start = '2026-08-22T10:00:00.000Z';
				const end1 = '2026-08-22T10:00:29.000Z'; // 29s -> 0m
				const end2 = '2026-08-22T10:00:31.000Z'; // 31s -> 1m
				const end3 = '2026-08-22T10:14:45.000Z'; // 14m 45s -> 15m
				expect(calculateBreakDuration(start, end1)).toBe(0);
				expect(calculateBreakDuration(start, end2)).toBe(1);
				expect(calculateBreakDuration(start, end3)).toBe(15);
			});

			it('should handle Date objects and numeric epoch timestamps', () => {
				const d1 = new Date('2026-08-22T10:00:00.000Z');
				const d2 = new Date('2026-08-22T10:10:00.000Z');
				expect(calculateBreakDuration(d1, d2)).toBe(10);
				expect(calculateBreakDuration(d1.getTime(), d2.getTime())).toBe(10);
			});

			it('should return 0 for invalid inputs or end before start', () => {
				expect(calculateBreakDuration('invalid', 'dates')).toBe(0);
				expect(
					calculateBreakDuration('2026-08-22T11:00:00Z', '2026-08-22T10:00:00Z')
				).toBe(0);
			});
		});

		describe('isBreakExceededThreshold (60-min Policy Alert)', () => {
			it('should return false when elapsed time is below 60 minutes', () => {
				const start = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30m ago
				expect(isBreakExceededThreshold(start)).toBe(false);
			});

			it('should return false at 59 minutes', () => {
				const start = new Date(Date.now() - 59 * 60 * 1000).toISOString();
				expect(isBreakExceededThreshold(start)).toBe(false);
			});

			it('should return true when elapsed time reaches or exceeds 60 minutes', () => {
				const start60 = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 60m ago
				const start75 = new Date(Date.now() - 75 * 60 * 1000).toISOString(); // 75m ago
				expect(isBreakExceededThreshold(start60)).toBe(true);
				expect(isBreakExceededThreshold(start75)).toBe(true);
			});

			it('should support custom threshold overrides', () => {
				const start20 = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20m ago
				expect(isBreakExceededThreshold(start20, null, 15)).toBe(true);
				expect(isBreakExceededThreshold(start20, null, 30)).toBe(false);
			});
		});

		describe('formatStopwatch', () => {
			it('should format seconds into MM:SS when under 1 hour', () => {
				expect(formatStopwatch(0)).toBe('00:00');
				expect(formatStopwatch(9)).toBe('00:09');
				expect(formatStopwatch(45)).toBe('00:45');
				expect(formatStopwatch(60)).toBe('01:00');
				expect(formatStopwatch(125)).toBe('02:05');
				expect(formatStopwatch(3599)).toBe('59:59');
			});

			it('should format seconds into HH:MM:SS when 1 hour or more', () => {
				expect(formatStopwatch(3600)).toBe('01:00:00');
				expect(formatStopwatch(3665)).toBe('01:01:05');
				expect(formatStopwatch(7325)).toBe('02:02:05');
			});

			it('should handle negative or invalid inputs gracefully', () => {
				expect(formatStopwatch(-10)).toBe('00:00');
				expect(formatStopwatch(NaN)).toBe('00:00');
			});
		});

		describe('formatDurationHuman', () => {
			it('should format minute values into concise human strings', () => {
				expect(formatDurationHuman(0)).toBe('0m');
				expect(formatDurationHuman(10)).toBe('10m');
				expect(formatDurationHuman(45)).toBe('45m');
				expect(formatDurationHuman(60)).toBe('1h');
				expect(formatDurationHuman(75)).toBe('1h 15m');
				expect(formatDurationHuman(130)).toBe('2h 10m');
			});
		});

		describe('BREAK_PRESETS', () => {
			it('should contain all required standard presets', () => {
				const presetIds = BREAK_PRESETS.map((p) => p.id);
				expect(presetIds).toContain('coffee');
				expect(presetIds).toContain('lunch');
				expect(presetIds).toContain('rest');
				expect(presetIds).toContain('custom');

				const coffee = BREAK_PRESETS.find((p) => p.id === 'coffee');
				expect(coffee?.durationMinutes).toBe(15);

				const lunch = BREAK_PRESETS.find((p) => p.id === 'lunch');
				expect(lunch?.durationMinutes).toBe(45);

				const rest = BREAK_PRESETS.find((p) => p.id === 'rest');
				expect(rest?.durationMinutes).toBe(10);
			});
		});
	});

	// =========================================================================
	// 2. DATABASE & BUSINESS LOGIC (IN-MEMORY SQLITE)
	// =========================================================================
	describe('Break Database Operations', () => {
		let testSqlite: Database;
		let testDb: any;
		const testEmpId = 'OITEST20260001';
		const testUserId = 'user-test-01';

		beforeEach(() => {
			testSqlite = new Database(':memory:');
			testSqlite.run('PRAGMA foreign_keys = ON;');
			testSqlite.run(`
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
			`);

			testDb = drizzle(testSqlite, { schema });

			const now = new Date().toISOString();
			testSqlite.run(`
				INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
				VALUES ('${testUserId}', 'test@dayflow.internal', 'hash', 'Test User', 'employee', '${now}', '${now}');
			`);

			testSqlite.run(`
				INSERT INTO employees (id, user_id, first_name, last_name, email, job_title, department, join_date, created_at, updated_at)
				VALUES ('${testEmpId}', '${testUserId}', 'Test', 'User', 'test@dayflow.internal', 'Engineer', 'Engineering', '2026-01-01', '${now}', '${now}');
			`);
		});

		it('should create an attendance record if none exists for the day', async () => {
			const att = await getOrCreateAttendanceRecord(
				testDb,
				testEmpId,
				'2026-08-22',
				'2026-08-22T09:00:00.000Z'
			);

			expect(att).toBeDefined();
			expect(att.employeeId).toBe(testEmpId);
			expect(att.date).toBe('2026-08-22');
			expect(att.totalBreakMinutes).toBe(0);

			// Re-fetching should return the exact same record
			const existing = await getOrCreateAttendanceRecord(
				testDb,
				testEmpId,
				'2026-08-22'
			);
			expect(existing.id).toBe(att.id);
		});

		it('should successfully start a break and set endTime to null', async () => {
			const startRes = await startBreak(testDb, {
				employeeId: testEmpId,
				reason: 'Coffee / Tea',
				startTime: '2026-08-22T10:00:00.000Z',
				date: '2026-08-22'
			});

			expect(startRes.success).toBe(true);
			expect(startRes.break).toBeDefined();
			expect(startRes.break!.employeeId).toBe(testEmpId);
			expect(startRes.break!.reason).toBe('Coffee / Tea');
			expect(startRes.break!.startTime).toBe('2026-08-22T10:00:00.000Z');
			expect(startRes.break!.endTime).toBeNull();
			expect(startRes.break!.durationMinutes).toBe(0);

			const active = await getActiveBreak(testDb, testEmpId);
			expect(active).not.toBeNull();
			expect(active?.id).toBe(startRes.break!.id);
		});

		it('should prevent starting concurrent breaks if one is already active', async () => {
			await startBreak(testDb, {
				employeeId: testEmpId,
				reason: 'First Break',
				startTime: '2026-08-22T10:00:00.000Z',
				date: '2026-08-22'
			});

			const secondRes = await startBreak(testDb, {
				employeeId: testEmpId,
				reason: 'Second Break',
				startTime: '2026-08-22T10:05:00.000Z',
				date: '2026-08-22'
			});

			expect(secondRes.success).toBe(false);
			expect(secondRes.error).toContain('already in progress');
		});

		it('should end an active break, compute duration, and update attendance totalBreakMinutes', async () => {
			const startRes = await startBreak(testDb, {
				employeeId: testEmpId,
				reason: 'Lunch',
				startTime: '2026-08-22T13:00:00.000Z',
				date: '2026-08-22'
			});

			const endRes = await endBreak(testDb, {
				employeeId: testEmpId,
				endTime: '2026-08-22T13:45:00.000Z'
			});

			expect(endRes.success).toBe(true);
			expect(endRes.durationMinutes).toBe(45);
			expect(endRes.break?.endTime).toBe('2026-08-22T13:45:00.000Z');
			expect(endRes.break?.durationMinutes).toBe(45);
			expect(endRes.totalBreakMinutes).toBe(45);
			expect(endRes.attendance?.totalBreakMinutes).toBe(45);

			// Active break should now be null
			const active = await getActiveBreak(testDb, testEmpId);
			expect(active).toBeNull();
		});

		it('should end a break specifically by breakId', async () => {
			const startRes = await startBreak(testDb, {
				employeeId: testEmpId,
				reason: 'Rest & Stretch',
				startTime: '2026-08-22T15:00:00.000Z',
				date: '2026-08-22'
			});

			expect(startRes.break).toBeDefined();

			const endRes = await endBreak(testDb, {
				breakId: startRes.break!.id,
				endTime: '2026-08-22T15:10:00.000Z'
			});

			expect(endRes.success).toBe(true);
			expect(endRes.durationMinutes).toBe(10);
			expect(endRes.break?.durationMinutes).toBe(10);
		});

		it('should return error when attempting to end a non-existent or already ended break', async () => {
			const endRes = await endBreak(testDb, {
				employeeId: testEmpId
			});
			expect(endRes.success).toBe(false);
			expect(endRes.error).toContain('No active break found');
		});

		it('should record complete intervals directly and sum multiple breaks accurately', async () => {
			// Record Morning Coffee Break (15m)
			const break1 = await recordBreakInterval(testDb, {
				employeeId: testEmpId,
				startTime: '2026-08-22T10:00:00.000Z',
				endTime: '2026-08-22T10:15:00.000Z',
				reason: 'Coffee / Tea',
				date: '2026-08-22'
			});

			expect(break1.success).toBe(true);
			expect(break1.durationMinutes).toBe(15);
			expect(break1.totalBreakMinutes).toBe(15);

			// Record Lunch Break (45m)
			const break2 = await recordBreakInterval(testDb, {
				employeeId: testEmpId,
				startTime: '2026-08-22T13:00:00.000Z',
				endTime: '2026-08-22T13:45:00.000Z',
				reason: 'Lunch',
				date: '2026-08-22'
			});

			expect(break2.success).toBe(true);
			expect(break2.durationMinutes).toBe(45);
			expect(break2.totalBreakMinutes).toBe(60); // 15 + 45 = 60

			// Record Afternoon Rest (10m)
			const break3 = await recordBreakInterval(testDb, {
				employeeId: testEmpId,
				startTime: '2026-08-22T16:00:00.000Z',
				endTime: '2026-08-22T16:10:00.000Z',
				reason: 'Rest & Stretch',
				date: '2026-08-22'
			});

			expect(break3.success).toBe(true);
			expect(break3.durationMinutes).toBe(10);
			expect(break3.totalBreakMinutes).toBe(70); // 15 + 45 + 10 = 70
			expect(break3.attendance?.totalBreakMinutes).toBe(70);
		});
	});

	// =========================================================================
	// 3. HTTP ENDPOINT REQUEST HANDLER TESTS
	// =========================================================================
	describe('HTTP Request Handlers (POST & GET /api/attendance/break)', () => {
		it('should return 400 if employeeId and breakId are missing on POST', async () => {
			const req = new Request('http://localhost/api/attendance/break', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});

			const response = await POST({ request: req } as any);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain('employeeId or breakId is required');
		});

		it('should return 400 if employeeId is missing on GET', async () => {
			const url = new URL('http://localhost/api/attendance/break');
			const response = await GET({ url } as any);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
		});

		it('should return 400 for invalid action parameter', async () => {
			const req = new Request('http://localhost/api/attendance/break', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: 'OIROVE20260003',
					action: 'unknown_action'
				})
			});

			const response = await POST({ request: req } as any);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain('Invalid action');
		});
	});
});
