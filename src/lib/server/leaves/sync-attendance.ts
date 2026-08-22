/**
 * Leave-to-Attendance Synchronization Engine
 * 
 * Automatically synchronizes approved employee leave requests with daily attendance records.
 * For each weekday within an approved leave duration:
 * - If an attendance record exists, marks its status as 'on_leave' with 0 work minutes.
 * - If no attendance record exists, creates a placeholder record with status 'on_leave'.
 */

import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Generates an array of 'YYYY-MM-DD' dates between start and end date inclusive.
 */
export function getDateRange(startDate: string, endDate: string): string[] {
	const dates: string[] = [];
	const start = new Date(startDate);
	const end = new Date(endDate);

	if (isNaN(start.getTime()) || isNaN(end.getTime())) {
		return [];
	}

	const current = new Date(start);
	while (current <= end) {
		dates.push(current.toISOString().split('T')[0]);
		current.setDate(current.getDate() + 1);
	}

	return dates;
}

/**
 * Returns true if a given 'YYYY-MM-DD' string is a business day (Monday to Friday).
 */
export function isWeekday(dateStr: string): boolean {
	const d = new Date(dateStr + 'T00:00:00Z');
	const day = d.getUTCDay();
	return day !== 0 && day !== 6;
}

export interface SyncLeaveResult {
	leaveRequestId: string;
	employeeId: string;
	syncedDays: string[];
	createdCount: number;
	updatedCount: number;
}

/**
 * Synchronizes a single approved leave request into the attendance table.
 */
export async function syncApprovedLeaveToAttendance(
	leaveRequestId: string
): Promise<SyncLeaveResult> {
	// 1. Fetch leave request
	const leaveReq = (
		await db
			.select()
			.from(schema.leaveRequests)
			.where(eq(schema.leaveRequests.id, leaveRequestId))
	)[0];

	if (!leaveReq) {
		throw new Error(`Leave request '${leaveRequestId}' not found.`);
	}

	if (leaveReq.status !== 'approved') {
		throw new Error(
			`Cannot sync leave request '${leaveRequestId}' because its status is '${leaveReq.status}'. Only 'approved' leaves can be synced.`
		);
	}

	const allDates = getDateRange(leaveReq.startDate, leaveReq.endDate);
	const weekdays = allDates.filter(isWeekday);

	let createdCount = 0;
	let updatedCount = 0;
	const syncedDays: string[] = [];
	const nowStr = new Date().toISOString();

	for (const dateStr of weekdays) {
		// Check if attendance record exists for this employee and date
		const existing = (
			await db
				.select()
				.from(schema.attendance)
				.where(
					and(
						eq(schema.attendance.employeeId, leaveReq.employeeId),
						eq(schema.attendance.date, dateStr)
					)
				)
		)[0];

		if (existing) {
			await db
				.update(schema.attendance)
				.set({
					status: 'on_leave',
					totalWorkMinutes: 0,
					totalBreakMinutes: 0,
					overtimeMinutes: 0,
					checkIn: null,
					checkOut: null,
					updatedAt: nowStr
				})
				.where(eq(schema.attendance.id, existing.id));
			updatedCount++;
		} else {
			await db.insert(schema.attendance).values({
				id: crypto.randomUUID(),
				employeeId: leaveReq.employeeId,
				date: dateStr,
				status: 'on_leave',
				checkIn: null,
				checkOut: null,
				totalWorkMinutes: 0,
				totalBreakMinutes: 0,
				overtimeMinutes: 0,
				createdAt: nowStr,
				updatedAt: nowStr
			});
			createdCount++;
		}

		syncedDays.push(dateStr);
	}

	return {
		leaveRequestId,
		employeeId: leaveReq.employeeId,
		syncedDays,
		createdCount,
		updatedCount
	};
}

/**
 * Batch syncs all approved leave requests across the system.
 */
export async function syncAllApprovedLeaves(): Promise<{
	totalSyncedLeaves: number;
	totalDaysAffected: number;
	results: SyncLeaveResult[];
}> {
	const approvedLeaves = await db
		.select()
		.from(schema.leaveRequests)
		.where(eq(schema.leaveRequests.status, 'approved'));

	const results: SyncLeaveResult[] = [];
	let totalDaysAffected = 0;

	for (const leave of approvedLeaves) {
		try {
			const res = await syncApprovedLeaveToAttendance(leave.id);
			results.push(res);
			totalDaysAffected += res.syncedDays.length;
		} catch (err) {
			console.error(`Failed to sync approved leave ${leave.id}:`, err);
		}
	}

	return {
		totalSyncedLeaves: results.length,
		totalDaysAffected,
		results
	};
}
