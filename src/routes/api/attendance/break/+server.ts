import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { calculateBreakDuration } from '$lib/utils/break';
import crypto from 'crypto';

/**
 * Ensures an attendance record exists for the given employee on the specified date (YYYY-MM-DD).
 * If none exists, creates a default one.
 */
export async function _getOrCreateAttendanceRecord(
	database: typeof db,
	employeeId: string,
	dateStr: string,
	checkInTime?: string
): Promise<typeof schema.attendance.$inferSelect> {
	const existing = await database
		.select()
		.from(schema.attendance)
		.where(
			and(
				eq(schema.attendance.employeeId, employeeId),
				eq(schema.attendance.date, dateStr)
			)
		)
		.limit(1);

	if (existing.length > 0) {
		return existing[0];
	}

	const now = new Date().toISOString();
	const newAttendanceId = crypto.randomUUID();
	const newRecord: typeof schema.attendance.$inferInsert = {
		id: newAttendanceId,
		employeeId,
		date: dateStr,
		checkIn: checkInTime || now,
		checkOut: null,
		totalWorkMinutes: 0,
		totalBreakMinutes: 0,
		overtimeMinutes: 0,
		status: 'present',
		createdAt: now,
		updatedAt: now
	};

	await database.insert(schema.attendance).values(newRecord);
	const [created] = await database
		.select()
		.from(schema.attendance)
		.where(eq(schema.attendance.id, newAttendanceId))
		.limit(1);

	return created;
}

/**
 * Recalculates and updates the totalBreakMinutes for an attendance record.
 */
export async function _recalculateTotalBreakMinutes(
	database: typeof db,
	attendanceId: string
): Promise<number> {
	const breaks = await database
		.select()
		.from(schema.attendanceBreaks)
		.where(eq(schema.attendanceBreaks.attendanceId, attendanceId));

	const totalMinutes = breaks.reduce((acc: number, b: { durationMinutes: number | null }) => acc + (b.durationMinutes || 0), 0);

	await database
		.update(schema.attendance)
		.set({
			totalBreakMinutes: totalMinutes,
			updatedAt: new Date().toISOString()
		})
		.where(eq(schema.attendance.id, attendanceId));

	return totalMinutes;
}

/**
 * Finds the currently active break for an employee.
 */
export async function _getActiveBreak(
	database: typeof db,
	employeeId: string
): Promise<typeof schema.attendanceBreaks.$inferSelect | null> {
	const activeBreaks = await database
		.select()
		.from(schema.attendanceBreaks)
		.where(
			and(
				eq(schema.attendanceBreaks.employeeId, employeeId),
				isNull(schema.attendanceBreaks.endTime)
			)
		)
		.orderBy(desc(schema.attendanceBreaks.startTime))
		.limit(1);

	return activeBreaks[0] || null;
}

/**
 * Starts a new break for the given employee.
 */
export async function _startBreak(
	database: typeof db,
	params: {
		employeeId: string;
		reason?: string;
		startTime?: string;
		date?: string;
	}
) {
	const { employeeId, reason = 'Break', startTime, date } = params;
	const startTimestamp = startTime || new Date().toISOString();
	const dateStr = date || startTimestamp.slice(0, 10);

	// Check if employee already has an active unended break
	const currentActive = await _getActiveBreak(database, employeeId);
	if (currentActive) {
		return {
			success: false,
			error: 'An active break is already in progress.',
			activeBreak: currentActive
		};
	}

	// Get or create today's attendance record
	const attendanceRecord = await _getOrCreateAttendanceRecord(
		database,
		employeeId,
		dateStr,
		startTimestamp
	);

	const breakId = crypto.randomUUID();
	const newBreak: typeof schema.attendanceBreaks.$inferInsert = {
		id: breakId,
		attendanceId: attendanceRecord.id,
		employeeId,
		startTime: startTimestamp,
		endTime: null,
		durationMinutes: 0,
		reason,
		createdAt: new Date().toISOString()
	};

	await database.insert(schema.attendanceBreaks).values(newBreak);

	const [created] = await database
		.select()
		.from(schema.attendanceBreaks)
		.where(eq(schema.attendanceBreaks.id, breakId))
		.limit(1);

	return {
		success: true,
		break: created,
		attendance: attendanceRecord
	};
}

/**
 * Ends an active break.
 */
export async function _endBreak(
	database: typeof db,
	params: {
		employeeId?: string;
		breakId?: string;
		endTime?: string;
	}
) {
	const { employeeId, breakId, endTime } = params;
	const endTimestamp = endTime || new Date().toISOString();

	let targetBreak: typeof schema.attendanceBreaks.$inferSelect | null = null;

	if (breakId) {
		const found = await database
			.select()
			.from(schema.attendanceBreaks)
			.where(eq(schema.attendanceBreaks.id, breakId))
			.limit(1);
		targetBreak = found[0] || null;
	} else if (employeeId) {
		targetBreak = await _getActiveBreak(database, employeeId);
	}

	if (!targetBreak) {
		return {
			success: false,
			error: 'No active break found to end.'
		};
	}

	if (targetBreak.endTime) {
		return {
			success: false,
			error: 'This break has already been ended.',
			break: targetBreak
		};
	}

	const durationMinutes = calculateBreakDuration(targetBreak.startTime, endTimestamp);

	await database
		.update(schema.attendanceBreaks)
		.set({
			endTime: endTimestamp,
			durationMinutes
		})
		.where(eq(schema.attendanceBreaks.id, targetBreak.id));

	// Recalculate attendance total breaks
	const updatedTotalBreakMinutes = await _recalculateTotalBreakMinutes(
		database,
		targetBreak.attendanceId
	);

	const [updatedBreak] = await database
		.select()
		.from(schema.attendanceBreaks)
		.where(eq(schema.attendanceBreaks.id, targetBreak.id))
		.limit(1);

	const [updatedAttendance] = await database
		.select()
		.from(schema.attendance)
		.where(eq(schema.attendance.id, targetBreak.attendanceId))
		.limit(1);

	return {
		success: true,
		break: updatedBreak,
		durationMinutes,
		totalBreakMinutes: updatedTotalBreakMinutes,
		attendance: updatedAttendance
	};
}

/**
 * Records a completed break interval directly.
 */
export async function _recordBreakInterval(
	database: typeof db,
	params: {
		employeeId: string;
		startTime: string;
		endTime: string;
		reason?: string;
		durationMinutes?: number;
		date?: string;
	}
) {
	const { employeeId, startTime, endTime, reason = 'Break', date } = params;
	const dateStr = date || startTime.slice(0, 10);
	const duration =
		params.durationMinutes !== undefined
			? params.durationMinutes
			: calculateBreakDuration(startTime, endTime);

	const attendanceRecord = await _getOrCreateAttendanceRecord(
		database,
		employeeId,
		dateStr,
		startTime
	);

	const breakId = crypto.randomUUID();
	const breakRecord: typeof schema.attendanceBreaks.$inferInsert = {
		id: breakId,
		attendanceId: attendanceRecord.id,
		employeeId,
		startTime,
		endTime,
		durationMinutes: duration,
		reason,
		createdAt: new Date().toISOString()
	};

	await database.insert(schema.attendanceBreaks).values(breakRecord);

	const totalBreakMinutes = await _recalculateTotalBreakMinutes(
		database,
		attendanceRecord.id
	);

	const [created] = await database
		.select()
		.from(schema.attendanceBreaks)
		.where(eq(schema.attendanceBreaks.id, breakId))
		.limit(1);

	const [updatedAttendance] = await database
		.select()
		.from(schema.attendance)
		.where(eq(schema.attendance.id, attendanceRecord.id))
		.limit(1);

	return {
		success: true,
		break: created,
		durationMinutes: duration,
		totalBreakMinutes,
		attendance: updatedAttendance
	};
}

// GET /api/attendance/break?employeeId=...
export const GET: RequestHandler = async ({ url }) => {
	try {
		const employeeId = url.searchParams.get('employeeId');
		if (!employeeId) {
			return json({ success: false, error: 'employeeId query parameter is required.' }, { status: 400 });
		}

		const dateStr = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);

		const activeBreak = await _getActiveBreak(db, employeeId);

		const [attendanceRecord] = await db
			.select()
			.from(schema.attendance)
			.where(
				and(
					eq(schema.attendance.employeeId, employeeId),
					eq(schema.attendance.date, dateStr)
				)
			)
			.limit(1);

		let breaksList: (typeof schema.attendanceBreaks.$inferSelect)[] = [];
		if (attendanceRecord) {
			breaksList = await db
				.select()
				.from(schema.attendanceBreaks)
				.where(eq(schema.attendanceBreaks.attendanceId, attendanceRecord.id))
				.orderBy(desc(schema.attendanceBreaks.startTime));
		}

		return json({
			success: true,
			employeeId,
			date: dateStr,
			activeBreak,
			breaks: breaksList,
			totalBreakMinutes: attendanceRecord?.totalBreakMinutes || 0
		});
	} catch (err) {
		console.error('Error fetching break data:', err);
		return json({ success: false, error: 'Failed to fetch break details.' }, { status: 500 });
	}
};

// POST /api/attendance/break
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const action = body.action || (body.endTime ? 'end' : 'start');

		if (!body.employeeId && !body.breakId) {
			return json(
				{ success: false, error: 'employeeId or breakId is required.' },
				{ status: 400 }
			);
		}

		if (action === 'start') {
			if (!body.employeeId) {
				return json(
					{ success: false, error: 'employeeId is required to start a break.' },
					{ status: 400 }
				);
			}

			const result = await _startBreak(db, {
				employeeId: body.employeeId,
				reason: body.reason,
				startTime: body.startTime,
				date: body.date
			});

			if (!result.success) {
				return json(result, { status: 409 });
			}

			return json(result, { status: 201 });
		}

		if (action === 'end') {
			const result = await _endBreak(db, {
				employeeId: body.employeeId,
				breakId: body.breakId,
				endTime: body.endTime
			});

			if (!result.success) {
				return json(result, { status: 404 });
			}

			return json(result, { status: 200 });
		}

		if (action === 'record' || action === 'interval') {
			if (!body.employeeId || !body.startTime || !body.endTime) {
				return json(
					{
						success: false,
						error: 'employeeId, startTime, and endTime are required for recording an interval.'
					},
					{ status: 400 }
				);
			}

			const result = await _recordBreakInterval(db, {
				employeeId: body.employeeId,
				startTime: body.startTime,
				endTime: body.endTime,
				reason: body.reason,
				durationMinutes: body.durationMinutes,
				date: body.date
			});

			return json(result, { status: 201 });
		}

		return json(
			{
				success: false,
				error: `Invalid action "${action}". Valid actions: start, end, record, interval.`
			},
			{ status: 400 }
		);
	} catch (err) {
		console.error('Error handling break API request:', err);
		return json(
			{ success: false, error: 'Internal server error while processing break.' },
			{ status: 500 }
		);
	}
};
