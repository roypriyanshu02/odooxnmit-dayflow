import { describe, it, expect, beforeAll, beforeEach } from 'bun:test';
import { POST } from './+server';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

describe('Leave Approval API (/api/leaves/approve)', () => {
	let testEmployeeId: string;
	let testUserId: string;
	let testApproverId: string;
	let ptoRequestId: string;
	let sickRequestId: string;
	let unpaidRequestId: string;
	let rejectTargetRequestId: string;

	beforeAll(async () => {
		const now = new Date().toISOString();
		const randomSuffix = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 1000)}`;
		testUserId = crypto.randomUUID();
		testApproverId = crypto.randomUUID();
		testEmployeeId = `OIT_APP_${randomSuffix}`;

		// 1. Insert test approver user
		await db.insert(schema.users).values({
			id: testApproverId,
			email: `approver_unit_${Date.now()}@dayflow.test`,
			passwordHash: 'hash',
			name: 'Sarah HR Manager',
			role: 'hr',
			createdAt: now,
			updatedAt: now
		});

		// 2. Insert test applicant user
		await db.insert(schema.users).values({
			id: testUserId,
			email: `applicant_unit_${Date.now()}@dayflow.test`,
			passwordHash: 'hash',
			name: 'Alex Johnson',
			role: 'employee',
			createdAt: now,
			updatedAt: now
		});

		// 3. Insert test employee
		await db.insert(schema.employees).values({
			id: testEmployeeId,
			userId: testUserId,
			firstName: 'Alex',
			lastName: 'Johnson',
			email: `alex_unit_${Date.now()}@dayflow.test`,
			jobTitle: 'Full Stack Engineer',
			department: 'Engineering',
			status: 'active',
			joinDate: '2025-01-01',
			monthlyWage: 120000,
			createdAt: now,
			updatedAt: now
		});

		// 4. Insert initial leave balance (24 PTO, 2 used; 7 Sick, 1 used; 0 Unpaid used)
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

		// 5. Create test leave requests
		ptoRequestId = crypto.randomUUID();
		sickRequestId = crypto.randomUUID();
		unpaidRequestId = crypto.randomUUID();
		rejectTargetRequestId = crypto.randomUUID();

		await db.insert(schema.leaveRequests).values([
			{
				id: ptoRequestId,
				employeeId: testEmployeeId,
				leaveType: 'paid_time_off',
				startDate: '2026-09-01',
				endDate: '2026-09-03',
				totalDays: 3,
				reason: 'Family trip to hills',
				status: 'pending',
				approvedBy: null,
				createdAt: now,
				updatedAt: now
			},
			{
				id: sickRequestId,
				employeeId: testEmployeeId,
				leaveType: 'sick_leave',
				startDate: '2026-09-15',
				endDate: '2026-09-16',
				totalDays: 2,
				reason: 'Viral fever rest',
				status: 'pending',
				approvedBy: null,
				createdAt: now,
				updatedAt: now
			},
			{
				id: unpaidRequestId,
				employeeId: testEmployeeId,
				leaveType: 'unpaid_leave',
				startDate: '2026-10-01',
				endDate: '2026-10-05',
				totalDays: 5,
				reason: 'Extended personal leave',
				status: 'pending',
				approvedBy: null,
				createdAt: now,
				updatedAt: now
			},
			{
				id: rejectTargetRequestId,
				employeeId: testEmployeeId,
				leaveType: 'paid_time_off',
				startDate: '2026-11-10',
				endDate: '2026-11-12',
				totalDays: 3,
				reason: 'Conference travel',
				status: 'pending',
				approvedBy: null,
				createdAt: now,
				updatedAt: now
			}
		]);
	});

	describe('Input Validation & Error Handling', () => {
		it('should return 400 if leaveRequestId is missing', async () => {
			const request = new Request('http://localhost/api/leaves/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'approve',
					approvedBy: testApproverId
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toContain('Leave request ID is required');
		});

		it('should return 400 for invalid action parameter', async () => {
			const request = new Request('http://localhost/api/leaves/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leaveRequestId: ptoRequestId,
					action: 'unknown_action'
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toContain("Must be 'approve' or 'reject'");
		});

		it('should return 400 when rejecting without rejectionReason', async () => {
			const request = new Request('http://localhost/api/leaves/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leaveRequestId: rejectTargetRequestId,
					action: 'reject',
					approvedBy: testApproverId
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toContain('Rejection reason is required');
		});

		it('should return 404 if leave request does not exist', async () => {
			const request = new Request('http://localhost/api/leaves/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leaveRequestId: 'NONEXISTENT_REQ_9999',
					action: 'approve',
					approvedBy: testApproverId
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(404);
			const data = await response.json();
			expect(data.error).toContain('not found');
		});
	});

	describe('Approval Flow & Quota Balance Deductions', () => {
		it('should approve PTO leave request and update paidTimeOffUsed balance', async () => {
			const request = new Request('http://localhost/api/leaves/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leaveRequestId: ptoRequestId,
					action: 'approve',
					approvedBy: testApproverId
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.action).toBe('approve');
			expect(data.leave).toBeDefined();
			expect(data.leave.status).toBe('approved');
			expect(data.leave.approvedBy).toBe(testApproverId);

			// Check quota deduction in database: 2 previously used + 3 approved = 5 used
			const updatedBalance = await db.query.leaveBalances.findFirst({
				where: and(
					eq(schema.leaveBalances.employeeId, testEmployeeId),
					eq(schema.leaveBalances.year, 2026)
				)
			});
			expect(updatedBalance?.paidTimeOffUsed).toBe(5);

			// Verify chatter audit log entry
			const chatterLogs = await db
				.select()
				.from(schema.chatter)
				.where(eq(schema.chatter.entityId, ptoRequestId));
			expect(chatterLogs.length).toBeGreaterThanOrEqual(1);
			const latestLog = chatterLogs[chatterLogs.length - 1];
			expect(latestLog.entityType).toBe('leave');
			expect(latestLog.type).toBe('status_change');
			expect(latestLog.message).toContain('was approved by Sarah HR Manager');
		});

		it('should approve Sick Leave request and update sickLeaveUsed balance', async () => {
			const request = new Request('http://localhost/api/leaves/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leaveRequestId: sickRequestId,
					action: 'approve',
					approvedBy: testApproverId
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.leave.status).toBe('approved');

			// Check sick leave quota: 1 previously used + 2 approved = 3 used
			const updatedBalance = await db.query.leaveBalances.findFirst({
				where: and(
					eq(schema.leaveBalances.employeeId, testEmployeeId),
					eq(schema.leaveBalances.year, 2026)
				)
			});
			expect(updatedBalance?.sickLeaveUsed).toBe(3);
		});

		it('should approve Unpaid Leave request and update unpaidLeaveUsed balance', async () => {
			const request = new Request('http://localhost/api/leaves/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leaveRequestId: unpaidRequestId,
					action: 'approve',
					approvedBy: testApproverId
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.leave.status).toBe('approved');

			// Check unpaid quota: 0 previously used + 5 approved = 5 used
			const updatedBalance = await db.query.leaveBalances.findFirst({
				where: and(
					eq(schema.leaveBalances.employeeId, testEmployeeId),
					eq(schema.leaveBalances.year, 2026)
				)
			});
			expect(updatedBalance?.unpaidLeaveUsed).toBe(5);
		});
	});

	describe('Rejection Flow & Reason Handling', () => {
		it('should reject leave request with reason, not deduct quota, and log chatter entry', async () => {
			const initialBalance = await db.query.leaveBalances.findFirst({
				where: and(
					eq(schema.leaveBalances.employeeId, testEmployeeId),
					eq(schema.leaveBalances.year, 2026)
				)
			});
			const initialPTOUsed = initialBalance?.paidTimeOffUsed;

			const rejectionNote = 'Critical Q4 milestone delivery conflicting with team bandwidth.';

			const request = new Request('http://localhost/api/leaves/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leaveRequestId: rejectTargetRequestId,
					action: 'reject',
					rejectionReason: rejectionNote,
					approvedBy: testApproverId
				})
			});

			const response = await POST({ request } as any);
			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.action).toBe('reject');
			expect(data.leave.status).toBe('rejected');
			expect(data.leave.rejectionReason).toBe(rejectionNote);

			// Verify quota was NOT deducted
			const finalBalance = await db.query.leaveBalances.findFirst({
				where: and(
					eq(schema.leaveBalances.employeeId, testEmployeeId),
					eq(schema.leaveBalances.year, 2026)
				)
			});
			expect(finalBalance?.paidTimeOffUsed).toBe(initialPTOUsed);

			// Verify rejection chatter log
			const chatterLogs = await db
				.select()
				.from(schema.chatter)
				.where(eq(schema.chatter.entityId, rejectTargetRequestId));
			expect(chatterLogs.length).toBeGreaterThanOrEqual(1);
			const latestLog = chatterLogs[chatterLogs.length - 1];
			expect(latestLog.entityType).toBe('leave');
			expect(latestLog.type).toBe('status_change');
			expect(latestLog.message).toContain('was rejected by Sarah HR Manager');
			expect(latestLog.message).toContain(rejectionNote);
		});
	});
});
