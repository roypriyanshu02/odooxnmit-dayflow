import { describe, it, expect, beforeAll } from 'bun:test';
import {
	calculateAttendanceSummary,
	computePayslipBreakdown,
	getDaysInMonth,
	getWorkingDaysInMonth,
	isWeekend,
	generatePayslip
} from './payslip-generator';
import { calculateSalaryBreakdown } from './calculator';
import { POST as calculateApi } from '../../../routes/api/payroll/calculate/+server';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { seedDatabase } from '$lib/server/db/seed';

describe('Payroll Engine & Payslip Generator Suite', () => {
	// Ensure database has seed data before DB integration tests
	beforeAll(async () => {
		await seedDatabase();
	});

	describe('Calendar & Working Days Calculation', () => {
		it('should calculate correct calendar days and weekdays for August 2026 (31 days, 21 weekdays)', () => {
			const calendarDays = getWorkingDaysInMonth(2026, 8, 'calendar_days');
			const businessDays = getWorkingDaysInMonth(2026, 8, 'business_days');

			expect(calendarDays).toBe(31);
			expect(businessDays).toBe(21);
		});

		it('should correctly handle February in leap years (2024) and non-leap years (2026)', () => {
			const feb2024Days = getWorkingDaysInMonth(2024, 2, 'calendar_days');
			const feb2026Days = getWorkingDaysInMonth(2026, 2, 'calendar_days');

			expect(feb2024Days).toBe(29);
			expect(feb2026Days).toBe(28);
		});

		it('should correctly identify weekend dates', () => {
			expect(isWeekend('2026-08-01')).toBe(true); // Saturday
			expect(isWeekend('2026-08-02')).toBe(true); // Sunday
			expect(isWeekend('2026-08-03')).toBe(false); // Monday
			expect(isWeekend('2026-08-07')).toBe(false); // Friday
		});
	});

	describe('Statutory Salary Component Breakdown Engine', () => {
		it('should calculate standard statutory formula breakdown for ₹50,000 monthly wage', () => {
			const breakdown = calculateSalaryBreakdown(50000);

			// Basic = 50% of Wage = 25,000
			expect(breakdown.basicSalary).toBe(25000);

			// HRA = 50% of Basic = 12,500
			expect(breakdown.hra).toBe(12500);

			// Standard Allowance = ₹4,167
			expect(breakdown.standardAllowance).toBe(4167);

			// Performance Bonus = 8.33% of Basic = 2,082.5
			expect(breakdown.performanceBonus).toBe(2082.5);

			// LTA = 8.33% of Basic = 2,082.5
			expect(breakdown.lta).toBe(2082.5);

			// Fixed Allowance = Remainder: 50,000 - (25000 + 12500 + 4167 + 2082.5 + 2082.5) = 4,168
			expect(breakdown.fixedAllowance).toBe(4168);

			// Gross Salary = Basic + HRA + Standard Allowance + Performance Bonus + LTA + Fixed Allowance = 50,000
			expect(breakdown.grossSalary).toBe(50000);

			// Employee PF = 12% of Basic = 3,000
			expect(breakdown.employeePf).toBe(3000);

			// Employer PF = 12% of Basic = 3,000
			expect(breakdown.employerPf).toBe(3000);

			// Professional Tax = ₹200 (since wage > 15k)
			expect(breakdown.professionalTax).toBe(200);

			// Total Deductions = Employee PF + Professional Tax = 3,200
			expect(breakdown.totalDeductions).toBe(3200);

			// Net Salary = Gross Salary - Total Deductions = 50,000 - 3,200 = 46,800
			expect(breakdown.netSalary).toBe(46800);
		});

		it('should handle zero wage accurately (all earnings and deductions = 0)', () => {
			const breakdown = calculateSalaryBreakdown(0);

			expect(breakdown.monthlyWage).toBe(0);
			expect(breakdown.basicSalary).toBe(0);
			expect(breakdown.hra).toBe(0);
			expect(breakdown.standardAllowance).toBe(0);
			expect(breakdown.performanceBonus).toBe(0);
			expect(breakdown.lta).toBe(0);
			expect(breakdown.fixedAllowance).toBe(0);
			expect(breakdown.grossSalary).toBe(0);
			expect(breakdown.employeePf).toBe(0);
			expect(breakdown.employerPf).toBe(0);
			expect(breakdown.professionalTax).toBe(0);
			expect(breakdown.totalDeductions).toBe(0);
			expect(breakdown.netSalary).toBe(0);
		});

		it('should not charge Professional Tax for wage <= ₹15,000', () => {
			const breakdown15k = calculateSalaryBreakdown(15000);
			const breakdown12k = calculateSalaryBreakdown(12000);

			expect(breakdown15k.professionalTax).toBe(0);
			expect(breakdown12k.professionalTax).toBe(0);

			const breakdown15001 = calculateSalaryBreakdown(15001);
			expect(breakdown15001.professionalTax).toBe(200);
		});

		it('should accurately compute high wage breakdown (e.g. ₹250,000)', () => {
			const breakdown = calculateSalaryBreakdown(250000);

			expect(breakdown.basicSalary).toBe(125000);
			expect(breakdown.hra).toBe(62500);
			expect(breakdown.standardAllowance).toBe(4167);
			expect(breakdown.performanceBonus).toBe(10412.5); // 125000 * 0.0833 = 10412.5
			expect(breakdown.lta).toBe(10412.5);
			expect(breakdown.employeePf).toBe(15000); // 12% of 125,000
			expect(breakdown.employerPf).toBe(15000);
			expect(breakdown.professionalTax).toBe(200);
			expect(breakdown.grossSalary).toBe(250000);
			expect(breakdown.totalDeductions).toBe(15200);
			expect(breakdown.netSalary).toBe(234800);
		});
	});

	describe('Attendance Summary & Payable Days Computation', () => {
		it('Scenario 1: 0 Attendance (all absent)', () => {
			const summary = calculateAttendanceSummary({
				year: 2026,
				month: 8,
				attendanceRecords: [],
				leaveRequests: []
			});

			expect(summary.totalWorkingDays).toBe(21);
			expect(summary.presentDays).toBe(0);
			expect(summary.paidLeaveDays).toBe(0);
			expect(summary.lopDays).toBe(0);
			expect(summary.unexcusedAbsentDays).toBe(21);
			expect(summary.payableDays).toBe(0);

			const payslip = computePayslipBreakdown({
				monthlyWage: 60000,
				totalWorkingDays: summary.totalWorkingDays,
				payableDays: summary.payableDays,
				month: 8,
				year: 2026,
				attendanceSummary: summary
			});

			expect(payslip.proRatedWage).toBe(0);
			expect(payslip.grossSalary).toBe(0);
			expect(payslip.totalDeductions).toBe(0);
			expect(payslip.netSalary).toBe(0);
			expect(payslip.payableDays).toBe(0);
		});

		it('Scenario 2: Full Attendance (21 working days present)', () => {
			// Generate 21 weekdays in August 2026 as present
			const augDates = getDaysInMonth(2026, 8).filter((d) => !isWeekend(d));
			const attendance = augDates.map((date) => ({
				date,
				status: 'present'
			}));

			const summary = calculateAttendanceSummary({
				year: 2026,
				month: 8,
				attendanceRecords: attendance,
				leaveRequests: []
			});

			expect(summary.totalWorkingDays).toBe(21);
			expect(summary.presentDays).toBe(21);
			expect(summary.paidLeaveDays).toBe(0);
			expect(summary.lopDays).toBe(0);
			expect(summary.unexcusedAbsentDays).toBe(0);
			expect(summary.payableDays).toBe(21);

			const payslip = computePayslipBreakdown({
				monthlyWage: 100000,
				totalWorkingDays: summary.totalWorkingDays,
				payableDays: summary.payableDays,
				month: 8,
				year: 2026,
				attendanceSummary: summary
			});

			expect(payslip.proRatedWage).toBe(100000);
			expect(payslip.basicSalary).toBe(50000);
			expect(payslip.hra).toBe(25000);
			expect(payslip.grossSalary).toBe(100000);
			expect(payslip.employeePf).toBe(6000);
			expect(payslip.professionalTax).toBe(200);
			expect(payslip.totalDeductions).toBe(6200);
			expect(payslip.netSalary).toBe(93800);
		});

		it('Scenario 3: 3 LOP Days (Unpaid Leave / Loss of Pay)', () => {
			const augDates = getDaysInMonth(2026, 8).filter((d) => !isWeekend(d));
			// 18 days present, 3 days approved unpaid leave (e.g. 2026-08-10 to 2026-08-12)
			const lopDates = ['2026-08-10', '2026-08-11', '2026-08-12'];
			const presentDates = augDates.filter((d) => !lopDates.includes(d));

			const attendance = presentDates.map((date) => ({
				date,
				status: 'present'
			}));

			const leaves = [
				{
					startDate: '2026-08-10',
					endDate: '2026-08-12',
					leaveType: 'unpaid_leave',
					status: 'approved'
				}
			];

			const summary = calculateAttendanceSummary({
				year: 2026,
				month: 8,
				attendanceRecords: attendance,
				leaveRequests: leaves
			});

			expect(summary.totalWorkingDays).toBe(21);
			expect(summary.presentDays).toBe(18);
			expect(summary.lopDays).toBe(3);
			expect(summary.paidLeaveDays).toBe(0);
			expect(summary.unexcusedAbsentDays).toBe(0);
			// Payable Days = Total Working Days (21) - LOP Days (3) - Unexcused Absent Days (0) = 18
			expect(summary.payableDays).toBe(18);

			const monthlyWage = 70000;
			const payslip = computePayslipBreakdown({
				monthlyWage,
				totalWorkingDays: summary.totalWorkingDays,
				payableDays: summary.payableDays,
				month: 8,
				year: 2026,
				attendanceSummary: summary
			});

			const expectedProRatedWage = Math.round((70000 * 18) / 21); // 60,000
			expect(payslip.proRatedWage).toBe(expectedProRatedWage);
			expect(payslip.proRatedWage).toBe(60000);
			expect(payslip.basicSalary).toBe(30000);
			expect(payslip.employeePf).toBe(3600);
			expect(payslip.professionalTax).toBe(200);
			expect(payslip.grossSalary).toBe(60000);
			expect(payslip.netSalary).toBe(60000 - 3800);
		});

		it('Scenario 4: 15 Payable Days (out of 20 working days)', () => {
			const totalWorkingDays = 20;
			const payableDays = 15;
			const monthlyWage = 80000;

			const payslip = computePayslipBreakdown({
				monthlyWage,
				totalWorkingDays,
				payableDays,
				month: 9,
				year: 2026
			});

			const expectedProRatedWage = Math.round((80000 * 15) / 20); // 60,000
			expect(payslip.proRatedWage).toBe(expectedProRatedWage);
			expect(payslip.basicSalary).toBe(30000);
			expect(payslip.hra).toBe(15000);
			expect(payslip.payableDays).toBe(15);
			expect(payslip.totalWorkingDays).toBe(20);
			expect(payslip.grossSalary).toBe(60000);
		});

		it('Scenario 5: Mixed Paid Leaves and Half Days', () => {
			const augDates = getDaysInMonth(2026, 8).filter((d) => !isWeekend(d));
			// 16 full days present, 2 days half day (2 * 0.5 = 1 present, 1 absent), 2 days paid PTO
			const ptoDates = ['2026-08-03', '2026-08-04'];
			const halfDates = ['2026-08-05', '2026-08-06'];
			const presentDates = augDates.slice(4); // remaining 17 days

			const attendance: Array<{ date: string; status: string }> = [
				...presentDates.map((date) => ({ date, status: 'present' })),
				...halfDates.map((date) => ({ date, status: 'half_day' }))
			];

			const leaves = [
				{
					startDate: '2026-08-03',
					endDate: '2026-08-04',
					leaveType: 'paid_time_off',
					status: 'approved'
				}
			];

			const summary = calculateAttendanceSummary({
				year: 2026,
				month: 8,
				attendanceRecords: attendance,
				leaveRequests: leaves
			});

			expect(summary.totalWorkingDays).toBe(21);
			expect(summary.paidLeaveDays).toBe(2);
			expect(summary.presentDays).toBe(17 + 1); // 18
			expect(summary.unexcusedAbsentDays).toBe(1); // 2 * 0.5
			expect(summary.lopDays).toBe(0);
			expect(summary.payableDays).toBe(20); // 18 + 2 = 20
		});
	});

	describe('Database Integration: generatePayslip', () => {
		it('should generate accurate payslip from SQLite database for seeded employee Rohan Verma', async () => {
			const employees = await db.select().from(schema.employees);
			const rohan = employees.find((e: typeof schema.employees.$inferSelect) => e.email === 'employee@dayflow.internal');

			expect(rohan).toBeDefined();
			if (!rohan) return;

			// Generate payslip for Rohan for August 2026
			const result = await generatePayslip(rohan.id, 8, 2026, { save: true });

			expect(result.employeeId).toBe(rohan.id);
			expect(result.month).toBe(8);
			expect(result.year).toBe(2026);
			expect(result.baseMonthlyWage).toBe(rohan.monthlyWage);
			expect(result.totalWorkingDays).toBe(21);
			expect(result.payableDays).toBeGreaterThanOrEqual(0);
			expect(Math.abs(result.grossSalary - result.proRatedWage)).toBeLessThanOrEqual(1);
			expect(Math.abs(result.netSalary - (result.grossSalary - result.totalDeductions))).toBeLessThanOrEqual(1);
			expect(result.id).toBeDefined();

			// Verify payslip was persisted in DB
			const saved = await db
				.select()
				.from(schema.payslips)
				.where(eq(schema.payslips.id, result.id!));

			expect(saved.length).toBe(1);
			expect(saved[0].employeeId).toBe(rohan.id);
			expect(saved[0].month).toBe(8);
			expect(saved[0].year).toBe(2026);
		});

		it('should throw error when employee ID does not exist', async () => {
			expect(
				generatePayslip('OINONEXISTENT20260001', 8, 2026)
			).rejects.toThrow('not found');
		});

		it('should throw error for invalid month and year parameters', async () => {
			expect(
				generatePayslip('OIROVE20260003', 13, 2026)
			).rejects.toThrow('Invalid month');

			expect(
				generatePayslip('OIROVE20260003', 0, 2026)
			).rejects.toThrow('Invalid month');
		});
	});

	describe('API Endpoint: POST /api/payroll/calculate', () => {
		it('should successfully calculate payslip breakdown via API for seeded employee', async () => {
			const employees = await db.select().from(schema.employees);
			const targetEmp = employees[0];

			const request = new Request('http://localhost/api/payroll/calculate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: targetEmp.id,
					month: 8,
					year: 2026,
					save: true
				})
			});

			const response = await calculateApi({ request } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.payslip).toBeDefined();
			expect(data.payslip.employeeId).toBe(targetEmp.id);
			expect(data.payslip.month).toBe(8);
			expect(data.payslip.year).toBe(2026);
			expect(data.payslip.basicSalary).toBeGreaterThan(0);
			expect(data.payslip.netSalary).toBeGreaterThan(0);
			expect(data.attendanceSummary).toBeDefined();
			expect(data.attendanceSummary.totalWorkingDays).toBe(21);
		});

		it('should return 400 for missing or empty employeeId', async () => {
			const request = new Request('http://localhost/api/payroll/calculate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: '',
					month: 8,
					year: 2026
				})
			});

			const response = await calculateApi({ request } as any);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain('employeeId');
		});

		it('should return 400 for invalid month value', async () => {
			const request = new Request('http://localhost/api/payroll/calculate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: 'OIROVE20260003',
					month: 13,
					year: 2026
				})
			});

			const response = await calculateApi({ request } as any);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain('month');
		});

		it('should return 400 for invalid year value', async () => {
			const request = new Request('http://localhost/api/payroll/calculate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: 'OIROVE20260003',
					month: 8,
					year: 1995
				})
			});

			const response = await calculateApi({ request } as any);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain('year');
		});

		it('should return 404 when employee does not exist', async () => {
			const request = new Request('http://localhost/api/payroll/calculate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					employeeId: 'OINOTFOUND9999',
					month: 8,
					year: 2026
				})
			});

			const response = await calculateApi({ request } as any);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.success).toBe(false);
			expect(data.error).toContain('not found');
		});
	});
});
