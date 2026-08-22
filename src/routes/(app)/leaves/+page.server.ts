import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { leaveBalances, leaveRequests } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { LeaveBalance, LeaveRequest, LeaveType, LeaveStatus } from '$lib/types/leaves';

export const load: PageServerLoad = async () => {
	try {
		// Attempt to load balances and requests from sqlite
		const allBalances = await db.select().from(leaveBalances);
		const allRequests = await db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));

		// Find balance for employee or provide standard enterprise default
		const defaultBalance: LeaveBalance = allBalances[0]
			? {
					id: allBalances[0].id,
					employeeId: allBalances[0].employeeId,
					year: allBalances[0].year,
					paidTimeOffTotal: allBalances[0].paidTimeOffTotal,
					paidTimeOffUsed: allBalances[0].paidTimeOffUsed,
					sickLeaveTotal: allBalances[0].sickLeaveTotal,
					sickLeaveUsed: allBalances[0].sickLeaveUsed,
					unpaidLeaveUsed: allBalances[0].unpaidLeaveUsed,
					updatedAt: allBalances[0].updatedAt
				}
			: {
					id: 'lb-default-01',
					employeeId: 'demo-emp-03',
					year: 2026,
					paidTimeOffTotal: 24,
					paidTimeOffUsed: 5,
					sickLeaveTotal: 7,
					sickLeaveUsed: 2,
					unpaidLeaveUsed: 0,
					updatedAt: new Date().toISOString()
				};

		// Format existing requests or provide realistic defaults
		const initialRequests: LeaveRequest[] = allRequests.length > 0
			? allRequests.map((r) => ({
					id: r.id,
					employeeId: r.employeeId,
					leaveType: r.leaveType as LeaveType,
					startDate: r.startDate,
					endDate: r.endDate,
					totalDays: r.totalDays,
					reason: r.reason,
					status: r.status as LeaveStatus,
					approvedBy: r.approvedBy,
					rejectionReason: r.rejectionReason,
					attachmentUrl: r.attachmentUrl,
					createdAt: r.createdAt,
					updatedAt: r.updatedAt
				}))
			: [
					{
						id: 'LR-2026-001',
						employeeId: 'demo-emp-03',
						leaveType: 'paid_time_off' as LeaveType,
						startDate: '2026-07-14',
						endDate: '2026-07-18',
						totalDays: 5,
						reason: 'Annual family summer vacation trip to Himachal.',
						status: 'approved' as LeaveStatus,
						approvedBy: 'demo-admin-01',
						createdAt: '2026-07-02T10:30:00Z',
						updatedAt: '2026-07-03T14:15:00Z'
					},
					{
						id: 'LR-2026-002',
						employeeId: 'demo-emp-03',
						leaveType: 'sick_leave' as LeaveType,
						startDate: '2026-08-04',
						endDate: '2026-08-05',
						totalDays: 2,
						reason: 'Severe viral fever and clinical consultation.',
						status: 'approved' as LeaveStatus,
						approvedBy: 'demo-hr-02',
						attachmentUrl: 'mock://medical_prescription.pdf',
						createdAt: '2026-08-04T08:00:00Z',
						updatedAt: '2026-08-04T09:30:00Z'
					},
					{
						id: 'LR-2026-003',
						employeeId: 'demo-emp-03',
						leaveType: 'paid_time_off' as LeaveType,
						startDate: '2026-09-10',
						endDate: '2026-09-12',
						totalDays: 3,
						reason: 'Attending cousin sister wedding ceremony.',
						status: 'pending' as LeaveStatus,
						createdAt: '2026-08-20T11:20:00Z',
						updatedAt: '2026-08-20T11:20:00Z'
					}
				];

		return {
			balance: defaultBalance,
			requests: initialRequests
		};
	} catch (error) {
		console.warn('Could not query sqlite, using mock leave data:', error);
		const defaultBalance: LeaveBalance = {
			id: 'lb-default-01',
			employeeId: 'demo-emp-03',
			year: 2026,
			paidTimeOffTotal: 24,
			paidTimeOffUsed: 5,
			sickLeaveTotal: 7,
			sickLeaveUsed: 2,
			unpaidLeaveUsed: 0,
			updatedAt: new Date().toISOString()
		};

		const defaultRequests: LeaveRequest[] = [
			{
				id: 'LR-2026-001',
				employeeId: 'demo-emp-03',
				leaveType: 'paid_time_off',
				startDate: '2026-07-14',
				endDate: '2026-07-18',
				totalDays: 5,
				reason: 'Annual family summer vacation trip to Himachal.',
				status: 'approved',
				approvedBy: 'demo-admin-01',
				createdAt: '2026-07-02T10:30:00Z',
				updatedAt: '2026-07-03T14:15:00Z'
			},
			{
				id: 'LR-2026-002',
				employeeId: 'demo-emp-03',
				leaveType: 'sick_leave',
				startDate: '2026-08-04',
				endDate: '2026-08-05',
				totalDays: 2,
				reason: 'Severe viral fever and clinical consultation.',
				status: 'approved',
				approvedBy: 'demo-hr-02',
				attachmentUrl: 'mock://medical_prescription.pdf',
				createdAt: '2026-08-04T08:00:00Z',
				updatedAt: '2026-08-04T09:30:00Z'
			},
			{
				id: 'LR-2026-003',
				employeeId: 'demo-emp-03',
				leaveType: 'paid_time_off',
				startDate: '2026-09-10',
				endDate: '2026-09-12',
				totalDays: 3,
				reason: 'Attending cousin sister wedding ceremony.',
				status: 'pending',
				createdAt: '2026-08-20T11:20:00Z',
				updatedAt: '2026-08-20T11:20:00Z'
			}
		];

		return {
			balance: defaultBalance,
			requests: defaultRequests
		};
	}
};
