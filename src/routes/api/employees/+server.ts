import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { EmployeeWithRelations, AttendanceDisplayStatus } from '$lib/types/employee';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const search = url.searchParams.get('query') || url.searchParams.get('search') || '';
		const department = url.searchParams.get('department') || 'all';
		const statusFilter = url.searchParams.get('status') || 'all';
		const sortBy = url.searchParams.get('sortBy') || 'name';
		const sortOrder = url.searchParams.get('sortOrder') || 'asc';

		// Get all employees from DB
		const rawEmployees = db.select().from(schema.employees).all();

		// Get today's attendance records to compute real presence
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

		// Also check recent approved leave requests that span today
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

		// Map to EmployeeWithRelations
		let mappedEmployees: EmployeeWithRelations[] = rawEmployees.map((raw) => {
			let skills: string[] = [];
			try {
				skills = Array.isArray(raw.skills)
					? raw.skills
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
				// Default active employee without checkin today is considered absent/remote
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

		// Apply Search Filtering (name, jobTitle, department, email, phone, skills)
		if (search && search.trim() !== '') {
			const query = search.toLowerCase().trim();
			mappedEmployees = mappedEmployees.filter((emp) => {
				const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
				const jobTitle = emp.jobTitle.toLowerCase();
				const dept = emp.department.toLowerCase();
				const email = emp.email.toLowerCase();
				const phone = emp.phone.toLowerCase();
				const skillsMatch = emp.resume.skills.some((s) => s.toLowerCase().includes(query));

				return (
					fullName.includes(query) ||
					jobTitle.includes(query) ||
					dept.includes(query) ||
					email.includes(query) ||
					phone.includes(query) ||
					skillsMatch
				);
			});
		}

		// Apply Department Filtering
		if (department && department !== 'all' && department !== 'All') {
			const deptLower = department.toLowerCase();
			mappedEmployees = mappedEmployees.filter(
				(emp) => emp.department.toLowerCase() === deptLower ||
				(department === 'HR' && emp.department.toLowerCase() === 'human resources') ||
				(department === 'Engineering' && emp.department.toLowerCase().includes('engineering'))
			);
		}

		// Apply Status Filtering
		if (statusFilter && statusFilter !== 'all' && statusFilter !== 'All') {
			const statusLower = statusFilter.toLowerCase();
			if (statusLower === 'present') {
				mappedEmployees = mappedEmployees.filter((emp) => emp.attendanceStatus === 'present');
			} else if (statusLower === 'on_leave' || statusLower === 'on leave') {
				mappedEmployees = mappedEmployees.filter((emp) => emp.attendanceStatus === 'on_leave' || emp.status === 'on_leave');
			} else if (statusLower === 'absent') {
				mappedEmployees = mappedEmployees.filter((emp) => emp.attendanceStatus === 'absent');
			} else if (statusLower === 'active') {
				mappedEmployees = mappedEmployees.filter((emp) => emp.status === 'active');
			} else if (statusLower === 'inactive') {
				mappedEmployees = mappedEmployees.filter((emp) => emp.status === 'inactive');
			}
		}

		// Apply Sorting
		mappedEmployees.sort((a, b) => {
			let compA: string | number = '';
			let compB: string | number = '';

			if (sortBy === 'department') {
				compA = a.department.toLowerCase();
				compB = b.department.toLowerCase();
			} else if (sortBy === 'jobTitle') {
				compA = a.jobTitle.toLowerCase();
				compB = b.jobTitle.toLowerCase();
			} else if (sortBy === 'joinDate') {
				compA = a.joinDate;
				compB = b.joinDate;
			} else if (sortBy === 'monthlyWage') {
				compA = a.monthlyWage;
				compB = b.monthlyWage;
			} else {
				// Default name
				compA = `${a.firstName} ${a.lastName}`.toLowerCase();
				compB = `${b.firstName} ${b.lastName}`.toLowerCase();
			}

			if (compA < compB) return sortOrder === 'desc' ? 1 : -1;
			if (compA > compB) return sortOrder === 'desc' ? -1 : 1;
			return 0;
		});

		// Collect unique department list for pills/dropdowns
		const allDepartments = Array.from(new Set(rawEmployees.map((e) => e.department))).sort();

		// Calculate statistics summary
		const stats = {
			total: rawEmployees.length,
			active: rawEmployees.filter((e) => e.status === 'active').length,
			present: mappedEmployees.filter((e) => e.attendanceStatus === 'present').length,
			onLeave: rawEmployees.filter((e) => e.status === 'on_leave').length,
			filteredCount: mappedEmployees.length
		};

		return json({
			success: true,
			employees: mappedEmployees,
			total: mappedEmployees.length,
			stats,
			departments: allDepartments
		});
	} catch (error: any) {
		console.error('Error fetching employees:', error);
		return json(
			{
				success: false,
				error: error?.message || 'Failed to fetch employee records',
				employees: [],
				total: 0
			},
			{ status: 500 }
		);
	}
};
