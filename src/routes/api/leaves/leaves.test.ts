import { describe, it, expect, beforeAll, beforeEach } from 'bun:test';
import { GET, POST, _calculateBusinessDays as calculateBusinessDays } from './+server';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('Leaves API & Business Logic (/api/leaves)', () => {
	let testEmployeeId: string;
	let testUserId: string;
	let testApproverId: string;

	beforeAll(async () => {
		const now = new Date().toISOString();
		const randomSuffix = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 1000)}`;
		testUserId = crypto.randomUUID();
		testApproverId = crypto.randomUUID();
		testEmployeeId = `OIT${randomSuffix}`;

		// Insert test approver user
		await db.insert(schema.users).values({
			id: testApproverId,
			email: `approver_${Date.now()}@dayflow.test`,
			passwordHash: 'hash',
			name: 'Test HR Approver',
			role: 'hr',
			createdAt: now,
			updatedAt: now
		});

		// Insert test employee user
		await db.insert(schema.users).values({
			id: testUserId,
			email: `employee_${Date.now()}@dayflow.test`,
			passwordHash: 'hash',
			name: 'Test Leave Applicant',
			role: 'employee',
			createdAt: now,
			updatedAt: now
		});

		// Insert test employee
		await db.insert(schema.employees).values({
			id: testEmployeeId,
			userId: testUserId,
			firstName: 'Test',
			lastName: 'Applicant',
			email: `employee_${Date.now()}@dayflow.test`,
			jobTitle: 'Software Engineer',
			department: 'Engineering',
			status: 'active',
			joinDate: '2025-01-01',
			monthlyWage: 100000,
			createdAt: now,
			updatedAt: now
		});

		// Insert leave balance (24 PTO, 2 used -> 22 left; 7 Sick, 1 used -> 6 left)
		await db.insert(schema.leaveBalances).values({
			id: crypto.randomUUID(),
			employeeId: testEmployeeId,
			year: 2026,
			paidTimeOffTotal: 24,
			paidTimeOffUsed: 2,
			sickLeaveTotal: 7,
			sickLeaveUsed: 1,
			unpaidLeaveUsed: 0,
			updatedAt: now
		});

		// Insert sample leave requests for testing
		await db.insert(schema.leaveRequests).values([
			{
				id: crypto.randomUUID(),
				employeeId: testEmployeeId,
				leaveType: 'paid_time_off',
				startDate: '2026-06-01',
				endDate: '2026-06-03',
				totalDays: 3,
				reason: 'Family vacation test',
				status: 'approved',
				approvedBy: testApproverId,
				createdAt: '2026-05-20T10:00:00.000Z',
				updatedAt: '2026-05-21T10:00:00.000Z'
			},
			{
				id: crypto.randomUUID(),
				employeeId: testEmployeeId,
				leaveType: 'sick_leave',
				startDate: '2026-07-10',
				endDate: '2026-07-10',
				totalDays: 1,
				reason: 'Dental appointment recovery',
				status: 'pending',
				approvedBy: null,
				createdAt: '2026-07-09T10:00:00.000Z',
				updatedAt: '2026-07-09T10:00:00.000Z'
			},
			{
				id: crypto.randomUUID(),
				employeeId: testEmployeeId,
				leaveType: 'unpaid_leave',
				startDate: '2026-08-01',
				endDate: '2026-08-02',
				totalDays: 2,
				reason: 'Personal leave on project break',
				status: 'rejected',
				approvedBy: testApproverId,
				rejectionReason: 'High priority release scheduled',
				createdAt: '2026-07-25T10:00:00.000Z',
				updatedAt: '2026-07-26T10:00:00.000Z'
			}
		]);
	});

	describe('calculateBusinessDays helper', () => {
		it('calculates weekdays correctly ignoring weekends', () => {
			// 2026-08-17 (Monday) to 2026-08-21 (Friday) = 5 days
			expect(calculateBusinessDays('2026-08-17', '2026-08-21')).toBe(5);

			// 2026-08-14 (Friday) to 2026-08-17 (Monday) = 2 business days (Fri & Mon)
			expect(calculateBusinessDays('2026-08-14', '2026-08-17')).toBe(2);

			// Weekend only: 2026-08-15 (Sat) to 2026-08-16 (Sun) = returns minimum 1
			expect(calculateBusinessDays('2026-08-15', '2026-08-16')).toBe(1);
		});

		it('returns 0 for invalid date ranges where start is after end', () => {
			expect(calculateBusinessDays('2026-08-20', '2026-08-15')).toBe(0);
		});
	});

	describe('GET /api/leaves - Query Filters & Pagination', () => {
		it('should return all leave records without filters', async () => {
			const url = new URL('http://localhost/api/leaves');
			const response = await GET({ url } as any);
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.leaves).toBeDefined();
			expect(Array.isArray(data.leaves)).toBe(true);
			expect(data.leaves.length).toBeGreaterThan(0);
			expect(data.total).toBeGreaterThan(0);
			expect(data.page).toBe(1);
			expect(data.limit).toBe(50);
		});

		it('should filter leaves by employeeId and return employee balance', async () => {
			const url = new URL(`http://localhost/api/leaves?employeeId=${testEmployeeId}&year=2026`);
			const response = await GET({ url } as any);
			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.leaves.length).toBeGreaterThanOrEqual(3);
			for (const leave of data.leaves) {
				expect(leave.employeeId).toBe(testEmployeeId);
				expect(leave.employee).toBeDefined();
				expect(leave.employee.firstName).toBe('Test');
			}
			expect(data.balance).toBeDefined();
			expect(data.balance.paidTimeOffTotal).toBe(24);
			expect(data.balance.paidTimeOffUsed).toBe(2);
		});

		it('should filter leaves by status', async () => {
			const url = new URL(`http://localhost/api/leaves?employeeId=${testEmployeeId}&status=pending`);
			const response = await GET({ url } as any);
			const data = await response.json();

			expect(data.leaves.length).toBeGreaterThanOrEqual(1);
			for (const leave of data.leaves) {
				expect(leave.status).toBe('pending');
			}
		});

		it('should filter leaves by leaveType', async () => {
			const url = new URL(`http://localhost/api/leaves?employeeId=${testEmployeeId}&type=paid_time_off`);
			const response = await GET({ url } as any);
			const data = await response.json();

			expect(data.leaves.length).toBeGreaterThanOrEqual(1);
			for (const leave of data.leaves) {
				expect(leave.leaveType).toBe('paid_time_off');
			}
		});

		it('should filter leaves by year', async () => {
			const url = new URL(`http://localhost/api/leaves?employeeId=${testEmployeeId}&year=2026`);
			const response = await GET({ url } as any);
			const data = await response.json();

			expect(data.leaves.length).toBeGreaterThanOrEqual(3);
		});

		it('should support pagination with page and limit parameters', async () => {
			const url = new URL(`http://localhost/api/leaves?employeeId=${testEmployeeId}&page=1&limit=2`);
			const response = await GET({ url } as any);
			const data = await response.json();

			expect(data.leaves.length).toBe(2);
			expect(data.page).toBe(1);
			expect(data.limit).toBe(2);
			expect(data.totalPages).toBeGreaterThanOrEqual(2);

			const page2Url = new URL(`http://localhost/api/leaves?employeeId=${testEmployeeId}&page=2&limit=2`);
			const page2Response = await GET({ url: page2Url } as any);
			const page2Data = await page2Response.json();

			expect(page2Data.leaves.length).toBeGreaterThanOrEqual(1);
			expect(page2Data.page).toBe(2);
			expect(page2Data.leaves[0].id).not.toBe(data.leaves[0].id);
		});
	});

	describe('POST /api/leaves - Validation & Leave Submission', () => {
		it('should reject requests with missing employeeId', async () => {
			const request = new Request('http://localhost/api/leaves', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leaveType: 'paid_time_off',
					startDate: '2026-09-01',
					endDate: '2026-09-02',
					reason: 'Vacation'
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toContain('Employee ID is required');
		});

		it('should reject requests with invalid leave type', async () => {
			const request = new Request('http://localhost/api/leaves', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: testEmployeeId,
					leaveType: 'invalid_type',
					startDate: '2026-09-01',
					endDate: '2026-09-02',
					reason: 'Vacation'
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toContain('Invalid leave type');
		});

		it('should reject requests with invalid or missing date format', async () => {
			const request = new Request('http://localhost/api/leaves', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: testEmployeeId,
					leaveType: 'paid_time_off',
					startDate: '01-09-2026',
					endDate: '2026-09-02',
					reason: 'Vacation'
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toContain('Valid start date');
		});

		it('should reject requests when startDate is after endDate', async () => {
			const request = new Request('http://localhost/api/leaves', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: testEmployeeId,
					leaveType: 'paid_time_off',
					startDate: '2026-09-10',
					endDate: '2026-09-05',
					reason: 'Vacation trip'
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toContain('Start date cannot be after end date');
		});

		it('should reject requests with too short reason (< 3 chars)', async () => {
			const request = new Request('http://localhost/api/leaves', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: testEmployeeId,
					leaveType: 'paid_time_off',
					startDate: '2026-09-01',
					endDate: '2026-09-02',
					reason: 'a'
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toContain('Reason must be at least 3 characters');
		});

		it('should return 404 if employee does not exist', async () => {
			const request = new Request('http://localhost/api/leaves', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: 'NONEXISTENT_EMP_9999',
					leaveType: 'paid_time_off',
					startDate: '2026-09-01',
					endDate: '2026-09-02',
					reason: 'Vacation'
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(404);
			const data = await response.json();
			expect(data.error).toContain('not found');
		});

		it('should enforce PTO quota limits and reject request exceeding balance', async () => {
			// Current balance: 24 total, 2 used -> 22 remaining.
			// Requesting 25 days:
			const request = new Request('http://localhost/api/leaves', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: testEmployeeId,
					leaveType: 'paid_time_off',
					startDate: '2026-09-01',
					endDate: '2026-10-06',
					totalDays: 25,
					reason: 'Sabbatical travel attempt'
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toContain('Insufficient Paid Time Off balance');
			expect(data.remaining).toBe(22);
		});

		it('should enforce Sick Leave quota limits and reject request exceeding balance', async () => {
			// Current sick balance: 7 total, 1 used -> 6 remaining.
			// Requesting 10 days:
			const request = new Request('http://localhost/api/leaves', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: testEmployeeId,
					leaveType: 'sick_leave',
					startDate: '2026-09-01',
					endDate: '2026-09-14',
					totalDays: 10,
					reason: 'Extended sick leave attempt'
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toContain('Insufficient Sick Leave balance');
			expect(data.remaining).toBe(6);
		});

		it('should successfully create leave request within quota and log chatter entry', async () => {
			const request = new Request('http://localhost/api/leaves', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: testEmployeeId,
					leaveType: 'paid_time_off',
					startDate: '2026-11-02',
					endDate: '2026-11-04',
					totalDays: 3,
					reason: 'Attending annual tech conference and regional meetup'
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(201);
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.leave).toBeDefined();
			expect(data.leave.employeeId).toBe(testEmployeeId);
			expect(data.leave.leaveType).toBe('paid_time_off');
			expect(data.leave.startDate).toBe('2026-11-02');
			expect(data.leave.endDate).toBe('2026-11-04');
			expect(data.leave.totalDays).toBe(3);
			expect(data.leave.status).toBe('pending');
			expect(data.leave.businessDays).toBe(3);

			// Verify record in database
			const createdRecord = await db.query.leaveRequests.findFirst({
				where: eq(schema.leaveRequests.id, data.leave.id)
			});
			expect(createdRecord).toBeDefined();
			expect(createdRecord?.status).toBe('pending');

			// Verify chatter audit log entry
			const chatterLogs = await db
				.select()
				.from(schema.chatter)
				.where(eq(schema.chatter.entityId, data.leave.id));
			expect(chatterLogs.length).toBe(1);
			expect(chatterLogs[0].entityType).toBe('leave');
			expect(chatterLogs[0].message).toContain('Submitted new leave request');
		});
	});
});
