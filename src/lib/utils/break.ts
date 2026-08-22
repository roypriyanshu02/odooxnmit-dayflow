export interface BreakPreset {
	id: 'coffee' | 'lunch' | 'rest' | 'custom';
	label: string;
	durationMinutes: number;
	description: string;
	iconName: 'Coffee' | 'Utensils' | 'Armchair' | 'Sliders';
}

export const BREAK_PRESETS: BreakPreset[] = [
	{
		id: 'coffee',
		label: 'Coffee / Tea',
		durationMinutes: 15,
		description: 'Quick beverage or recharge break',
		iconName: 'Coffee'
	},
	{
		id: 'lunch',
		label: 'Lunch',
		durationMinutes: 45,
		description: 'Midday meal and refreshment',
		iconName: 'Utensils'
	},
	{
		id: 'rest',
		label: 'Rest & Stretch',
		durationMinutes: 10,
		description: 'Short screen pause and stretching',
		iconName: 'Armchair'
	},
	{
		id: 'custom',
		label: 'Custom Break',
		durationMinutes: 20,
		description: 'Custom duration with manual timer',
		iconName: 'Sliders'
	}
];

export const BREAK_THRESHOLD_MINUTES = 60; // 1-hour policy threshold alert

/**
 * Calculates duration in minutes between two timestamps.
 * Returns an integer number of minutes (minimum 0).
 */
export function calculateBreakDuration(
	startTime: string | Date | number,
	endTime: string | Date | number
): number {
	const start = new Date(startTime).getTime();
	const end = new Date(endTime).getTime();

	if (isNaN(start) || isNaN(end)) {
		return 0;
	}

	const diffMs = Math.max(0, end - start);
	return Math.round(diffMs / 60000);
}

/**
 * Returns elapsed seconds between startTime and an optional endTime/current time.
 */
export function getBreakElapsedSeconds(
	startTime: string | Date | number,
	endTime: string | Date | number | null = null
): number {
	const start = new Date(startTime).getTime();
	if (isNaN(start)) return 0;

	const end = endTime ? new Date(endTime).getTime() : Date.now();
	if (isNaN(end)) return 0;

	const diffMs = Math.max(0, end - start);
	return Math.floor(diffMs / 1000);
}

/**
 * Checks if a break has exceeded a specified threshold in minutes (default 60 mins / 1 hour).
 */
export function isBreakExceededThreshold(
	startTime: string | Date | number,
	currentTime: string | Date | number | null = null,
	thresholdMinutes: number = BREAK_THRESHOLD_MINUTES
): boolean {
	const elapsedSeconds = getBreakElapsedSeconds(startTime, currentTime);
	return elapsedSeconds >= thresholdMinutes * 60;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS.
 */
export function formatStopwatch(totalSeconds: number): string {
	if (isNaN(totalSeconds) || totalSeconds < 0) {
		return '00:00';
	}

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.floor(totalSeconds % 60);

	const paddedMin = minutes.toString().padStart(2, '0');
	const paddedSec = seconds.toString().padStart(2, '0');

	if (hours > 0) {
		const paddedHour = hours.toString().padStart(2, '0');
		return `${paddedHour}:${paddedMin}:${paddedSec}`;
	}

	return `${paddedMin}:${paddedSec}`;
}

/**
 * Formats minutes into human-readable representation like '45m' or '1h 15m'.
 */
export function formatDurationHuman(minutes: number): string {
	if (isNaN(minutes) || minutes <= 0) return '0m';
	const hrs = Math.floor(minutes / 60);
	const mins = minutes % 60;

	if (hrs > 0 && mins > 0) {
		return `${hrs}h ${mins}m`;
	}
	if (hrs > 0) {
		return `${hrs}h`;
	}
	return `${mins}m`;
}
