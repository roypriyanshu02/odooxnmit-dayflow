import { json, type RequestHandler } from '@sveltejs/kit';
import { generatePayslip } from '$lib/server/payroll/payslip-generator';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({}));
		const { employeeId, month, year, save = false, mode = 'business_days', status = 'draft' } = body;

		if (!employeeId || typeof employeeId !== 'string' || !employeeId.trim()) {
			return json(
				{
					success: false,
					error: 'Invalid or missing "employeeId". Must be a non-empty string.'
				},
				{ status: 400 }
			);
		}

		const parsedMonth = typeof month === 'string' ? parseInt(month, 10) : month;
		if (typeof parsedMonth !== 'number' || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
			return json(
				{
					success: false,
					error: 'Invalid "month". Must be an integer between 1 and 12.'
				},
				{ status: 400 }
			);
		}

		const parsedYear = typeof year === 'string' ? parseInt(year, 10) : year;
		if (typeof parsedYear !== 'number' || isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
			return json(
				{
					success: false,
					error: 'Invalid "year". Must be a valid 4-digit year (2000-2100).'
				},
				{ status: 400 }
			);
		}

		const payslip = await generatePayslip(employeeId.trim(), parsedMonth, parsedYear, {
			mode: mode === 'calendar_days' ? 'calendar_days' : 'business_days',
			save: Boolean(save),
			status: status === 'paid' || status === 'processed' ? status : 'draft'
		});

		return json({
			success: true,
			payslip,
			attendanceSummary: {
				totalWorkingDays: payslip.totalWorkingDays,
				presentDays: payslip.presentDays,
				paidLeaveDays: payslip.paidLeaveDays,
				lopDays: payslip.lopDays,
				unexcusedAbsentDays: payslip.unexcusedAbsentDays,
				payableDays: payslip.payableDays
			}
		});
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'An error occurred during payslip calculation';

		if (errorMessage.includes('not found')) {
			return json(
				{
					success: false,
					error: errorMessage
				},
				{ status: 404 }
			);
		}

		return json(
			{
				success: false,
				error: errorMessage
			},
			{ status: 500 }
		);
	}
};
