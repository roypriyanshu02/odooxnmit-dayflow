/**
 * Attendance & Time Tracking Types
 * Dayflow HRMS - Odoo-inspired Attendance Module
 */

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'on_leave';
export type AttendanceDisplayStatus = 'present' | 'absent' | 'on_leave';
export type StopwatchStatus = 'active' | 'paused' | 'checked_out' | 'on_break';

export type BreakReasonType = 'lunch' | 'tea' | 'personal' | 'meeting' | 'other' | (string & {});

export interface AttendanceBreak {
	id: string;
	attendanceId: string;
	employeeId: string;
	startTime: string; // ISO timestamp
	endTime?: string | null; // ISO timestamp
	durationMinutes: number;
	reason?: string | null;
	createdAt?: string;
}

export interface AttendanceRecord {
	id: string;
	employeeId: string;
	date: string; // YYYY-MM-DD
	checkIn?: string | null; // ISO timestamp
	checkOut?: string | null; // ISO timestamp
	totalWorkMinutes: number;
	totalBreakMinutes: number;
	overtimeMinutes: number;
	status: AttendanceStatus;
	breaks?: AttendanceBreak[];
	createdAt: string;
	updatedAt: string;
}

export interface AttendanceWithEmployee extends AttendanceRecord {
	employee?: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		jobTitle: string;
		department: string;
		avatarUrl?: string | null;
	};
}

export interface AttendanceSessionState {
	date: string; // YYYY-MM-DD
	recordId?: string | null;
	employeeId: string;
	isCheckedIn: boolean;
	isOnBreak: boolean;
	checkInTime?: string | null; // ISO timestamp
	checkOutTime?: string | null; // ISO timestamp
	currentBreakStartTime?: string | null; // ISO timestamp
	currentBreakReason?: string | null;
	totalWorkSeconds: number;
	totalBreakSeconds: number;
	breaks: AttendanceBreak[];
}

export interface LiveStopwatchState {
	status: StopwatchStatus;
	elapsedSeconds: number;
	breakSeconds: number;
	currentBreakReason?: string | null;
	checkInTime?: string | null; // ISO timestamp
	lastBreakStartTime?: string | null; // ISO timestamp
}

export interface DailyAttendanceSummary {
	date: string; // YYYY-MM-DD
	totalEmployees: number;
	presentCount: number;
	absentCount: number;
	halfDayCount: number;
	onLeaveCount: number;
	attendanceRate: number; // percentage (0-100)
	avgWorkMinutes: number;
	totalOvertimeMinutes: number;
}

export interface WeeklyAttendanceDay {
	date: string; // YYYY-MM-DD
	dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' | string;
	workMinutes: number;
	breakMinutes: number;
	overtimeMinutes: number;
	status: AttendanceStatus;
	checkIn?: string | null;
	checkOut?: string | null;
}

export interface OvertimeBreakdown {
	standardMinutes: number; // Regular 8h/day (480 mins per workday)
	overtimeMinutes: number; // Excess beyond standard
	totalPayableMinutes: number; // standard + overtime
	overtimeHours: number; // Formatted hours e.g. 2.5
	isOvertimeThresholdMet: boolean;
}

export interface WeeklyAttendanceSummary {
	weekStartDate: string; // YYYY-MM-DD
	weekEndDate: string; // YYYY-MM-DD
	days: WeeklyAttendanceDay[];
	totalWorkMinutes: number;
	totalBreakMinutes: number;
	totalOvertimeMinutes: number;
	expectedWorkMinutes: number;
	completedDays: number;
	presentDays: number;
	leaveDays: number;
	absentDays: number;
	overtimeBreakdown: OvertimeBreakdown;
}

export interface AttendanceFilterCriteria {
	searchQuery?: string;
	department?: string;
	status?: AttendanceStatus | 'all';
	startDate?: string; // YYYY-MM-DD
	endDate?: string; // YYYY-MM-DD
	employeeId?: string;
	page?: number;
	limit?: number;
	sortBy?: 'date' | 'employeeName' | 'totalWorkMinutes' | 'checkIn' | 'checkOut';
	sortOrder?: 'asc' | 'desc';
}

export interface CsvExportOptions {
	filename?: string;
	includeBreaks?: boolean;
	includeEmployeeDetails?: boolean;
	dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'ISO';
	columns?: string[];
}
