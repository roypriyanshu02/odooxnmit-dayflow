import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const employeeId = params.id;

	if (!employeeId) {
		throw error(400, 'Employee ID parameter is required');
	}

	// 1. Fetch the primary employee record by employee ID (or userId fallback)
	const employeeList = await db
		.select()
		.from(schema.employees)
		.where(or(eq(schema.employees.id, employeeId), eq(schema.employees.userId, employeeId)))
		.limit(1);

	const employee = employeeList[0];

	if (!employee) {
		throw error(404, `Employee with ID '${employeeId}' was not found in the directory.`);
	}

	// 2. Fetch manager info if managerId is present
	let manager = null;
	if (employee.managerId) {
		const managerList = await db
			.select({
				id: schema.employees.id,
				firstName: schema.employees.firstName,
				lastName: schema.employees.lastName,
				jobTitle: schema.employees.jobTitle,
				department: schema.employees.department,
				email: schema.employees.email,
				phone: schema.employees.phone,
				avatarUrl: schema.employees.avatarUrl
			})
			.from(schema.employees)
			.where(eq(schema.employees.id, employee.managerId))
			.limit(1);

		if (managerList.length > 0) {
			manager = managerList[0];
		}
	}

	// 3. Fetch direct reports (subordinates)
	const subordinates = await db
		.select({
			id: schema.employees.id,
			firstName: schema.employees.firstName,
			lastName: schema.employees.lastName,
			jobTitle: schema.employees.jobTitle,
			department: schema.employees.department,
			avatarUrl: schema.employees.avatarUrl
		})
		.from(schema.employees)
		.where(eq(schema.employees.managerId, employee.id));

	// 4. Fetch today's attendance record (using 2026-08-22 or current date)
	const todayStr = '2026-08-22';
	const todayAttendance = await db
		.select()
		.from(schema.attendance)
		.where(eq(schema.attendance.employeeId, employee.id))
		.limit(5);

	const todayRecord = todayAttendance.find((a: typeof schema.attendance.$inferSelect) => a.date === todayStr);

	let presenceStatus: 'present' | 'on_leave' | 'absent' = 'absent';
	if (employee.status === 'on_leave' || todayRecord?.status === 'on_leave') {
		presenceStatus = 'on_leave';
	} else if (todayRecord?.checkIn || todayRecord?.status === 'present' || employee.status === 'active') {
		presenceStatus = 'present';
	}

	return {
		employee,
		manager,
		subordinates,
		presenceStatus
	};
};
