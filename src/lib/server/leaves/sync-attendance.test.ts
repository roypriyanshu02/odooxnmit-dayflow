import { describe, it, expect, beforeAll } from 'bun:test';
import {
	getDateRange,
	isWeekday,
	syncApprovedLeaveToAttendance,
	syncAllApprovedLeaves
} from './sync-attendance';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { seedDatabase } from '$lib/server/db/seed';
import { eq, and } from 'drizzle-orm';

describe('Leave-to-Attendance Synchronization Engine', () => {
	beforeAll(async () => {
		await seedDatabase();
	});

	it('should calculate accurate date ranges between start and end dates', () => {
		const range = getDateRange('2026-08-20', '2026-08-24');
		expect(range).toEqual([
			'2026-08-20',
			'2026-08-21',
			'2026-08-22',
			'2026-08-23',
			'2026-08-24'
		]);
	});

	it('should accurately identify weekdays and exclude weekends', () => {
		// 2026-08-21 is Friday (true)
		expect(isWeekday('2026-08-21')).toBe(true);
		// 2026-08-22 is Saturday (false)
		expect(isWeekday('2026-08-22')).toBe(false);
		// 2026-08-23 is Sunday (false)
		expect(isWeekday('2026-08-23')).toBe(false);
		// 2026-08-24 is Monday (true)
		expect(isWeekday('2026-08-24')).toBe(true);
	});

	it('should sync an approved leave request to attendance records with status on_leave', async () => {
		// Find an approved leave request from seeded data
		const approvedLeave = (
			await db
				.select()
				.from(schema.leaveRequests)
				.where(eq(schema.leaveRequests.status, 'approved'))
		)[0];

		expect(approvedLeave).toBeDefined();

		const result = await syncApprovedLeaveToAttendance(approvedLeave.id);
		expect(result.leaveRequestId).toBe(approvedLeave.id);
		expect(result.employeeId).toBe(approvedLeave.employeeId);
		expect(result.syncedDays.length).toBeGreaterThan(0);

		// Verify that attendance records for synced weekdays have status 'on_leave'
		for (const dateStr of result.syncedDays) {
			const attRecord = (
				await db
					.select()
					.from(schema.attendance)
					.where(
						and(
							eq(schema.attendance.employeeId, approvedLeave.employeeId),
							eq(schema.attendance.date, dateStr)
						)
					)
			)[0];

			expect(attRecord).toBeDefined();
			expect(attRecord.status).toBe('on_leave');
			expect(attRecord.totalWorkMinutes).toBe(0);
		}
	});

	it('should batch sync all approved leave requests across the workforce', async () => {
		const batchResult = await syncAllApprovedLeaves();
		expect(batchResult.totalSyncedLeaves).toBeGreaterThan(0);
		expect(batchResult.totalDaysAffected).toBeGreaterThan(0);
	});
});
