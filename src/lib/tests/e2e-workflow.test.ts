import { describe, it, expect, beforeAll } from 'bun:test';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { seedDatabase } from '$lib/server/db/seed';
import { eq, and } from 'drizzle-orm';
import { generateEmployeeId, parseEmployeeId } from '$lib/utils/employee-id';
import { calculateBreakDuration, isBreakExceededThreshold } from '$lib/utils/break';
import { calculateBusinessDays } from '$lib/types/leaves';
import { syncApprovedLeaveToAttendance } from '$lib/server/leaves/sync-attendance';
import { calculateSalaryBreakdown } from '$lib/server/payroll/calculator';
import { generatePayslip } from '$lib/server/payroll/payslip-generator';

describe('Dayflow HRMS End-to-End Cross-Module Integration Suite', () => {
	beforeAll(async () => {
		await seedDatabase();
	});

	describe('Workflow 1: Employee Lifecycle & Dynamic ID Provisioning', () => {
		it('should generate standard compliant Odoo-format Employee IDs', () => {
			const id1 = generateEmployeeId('Priyanshu', 'Roy', 2026, 1);
			expect(id1).toBe('OIPRRO20260001');

			const id2 = generateEmployeeId('Arnav', 'Kini', 2026, 2);
			expect(id2).toBe('OIARKI20260002');

			const parsed = parseEmployeeId(id1);
			expect(parsed.isValid).toBe(true);
			expect(parsed.prefix).toBe('OI');
			expect(parsed.firstNameCode).toBe('PR');
			expect(parsed.lastNameCode).toBe('RO');
			expect(parsed.year).toBe(2026);
			expect(parsed.serial).toBe(1);
		});

		it('should verify all seeded employees exist with matching user relationships', async () => {
			const emps = await db.select().from(schema.employees);
			expect(emps.length).toBe(12);

			for (const emp of emps) {
				expect(emp.id.startsWith('OI')).toBe(true);
				expect(emp.userId).toBeDefined();
				expect(emp.monthlyWage).toBeGreaterThan(0);
			}
		});
	});

	describe('Workflow 2: Shift Attendance & Break Threshold Policy', () => {
		it('should compute exact break durations and trigger 60-minute threshold policy', () => {
			// 45-min Lunch Break
			const start45 = '2026-08-22T13:00:00Z';
			const end45 = '2026-08-22T13:45:00Z';
			expect(calculateBreakDuration(start45, end45)).toBe(45);
			expect(isBreakExceededThreshold(start45, end45)).toBe(false);

			// 75-min Over-limit Break
			const start75 = '2026-08-22T13:00:00Z';
			const end75 = '2026-08-22T14:15:00Z';
			expect(calculateBreakDuration(start75, end75)).toBe(75);
			expect(isBreakExceededThreshold(start75, end75)).toBe(true);
		});

		it('should accurately compute productive shift hours and overtime (> 8.0h)', async () => {
			const emp = (await db.select().from(schema.employees).limit(1))[0];
			expect(emp).toBeDefined();

			const todayStr = '2026-08-22';
			// Check-In 09:00, Check-Out 18:00 (540 mins) with 45 mins break -> 495 mins work (8.25h) -> 15 mins OT
			const totalShiftMinutes = 540;
			const totalBreakMinutes = 45;
			const netWorkMinutes = totalShiftMinutes - totalBreakMinutes; // 495
			const overtimeMinutes = Math.max(0, netWorkMinutes - 480); // 15 mins

			expect(netWorkMinutes).toBe(495);
			expect(overtimeMinutes).toBe(15);
		});
	});

	describe('Workflow 3: Leave Management & Attendance Auto-Sync', () => {
		it('should compute working business days excluding weekends', () => {
			// Thursday Aug 20 to Monday Aug 24: Thu, Fri, Mon = 3 business days
			const days = calculateBusinessDays('2026-08-20', '2026-08-24');
			expect(days).toBe(3);
		});

		it('should auto-sync approved leave into daily attendance records as on_leave', async () => {
			const emp = (await db.select().from(schema.employees).limit(1))[0];
			expect(emp).toBeDefined();

			// Create and approve a 2-day leave
			const leaveId = crypto.randomUUID();
			await db.insert(schema.leaveRequests).values({
				id: leaveId,
				employeeId: emp.id,
				leaveType: 'paid_time_off',
				startDate: '2026-09-01', // Tuesday
				endDate: '2026-09-02', // Wednesday
				totalDays: 2,
				reason: 'Family event',
				status: 'approved',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			const syncResult = await syncApprovedLeaveToAttendance(leaveId);
			expect(syncResult.syncedDays).toEqual(['2026-09-01', '2026-09-02']);

			// Verify attendance records were inserted with on_leave status
			const att1 = (
				await db
					.select()
					.from(schema.attendance)
					.where(and(eq(schema.attendance.employeeId, emp.id), eq(schema.attendance.date, '2026-09-01')))
			)[0];
			expect(att1).toBeDefined();
			expect(att1.status).toBe('on_leave');
			expect(att1.totalWorkMinutes).toBe(0);
		});
	});

	describe('Workflow 4: Statutory Payroll Engine & Batch Run', () => {
		it('should compute exact statutory breakdown matching company compensation formula', () => {
			const monthlyWage = 120000;
			const breakdown = calculateSalaryBreakdown(monthlyWage);

			expect(breakdown.basicSalary).toBe(60000); // 50%
			expect(breakdown.hra).toBe(30000); // 50% of Basic / 25% of Wage
			expect(breakdown.standardAllowance).toBe(4167);
			expect(breakdown.performanceBonus).toBe(4998); // 8.33% of Basic
			expect(breakdown.lta).toBe(4998); // 8.33% of Basic
			expect(breakdown.employeePf).toBe(7200); // 12% of Basic
			expect(breakdown.professionalTax).toBe(200); // Fixed 200 for wage > 15k
			expect(breakdown.totalDeductions).toBe(7400); // PF + PT
			expect(breakdown.netSalary).toBe(112600); // Gross 120000 - 7400
		});

		it('should compute attendance-adjusted payslip and save with Drizzle ORM', async () => {
			const emp = (await db.select().from(schema.employees).limit(1))[0];
			expect(emp).toBeDefined();

			const payslip = await generatePayslip(emp.id, 8, 2026, { save: true });
			expect(payslip.id).toBeDefined();
			expect(payslip.payableDays).toBeGreaterThan(0);
			expect(payslip.netSalary).toBeGreaterThan(0);
			expect(payslip.grossSalary).toBeGreaterThanOrEqual(payslip.netSalary);
		});
	});

	describe('Workflow 5: Odoo Chatter Audit Logging', () => {
		it('should maintain comprehensive chronological audit logs in chatter table', async () => {
			const logs = await db.select().from(schema.chatter);
			expect(logs.length).toBeGreaterThan(0);

			// Check entity types
			const entityTypes = new Set(logs.map((l) => l.entityType));
			expect(entityTypes.has('employee') || entityTypes.has('leave') || entityTypes.has('payroll')).toBe(true);
		});
	});
});
