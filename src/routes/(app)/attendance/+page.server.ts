import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { AttendanceRecord } from '$lib/types/attendance';

export const load: PageServerLoad = async () => {
	try {
		// 1. Fetch current logged-in employee attendance records (default to first active employee if demo)
		const employees = await db.select().from(schema.employees).limit(1);
		const defaultEmployee = employees[0];
		const employeeId = defaultEmployee ? defaultEmployee.id : 'OIPRRO20260001';

		const records = await db
			.select()
			.from(schema.attendance)
			.where(eq(schema.attendance.employeeId, employeeId))
			.orderBy(desc(schema.attendance.date));

		// 2. Fetch breaks for today
		const todayStr = '2026-08-22';
		const todayAttendance = records.find((r) => r.date === todayStr);

		let todayBreaks: any[] = [];
		if (todayAttendance) {
			todayBreaks = await db
				.select()
				.from(schema.attendanceBreaks)
				.where(eq(schema.attendanceBreaks.attendanceId, todayAttendance.id))
				.orderBy(desc(schema.attendanceBreaks.startTime));
		}

		return {
			employeeId,
			employeeName: defaultEmployee ? `${defaultEmployee.firstName} ${defaultEmployee.lastName}` : 'Priyanshu Roy',
			records: records as AttendanceRecord[],
			todayRecord: todayAttendance as AttendanceRecord | undefined,
			todayBreaks
		};
	} catch (err) {
		console.error('Failed to load attendance page data:', err);
		return {
			employeeId: 'OIPRRO20260001',
			employeeName: 'Priyanshu Roy',
			records: [],
			todayRecord: undefined,
			todayBreaks: []
		};
	}
};
