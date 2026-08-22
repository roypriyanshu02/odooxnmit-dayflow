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

/**
 * Calculates working business days between start and end dates (excluding Saturdays and Sundays).
 */
export function calculateBusinessDays(startDateStr: string, endDateStr: string): number {
	const start = new Date(startDateStr + 'T00:00:00Z');
	const end = new Date(endDateStr + 'T00:00:00Z');

	if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
		return 0;
	}

	let count = 0;
	const cur = new Date(start);
	while (cur <= end) {
		const day = cur.getUTCDay();
		if (day !== 0 && day !== 6) {
			count++;
		}
		cur.setUTCDate(cur.getUTCDate() + 1);
	}
	return count;
}

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
	totalDays: number;
	reason: string;
	attachmentUrl?: string | null;
	attachmentName?: string | null;
}

export type CreateLeaveRequestPayload = CreateLeaveRequestInput;

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

export interface LeaveTypeColors {
	primary: string;
	badgeBg: string;
	badgeText: string;
	ring: string;
	gradient: string;
	text: string;
}

export interface LeaveTypeConfigItem {
	id: LeaveType;
	title: string;
	shortName: string;
	label: string;
	badge: string;
	allowanceUnit: string;
	defaultAllowance: number;
	description: string;
	color: LeaveTypeColors;
}

export const LEAVE_TYPES_CONFIG: Record<LeaveType, LeaveTypeConfigItem> = {
	paid_time_off: {
		id: 'paid_time_off',
		title: 'Paid Time Off',
		shortName: 'PTO',
		label: 'Paid Time Off (PTO)',
		badge: 'PTO',
		allowanceUnit: '24 days/yr',
		defaultAllowance: 24,
		description: 'Annual vacation, family obligations, and personal leave',
		color: {
			primary: '#10b981',
			badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
			badgeText: 'text-emerald-600 dark:text-emerald-400',
			ring: 'stroke-emerald-500',
			gradient: 'from-emerald-500 to-teal-500',
			text: 'text-emerald-600 dark:text-emerald-400'
		}
	},
	sick_leave: {
		id: 'sick_leave',
		title: 'Sick Leave',
		shortName: 'Sick',
		label: 'Sick Leave',
		badge: 'Sick',
		allowanceUnit: '7 days/yr',
		defaultAllowance: 7,
		description: 'Medical appointments, illness, wellness and recovery',
		color: {
			primary: '#f59e0b',
			badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
			badgeText: 'text-amber-600 dark:text-amber-400',
			ring: 'stroke-amber-500',
			gradient: 'from-amber-500 to-orange-500',
			text: 'text-amber-600 dark:text-amber-400'
		}
	},
	unpaid_leave: {
		id: 'unpaid_leave',
		title: 'Unpaid Leave',
		shortName: 'Unpaid',
		label: 'Unpaid Leave (Loss of Pay)',
		badge: 'Loss of Pay',
		allowanceUnit: 'No Quota',
		defaultAllowance: 0,
		description: 'Extended leaves beyond standard allowances with salary deduction',
		color: {
			primary: '#f43f5e',
			badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
			badgeText: 'text-rose-600 dark:text-rose-400',
			ring: 'stroke-rose-500',
			gradient: 'from-rose-500 to-red-500',
			text: 'text-rose-600 dark:text-rose-400'
		}
	}
};

export interface WorkingDaysCalculation {
	workingDays: number;
	weekendDays: number;
	totalCalendarDays: number;
	isValid: boolean;
}

export function calculateWorkingDays(startDateStr: string, endDateStr: string): WorkingDaysCalculation {
	if (!startDateStr || !endDateStr) {
		return { workingDays: 0, weekendDays: 0, totalCalendarDays: 0, isValid: false };
	}
	const start = new Date(startDateStr);
	const end = new Date(endDateStr);
	if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
		return { workingDays: 0, weekendDays: 0, totalCalendarDays: 0, isValid: false };
	}

	let workingDays = 0;
	let weekendDays = 0;
	let totalCalendarDays = 0;

	const cur = new Date(start);
	while (cur <= end) {
		totalCalendarDays++;
		const day = cur.getDay();
		if (day === 0 || day === 6) {
			weekendDays++;
		} else {
			workingDays++;
		}
		cur.setDate(cur.getDate() + 1);
	}

	return { workingDays, weekendDays, totalCalendarDays, isValid: true };
}

