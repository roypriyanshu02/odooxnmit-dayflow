import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	try {
		// 1. Fetch all payslips joined with employee details
		const payslipRecords = await db
			.select({
				id: schema.payslips.id,
				employeeId: schema.payslips.employeeId,
				month: schema.payslips.month,
				year: schema.payslips.year,
				basicSalary: schema.payslips.basicSalary,
				hra: schema.payslips.hra,
				standardAllowance: schema.payslips.standardAllowance,
				performanceBonus: schema.payslips.performanceBonus,
				lta: schema.payslips.lta,
				fixedAllowance: schema.payslips.fixedAllowance,
				grossSalary: schema.payslips.grossSalary,
				employeePf: schema.payslips.employeePf,
				employerPf: schema.payslips.employerPf,
				professionalTax: schema.payslips.professionalTax,
				totalDeductions: schema.payslips.totalDeductions,
				netSalary: schema.payslips.netSalary,
				payableDays: schema.payslips.payableDays,
				totalWorkingDays: schema.payslips.totalWorkingDays,
				status: schema.payslips.status,
				paymentDate: schema.payslips.paymentDate,
				createdAt: schema.payslips.createdAt,
				employeeFirstName: schema.employees.firstName,
				employeeLastName: schema.employees.lastName,
				employeeJobTitle: schema.employees.jobTitle,
				employeeDepartment: schema.employees.department,
				employeeAvatarUrl: schema.employees.avatarUrl
			})
			.from(schema.payslips)
			.leftJoin(schema.employees, eq(schema.payslips.employeeId, schema.employees.id))
			.orderBy(desc(schema.payslips.year), desc(schema.payslips.month), desc(schema.payslips.createdAt));

		// 2. Fetch all departments
		const allEmployees = await db.select({ department: schema.employees.department }).from(schema.employees);
		const departments: string[] = Array.from(new Set<string>(allEmployees.map((e: { department: string }) => e.department))).sort();

		// 3. Format payslips list
		const formattedPayslips = payslipRecords.map((p: any) => ({
			...p,
			employeeName: p.employeeFirstName ? `${p.employeeFirstName} ${p.employeeLastName}` : 'Unknown Employee',
			jobTitle: p.employeeJobTitle || 'Staff Member',
			department: p.employeeDepartment || 'General'
		}));

		// 4. Calculate summary stats
		const totalGross = formattedPayslips.reduce((acc: number, p: any) => acc + (p.grossSalary || 0), 0);
		const totalNet = formattedPayslips.reduce((acc: number, p: any) => acc + (p.netSalary || 0), 0);
		const totalDeductions = formattedPayslips.reduce((acc: number, p: any) => acc + (p.totalDeductions || 0), 0);
		const totalPf = formattedPayslips.reduce((acc: number, p: any) => acc + (p.employeePf || 0), 0);

		return {
			payslips: formattedPayslips,
			departments,
			stats: {
				totalCount: formattedPayslips.length,
				totalGross: Number(totalGross.toFixed(2)),
				totalNet: Number(totalNet.toFixed(2)),
				totalDeductions: Number(totalDeductions.toFixed(2)),
				totalPf: Number(totalPf.toFixed(2))
			}
		};
	} catch (err) {
		console.error('Failed to load payroll records:', err);
		return {
			payslips: [],
			departments: ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'HR'],
			stats: {
				totalCount: 0,
				totalGross: 0,
				totalNet: 0,
				totalDeductions: 0,
				totalPf: 0
			}
		};
	}
};
