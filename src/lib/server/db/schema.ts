import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import type { Certification, WorkHistory } from '$lib/types';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	name: text('name').notNull(),
	role: text('role', { enum: ['admin', 'hr', 'employee'] }).notNull().default('employee'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

export const employees = sqliteTable('employees', {
	id: text('id').primaryKey(), // e.g. OIJODO20250001
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	email: text('email').notNull().unique(),
	phone: text('phone').notNull().default(''),
	jobTitle: text('job_title').notNull(),
	department: text('department').notNull(),
	managerId: text('manager_id'),
	avatarUrl: text('avatar_url'),
	status: text('status', { enum: ['active', 'on_leave', 'inactive'] }).notNull().default('active'),
	joinDate: text('join_date').notNull(),
	aboutBio: text('about_bio').notNull().default(''),
	aboutPassions: text('about_passions').notNull().default(''),
	aboutHobbies: text('about_hobbies').notNull().default(''),
	skills: text('skills', { mode: 'json' }).$type<string[]>().notNull().default([]),
	certifications: text('certifications', { mode: 'json' }).$type<Certification[]>().notNull().default([]),
	workHistory: text('work_history', { mode: 'json' }).$type<WorkHistory[]>().notNull().default([]),
	panNumber: text('pan_number').notNull().default(''),
	uanNumber: text('uan_number').notNull().default(''),
	dob: text('dob').notNull().default(''),
	gender: text('gender', { enum: ['male', 'female', 'other', 'prefer_not_to_say'] }).notNull().default('prefer_not_to_say'),
	maritalStatus: text('marital_status', { enum: ['single', 'married', 'other'] }).notNull().default('single'),
	address: text('address').notNull().default(''),
	bankAccountNumber: text('bank_account_number').notNull().default(''),
	bankIfsc: text('bank_ifsc').notNull().default(''),
	bankName: text('bank_name').notNull().default(''),
	monthlyWage: real('monthly_wage').notNull().default(0),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

export const attendance = sqliteTable('attendance', {
	id: text('id').primaryKey(),
	employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
	date: text('date').notNull(), // YYYY-MM-DD
	checkIn: text('check_in'),
	checkOut: text('check_out'),
	totalWorkMinutes: integer('total_work_minutes').notNull().default(0),
	totalBreakMinutes: integer('total_break_minutes').notNull().default(0),
	overtimeMinutes: integer('overtime_minutes').notNull().default(0),
	status: text('status', { enum: ['present', 'absent', 'half_day', 'on_leave'] }).notNull().default('present'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

export const attendanceBreaks = sqliteTable('attendance_breaks', {
	id: text('id').primaryKey(),
	attendanceId: text('attendance_id').notNull().references(() => attendance.id, { onDelete: 'cascade' }),
	employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
	startTime: text('start_time').notNull(),
	endTime: text('end_time'),
	durationMinutes: integer('duration_minutes').notNull().default(0),
	reason: text('reason'),
	createdAt: text('created_at').notNull()
});

export const leaveBalances = sqliteTable('leave_balances', {
	id: text('id').primaryKey(),
	employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
	year: integer('year').notNull(),
	paidTimeOffTotal: real('paid_time_off_total').notNull().default(24),
	paidTimeOffUsed: real('paid_time_off_used').notNull().default(0),
	sickLeaveTotal: real('sick_leave_total').notNull().default(7),
	sickLeaveUsed: real('sick_leave_used').notNull().default(0),
	unpaidLeaveUsed: real('unpaid_leave_used').notNull().default(0),
	updatedAt: text('updated_at').notNull()
});

export const leaveRequests = sqliteTable('leave_requests', {
	id: text('id').primaryKey(),
	employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
	leaveType: text('leave_type', { enum: ['paid_time_off', 'sick_leave', 'unpaid_leave'] }).notNull(),
	startDate: text('start_date').notNull(), // YYYY-MM-DD
	endDate: text('end_date').notNull(), // YYYY-MM-DD
	totalDays: real('total_days').notNull(),
	reason: text('reason').notNull(),
	status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
	approvedBy: text('approved_by').references(() => users.id),
	rejectionReason: text('rejection_reason'),
	attachmentUrl: text('attachment_url'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

export const payslips = sqliteTable('payslips', {
	id: text('id').primaryKey(),
	employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
	month: integer('month').notNull(),
	year: integer('year').notNull(),
	monthlyWage: real('monthly_wage').notNull(),
	basicSalary: real('basic_salary').notNull(),
	hra: real('hra').notNull(),
	standardAllowance: real('standard_allowance').notNull(),
	performanceBonus: real('performance_bonus').notNull(),
	lta: real('lta').notNull(),
	fixedAllowance: real('fixed_allowance').notNull(),
	grossSalary: real('gross_salary').notNull(),
	employeePf: real('employee_pf').notNull(),
	employerPf: real('employer_pf').notNull(),
	professionalTax: real('professional_tax').notNull(),
	totalDeductions: real('total_deductions').notNull(),
	netSalary: real('net_salary').notNull(),
	payableDays: real('payable_days').notNull(),
	totalWorkingDays: real('total_working_days').notNull(),
	status: text('status', { enum: ['draft', 'processed', 'paid'] }).notNull().default('draft'),
	paymentDate: text('payment_date'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

export const chatter = sqliteTable('chatter', {
	id: text('id').primaryKey(),
	entityType: text('entity_type', { enum: ['employee', 'leave', 'payroll'] }).notNull(),
	entityId: text('entity_id').notNull(),
	authorId: text('author_id').notNull().references(() => users.id),
	authorName: text('author_name').notNull(),
	authorAvatar: text('author_avatar'),
	message: text('message').notNull(),
	type: text('type', { enum: ['note', 'status_change', 'field_update'] }).notNull().default('note'),
	metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
	createdAt: text('created_at').notNull()
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
	employee: one(employees, {
		fields: [users.id],
		references: [employees.userId]
	}),
	approvedLeaves: many(leaveRequests),
	chatterEntries: many(chatter)
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
	user: one(users, {
		fields: [employees.userId],
		references: [users.id]
	}),
	manager: one(employees, {
		fields: [employees.managerId],
		references: [employees.id],
		relationName: 'managerRelation'
	}),
	subordinates: many(employees, {
		relationName: 'managerRelation'
	}),
	attendances: many(attendance),
	attendanceBreaks: many(attendanceBreaks),
	leaveBalances: many(leaveBalances),
	leaveRequests: many(leaveRequests),
	payslips: many(payslips)
}));

export const attendanceRelations = relations(attendance, ({ one, many }) => ({
	employee: one(employees, {
		fields: [attendance.employeeId],
		references: [employees.id]
	}),
	breaks: many(attendanceBreaks)
}));

export const attendanceBreaksRelations = relations(attendanceBreaks, ({ one }) => ({
	attendance: one(attendance, {
		fields: [attendanceBreaks.attendanceId],
		references: [attendance.id]
	}),
	employee: one(employees, {
		fields: [attendanceBreaks.employeeId],
		references: [employees.id]
	})
}));

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
	employee: one(employees, {
		fields: [leaveBalances.employeeId],
		references: [employees.id]
	})
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
	employee: one(employees, {
		fields: [leaveRequests.employeeId],
		references: [employees.id]
	}),
	approver: one(users, {
		fields: [leaveRequests.approvedBy],
		references: [users.id]
	})
}));

export const payslipsRelations = relations(payslips, ({ one }) => ({
	employee: one(employees, {
		fields: [payslips.employeeId],
		references: [employees.id]
	})
}));

export const chatterRelations = relations(chatter, ({ one }) => ({
	author: one(users, {
		fields: [chatter.authorId],
		references: [users.id]
	})
}));
