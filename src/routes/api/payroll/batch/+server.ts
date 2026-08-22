import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { generatePayslip } from '$lib/server/payroll/payslip-generator';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const month = Number(body.month);
		const year = Number(body.year);
		const department = body.department ? String(body.department).trim() : undefined;
		const overwrite = Boolean(body.overwrite ?? true);

		// Validate month and year
		if (!month || isNaN(month) || month < 1 || month > 12) {
			return json(
				{
					success: false,
					error: 'Invalid month. Month must be an integer between 1 and 12.'
				},
				{ status: 400 }
			);
		}

		if (!year || isNaN(year) || year < 2000 || year > 2100) {
			return json(
				{
					success: false,
					error: 'Invalid year. Year must be an integer between 2000 and 2100.'
				},
				{ status: 400 }
			);
		}

		// Fetch target active employees
		let query = db.select().from(schema.employees);
		const conditions = [eq(schema.employees.status, 'active')];

		if (department && department !== 'all') {
			conditions.push(eq(schema.employees.department, department));
		}

		const activeEmployees = await query.where(and(...conditions));

		if (activeEmployees.length === 0) {
			return json({
				success: true,
				message: 'No active employees found matching the criteria.',
				processedCount: 0,
				summary: {
					totalGross: 0,
					totalDeductions: 0,
					totalNet: 0,
					totalPf: 0
				},
				results: []
			});
		}

		// Find an existing admin user for audit log authorId
		const adminUser = (await db.select().from(schema.users).limit(1))[0];
		const authorId = adminUser ? adminUser.id : activeEmployees[0].userId;

		const results: any[] = [];
		let totalGross = 0;
		let totalDeductions = 0;
		let totalNet = 0;
		let totalPf = 0;

		for (const emp of activeEmployees) {
			try {
				const payslipResult = await generatePayslip(emp.id, month, year, {
					save: true
				});

				results.push({
					employeeId: emp.id,
					employeeName: `${emp.firstName} ${emp.lastName}`,
					department: emp.department,
					payslipId: payslipResult.id,
					grossSalary: payslipResult.grossSalary,
					totalDeductions: payslipResult.totalDeductions,
					netSalary: payslipResult.netSalary,
					payableDays: payslipResult.payableDays,
					lopDays: payslipResult.lopDays,
					status: 'success'
				});

				totalGross += payslipResult.grossSalary;
				totalDeductions += payslipResult.totalDeductions;
				totalNet += payslipResult.netSalary;
				totalPf += payslipResult.employeePf;
			} catch (err: any) {
				console.error(`Failed to generate payslip for employee ${emp.id}:`, err);
				results.push({
					employeeId: emp.id,
					employeeName: `${emp.firstName} ${emp.lastName}`,
					department: emp.department,
					error: err.message || 'Computation error',
					status: 'failed'
				});
			}
		}

		// Insert batch audit log in chatter
		try {
			if (authorId) {
				await db.insert(schema.chatter).values({
					id: crypto.randomUUID(),
					entityType: 'payroll',
					entityId: `batch-${year}-${String(month).padStart(2, '0')}`,
					authorId,
					authorName: 'Payroll Automation Engine',
					type: 'status_change',
					message: `Automated Batch Payroll processed for ${results.filter((r) => r.status === 'success').length} employees (${month}/${year}). Total Gross: ₹${totalGross.toLocaleString('en-IN')}, Net: ₹${totalNet.toLocaleString('en-IN')}.`,
					metadata: {
						month,
						year,
						processedCount: results.filter((r) => r.status === 'success').length,
						totalGross,
						totalNet
					},
					createdAt: new Date().toISOString()
				});
			}
		} catch (logErr) {
			console.error('Failed to write chatter log for batch payroll:', logErr);
		}

		return json({
			success: true,
			month,
			year,
			processedCount: results.filter((r) => r.status === 'success').length,
			failedCount: results.filter((r) => r.status === 'failed').length,
			summary: {
				totalGross: Number(totalGross.toFixed(2)),
				totalDeductions: Number(totalDeductions.toFixed(2)),
				totalNet: Number(totalNet.toFixed(2)),
				totalPf: Number(totalPf.toFixed(2))
			},
			results
		});
	} catch (err: any) {
		console.error('Error in batch payroll processor:', err);
		return json(
			{
				success: false,
				error: err.message || 'Internal server error processing batch payroll.'
			},
			{ status: 500 }
		);
	}
};
