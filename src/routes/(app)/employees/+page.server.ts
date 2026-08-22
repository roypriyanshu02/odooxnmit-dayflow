import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { EmployeeWithRelations, AttendanceDisplayStatus } from '$lib/types/employee';

export const load: PageServerLoad = async ({ url }) => {
	try {
		const search = url.searchParams.get('query') || url.searchParams.get('search') || '';
		const department = url.searchParams.get('department') || 'all';
		const statusFilter = url.searchParams.get('status') || 'all';

		const rawEmployees = db.select().from(schema.employees).all();

		// Today's attendance
		const todayStr = new Date().toISOString().slice(0, 10);
		const attendanceRecords = db
			.select()
			.from(schema.attendance)
			.where(eq(schema.attendance.date, todayStr))
			.all();

		const attendanceMap = new Map<string, any>();
		for (const att of attendanceRecords) {
			attendanceMap.set(att.employeeId, att);
		}

		// Active leave requests spanning today
		const activeLeaves = db
			.select()
			.from(schema.leaveRequests)
			.where(
				and(
					eq(schema.leaveRequests.status, 'approved'),
					sql`${schema.leaveRequests.startDate} <= ${todayStr}`,
					sql`${schema.leaveRequests.endDate} >= ${todayStr}`
				)
			)
			.all();

		const leaveMap = new Map<string, any>();
		for (const leave of activeLeaves) {
			leaveMap.set(leave.employeeId, leave);
		}

		let mappedEmployees: EmployeeWithRelations[] = rawEmployees.map((raw: typeof schema.employees.$inferSelect) => {
			let skills: string[] = [];
			try {
				skills = Array.isArray(raw.skills)
					? (raw.skills as string[])
					: typeof raw.skills === 'string'
						? JSON.parse(raw.skills || '[]')
						: [];
			} catch {
				skills = [];
			}

			let certifications: any[] = [];
			try {
				certifications = Array.isArray(raw.certifications)
					? raw.certifications
					: typeof raw.certifications === 'string'
						? JSON.parse(raw.certifications || '[]')
						: [];
			} catch {
				certifications = [];
			}

			let workHistory: any[] = [];
			try {
				workHistory = Array.isArray(raw.workHistory)
					? raw.workHistory
					: typeof raw.workHistory === 'string'
						? JSON.parse(raw.workHistory || '[]')
						: [];
			} catch {
				workHistory = [];
			}

			const todayAtt = attendanceMap.get(raw.id);
			const todayLeave = leaveMap.get(raw.id);

			let presenceStatus: AttendanceDisplayStatus = 'absent';
			if (raw.status === 'on_leave' || todayLeave) {
				presenceStatus = 'on_leave';
			} else if (todayAtt && (todayAtt.status === 'present' || todayAtt.status === 'half_day' || todayAtt.checkIn)) {
				presenceStatus = 'present';
			} else if (raw.status === 'active') {
				presenceStatus = 'absent';
			} else {
				presenceStatus = 'absent';
			}

			return {
				id: raw.id,
				userId: raw.userId,
				firstName: raw.firstName,
				lastName: raw.lastName,
				email: raw.email,
				phone: raw.phone || '',
				jobTitle: raw.jobTitle,
				department: raw.department,
				managerId: raw.managerId,
				avatarUrl: raw.avatarUrl,
				status: raw.status as any,
				joinDate: raw.joinDate,
				about: {
					bio: raw.aboutBio || '',
					passions: raw.aboutPassions || '',
					hobbies: raw.aboutHobbies || ''
				},
				resume: {
					skills,
					certifications,
					workHistory
				},
				privateInfo: {
					panNumber: raw.panNumber || '',
					uanNumber: raw.uanNumber || '',
					dob: raw.dob || '',
					gender: raw.gender as any,
					maritalStatus: raw.maritalStatus as any,
					address: raw.address || '',
					bankAccountNumber: raw.bankAccountNumber || '',
					bankIfsc: raw.bankIfsc || '',
					bankName: raw.bankName || ''
				},
				monthlyWage: raw.monthlyWage || 0,
				attendanceToday: todayAtt || null,
				attendanceStatus: presenceStatus,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt
			};
		});

		const allDepartments = Array.from(new Set<string>(rawEmployees.map((e: typeof schema.employees.$inferSelect) => e.department))).sort();

		const stats = {
			total: rawEmployees.length,
			active: rawEmployees.filter((e: typeof schema.employees.$inferSelect) => e.status === 'active').length,
			present: mappedEmployees.filter((e: EmployeeWithRelations) => e.attendanceStatus === 'present').length,
			onLeave: rawEmployees.filter((e: typeof schema.employees.$inferSelect) => e.status === 'on_leave').length
		};

		return {
			initialEmployees: mappedEmployees,
			departments: allDepartments,
			stats
		};
	} catch (err) {
		console.error('Error in +page.server.ts load for employees:', err);
		return {
			initialEmployees: [],
			departments: [],
			stats: { total: 0, active: 0, present: 0, onLeave: 0 }
		};
	}
};
