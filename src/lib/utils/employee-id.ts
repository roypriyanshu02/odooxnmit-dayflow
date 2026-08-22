/**
 * Employee ID Utility Module
 * 
 * Generates, parses, and validates standardized Employee IDs for Dayflow HRMS.
 * 
 * Formula: OI + FN (2 uppercase letters) + LN (2 uppercase letters) + YYYY (4 digits) + SSSS (4 digits)
 * Example: Priyanshu Roy (2026, serial 1) -> OIPRRO20260001
 * Single Name: Cher (2026, serial 1) -> OICHXX20260001
 */

export interface ParsedEmployeeId {
	isValid: boolean;
	raw: string;
	prefix?: string;
	firstNameCode?: string;
	lastNameCode?: string;
	year?: number;
	serial?: number;
	formattedSerial?: string;
}

/**
 * Sanitizes and normalizes name string into 2 uppercase alpha characters.
 * Handles accented characters, punctuation, spaces, and short strings.
 * Falls back to padding with 'X'.
 */
export function extractNameCode(name?: string | null): string {
	if (!name || typeof name !== 'string') {
		return 'XX';
	}

	// Normalize accented/diacritic characters (e.g., 'é' -> 'e')
	const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

	// Remove non-alphabetic characters
	const cleaned = normalized.replace(/[^a-zA-Z]/g, '').toUpperCase();

	if (cleaned.length === 0) {
		return 'XX';
	}

	return cleaned.slice(0, 2).padEnd(2, 'X');
}

/**
 * Formats a numeric or string serial into a zero-padded 4-digit serial string.
 * E.g., 1 -> "0001", 42 -> "0042", "123" -> "0123"
 */
export function formatEmployeeSerial(serial: number | string = 1): string {
	const parsed = typeof serial === 'string' ? parseInt(serial, 10) : serial;
	if (isNaN(parsed) || parsed < 0) {
		return '0001';
	}
	return Math.floor(parsed).toString().padStart(4, '0');
}

/**
 * Auto Employee ID generator following formula:
 * OI + 2 uppercase letters of First Name + 2 uppercase letters of Last Name + Year + 4-digit serial.
 *
 * @param firstName First name of the employee
 * @param lastName Optional last name (defaults to 'XX' fallback for single names)
 * @param year Joining year (defaults to current year, e.g. 2026)
 * @param serial Incremental serial number (defaults to 1, e.g. 1 -> "0001")
 * @returns Standardized employee ID string (e.g., "OIPRRO20260001")
 */
export function generateEmployeeId(
	firstName: string,
	lastName?: string | null,
	year: number | string = new Date().getFullYear(),
	serial: number | string = 1
): string {
	const fn = extractNameCode(firstName);
	const ln = extractNameCode(lastName);

	const parsedYear = typeof year === 'string' ? parseInt(year, 10) : year;
	const validYear = isNaN(parsedYear) || parsedYear <= 0 ? new Date().getFullYear() : parsedYear;
	const yearStr = validYear.toString().padStart(4, '0');

	const serialStr = formatEmployeeSerial(serial);

	return `OI${fn}${ln}${yearStr}${serialStr}`;
}

/**
 * Regular expression matching valid Dayflow Employee IDs.
 * Format: OI + 2 letters (A-Z) + 2 letters (A-Z) + 4 digits (year) + 4 digits (serial)
 */
export const EMPLOYEE_ID_REGEX = /^OI([A-Z]{2})([A-Z]{2})(\d{4})(\d{4})$/;

/**
 * Validates if the given string is a valid Dayflow Employee ID.
 */
export function isValidEmployeeId(id: string): boolean {
	if (!id || typeof id !== 'string') {
		return false;
	}
	return EMPLOYEE_ID_REGEX.test(id.trim().toUpperCase());
}

/**
 * Parses a Dayflow Employee ID string into its constituent components.
 * 
 * @param id The Employee ID string to parse
 * @returns Parsed components if valid, or isValid: false structure
 */
export function parseEmployeeId(id: string): ParsedEmployeeId {
	if (!id || typeof id !== 'string') {
		return {
			isValid: false,
			raw: String(id ?? '')
		};
	}

	const trimmed = id.trim().toUpperCase();
	const match = trimmed.match(EMPLOYEE_ID_REGEX);

	if (!match) {
		return {
			isValid: false,
			raw: id
		};
	}

	const [, firstNameCode, lastNameCode, yearStr, serialStr] = match;
	const year = parseInt(yearStr, 10);
	const serial = parseInt(serialStr, 10);

	return {
		isValid: true,
		raw: id,
		prefix: 'OI',
		firstNameCode,
		lastNameCode,
		year,
		serial,
		formattedSerial: serialStr
	};
}
