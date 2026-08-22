/**
 * Attendance CSV Export Utility
 * Dayflow HRMS - Odoo-inspired Attendance & Time Tracking
 */

import type { AttendanceRecord, AttendanceWithEmployee } from '$lib/types/attendance';

export const CSV_HEADERS = [
	'Employee ID',
	'Employee Name',
	'Department',
	'Date',
	'Check In',
	'Check Out',
	'Work Hours',
	'Break Minutes',
	'Overtime Hours',
	'Status'
] as const;

/**
 * Escapes a single CSV field following RFC 4180 rules.
 * Wraps in double quotes if the field contains commas, double quotes, or newlines.
 * Escapes internal double quotes by doubling them.
 */
export function escapeCsvField(value: unknown): string {
	if (value === null || value === undefined) {
		return '';
	}

	const stringValue = String(value);

	// If value contains quotes, commas, or newlines, quote and escape it
	if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}

	return stringValue;
}

/**
 * Formats time from ISO string or time string for CSV export.
 */
export function formatCsvTime(isoOrTime?: string | null): string {
	if (!isoOrTime) return '';
	// If it's already a short time string like "09:00" or "09:00:00" or "09:00 AM"
	if (/^\d{1,2}:\d{2}(:\d{2})?(\s?[AP]M)?$/i.test(isoOrTime)) {
		return isoOrTime;
	}
	try {
		const d = new Date(isoOrTime);
		if (isNaN(d.getTime())) return isoOrTime;
		return d.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true
		});
	} catch {
		return isoOrTime;
	}
}

/**
 * Computes overtime hours from total work minutes or explicit overtime minutes.
 * Standard workday is 8 hours (480 minutes).
 */
export function computeOvertimeHours(record: Partial<AttendanceRecord>): string {
	if (typeof record.overtimeMinutes === 'number' && record.overtimeMinutes > 0) {
		return (record.overtimeMinutes / 60).toFixed(2);
	}
	if (typeof record.totalWorkMinutes === 'number' && record.totalWorkMinutes > 480) {
		return ((record.totalWorkMinutes - 480) / 60).toFixed(2);
	}
	return '0.00';
}

/**
 * Computes work hours formatted to 2 decimal places from work minutes.
 */
export function computeWorkHours(totalWorkMinutes?: number | null): string {
	if (!totalWorkMinutes || totalWorkMinutes <= 0) {
		return '0.00';
	}
	return (totalWorkMinutes / 60).toFixed(2);
}

/**
 * Converts a list of attendance records into a CSV formatted string with UTF-8 BOM.
 */
export function generateAttendanceCsv(
	records: (AttendanceRecord | AttendanceWithEmployee)[]
): string {
	const headerRow = CSV_HEADERS.map(escapeCsvField).join(',');

	const dataRows = records.map((record) => {
		const rec = record as AttendanceWithEmployee;
		const employeeId = rec.employee?.id ?? rec.employeeId ?? '';
		const employeeName = rec.employee
			? `${rec.employee.firstName || ''} ${rec.employee.lastName || ''}`.trim()
			: '';
		const department = rec.employee?.department ?? '';
		const date = rec.date ?? '';
		const checkIn = formatCsvTime(rec.checkIn);
		const checkOut = formatCsvTime(rec.checkOut);
		const workHours = computeWorkHours(rec.totalWorkMinutes);
		const breakMinutes = rec.totalBreakMinutes ?? 0;
		const overtimeHours = computeOvertimeHours(rec);
		const status = rec.status ?? 'present';

		const rowValues = [
			employeeId,
			employeeName,
			department,
			date,
			checkIn,
			checkOut,
			workHours,
			breakMinutes,
			overtimeHours,
			status
		];

		return rowValues.map(escapeCsvField).join(',');
	});

	// Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
	return '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
}

/**
 * Exports attendance records to CSV. In a browser environment, triggers a file download.
 * Always returns the generated CSV string.
 */
export function exportAttendanceToCsv(
	records: (AttendanceRecord | AttendanceWithEmployee)[],
	filename?: string
): string {
	const defaultFilename = `attendance_export_${new Date().toISOString().slice(0, 10)}.csv`;
	const finalFilename = filename || defaultFilename;
	const csvContent = generateAttendanceCsv(records);

	if (typeof window !== 'undefined' && typeof document !== 'undefined') {
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute(
			'download',
			finalFilename.endsWith('.csv') ? finalFilename : `${finalFilename}.csv`
		);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	return csvContent;
}
