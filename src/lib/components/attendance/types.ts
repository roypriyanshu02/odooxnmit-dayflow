/**
 * Attendance Component Prop Types
 * Dayflow HRMS - Odoo-inspired Attendance Module
 */

import type {
	AttendanceRecord,
	AttendanceBreak,
	AttendanceSessionState,
	LiveStopwatchState,
	StopwatchStatus,
	DailyAttendanceSummary,
	WeeklyAttendanceSummary,
	AttendanceFilterCriteria,
	AttendanceWithEmployee
} from '$lib/types/attendance';

export interface SystrayStopwatchProps {
	employeeId: string;
	employeeName?: string;
	initialSession?: AttendanceSessionState | null;
	onCheckIn?: (timestamp: string) => Promise<void> | void;
	onCheckOut?: (timestamp: string) => Promise<void> | void;
	onBreakStart?: (reason?: string) => Promise<void> | void;
	onBreakEnd?: () => Promise<void> | void;
	compact?: boolean;
	class?: string;
}

export interface WorkTimerProps {
	elapsedSeconds: number;
	status: StopwatchStatus;
	breakSeconds?: number;
	size?: 'sm' | 'md' | 'lg';
	showSeconds?: boolean;
	showControls?: boolean;
	class?: string;
}

export interface BreakModalProps {
	open: boolean;
	currentBreakSeconds?: number;
	breakLimitMinutes?: number; // Default: 60 mins (1-hour limit alert)
	initialReason?: string;
	onClose?: () => void;
	onStartBreak?: (reason: string) => Promise<void> | void;
	onEndBreak?: () => Promise<void> | void;
}

export interface AttendanceTableProps {
	records: AttendanceWithEmployee[];
	isLoading?: boolean;
	showEmployeeColumns?: boolean;
	isAdminView?: boolean;
	onViewBreaks?: (record: AttendanceRecord) => void;
	onEditRecord?: (record: AttendanceRecord) => void;
	class?: string;
}

export interface WeeklySummaryCardProps {
	summary: WeeklyAttendanceSummary;
	isLoading?: boolean;
	onPreviousWeek?: () => void;
	onNextWeek?: () => void;
	onCurrentWeek?: () => void;
	class?: string;
}

export interface AttendanceAdminFilterProps {
	filters: AttendanceFilterCriteria;
	departments?: string[];
	onFilterChange: (filters: AttendanceFilterCriteria) => void;
	onResetFilters?: () => void;
	onExportCsv?: () => void;
	isExporting?: boolean;
	class?: string;
}
