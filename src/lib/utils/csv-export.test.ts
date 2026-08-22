import { describe, it, expect } from 'bun:test';
import {
	CSV_HEADERS,
	escapeCsvField,
	formatCsvTime,
	computeOvertimeHours,
	computeWorkHours,
	generateAttendanceCsv,
	exportAttendanceToCsv
} from './csv-export';
import type { AttendanceWithEmployee } from '$lib/types/attendance';

describe('CSV Export Utility (csv-export.ts)', () => {
	describe('escapeCsvField', () => {
		it('should return empty string for null and undefined', () => {
			expect(escapeCsvField(null)).toBe('');
			expect(escapeCsvField(undefined)).toBe('');
		});

		it('should return plain string as-is when no special characters are present', () => {
			expect(escapeCsvField('Engineering')).toBe('Engineering');
			expect(escapeCsvField('OIPRRO20260001')).toBe('OIPRRO20260001');
			expect(escapeCsvField(42)).toBe('42');
		});

		it('should wrap in double quotes if string contains a comma', () => {
			expect(escapeCsvField('Engineering, DevOps')).toBe('"Engineering, DevOps"');
		});

		it('should escape double quotes by doubling them and wrapping in double quotes', () => {
			expect(escapeCsvField('John "The Boss" Doe')).toBe('"John ""The Boss"" Doe"');
		});

		it('should wrap in double quotes if string contains newline or carriage return', () => {
			expect(escapeCsvField('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
			expect(escapeCsvField('Line 1\r\nLine 2')).toBe('"Line 1\r\nLine 2"');
		});
	});

	describe('formatCsvTime', () => {
		it('should return empty string for null or undefined', () => {
			expect(formatCsvTime(null)).toBe('');
			expect(formatCsvTime(undefined)).toBe('');
		});

		it('should preserve standard time strings', () => {
			expect(formatCsvTime('09:00 AM')).toBe('09:00 AM');
			expect(formatCsvTime('18:30')).toBe('18:30');
		});

		it('should parse ISO timestamp strings', () => {
			const time = formatCsvTime('2026-08-22T09:30:00.000Z');
			expect(time).toBeTruthy();
			expect(typeof time).toBe('string');
		});
	});

	describe('computeOvertimeHours', () => {
		it('should return explicit overtime hours when overtimeMinutes is provided', () => {
			expect(computeOvertimeHours({ overtimeMinutes: 90 })).toBe('1.50');
			expect(computeOvertimeHours({ overtimeMinutes: 60 })).toBe('1.00');
			expect(computeOvertimeHours({ overtimeMinutes: 0 })).toBe('0.00');
		});

		it('should compute overtime when totalWorkMinutes exceeds 480 minutes (8 hours)', () => {
			// 9 hours = 540 minutes -> 1 hour overtime
			expect(computeOvertimeHours({ totalWorkMinutes: 540 })).toBe('1.00');
			// 10.5 hours = 630 minutes -> 2.5 hours overtime
			expect(computeOvertimeHours({ totalWorkMinutes: 630 })).toBe('2.50');
		});

		it('should return 0.00 when work minutes are within 8 hours standard shift', () => {
			expect(computeOvertimeHours({ totalWorkMinutes: 480 })).toBe('0.00');
			expect(computeOvertimeHours({ totalWorkMinutes: 360 })).toBe('0.00');
			expect(computeOvertimeHours({})).toBe('0.00');
		});
	});

	describe('computeWorkHours', () => {
		it('should convert minutes to decimal hours formatted to 2 places', () => {
			expect(computeWorkHours(480)).toBe('8.00');
			expect(computeWorkHours(510)).toBe('8.50');
			expect(computeWorkHours(0)).toBe('0.00');
			expect(computeWorkHours(null)).toBe('0.00');
		});
	});

	describe('generateAttendanceCsv & exportAttendanceToCsv', () => {
		const sampleRecords: AttendanceWithEmployee[] = [
			{
				id: 'att-1',
				employeeId: 'OIPRRO20260001',
				date: '2026-08-22',
				checkIn: '09:00 AM',
				checkOut: '06:00 PM',
				totalWorkMinutes: 510,
				totalBreakMinutes: 30,
				overtimeMinutes: 30,
				status: 'present',
				createdAt: '2026-08-22T09:00:00.000Z',
				updatedAt: '2026-08-22T18:00:00.000Z',
				employee: {
					id: 'OIPRRO20260001',
					firstName: 'Priyanshu',
					lastName: 'Roy',
					email: 'priyanshu@dayflow.corp',
					jobTitle: 'Senior Software Engineer',
					department: 'Engineering, Core',
					avatarUrl: null
				}
			},
			{
				id: 'att-2',
				employeeId: 'OIANIY20260005',
				date: '2026-08-22',
				checkIn: null,
				checkOut: null,
				totalWorkMinutes: 0,
				totalBreakMinutes: 0,
				overtimeMinutes: 0,
				status: 'absent',
				createdAt: '2026-08-22T00:00:00.000Z',
				updatedAt: '2026-08-22T00:00:00.000Z',
				employee: {
					id: 'OIANIY20260005',
					firstName: 'Ananya "HR"',
					lastName: 'Iyer',
					email: 'ananya@dayflow.corp',
					jobTitle: 'HR Specialist',
					department: 'People Operations',
					avatarUrl: null
				}
			}
		];

		it('should include the UTF-8 BOM prefix for Excel compatibility', () => {
			const csv = generateAttendanceCsv(sampleRecords);
			expect(csv.startsWith('\uFEFF')).toBe(true);
			expect(csv.charCodeAt(0)).toBe(0xFEFF);
		});

		it('should include exact required CSV header columns', () => {
			const csv = generateAttendanceCsv(sampleRecords);
			const lines = csv.replace('\uFEFF', '').split('\r\n');
			expect(lines[0]).toBe(
				'Employee ID,Employee Name,Department,Date,Check In,Check Out,Work Hours,Break Minutes,Overtime Hours,Status'
			);
		});

		it('should properly format and escape records with special characters and commas', () => {
			const csv = generateAttendanceCsv(sampleRecords);
			const lines = csv.replace('\uFEFF', '').split('\r\n');
			expect(lines.length).toBe(3);

			// First record has department with comma "Engineering, Core"
			expect(lines[1]).toContain('"Engineering, Core"');
			expect(lines[1]).toContain('OIPRRO20260001');
			expect(lines[1]).toContain('Priyanshu Roy');
			expect(lines[1]).toContain('8.50'); // 510 minutes / 60
			expect(lines[1]).toContain('30'); // Break minutes
			expect(lines[1]).toContain('0.50'); // Overtime 30 mins

			// Second record has quotes in name and null check in/out
			expect(lines[2]).toContain('"Ananya ""HR"" Iyer"');
			expect(lines[2]).toContain('absent');
			expect(lines[2]).toContain('0.00');
		});

		it('exportAttendanceToCsv should return generated CSV string', () => {
			const output = exportAttendanceToCsv(sampleRecords, 'test_export.csv');
			expect(output.startsWith('\uFEFF')).toBe(true);
			expect(output).toContain('OIPRRO20260001');
		});

		it('should handle empty records list gracefully', () => {
			const csv = generateAttendanceCsv([]);
			expect(csv.startsWith('\uFEFF')).toBe(true);
			const lines = csv.replace('\uFEFF', '').split('\r\n');
			expect(lines.length).toBe(1);
			expect(lines[0]).toBe(
				'Employee ID,Employee Name,Department,Date,Check In,Check Out,Work Hours,Break Minutes,Overtime Hours,Status'
			);
		});
	});
});
