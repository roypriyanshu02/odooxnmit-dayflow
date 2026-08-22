<script lang="ts">
	import {
		Calendar,
		Flame,
		CheckCircle2,
		Plane,
		AlertCircle
	} from '@lucide/svelte';
	import type { AttendanceRecord } from '$lib/types/attendance';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';

	interface DayStat {
		dateStr: string;
		dayLabel: string;
		dayNumber: number;
		isToday: boolean;
		isWeekend: boolean;
		status: 'present' | 'absent' | 'on_leave' | 'half_day' | 'weekend' | 'upcoming';
		workMinutes: number;
		breakMinutes: number;
		overtimeMinutes: number;
		checkIn?: string | null;
		checkOut?: string | null;
	}

	interface Props {
		attendanceRecords?: AttendanceRecord[];
		currentDateStr?: string;
		employeeName?: string;
	}

	let {
		attendanceRecords = [],
		currentDateStr = '2026-08-22',
		employeeName = 'You'
	}: Props = $props();

	// Calculate Monday of current week
	const weekDays = $derived.by(() => {
		const current = new Date(currentDateStr + 'T00:00:00Z');
		const dayOfWeek = current.getUTCDay();
		const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		
		const monday = new Date(current);
		monday.setUTCDate(current.getUTCDate() + diffToMonday);

		const days: DayStat[] = [];
		const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

		for (let i = 0; i < 7; i++) {
			const d = new Date(monday);
			d.setUTCDate(monday.getUTCDate() + i);
			const dStr = d.toISOString().split('T')[0];
			const isWknd = i >= 5;
			const isTod = dStr === currentDateStr;

			const match = attendanceRecords.find((r) => r.date === dStr);

			let status: DayStat['status'] = isWknd ? 'weekend' : 'upcoming';
			let workMinutes = 0;
			let breakMinutes = 0;
			let overtimeMinutes = 0;
			let checkIn: string | null | undefined = null;
			let checkOut: string | null | undefined = null;

			if (match) {
				status = match.status as any;
				workMinutes = match.totalWorkMinutes || 0;
				breakMinutes = match.totalBreakMinutes || 0;
				overtimeMinutes = match.overtimeMinutes || 0;
				checkIn = match.checkIn;
				checkOut = match.checkOut;
			} else if (dStr < currentDateStr && !isWknd) {
				status = 'absent';
			}

			days.push({
				dateStr: dStr,
				dayLabel: dayNames[i],
				dayNumber: d.getUTCDate(),
				isToday: isTod,
				isWeekend: isWknd,
				status,
				workMinutes,
				breakMinutes,
				overtimeMinutes,
				checkIn,
				checkOut
			});
		}

		return days;
	});

	// Weekly aggregate metrics
	const totalWeeklyMinutes = $derived(
		weekDays.reduce((acc, d) => acc + d.workMinutes, 0)
	);
	const totalWeeklyHours = $derived(Number((totalWeeklyMinutes / 60).toFixed(1)));
	const targetWeeklyHours = 40.0;
	const progressPercent = $derived(
		Math.min(100, Math.round((totalWeeklyHours / targetWeeklyHours) * 100))
	);

	const totalOvertimeMinutes = $derived(
		weekDays.reduce((acc, d) => acc + d.overtimeMinutes, 0)
	);
	const totalOvertimeHours = $derived(Number((totalOvertimeMinutes / 60).toFixed(1)));

	const workedDaysCount = $derived(
		weekDays.filter((d) => d.status === 'present' || d.status === 'half_day').length
	);
	const avgDailyHours = $derived(
		workedDaysCount > 0 ? Number((totalWeeklyHours / workedDaysCount).toFixed(1)) : 0
	);
</script>

<Card.Root class="p-5 shadow-2xs">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-border/80">
		<div class="flex items-center gap-2.5">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
				<Calendar class="h-4 w-4" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-foreground">Weekly Timesheet & Shift Summary</h3>
				<p class="text-[11px] text-muted-foreground">Monday to Sunday attendance breakdown and overtime tracking</p>
			</div>
		</div>

		<!-- Progress Badge -->
		<div class="flex items-center gap-2 text-xs">
			<span class="text-muted-foreground">Goal: <strong>40h</strong></span>
			<Badge variant="secondary" class="font-bold font-mono text-primary text-[11px] px-2.5 py-0.5">
				{progressPercent}% Complete
			</Badge>
		</div>
	</div>

	<!-- 7-Day Calendar Strip -->
	<div class="grid grid-cols-7 gap-2 mb-5">
		{#each weekDays as day (day.dateStr)}
			<div
				class="flex flex-col rounded-xl border p-2.5 transition-all text-center relative {day.isToday
					? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30'
					: day.status === 'present'
						? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
						: day.status === 'on_leave'
							? 'border-blue-200 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/20'
							: 'border-border/80 bg-muted/20'}"
			>
				{#if day.isToday}
					<span class="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 py-0.2 text-[8px] font-black uppercase text-primary-foreground">
						Today
					</span>
				{/if}

				<!-- Day Label & Number -->
				<span class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{day.dayLabel}</span>
				<span class="text-base font-black font-mono text-foreground my-0.5">{day.dayNumber}</span>

				<!-- Status Badge Icon -->
				<div class="my-1 flex items-center justify-center min-h-[22px]">
					{#if day.status === 'present'}
						<Badge variant="secondary" class="gap-1 px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
							<CheckCircle2 class="h-2.5 w-2.5 text-emerald-600" />
							<span>{(day.workMinutes / 60).toFixed(1)}h</span>
						</Badge>
					{:else if day.status === 'on_leave'}
						<Badge variant="secondary" class="gap-1 px-1.5 py-0.2 text-[9px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
							<Plane class="h-2.5 w-2.5 text-blue-600" />
							<span>Leave</span>
						</Badge>
					{:else if day.status === 'weekend'}
						<span class="text-[9px] font-medium text-muted-foreground/60 italic">Weekend</span>
					{:else if day.status === 'absent'}
						<Badge variant="secondary" class="gap-1 px-1.5 py-0.2 text-[9px] font-bold bg-destructive/10 text-destructive">
							<AlertCircle class="h-2.5 w-2.5" />
							<span>Absent</span>
						</Badge>
					{:else}
						<span class="text-[9px] text-muted-foreground">—</span>
					{/if}
				</div>

				<!-- Overtime Badge -->
				{#if day.overtimeMinutes > 0}
					<div class="mt-auto pt-1">
						<span class="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-700 dark:text-purple-300 font-mono">
							<Flame class="h-2.5 w-2.5 text-purple-600" />
							<span>+{(day.overtimeMinutes / 60).toFixed(1)}h</span>
						</span>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Weekly KPI Overview Bar -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3 rounded-xl border border-border/80 bg-muted/30 p-3.5 text-xs">
		<!-- Total Hours -->
		<div>
			<span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Worked</span>
			<div class="text-base font-black font-mono text-foreground mt-0.5">
				{totalWeeklyHours} <span class="text-xs font-normal text-muted-foreground">/ 40h</span>
			</div>
		</div>

		<!-- Daily Average -->
		<div>
			<span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Daily Average</span>
			<div class="text-base font-black font-mono text-foreground mt-0.5">
				{avgDailyHours} <span class="text-xs font-normal text-muted-foreground">h/day</span>
			</div>
		</div>

		<!-- Weekly Overtime -->
		<div>
			<span class="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 tracking-wider">Weekly Overtime</span>
			<div class="text-base font-black font-mono text-purple-700 dark:text-purple-300 mt-0.5 flex items-center gap-1">
				<Flame class="h-3.5 w-3.5 text-purple-600" />
				<span>{totalOvertimeHours}h</span>
			</div>
		</div>

		<!-- Active Days -->
		<div>
			<span class="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">Days Logged</span>
			<div class="text-base font-black font-mono text-emerald-700 dark:text-emerald-300 mt-0.5 flex items-center gap-1">
				<CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" />
				<span>{workedDaysCount} / 5 days</span>
			</div>
		</div>
	</div>
</Card.Root>
