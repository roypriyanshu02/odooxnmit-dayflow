/**
 * Reactive Attendance Session State Management (Svelte 5 Runes)
 * Dayflow HRMS - Odoo-inspired Attendance & Time Tracking Module
 */

import type { AttendanceBreak, AttendanceSessionState, StopwatchStatus } from '$lib/types/attendance';
import type { AttendanceMode } from '$lib/components/attendance/types';

const STORAGE_KEY = 'dayflow_attendance_session_v1';
const STANDARD_WORK_SECONDS = 8 * 3600; // 8 hours = 28,800 seconds

export interface StoredSession {
	date: string; // YYYY-MM-DD
	status: AttendanceMode;
	checkInTime: string | null; // ISO string
	checkOutTime: string | null; // ISO string
	breakStartTime: string | null; // ISO string
	breakReason: string;
	completedWorkSeconds: number; // accumulated when checking in/out or pausing
	accumulatedBreakSeconds: number;
	breaks: AttendanceBreak[];
}

function getTodayDateString(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export class AttendanceState {
	// Reactive state variables
	status = $state<AttendanceMode>('working');
	checkInTime = $state<string | null>(null);
	checkOutTime = $state<string | null>(null);
	breakStartTime = $state<string | null>(null);
	breakReason = $state<string>('');
	accumulatedBreakSeconds = $state<number>(0);
	breaks = $state<AttendanceBreak[]>([]);
	activeDate = $state<string>(getTodayDateString());

	// Live tick counter
	private currentTimeMs = $state<number>(Date.now());
	private timerInterval: ReturnType<typeof setInterval> | null = null;
	private initialized = false;

	constructor() {
		if (typeof window !== 'undefined') {
			this.initFromStorage();
			this.startTicker();
		}
	}

	/**
	 * Starts the 1-second live ticker for real-time stopwatch updates
	 */
	startTicker() {
		if (typeof window === 'undefined') return;
		if (this.timerInterval) clearInterval(this.timerInterval);

		this.timerInterval = setInterval(() => {
			this.currentTimeMs = Date.now();
			// Check if day rolled over
			const today = getTodayDateString();
			if (this.activeDate !== today && this.status === 'checked_out') {
				this.resetSessionForNewDay(today);
			}
		}, 1000);
	}

	/**
	 * Stop ticker on cleanup
	 */
	stopTicker() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	/**
	 * Initializes session from localStorage or sets a realistic initial state
	 */
	private initFromStorage() {
		if (this.initialized) return;
		this.initialized = true;

		try {
			const storedJson = localStorage.getItem(STORAGE_KEY);
			const today = getTodayDateString();

			if (storedJson) {
				const data = JSON.parse(storedJson) as StoredSession;
				if (data && data.date === today) {
					this.status = data.status || 'checked_out';
					this.checkInTime = data.checkInTime || null;
					this.checkOutTime = data.checkOutTime || null;
					this.breakStartTime = data.breakStartTime || null;
					this.breakReason = data.breakReason || '';
					this.accumulatedBreakSeconds = data.accumulatedBreakSeconds || 0;
					this.breaks = data.breaks || [];
					this.activeDate = data.date;
					return;
				}
			}

			// Default initial demo state: Checked in 4 hours 24 minutes ago today
			const fourHoursAgo = new Date(Date.now() - (4 * 3600 + 24 * 60) * 1000).toISOString();
			this.status = 'working';
			this.checkInTime = fourHoursAgo;
			this.checkOutTime = null;
			this.breakStartTime = null;
			this.breakReason = '';
			this.accumulatedBreakSeconds = 15 * 60; // 15m lunch break already recorded
			this.breaks = [
				{
					id: 'brk-demo-01',
					attendanceId: 'att-today-01',
					employeeId: 'emp-01',
					startTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
					endTime: new Date(Date.now() - (2 * 3600 - 15 * 60) * 1000).toISOString(),
					durationMinutes: 15,
					reason: 'Coffee Break'
				}
			];
			this.activeDate = today;
			this.saveToStorage();
		} catch (err) {
			console.error('Error loading attendance session from localStorage:', err);
		}
	}

	private saveToStorage() {
		if (typeof window === 'undefined') return;
		try {
			const data: StoredSession = {
				date: this.activeDate,
				status: this.status,
				checkInTime: this.checkInTime,
				checkOutTime: this.checkOutTime,
				breakStartTime: this.breakStartTime,
				breakReason: this.breakReason,
				completedWorkSeconds: this.elapsedWorkSeconds,
				accumulatedBreakSeconds: this.accumulatedBreakSeconds,
				breaks: this.breaks
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch (err) {
			console.error('Error saving attendance session to localStorage:', err);
		}
	}

	private resetSessionForNewDay(newDate: string) {
		this.activeDate = newDate;
		this.status = 'checked_out';
		this.checkInTime = null;
		this.checkOutTime = null;
		this.breakStartTime = null;
		this.breakReason = '';
		this.accumulatedBreakSeconds = 0;
		this.breaks = [];
		this.saveToStorage();
	}

	// -------------------------------------------------------------
	// Reactive Derived Getters
	// -------------------------------------------------------------

	/**
	 * Active break elapsed seconds (if currently on break)
	 */
	currentBreakSeconds = $derived.by(() => {
		if (this.status !== 'on_break' || !this.breakStartTime) {
			return 0;
		}
		const startMs = new Date(this.breakStartTime).getTime();
		return Math.max(0, Math.floor((this.currentTimeMs - startMs) / 1000));
	});

	/**
	 * Total break seconds today (accumulated past breaks + active break)
	 */
	totalBreakSeconds = $derived.by(() => {
		return this.accumulatedBreakSeconds + this.currentBreakSeconds;
	});

	/**
	 * Total active elapsed work seconds today
	 */
	elapsedWorkSeconds = $derived.by(() => {
		if (this.status === 'checked_out') {
			if (!this.checkInTime || !this.checkOutTime) return 0;
			const inMs = new Date(this.checkInTime).getTime();
			const outMs = new Date(this.checkOutTime).getTime();
			const rawSeconds = Math.floor((outMs - inMs) / 1000);
			return Math.max(0, rawSeconds - this.totalBreakSeconds);
		}

		if (!this.checkInTime) return 0;
		const inMs = new Date(this.checkInTime).getTime();

		if (this.status === 'on_break' && this.breakStartTime) {
			// When on break, freeze work time at the moment the break started
			const breakMs = new Date(this.breakStartTime).getTime();
			const rawSeconds = Math.floor((breakMs - inMs) / 1000);
			return Math.max(0, rawSeconds - this.accumulatedBreakSeconds);
		}

		// When working
		const rawSeconds = Math.floor((this.currentTimeMs - inMs) / 1000);
		return Math.max(0, rawSeconds - this.accumulatedBreakSeconds);
	});

	/**
	 * Whether the user has exceeded standard 8-hour shift
	 */
	isOvertime = $derived.by(() => {
		return this.elapsedWorkSeconds > STANDARD_WORK_SECONDS;
	});

	/**
	 * Total overtime seconds (> 8h)
	 */
	overtimeSeconds = $derived.by(() => {
		return Math.max(0, this.elapsedWorkSeconds - STANDARD_WORK_SECONDS);
	});

	/**
	 * Standard shift completion percentage (0 - 100)
	 */
	shiftProgressPercent = $derived.by(() => {
		return Math.min(100, Math.round((this.elapsedWorkSeconds / STANDARD_WORK_SECONDS) * 100));
	});

	/**
	 * Stopwatch Status compatible with types
	 */
	stopwatchStatus = $derived.by((): StopwatchStatus => {
		if (this.status === 'working') return 'active';
		if (this.status === 'on_break') return 'on_break';
		return 'checked_out';
	});

	// -------------------------------------------------------------
	// State Modification Actions
	// -------------------------------------------------------------

	/**
	 * Check In Action
	 */
	checkIn() {
		const nowIso = new Date().toISOString();
		this.activeDate = getTodayDateString();
		this.status = 'working';
		this.checkInTime = this.checkInTime || nowIso;
		this.checkOutTime = null;
		this.breakStartTime = null;
		this.breakReason = '';
		this.saveToStorage();
	}

	/**
	 * Start a break session
	 */
	startBreak(reason = 'Break') {
		if (this.status !== 'working') return;
		const nowIso = new Date().toISOString();
		this.status = 'on_break';
		this.breakStartTime = nowIso;
		this.breakReason = reason;
		this.saveToStorage();
	}

	/**
	 * End current break session and resume work
	 */
	endBreak() {
		if (this.status !== 'on_break' || !this.breakStartTime) return;
		const nowIso = new Date().toISOString();
		const startMs = new Date(this.breakStartTime).getTime();
		const endMs = new Date(nowIso).getTime();
		const durationSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
		const durationMin = Math.round(durationSec / 60);

		const newBreak: AttendanceBreak = {
			id: `brk-${Date.now()}`,
			attendanceId: 'att-session',
			employeeId: 'current-user',
			startTime: this.breakStartTime,
			endTime: nowIso,
			durationMinutes: durationMin,
			reason: this.breakReason || 'Break',
			createdAt: nowIso
		};

		this.breaks = [...this.breaks, newBreak];
		this.accumulatedBreakSeconds += durationSec;
		this.status = 'working';
		this.breakStartTime = null;
		this.breakReason = '';
		this.saveToStorage();
	}

	/**
	 * Toggle Break state
	 */
	toggleBreak(reason = 'Quick Break') {
		if (this.status === 'on_break') {
			this.endBreak();
		} else if (this.status === 'working') {
			this.startBreak(reason);
		}
	}

	/**
	 * Check Out Action
	 */
	checkOut() {
		if (this.status === 'on_break') {
			this.endBreak();
		}
		const nowIso = new Date().toISOString();
		this.status = 'checked_out';
		this.checkOutTime = nowIso;
		this.saveToStorage();
	}

	/**
	 * Toggle Check In / Check Out
	 */
	toggleCheckIn() {
		if (this.status === 'checked_out') {
			this.checkIn();
		} else {
			this.checkOut();
		}
	}

	/**
	 * Reset session for testing / demo purposes
	 */
	resetSession(startFresh = false) {
		const today = getTodayDateString();
		this.activeDate = today;
		if (startFresh) {
			this.status = 'checked_out';
			this.checkInTime = null;
			this.checkOutTime = null;
			this.breakStartTime = null;
			this.breakReason = '';
			this.accumulatedBreakSeconds = 0;
			this.breaks = [];
		} else {
			const fourHoursAgo = new Date(Date.now() - (4 * 3600 + 24 * 60) * 1000).toISOString();
			this.status = 'working';
			this.checkInTime = fourHoursAgo;
			this.checkOutTime = null;
			this.breakStartTime = null;
			this.breakReason = '';
			this.accumulatedBreakSeconds = 15 * 60;
			this.breaks = [
				{
					id: `brk-${Date.now()}`,
					attendanceId: 'att-session',
					employeeId: 'current-user',
					startTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
					endTime: new Date(Date.now() - (2 * 3600 - 15 * 60) * 1000).toISOString(),
					durationMinutes: 15,
					reason: 'Coffee Break'
				}
			];
		}
		this.saveToStorage();
	}

	// -------------------------------------------------------------
	// Static Format Helpers
	// -------------------------------------------------------------

	static formatDigital(totalSeconds: number): string {
		const sec = Math.max(0, Math.floor(totalSeconds));
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec % 3600) / 60);
		const s = sec % 60;
		return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}

	static formatVerbose(totalSeconds: number): string {
		const sec = Math.max(0, Math.floor(totalSeconds));
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec % 3600) / 60);
		const s = sec % 60;
		if (h > 0) {
			return `${h}h ${m}m ${s}s`;
		}
		if (m > 0) {
			return `${m}m ${s}s`;
		}
		return `${s}s`;
	}

	static formatCompact(totalSeconds: number): string {
		const sec = Math.max(0, Math.floor(totalSeconds));
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec % 3600) / 60);
		if (h > 0) {
			return `${h}h ${String(m).padStart(2, '0')}m`;
		}
		return `${m}m`;
	}

	static formatTimeOnly(isoString?: string | null): string {
		if (!isoString) return '--:--';
		try {
			const d = new Date(isoString);
			return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} catch {
			return '--:--';
		}
	}
}

export const attendanceState = new AttendanceState();
