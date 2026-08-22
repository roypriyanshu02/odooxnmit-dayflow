import { describe, it, expect } from 'bun:test';
import {
	generateEmployeeId,
	parseEmployeeId,
	formatEmployeeSerial,
	extractNameCode,
	isValidEmployeeId
} from './employee-id';

describe('Employee ID Utilities', () => {
	describe('extractNameCode', () => {
		it('should extract first 2 uppercase letters of standard name', () => {
			expect(extractNameCode('Priyanshu')).toBe('PR');
			expect(extractNameCode('Roy')).toBe('RO');
			expect(extractNameCode('Aarav')).toBe('AA');
			expect(extractNameCode('Sharma')).toBe('SH');
		});

		it('should handle single-letter short names with X padding', () => {
			expect(extractNameCode('A')).toBe('AX');
			expect(extractNameCode('Z')).toBe('ZX');
		});

		it('should handle empty, null, and undefined inputs with fallback XX', () => {
			expect(extractNameCode('')).toBe('XX');
			expect(extractNameCode(null)).toBe('XX');
			expect(extractNameCode(undefined)).toBe('XX');
			expect(extractNameCode('   ')).toBe('XX');
		});

		it('should strip non-alphabetic characters and handle hyphenated/spaced names', () => {
			expect(extractNameCode('Jean-Luc')).toBe('JE');
			expect(extractNameCode('O\'Connor')).toBe('OC');
			expect(extractNameCode('Mary Jane')).toBe('MA');
			expect(extractNameCode('123')).toBe('XX');
			expect(extractNameCode('A-1')).toBe('AX');
		});

		it('should normalize accented and diacritic characters', () => {
			expect(extractNameCode('Hélène')).toBe('HE');
			expect(extractNameCode('Côté')).toBe('CO');
			expect(extractNameCode('Élodie')).toBe('EL');
			expect(extractNameCode('Müller')).toBe('MU');
		});
	});

	describe('formatEmployeeSerial', () => {
		it('should format numbers into zero-padded 4-digit serial strings', () => {
			expect(formatEmployeeSerial(1)).toBe('0001');
			expect(formatEmployeeSerial(42)).toBe('0042');
			expect(formatEmployeeSerial(999)).toBe('0999');
			expect(formatEmployeeSerial(1000)).toBe('1000');
			expect(formatEmployeeSerial(9999)).toBe('9999');
		});

		it('should support numbers > 9999 gracefully', () => {
			expect(formatEmployeeSerial(10000)).toBe('10000');
		});

		it('should parse numeric strings correctly', () => {
			expect(formatEmployeeSerial('7')).toBe('0007');
			expect(formatEmployeeSerial('0042')).toBe('0042');
			expect(formatEmployeeSerial('1234')).toBe('1234');
		});

		it('should fallback to 0001 for invalid or negative inputs', () => {
			expect(formatEmployeeSerial(NaN)).toBe('0001');
			expect(formatEmployeeSerial(-5)).toBe('0001');
			expect(formatEmployeeSerial('invalid')).toBe('0001');
		});
	});

	describe('generateEmployeeId', () => {
		it('should generate valid standard employee ID (Priyanshu Roy, 2026, 1)', () => {
			const id = generateEmployeeId('Priyanshu', 'Roy', 2026, 1);
			expect(id).toBe('OIPRRO20260001');
		});

		it('should generate correct IDs for standard employee seed data', () => {
			expect(generateEmployeeId('Aarav', 'Sharma', 2026, 1)).toBe('OIAASH20260001');
			expect(generateEmployeeId('Priya', 'Nair', 2026, 2)).toBe('OIPRNA20260002');
			expect(generateEmployeeId('Rohan', 'Verma', 2026, 3)).toBe('OIROVE20260003');
			expect(generateEmployeeId('Vikram', 'Malhotra', 2026, 4)).toBe('OIVIMA20260004');
			expect(generateEmployeeId('Ananya', 'Iyer', 2026, 5)).toBe('OIANIY20260005');
			expect(generateEmployeeId('Dev', 'Patel', 2026, 6)).toBe('OIDEPA20260006');
		});

		it('should handle single name fallback with XX (e.g. Cher, Madonna)', () => {
			expect(generateEmployeeId('Cher', null, 2026, 1)).toBe('OICHXX20260001');
			expect(generateEmployeeId('Madonna', undefined, 2026, 5)).toBe('OIMAXX20260005');
			expect(generateEmployeeId('Prince', '', 2026, 12)).toBe('OIPRXX20260012');
			expect(generateEmployeeId('Plato', '   ', 2026, 99)).toBe('OIPLXX20260099');
		});

		it('should handle short first/last names (< 2 letters)', () => {
			expect(generateEmployeeId('A', 'Li', 2026, 1)).toBe('OIAXLI20260001');
			expect(generateEmployeeId('Al', 'O', 2026, 7)).toBe('OIALOX20260007');
			expect(generateEmployeeId('U', 'I', 2026, 10)).toBe('OIUXIX20260010');
		});

		it('should handle hyphenated and compound names', () => {
			expect(generateEmployeeId('Jean-Luc', 'Picard', 2026, 1)).toBe('OIJEPI20260001');
			expect(generateEmployeeId('Mary Jane', 'Watson-Parker', 2026, 42)).toBe('OIMAWA20260042');
			expect(generateEmployeeId('Anne-Marie', 'Saint-Pierre', 2026, 100)).toBe('OIANSA20260100');
		});

		it('should handle accented international names', () => {
			expect(generateEmployeeId('Hélène', 'Côté', 2026, 8)).toBe('OIHECO20260008');
			expect(generateEmployeeId('Jürgen', 'Klopp', 2026, 4)).toBe('OIJUKL20260004');
		});

		it('should default year to current year if omitted or invalid', () => {
			const currentYear = new Date().getFullYear();
			const id = generateEmployeeId('John', 'Doe');
			expect(id).toBe(`OIJODO${currentYear}0001`);
		});

		it('should handle year as string or number', () => {
			expect(generateEmployeeId('John', 'Doe', '2025', 10)).toBe('OIJODO20250010');
			expect(generateEmployeeId('John', 'Doe', 2026, '50')).toBe('OIJODO20260050');
		});
	});

	describe('isValidEmployeeId', () => {
		it('should return true for valid Dayflow Employee IDs', () => {
			expect(isValidEmployeeId('OIPRRO20260001')).toBe(true);
			expect(isValidEmployeeId('OICHXX20260001')).toBe(true);
			expect(isValidEmployeeId('OIARSH20250012')).toBe(true);
		});

		it('should be case-insensitive and handle whitespace', () => {
			expect(isValidEmployeeId('oiprro20260001')).toBe(true);
			expect(isValidEmployeeId('  OIPRRO20260001  ')).toBe(true);
		});

		it('should return false for malformed IDs', () => {
			expect(isValidEmployeeId('XXPRRO20260001')).toBe(false); // wrong prefix
			expect(isValidEmployeeId('OIPR1220260001')).toBe(false); // digits in name code
			expect(isValidEmployeeId('OIPRRO260001')).toBe(false); // short year
			expect(isValidEmployeeId('OIPRRO20261')).toBe(false); // short serial
			expect(isValidEmployeeId('')).toBe(false);
			expect(isValidEmployeeId('INVALID')).toBe(false);
			expect(isValidEmployeeId(null as unknown as string)).toBe(false);
		});
	});

	describe('parseEmployeeId', () => {
		it('should parse valid employee ID into structured object', () => {
			const result = parseEmployeeId('OIPRRO20260001');
			expect(result.isValid).toBe(true);
			expect(result.raw).toBe('OIPRRO20260001');
			expect(result.prefix).toBe('OI');
			expect(result.firstNameCode).toBe('PR');
			expect(result.lastNameCode).toBe('RO');
			expect(result.year).toBe(2026);
			expect(result.serial).toBe(1);
			expect(result.formattedSerial).toBe('0001');
		});

		it('should parse single-name fallback employee IDs', () => {
			const result = parseEmployeeId('OICHXX20260042');
			expect(result.isValid).toBe(true);
			expect(result.firstNameCode).toBe('CH');
			expect(result.lastNameCode).toBe('XX');
			expect(result.year).toBe(2026);
			expect(result.serial).toBe(42);
			expect(result.formattedSerial).toBe('0042');
		});

		it('should handle lowercase or spaced inputs seamlessly', () => {
			const result = parseEmployeeId('  oiprna20240015  ');
			expect(result.isValid).toBe(true);
			expect(result.firstNameCode).toBe('PR');
			expect(result.lastNameCode).toBe('NA');
			expect(result.year).toBe(2024);
			expect(result.serial).toBe(15);
			expect(result.formattedSerial).toBe('0015');
		});

		it('should return isValid: false for malformed or invalid IDs', () => {
			expect(parseEmployeeId('INVALID').isValid).toBe(false);
			expect(parseEmployeeId('XXPRRO20260001').isValid).toBe(false);
			expect(parseEmployeeId('').isValid).toBe(false);
			expect(parseEmployeeId(null as unknown as string).isValid).toBe(false);
		});
	});
});
