export type LeaveType = 'paid_time_off' | 'sick_leave' | 'unpaid_leave';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export const DEFAULT_LEAVE_QUOTAS = {
	paid_time_off: 24,
	sick_leave: 7,
	unpaid_leave: Infinity
} as const;

export interface LeaveQuotaConfig {
	paidTimeOff: number;
	sickLeave: number;
	unpaidLeave?: number;
}

export const DEFAULT_LEAVE_QUOTA_CONFIG: LeaveQuotaConfig = {
	paidTimeOff: 24,
	sickLeave: 7
};

export interface LeaveBalance {
	id: string;
	employeeId: string;
	year: number;
	paidTimeOffTotal: number;
	paidTimeOffUsed: number;
	sickLeaveTotal: number;
	sickLeaveUsed: number;
	unpaidLeaveUsed: number;
	updatedAt: string;
}

export interface LeaveBalanceItemSummary {
	total: number;
	used: number;
	remaining: number;
	pending: number;
}

export interface LeaveBalanceSummary {
	employeeId: string;
	year: number;
	paidTimeOff: LeaveBalanceItemSummary;
	sickLeave: LeaveBalanceItemSummary;
	unpaidLeave: {
		used: number;
		pending: number;
	};
	totalAllocatedDays: number;
	totalUsedDays: number;
	totalRemainingDays: number;
	totalPendingDays: number;
}

export interface LeaveRequest {
	id: string;
	employeeId: string;
	leaveType: LeaveType;
	startDate: string; // YYYY-MM-DD
	endDate: string; // YYYY-MM-DD
	totalDays: number;
	reason: string;
	status: LeaveStatus;
	approvedBy?: string | null;
	rejectionReason?: string | null;
	attachmentUrl?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface LeaveRequestWithEmployee extends LeaveRequest {
	employee: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		jobTitle: string;
		department: string;
		avatarUrl?: string | null;
	};
	approver?: {
		id: string;
		name: string;
		email: string;
	} | null;
}

export interface CreateLeaveRequestInput {
	employeeId: string;
	leaveType: LeaveType;
	startDate: string; // YYYY-MM-DD
	endDate: string; // YYYY-MM-DD
	totalDays?: number;
	reason: string;
	attachmentUrl?: string | null;
}

export interface ReviewLeaveRequestInput {
	requestId: string;
	status: 'approved' | 'rejected';
	approvedBy: string;
	rejectionReason?: string | null;
}

export interface LeaveCalendarEntry {
	id: string;
	requestId: string;
	employeeId: string;
	employeeName: string;
	employeeAvatar?: string | null;
	department: string;
	leaveType: LeaveType;
	startDate: string; // YYYY-MM-DD
	endDate: string; // YYYY-MM-DD
	totalDays: number;
	status: LeaveStatus;
}

export interface LeaveApprovalQueueItem {
	id: string;
	employeeId: string;
	employeeName: string;
	employeeAvatar?: string | null;
	jobTitle: string;
	department: string;
	leaveType: LeaveType;
	startDate: string; // YYYY-MM-DD
	endDate: string; // YYYY-MM-DD
	totalDays: number;
	reason: string;
	status: LeaveStatus;
	attachmentUrl?: string | null;
	createdAt: string;
	ptoRemaining?: number;
	sickLeaveRemaining?: number;
}
