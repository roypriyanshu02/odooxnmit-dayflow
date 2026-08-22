import type {
	LeaveType,
	LeaveStatus,
	LeaveBalance,
	LeaveBalanceSummary,
	LeaveRequest,
	LeaveRequestWithEmployee,
	CreateLeaveRequestInput,
	LeaveApprovalQueueItem
} from '$lib/types';

// ==========================================
// Filter & Sort Interfaces
// ==========================================

export type LeaveTypeFilter = LeaveType | 'all';
export type LeaveStatusFilter = LeaveStatus | 'all';

export interface LeaveFilterParams {
	leaveType?: LeaveTypeFilter;
	status?: LeaveStatusFilter;
	department?: string;
	searchQuery?: string;
	startDate?: string;
	endDate?: string;
	year?: number;
}

export type LeaveSortField =
	| 'createdAt'
	| 'startDate'
	| 'endDate'
	| 'totalDays'
	| 'status'
	| 'leaveType'
	| 'employeeName';

export type LeaveSortOrder = 'asc' | 'desc';

export interface LeaveSortParams {
	field: LeaveSortField;
	order: LeaveSortOrder;
}

// ==========================================
// Component Prop Interfaces
// ==========================================

export interface LeaveApplyModalProps {
	open: boolean;
	employeeId?: string;
	balanceSummary?: LeaveBalanceSummary | null;
	isSubmitting?: boolean;
	onClose?: () => void;
	onSubmit?: (input: CreateLeaveRequestInput) => Promise<void> | void;
	onSuccess?: (request: LeaveRequest) => void;
}

export interface LeaveBalanceCardProps {
	balance?: LeaveBalanceSummary | LeaveBalance | null;
	employeeName?: string;
	showApplyButton?: boolean;
	onApplyClick?: (leaveType?: LeaveType) => void;
	class?: string;
}

export interface LeaveHistoryTableProps {
	requests: (LeaveRequest | LeaveRequestWithEmployee)[];
	isLoading?: boolean;
	showEmployeeCol?: boolean;
	filter?: LeaveFilterParams;
	sort?: LeaveSortParams;
	onFilterChange?: (filter: LeaveFilterParams) => void;
	onSortChange?: (sort: LeaveSortParams) => void;
	onCancelRequest?: (requestId: string) => Promise<void> | void;
	onRowClick?: (request: LeaveRequest | LeaveRequestWithEmployee) => void;
	class?: string;
}

export interface ApprovalQueueCardProps {
	item: LeaveApprovalQueueItem | LeaveRequestWithEmployee;
	isProcessing?: boolean;
	onApprove?: (id: string) => Promise<void> | void;
	onReject?: (id: string, reason?: string) => Promise<void> | void;
	class?: string;
}

export interface MedicalCertificateUploadProps {
	value?: string | null;
	required?: boolean;
	disabled?: boolean;
	maxSizeMb?: number;
	acceptedFileTypes?: string[];
	onUploadComplete?: (url: string) => void;
	onRemove?: () => void;
	onError?: (error: string) => void;
	class?: string;
}
