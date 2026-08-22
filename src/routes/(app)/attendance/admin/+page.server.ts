import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { AttendanceWithEmployee } from '$lib/types/attendance';

export const load: PageServerLoad = async () => {
	try {
		// 1. Fetch attendance records joined with employee info
		const attendanceRecords = await db
			.select({
				id: schema.attendance.id,
				employeeId: schema.attendance.employeeId,
				date: schema.attendance.date,
				checkIn: schema.attendance.checkIn,
				checkOut: schema.attendance.checkOut,
				workMinutes: schema.attendance.totalWorkMinutes,
				breakMinutes: schema.attendance.totalBreakMinutes,
				overtimeMinutes: schema.attendance.overtimeMinutes,
				status: schema.attendance.status,
				createdAt: schema.attendance.createdAt,
				updatedAt: schema.attendance.updatedAt,
				employeeFirstName: schema.employees.firstName,
				employeeLastName: schema.employees.lastName,
				employeeJobTitle: schema.employees.jobTitle,
				employeeDepartment: schema.employees.department,
				employeeAvatarUrl: schema.employees.avatarUrl
			})
			.from(schema.attendance)
			.leftJoin(schema.employees, eq(schema.attendance.employeeId, schema.employees.id))
			.orderBy(desc(schema.attendance.date), desc(schema.attendance.checkIn));

		// 2. Fetch all break records to enrich break history modal
		const allBreaks = await db
			.select()
			.from(schema.attendanceBreaks)
			.orderBy(desc(schema.attendanceBreaks.startTime));

		const breaksByAttendanceId = new Map<string, typeof allBreaks>();
		for (const br of allBreaks) {
			const existing = breaksByAttendanceId.get(br.attendanceId) || [];
			existing.push(br);
			breaksByAttendanceId.set(br.attendanceId, existing);
		}

		// 3. Format records as AttendanceWithEmployee
		const formattedRecords: AttendanceWithEmployee[] = attendanceRecords.map((r: any) => {
			const breaks = breaksByAttendanceId.get(r.id) || [];
			return {
				id: r.id,
				employeeId: r.employeeId,
				date: r.date,
				checkIn: r.checkIn,
				checkOut: r.checkOut,
				workMinutes: r.workMinutes || 0,
				breakMinutes: r.breakMinutes || 0,
				overtimeMinutes: r.overtimeMinutes || 0,
				status: (r.status || 'present') as any,
				createdAt: r.createdAt,
				updatedAt: r.updatedAt,
				breaks: breaks.map((b: any) => ({
					id: b.id,
					attendanceId: b.attendanceId,
					startTime: b.startTime,
					endTime: b.endTime,
					durationMinutes: b.durationMinutes || 0,
					reason: b.reason || 'Rest Break',
					createdAt: b.createdAt
				})),
				employee: r.employeeFirstName
					? {
							id: r.employeeId,
							firstName: r.employeeFirstName,
							lastName: r.employeeLastName,
							email: '',
							jobTitle: r.employeeJobTitle || 'Staff Member',
							department: r.employeeDepartment || 'General',
							avatarUrl: r.employeeAvatarUrl
						}
					: undefined
			};
		});

		// 4. Extract unique departments
		const rawDepartments = attendanceRecords
			.map((r: any) => r.employeeDepartment)
			.filter((d: any): d is string => Boolean(d));
		const departments: string[] = Array.from(new Set<string>(rawDepartments)).sort();

		// 5. Calculate KPI metrics
		const todayStr = '2026-08-22';
		const todayRecords = formattedRecords.filter((r: AttendanceWithEmployee) => r.date === todayStr);

		const presentCount = todayRecords.filter(
			(r: AttendanceWithEmployee) => r.status === 'present' || r.status === 'half_day'
		).length;
		const onBreakCount = todayRecords.filter((r: AttendanceWithEmployee) =>
			r.breaks?.some((b) => !b.endTime)
		).length;
		const totalOvertimeMinutes = formattedRecords.reduce(
			(acc: number, r: AttendanceWithEmployee) => acc + (r.overtimeMinutes || 0),
			0
		);

		return {
			records: formattedRecords,
			departments,
			kpi: {
				totalRecords: formattedRecords.length,
				presentToday: presentCount,
				onBreakToday: onBreakCount,
				totalOvertimeHours: Number((totalOvertimeMinutes / 60).toFixed(1))
			}
		};
	} catch (error) {
		console.error('Failed to load attendance admin records:', error);
		return {
			records: [],
			departments: ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'HR'],
			kpi: {
				totalRecords: 0,
				presentToday: 0,
				onBreakToday: 0,
				totalOvertimeHours: 0
			}
		};
	}
};
