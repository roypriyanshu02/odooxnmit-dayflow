import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const payslipId = params.id;

	try {
		// 1. Fetch payslip
		const payslip = (
			await db.select().from(schema.payslips).where(eq(schema.payslips.id, payslipId))
		)[0];

		if (!payslip) {
			throw error(404, `Payslip record '${payslipId}' not found.`);
		}

		// 2. Fetch employee details
		const employee = (
			await db
				.select()
				.from(schema.employees)
				.where(eq(schema.employees.id, payslip.employeeId))
		)[0];

		if (!employee) {
			throw error(404, `Employee for payslip '${payslipId}' not found.`);
		}

		return {
			payslip: {
				id: payslip.id,
				employeeId: payslip.employeeId,
				employeeName: `${employee.firstName} ${employee.lastName}`,
				jobTitle: employee.jobTitle,
				department: employee.department,
				joinDate: employee.joinDate,
				panNumber: employee.panNumber || undefined,
				uanNumber: employee.uanNumber || undefined,
				bankAccountNumber: employee.bankAccountNumber || undefined,
				bankIfsc: employee.bankIfsc || undefined,
				bankName: employee.bankName || undefined,
				month: payslip.month,
				year: payslip.year,
				totalWorkingDays: payslip.totalWorkingDays,
				payableDays: payslip.payableDays,
				lopDays: Math.max(0, payslip.totalWorkingDays - payslip.payableDays),
				presentDays: payslip.payableDays,
				paidLeaveDays: 0,
				unexcusedAbsentDays: 0,
				baseMonthlyWage: employee.monthlyWage || 0,
				proRatedWage: payslip.grossSalary,
				basicSalary: payslip.basicSalary,
				hra: payslip.hra,
				standardAllowance: payslip.standardAllowance,
				performanceBonus: payslip.performanceBonus,
				lta: payslip.lta,
				fixedAllowance: payslip.fixedAllowance,
				grossSalary: payslip.grossSalary,
				employeePf: payslip.employeePf,
				professionalTax: payslip.professionalTax,
				totalDeductions: payslip.totalDeductions,
				netSalary: payslip.netSalary,
				status: payslip.status as any,
				paymentDate: payslip.paymentDate
			}
		};
	} catch (err: any) {
		if (err.status) throw err;
		console.error('Failed to load payslip:', err);
		throw error(500, err.message || 'Internal server error loading payslip.');
	}
};
