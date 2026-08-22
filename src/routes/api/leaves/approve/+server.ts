import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * POST /api/leaves/approve
 * Request Body:
 * {
 *   leaveRequestId: string;
 *   action: 'approve' | 'reject';
 *   rejectionReason?: string;
 *   approvedBy?: string;
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { leaveRequestId, action, rejectionReason, approvedBy } = body;

		// 1. Validation: Required fields
		if (!leaveRequestId || typeof leaveRequestId !== 'string' || leaveRequestId.trim() === '') {
			return json({ error: 'Leave request ID is required' }, { status: 400 });
		}

		if (!action || (action !== 'approve' && action !== 'reject')) {
			return json(
				{ error: "Invalid action. Must be 'approve' or 'reject'" },
				{ status: 400 }
			);
		}

		if (action === 'reject') {
			if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
				return json(
					{ error: 'Rejection reason is required when rejecting a leave request' },
					{ status: 400 }
				);
			}
		}

		// 2. Query the targeted leave request
		const leaveRecord = await db.query.leaveRequests.findFirst({
			where: eq(schema.leaveRequests.id, leaveRequestId.trim()),
			with: {
				employee: true
			}
		});

		if (!leaveRecord) {
			return json(
				{ error: `Leave request with ID '${leaveRequestId}' not found` },
				{ status: 404 }
			);
		}

		const now = new Date().toISOString();
		const leaveYear = parseInt(leaveRecord.startDate.slice(0, 4), 10) || new Date().getFullYear();

		// 3. Resolve approver user details for audit trail
		let approverUser = null;
		if (approvedBy && typeof approvedBy === 'string') {
			approverUser = await db.query.users.findFirst({
				where: eq(schema.users.id, approvedBy.trim())
			});
		}

		// If approver not found by id, check if any HR/Admin user exists or create fallback author
		const authorId = approverUser?.id || (approvedBy ? approvedBy.trim() : leaveRecord.employee?.userId || 'system-admin');
		const authorName = approverUser?.name || 'HR Administrator';
		const approverId = approverUser?.id || (approvedBy ? approvedBy.trim() : null);

		// 4. Update the Leave Request record
		if (action === 'approve') {
			await db
				.update(schema.leaveRequests)
				.set({
					status: 'approved',
					approvedBy: approverId,
					rejectionReason: null,
					updatedAt: now
				})
				.where(eq(schema.leaveRequests.id, leaveRecord.id));

			// Deduct/Update leave balance
			let balance = (
				await db
					.select()
					.from(schema.leaveBalances)
					.where(
						and(
							eq(schema.leaveBalances.employeeId, leaveRecord.employeeId),
							eq(schema.leaveBalances.year, leaveYear)
						)
					)
					.limit(1)
			)[0];

			if (!balance) {
				const newBalanceId = crypto.randomUUID();
				await db.insert(schema.leaveBalances).values({
					id: newBalanceId,
					employeeId: leaveRecord.employeeId,
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
					employeeId: leaveRecord.employeeId,
					year: leaveYear,
					paidTimeOffTotal: 24,
					paidTimeOffUsed: 0,
					sickLeaveTotal: 7,
					sickLeaveUsed: 0,
					unpaidLeaveUsed: 0,
					updatedAt: now
				};
			}

			// Calculate updated balance fields
			let newPaidUsed = balance.paidTimeOffUsed;
			let newSickUsed = balance.sickLeaveUsed;
			let newUnpaidUsed = balance.unpaidLeaveUsed;

			if (leaveRecord.leaveType === 'paid_time_off') {
				newPaidUsed = Number((balance.paidTimeOffUsed + leaveRecord.totalDays).toFixed(2));
			} else if (leaveRecord.leaveType === 'sick_leave') {
				newSickUsed = Number((balance.sickLeaveUsed + leaveRecord.totalDays).toFixed(2));
			} else if (leaveRecord.leaveType === 'unpaid_leave') {
				newUnpaidUsed = Number((balance.unpaidLeaveUsed + leaveRecord.totalDays).toFixed(2));
			}

			await db
				.update(schema.leaveBalances)
				.set({
					paidTimeOffUsed: newPaidUsed,
					sickLeaveUsed: newSickUsed,
					unpaidLeaveUsed: newUnpaidUsed,
					updatedAt: now
				})
				.where(eq(schema.leaveBalances.id, balance.id));
		} else {
			// action === 'reject'
			await db
				.update(schema.leaveRequests)
				.set({
					status: 'rejected',
					approvedBy: approverId,
					rejectionReason: rejectionReason!.trim(),
					updatedAt: now
				})
				.where(eq(schema.leaveRequests.id, leaveRecord.id));
		}

		// 5. Insert audit log chatter entry
		const chatterMessage =
			action === 'approve'
				? `Leave request for ${leaveRecord.totalDays} day(s) (${leaveRecord.startDate} to ${leaveRecord.endDate}) was approved by ${authorName}.`
				: `Leave request for ${leaveRecord.totalDays} day(s) was rejected by ${authorName}. Reason: "${rejectionReason!.trim()}".`;

		await db.insert(schema.chatter).values({
			id: crypto.randomUUID(),
			entityType: 'leave',
			entityId: leaveRecord.id,
			authorId,
			authorName,
			authorAvatar: null,
			message: chatterMessage,
			type: 'status_change',
			metadata: {
				leaveRequestId: leaveRecord.id,
				action,
				totalDays: leaveRecord.totalDays,
				leaveType: leaveRecord.leaveType,
				status: action === 'approve' ? 'approved' : 'rejected',
				rejectionReason: action === 'reject' ? rejectionReason!.trim() : null
			},
			createdAt: now
		});

		// 6. Fetch updated leave and balance for response
		const updatedLeave = await db.query.leaveRequests.findFirst({
			where: eq(schema.leaveRequests.id, leaveRecord.id),
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

		const updatedBalance = (
			await db
				.select()
				.from(schema.leaveBalances)
				.where(
					and(
						eq(schema.leaveBalances.employeeId, leaveRecord.employeeId),
						eq(schema.leaveBalances.year, leaveYear)
					)
				)
				.limit(1)
		)[0] || null;

		return json(
			{
				success: true,
				action,
				leave: updatedLeave,
				balance: updatedBalance
			},
			{ status: 200 }
		);
	} catch (err: any) {
		console.error('Error approving/rejecting leave request:', err);
		return json(
			{ error: 'Failed to process leave approval action', details: err?.message },
			{ status: 500 }
		);
	}
};
