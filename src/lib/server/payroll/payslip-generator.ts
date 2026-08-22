/**
 * Payslip Generator & Attendance-Based Payroll Calculation Engine
 * 
 * Responsibilities:
 * - Reads employee profile wage, attendance records, and leave requests for a given month/year.
 * - Computes total working days in month (calendar days or standard business days).
 * - Computes present days, paid leave days, unpaid leave days (Loss of Pay / LOP), and unexcused absences.
 * - Computes Payable Days = Total Working Days - LOP Days - Unexcused Absent Days.
 * - Computes pro-rated wage = (monthlyWage * payableDays) / totalWorkingDays.
 * - Applies standard statutory formula engine (Basic, HRA, Standard, Bonus, LTA, Fixed, PF, PT, Net).
 * - Generates and optionally persists payslips in SQLite DB with Drizzle ORM.
 */

import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import crypto from 'crypto';
import type { AttendanceRecord, LeaveRequest, SalaryBreakdown } from '$lib/types';
import { calculateSalaryBreakdown, type SalaryBreakdownOptions } from './calculator';

export type WorkingDaysMode = 'business_days' | 'calendar_days';

export interface AttendanceSummary {
	totalWorkingDays: number;
	presentDays: number;
	paidLeaveDays: number;
	lopDays: number;
	unexcusedAbsentDays: number;
	payableDays: number;
}

export interface PayslipCalculationResult extends SalaryBreakdown {
	id?: string;
	employeeId?: string;
	month: number;
	year: number;
	baseMonthlyWage: number;
	proRatedWage: number;
	payableDays: number;
	totalWorkingDays: number;
	presentDays: number;
	paidLeaveDays: number;
	lopDays: number;
	unexcusedAbsentDays: number;
	status?: 'draft' | 'processed' | 'paid';
	paymentDate?: string | null;
}

export interface GeneratePayslipOptions {
	mode?: WorkingDaysMode;
	save?: boolean;
	status?: 'draft' | 'processed' | 'paid';
	paymentDate?: string | null;
	options?: SalaryBreakdownOptions;
}

/**
 * Returns all calendar dates ('YYYY-MM-DD') for a given month and year.
 * @param year e.g. 2026
 * @param month 1-indexed month (1 = Jan, 12 = Dec)
 */
export function getDaysInMonth(year: number, month: number): string[] {
	const daysInMonth = new Date(year, month, 0).getDate();
	const dates: string[] = [];
	const yStr = year.toString().padStart(4, '0');
	const mStr = month.toString().padStart(2, '0');
	for (let d = 1; d <= daysInMonth; d++) {
		const dStr = d.toString().padStart(2, '0');
		dates.push(`${yStr}-${mStr}-${dStr}`);
	}
	return dates;
}

/**
 * Returns whether a date string ('YYYY-MM-DD') is a weekend (Saturday or Sunday).
 */
export function isWeekend(dateStr: string): boolean {
	const [y, m, d] = dateStr.split('-').map(Number);
	const dayOfWeek = new Date(y, m - 1, d).getDay(); // 0 = Sun, 6 = Sat
	return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Calculates total working days in a given month and year.
 *
 * @param year e.g. 2026
 * @param month 1-indexed month (1..12)
 * @param mode 'business_days' (Mon-Fri, default) or 'calendar_days'
 */
export function getWorkingDaysInMonth(
	year: number,
	month: number,
	mode: WorkingDaysMode = 'business_days'
): number {
	const dates = getDaysInMonth(year, month);
	if (mode === 'calendar_days') {
		return dates.length;
	}
	// Business days: Mon through Fri
	return dates.filter((d) => !isWeekend(d)).length;
}

/**
 * Calculates attendance metrics (present, paid leave, unpaid LOP, unexcused absent, payable days)
 * for an employee in a given month and year.
 */
export function calculateAttendanceSummary(params: {
	year: number;
	month: number;
	attendanceRecords?: AttendanceRecord[] | Array<{ date: string; status: string }>;
	leaveRequests?: LeaveRequest[] | Array<{ startDate: string; endDate: string; leaveType: string; status: string }>;
	mode?: WorkingDaysMode;
	allDaysAbsentByDefault?: boolean;
}): AttendanceSummary {
	const {
		year,
		month,
		attendanceRecords = [],
		leaveRequests = [],
		mode = 'business_days',
		allDaysAbsentByDefault = true
	} = params;

	const allMonthDates = getDaysInMonth(year, month);
	const eligibleDates = mode === 'business_days'
		? allMonthDates.filter((d) => !isWeekend(d))
		: allMonthDates;

	const totalWorkingDays = eligibleDates.length;

	if (totalWorkingDays === 0) {
		return {
			totalWorkingDays: 0,
			presentDays: 0,
			paidLeaveDays: 0,
			lopDays: 0,
			unexcusedAbsentDays: 0,
			payableDays: 0
		};
	}

	// Filter approved leave requests
	const approvedLeaves = leaveRequests.filter((lr) => lr.status === 'approved');

	// Create lookup map for attendance records by date
	const attendanceMap = new Map<string, string>();
	for (const att of attendanceRecords) {
		if (att.date) {
			attendanceMap.set(att.date, att.status);
		}
	}

	let presentDays = 0;
	let paidLeaveDays = 0;
	let lopDays = 0;
	let unexcusedAbsentDays = 0;

	for (const date of eligibleDates) {
		// 1. Check if date falls in approved leave window
		const matchingLeave = approvedLeaves.find(
			(lr) => date >= lr.startDate && date <= lr.endDate
		);

		if (matchingLeave) {
			if (matchingLeave.leaveType === 'unpaid_leave') {
				lopDays += 1;
			} else {
				// paid_time_off or sick_leave
				paidLeaveDays += 1;
			}
			continue;
		}

		// 2. Check attendance record for this date
		const attStatus = attendanceMap.get(date);

		if (attStatus === 'present') {
			presentDays += 1;
		} else if (attStatus === 'half_day') {
			presentDays += 0.5;
			unexcusedAbsentDays += 0.5;
		} else if (attStatus === 'on_leave') {
			// Marked as on_leave in attendance without formal leave request -> treat as excusable paid leave
			paidLeaveDays += 1;
		} else if (attStatus === 'absent') {
			unexcusedAbsentDays += 1;
		} else {
			// No attendance record found for this working date
			if (allDaysAbsentByDefault) {
				unexcusedAbsentDays += 1;
			}
		}
	}

	// Payable Days = Total Working Days - LOP Days - Unexcused Absent Days
	const computedPayable = totalWorkingDays - lopDays - unexcusedAbsentDays;
	const payableDays = Math.max(0, Math.min(totalWorkingDays, Number(computedPayable.toFixed(2))));

	return {
		totalWorkingDays,
		presentDays: Number(presentDays.toFixed(2)),
		paidLeaveDays: Number(paidLeaveDays.toFixed(2)),
		lopDays: Number(lopDays.toFixed(2)),
		unexcusedAbsentDays: Number(unexcusedAbsentDays.toFixed(2)),
		payableDays
	};
}

/**
 * Computes pro-rated wage and statutory salary component breakdown for given wage and attendance parameters.
 */
export function computePayslipBreakdown(params: {
	monthlyWage: number;
	totalWorkingDays: number;
	payableDays: number;
	month: number;
	year: number;
	employeeId?: string;
	attendanceSummary?: Partial<AttendanceSummary>;
	options?: SalaryBreakdownOptions;
}): PayslipCalculationResult {
	const {
		monthlyWage,
		totalWorkingDays,
		payableDays,
		month,
		year,
		employeeId,
		attendanceSummary,
		options = { round: true }
	} = params;

	const baseWage = Math.max(0, isNaN(monthlyWage) ? 0 : monthlyWage);
	const safeTotalDays = Math.max(0, totalWorkingDays);
	const safePayableDays = Math.max(0, Math.min(safeTotalDays, payableDays));

	// Compute pro-rated wage: (monthlyWage * payableDays) / totalWorkingDays
	const proRatedWage = safeTotalDays > 0 && safePayableDays > 0 && baseWage > 0
		? (baseWage * safePayableDays) / safeTotalDays
		: 0;

	// Apply statutory formula engine on pro-rated wage
	const breakdown = calculateSalaryBreakdown(proRatedWage, options);

	return {
		employeeId,
		month,
		year,
		baseMonthlyWage: baseWage,
		proRatedWage: options.round !== false ? Math.round(proRatedWage) : Number(proRatedWage.toFixed(2)),
		monthlyWage: baseWage,
		basicSalary: breakdown.basicSalary,
		hra: breakdown.hra,
		standardAllowance: breakdown.standardAllowance,
		performanceBonus: breakdown.performanceBonus,
		lta: breakdown.lta,
		fixedAllowance: breakdown.fixedAllowance,
		grossSalary: breakdown.grossSalary,
		employeePf: breakdown.employeePf,
		employerPf: breakdown.employerPf,
		professionalTax: breakdown.professionalTax,
		totalDeductions: breakdown.totalDeductions,
		netSalary: breakdown.netSalary,
		payableDays: safePayableDays,
		totalWorkingDays: safeTotalDays,
		presentDays: attendanceSummary?.presentDays ?? safePayableDays,
		paidLeaveDays: attendanceSummary?.paidLeaveDays ?? 0,
		lopDays: attendanceSummary?.lopDays ?? 0,
		unexcusedAbsentDays: attendanceSummary?.unexcusedAbsentDays ?? (safeTotalDays - safePayableDays),
		status: 'draft',
		paymentDate: null
	};
}

/**
 * Generates an end-to-end payslip for an employee by reading profile, attendance and leaves from SQLite DB.
 *
 * @param employeeId Unique employee ID (e.g., "OIPRRO20260001")
 * @param month 1-indexed month (1..12)
 * @param year Year (e.g. 2026)
 * @param options Mode, persistence, and status configuration
 * @returns PayslipCalculationResult
 */
export async function generatePayslip(
	employeeId: string,
	month: number,
	year: number,
	options: GeneratePayslipOptions = {}
): Promise<PayslipCalculationResult> {
	if (!employeeId || typeof employeeId !== 'string') {
		throw new Error('Valid employeeId is required for payslip generation.');
	}
	if (!month || month < 1 || month > 12) {
		throw new Error(`Invalid month: ${month}. Must be between 1 and 12.`);
	}
	if (!year || year < 2000 || year > 2100) {
		throw new Error(`Invalid year: ${year}.`);
	}

	const { mode = 'business_days', save = false, status = 'draft', paymentDate = null } = options;

	// 1. Fetch Employee Profile
	const employeeRecords = await db
		.select()
		.from(schema.employees)
		.where(eq(schema.employees.id, employeeId));

	const employee = employeeRecords[0];
	if (!employee) {
		throw new Error(`Employee with ID "${employeeId}" not found.`);
	}

	// 2. Fetch Attendance Records for this month
	const daysInMonth = getDaysInMonth(year, month);
	const startOfMonth = daysInMonth[0];
	const endOfMonth = daysInMonth[daysInMonth.length - 1];

	const attendanceList = await db
		.select()
		.from(schema.attendance)
		.where(
			and(
				eq(schema.attendance.employeeId, employeeId),
				gte(schema.attendance.date, startOfMonth),
				lte(schema.attendance.date, endOfMonth)
			)
		);

	// 3. Fetch Approved Leave Requests for this employee
	const leaveList = await db
		.select()
		.from(schema.leaveRequests)
		.where(
			and(
				eq(schema.leaveRequests.employeeId, employeeId),
				eq(schema.leaveRequests.status, 'approved')
			)
		);

	// 4. Calculate Attendance Metrics & Payable Days
	const attendanceSummary = calculateAttendanceSummary({
		year,
		month,
		attendanceRecords: attendanceList,
		leaveRequests: leaveList,
		mode
	});

	// 5. Compute Payslip Breakdown
	const calculation = computePayslipBreakdown({
		monthlyWage: employee.monthlyWage,
		totalWorkingDays: attendanceSummary.totalWorkingDays,
		payableDays: attendanceSummary.payableDays,
		month,
		year,
		employeeId,
		attendanceSummary,
		options: options.options
	});

	calculation.status = status;
	calculation.paymentDate = paymentDate;

	// 6. Optionally persist / upsert payslip into DB
	if (save) {
		const existingPayslips = await db
			.select()
			.from(schema.payslips)
			.where(
				and(
					eq(schema.payslips.employeeId, employeeId),
					eq(schema.payslips.month, month),
					eq(schema.payslips.year, year)
				)
			);

		const now = new Date().toISOString();
		const payslipId = existingPayslips[0]?.id || crypto.randomUUID();

		if (existingPayslips.length > 0) {
			await db
				.update(schema.payslips)
				.set({
					monthlyWage: calculation.monthlyWage,
					basicSalary: calculation.basicSalary,
					hra: calculation.hra,
					standardAllowance: calculation.standardAllowance,
					performanceBonus: calculation.performanceBonus,
					lta: calculation.lta,
					fixedAllowance: calculation.fixedAllowance,
					grossSalary: calculation.grossSalary,
					employeePf: calculation.employeePf,
					employerPf: calculation.employerPf,
					professionalTax: calculation.professionalTax,
					totalDeductions: calculation.totalDeductions,
					netSalary: calculation.netSalary,
					payableDays: calculation.payableDays,
					totalWorkingDays: calculation.totalWorkingDays,
					status: calculation.status ?? 'draft',
					paymentDate: calculation.paymentDate,
					updatedAt: now
				})
				.where(eq(schema.payslips.id, payslipId));
		} else {
			await db.insert(schema.payslips).values({
				id: payslipId,
				employeeId: employee.id,
				month,
				year,
				monthlyWage: calculation.monthlyWage,
				basicSalary: calculation.basicSalary,
				hra: calculation.hra,
				standardAllowance: calculation.standardAllowance,
				performanceBonus: calculation.performanceBonus,
				lta: calculation.lta,
				fixedAllowance: calculation.fixedAllowance,
				grossSalary: calculation.grossSalary,
				employeePf: calculation.employeePf,
				employerPf: calculation.employerPf,
				professionalTax: calculation.professionalTax,
				totalDeductions: calculation.totalDeductions,
				netSalary: calculation.netSalary,
				payableDays: calculation.payableDays,
				totalWorkingDays: calculation.totalWorkingDays,
				status: calculation.status ?? 'draft',
				paymentDate: calculation.paymentDate,
				createdAt: now,
				updatedAt: now
			});
		}

		calculation.id = payslipId;
	}

	return calculation;
}
