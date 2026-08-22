import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

// Helper to calculate working business days between two dates (Mon-Fri)
export function _calculateBusinessDays(startDateStr: string, endDateStr: string): number {
	const start = new Date(startDateStr + 'T00:00:00Z');
	const end = new Date(endDateStr + 'T00:00:00Z');

	if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
		return 0;
	}

	let count = 0;
	const current = new Date(start);
	while (current <= end) {
		const day = current.getUTCDay();
		if (day !== 0 && day !== 6) {
			// Not Sunday (0) or Saturday (6)
			count++;
		}
		current.setUTCDate(current.getUTCDate() + 1);
	}
	return count === 0 ? 1 : count; // If weekend only, count at least 1 or business day count
}

/**
 * GET /api/leaves
 * Query Params:
 * - employeeId: Filter by specific employee
 * - status: 'all' | 'pending' | 'approved' | 'rejected'
 * - type: 'all' | 'paid_time_off' | 'sick_leave' | 'unpaid_leave'
 * - year: Filter by year (e.g. 2026)
 * - page: 1-indexed page number (default: 1)
 * - limit: items per page (default: 50)
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const employeeId = url.searchParams.get('employeeId');
		const status = url.searchParams.get('status');
		const type = url.searchParams.get('type');
		const yearParam = url.searchParams.get('year');
		const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
		const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '50', 10)));
		const offset = (page - 1) * limit;

		// Build filter conditions
		const conditions = [];

		if (employeeId && employeeId.trim() !== '') {
			conditions.push(eq(schema.leaveRequests.employeeId, employeeId.trim()));
		}

		if (status && status !== 'all' && ['pending', 'approved', 'rejected'].includes(status)) {
			conditions.push(eq(schema.leaveRequests.status, status as 'pending' | 'approved' | 'rejected'));
		}

		if (type && type !== 'all' && ['paid_time_off', 'sick_leave', 'unpaid_leave'].includes(type)) {
			conditions.push(eq(schema.leaveRequests.leaveType, type as 'paid_time_off' | 'sick_leave' | 'unpaid_leave'));
		}

		if (yearParam) {
			const year = parseInt(yearParam, 10);
			if (!isNaN(year)) {
				const startOfYear = `${year}-01-01`;
				const endOfYear = `${year}-12-31`;
				conditions.push(
					sql`(${schema.leaveRequests.startDate} BETWEEN ${startOfYear} AND ${endOfYear} OR ${schema.leaveRequests.endDate} BETWEEN ${startOfYear} AND ${endOfYear})`
				);
			}
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Query total count for pagination
		const totalResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(schema.leaveRequests)
			.where(whereClause);
		const total = totalResult[0]?.count ?? 0;

		// Query paginated leave requests with relation joins
		const leaves = await db.query.leaveRequests.findMany({
			where: whereClause,
			orderBy: [desc(schema.leaveRequests.createdAt)],
			limit,
			offset,
			with: {
				employee: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						avatarUrl: true,
						jobTitle: true,
						department: true
					}
				},
				approver: {
					columns: {
						id: true,
						name: true,
						email: true,
						role: true
					}
				}
			}
		});

		// Enrich each leave with calculated business days
		const enrichedLeaves = leaves.map((leave: typeof schema.leaveRequests.$inferSelect) => ({
			...leave,
			businessDays: _calculateBusinessDays(leave.startDate, leave.endDate)
		}));

		// If a specific employeeId is requested, also fetch their leave balance for the year
		let balance = null;
		if (employeeId) {
			const currentYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
			const balanceRecords = await db
				.select()
				.from(schema.leaveBalances)
				.where(
					and(
						eq(schema.leaveBalances.employeeId, employeeId),
						eq(schema.leaveBalances.year, isNaN(currentYear) ? 2026 : currentYear)
					)
				)
				.limit(1);

			if (balanceRecords.length > 0) {
				balance = balanceRecords[0];
			}
		}

		return json({
			leaves: enrichedLeaves,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit) || 1,
			balance
		});
	} catch (err: any) {
		console.error('Error fetching leaves:', err);
		return json({ error: 'Failed to fetch leave requests', details: err?.message }, { status: 500 });
	}
};

/**
 * POST /api/leaves
 * Body:
 * {
 *   employeeId: string;
 *   leaveType: 'paid_time_off' | 'sick_leave' | 'unpaid_leave';
 *   startDate: string; // YYYY-MM-DD
 *   endDate: string; // YYYY-MM-DD
 *   totalDays?: number;
 *   reason: string;
 *   attachmentUrl?: string;
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { employeeId, leaveType, startDate, endDate, reason, attachmentUrl } = body;

		// 1. Validation: Required fields
		if (!employeeId || typeof employeeId !== 'string' || employeeId.trim() === '') {
			return json({ error: 'Employee ID is required' }, { status: 400 });
		}

		if (!leaveType || !['paid_time_off', 'sick_leave', 'unpaid_leave'].includes(leaveType)) {
			return json({
				error: 'Invalid leave type. Must be paid_time_off, sick_leave, or unpaid_leave'
			}, { status: 400 });
		}

		if (!startDate || typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
			return json({ error: 'Valid start date in YYYY-MM-DD format is required' }, { status: 400 });
		}

		if (!endDate || typeof endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
			return json({ error: 'Valid end date in YYYY-MM-DD format is required' }, { status: 400 });
		}

		if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
			return json({ error: 'Reason must be at least 3 characters long' }, { status: 400 });
		}

		const start = new Date(startDate + 'T00:00:00Z');
		const end = new Date(endDate + 'T00:00:00Z');

		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			return json({ error: 'Invalid start or end date' }, { status: 400 });
		}

		if (start > end) {
			return json({ error: 'Start date cannot be after end date' }, { status: 400 });
		}

		// Calculate total business days if not provided
		let totalDays: number = Number(body.totalDays);
		if (isNaN(totalDays) || totalDays <= 0) {
			totalDays = _calculateBusinessDays(startDate, endDate);
		}

		// 2. Validate Employee exists
		const employeeRecords = await db
			.select()
			.from(schema.employees)
			.where(eq(schema.employees.id, employeeId))
			.limit(1);

		if (employeeRecords.length === 0) {
			return json({ error: `Employee with ID '${employeeId}' not found` }, { status: 404 });
		}

		const employee = employeeRecords[0];
		const leaveYear = start.getUTCFullYear();

		// 3. Quota check against leave balances
		let balance = (
			await db
				.select()
				.from(schema.leaveBalances)
				.where(
					and(
						eq(schema.leaveBalances.employeeId, employeeId),
						eq(schema.leaveBalances.year, leaveYear)
					)
				)
				.limit(1)
		)[0];

		// If no balance record exists for this year, create default quotas
		if (!balance) {
			const newBalanceId = crypto.randomUUID();
			const now = new Date().toISOString();
			await db.insert(schema.leaveBalances).values({
				id: newBalanceId,
				employeeId,
				year: leaveYear,
				paidTimeOffTotal: 24,
				paidTimeOffUsed: 0,
				sickLeaveTotal: 7,
				sickLeaveUsed: 0,
				unpaidLeaveUsed: 0,
				updatedAt: now
			});

			balance = {
				id: newBalanceId,
				employeeId,
				year: leaveYear,
				paidTimeOffTotal: 24,
				paidTimeOffUsed: 0,
				sickLeaveTotal: 7,
				sickLeaveUsed: 0,
				unpaidLeaveUsed: 0,
				updatedAt: now
			};
		}

		// Check remaining balance for the requested leave type
		if (leaveType === 'paid_time_off') {
			const remainingPTO = balance.paidTimeOffTotal - balance.paidTimeOffUsed;
			if (totalDays > remainingPTO) {
				return json(
					{
						error: `Insufficient Paid Time Off balance. Requested ${totalDays} day(s), but only ${remainingPTO} day(s) remaining.`,
						requested: totalDays,
						remaining: remainingPTO,
						total: balance.paidTimeOffTotal,
						used: balance.paidTimeOffUsed
					},
					{ status: 400 }
				);
			}
		} else if (leaveType === 'sick_leave') {
			const remainingSick = balance.sickLeaveTotal - balance.sickLeaveUsed;
			if (totalDays > remainingSick) {
				return json(
					{
						error: `Insufficient Sick Leave balance. Requested ${totalDays} day(s), but only ${remainingSick} day(s) remaining.`,
						requested: totalDays,
						remaining: remainingSick,
						total: balance.sickLeaveTotal,
						used: balance.sickLeaveUsed
					},
					{ status: 400 }
				);
			}
		}

		// 4. Create the Leave Request record
		const newLeaveId = crypto.randomUUID();
		const now = new Date().toISOString();

		const newLeave: typeof schema.leaveRequests.$inferInsert = {
			id: newLeaveId,
			employeeId,
			leaveType,
			startDate,
			endDate,
			totalDays,
			reason: reason.trim(),
			status: 'pending',
			approvedBy: null,
			rejectionReason: null,
			attachmentUrl: attachmentUrl || null,
			createdAt: now,
			updatedAt: now
		};

		await db.insert(schema.leaveRequests).values(newLeave);

		// 5. Create audit chatter entry
		const leaveTypeFormatted =
			leaveType === 'paid_time_off'
				? 'Paid Time Off (PTO)'
				: leaveType === 'sick_leave'
					? 'Sick Leave'
					: 'Unpaid Leave';

		await db.insert(schema.chatter).values({
			id: crypto.randomUUID(),
			entityType: 'leave',
			entityId: newLeaveId,
			authorId: employee.userId,
			authorName: `${employee.firstName} ${employee.lastName}`,
			authorAvatar: employee.avatarUrl,
			message: `Submitted new leave request for ${totalDays} day(s) (${leaveTypeFormatted}) from ${startDate} to ${endDate}. Reason: "${reason.trim()}"`,
			type: 'status_change',
			metadata: {
				leaveId: newLeaveId,
				leaveType,
				startDate,
				endDate,
				totalDays,
				status: 'pending'
			},
			createdAt: now
		});

		// Fetch the newly created record with employee relations
		const createdLeave = await db.query.leaveRequests.findFirst({
			where: eq(schema.leaveRequests.id, newLeaveId),
			with: {
				employee: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						avatarUrl: true,
						jobTitle: true,
						department: true
					}
				},
				approver: {
					columns: {
						id: true,
						name: true,
						email: true,
						role: true
					}
				}
			}
		});

		return json(
			{
				success: true,
				leave: {
					...createdLeave,
					businessDays: _calculateBusinessDays(startDate, endDate)
				},
				balance
			},
			{ status: 201 }
		);
	} catch (err: any) {
		console.error('Error creating leave request:', err);
		return json({ error: 'Failed to create leave request', details: err?.message }, { status: 500 });
	}
};
