<script lang="ts">
	import { cn } from '$lib/utils';
	import { Clock, Flame, Coffee, CheckCircle2, AlertCircle } from '@lucide/svelte';
	import type { WorkTimerFormat, WorkTimerSize } from './types';
	import type { StopwatchStatus } from '$lib/types/attendance';
	import { AttendanceState } from '$lib/state/attendance.svelte';

	interface Props {
		seconds?: number;
		elapsedSeconds?: number;
		status?: StopwatchStatus | 'checked_out' | 'working' | 'on_break';
		format?: WorkTimerFormat;
		size?: WorkTimerSize;
		showOvertimeBadge?: boolean;
		showPulse?: boolean;
		showIcon?: boolean;
		overtimeThresholdSeconds?: number;
		class?: string;
	}

	let {
		seconds,
		elapsedSeconds,
		status = 'working',
		format = 'digital',
		size = 'md',
		showOvertimeBadge = true,
		showPulse = true,
		showIcon = false,
		overtimeThresholdSeconds = 28800, // 8 Hours = 28800s
		class: className = ''
	}: Props = $props();

	// Derived calculations
	const safeSeconds = $derived(Math.max(0, Math.floor(seconds ?? elapsedSeconds ?? 0)));
	const isOvertime = $derived(safeSeconds > overtimeThresholdSeconds);
	const overtimeSeconds = $derived(Math.max(0, safeSeconds - overtimeThresholdSeconds));

	const formattedTime = $derived.by(() => {
		if (format === 'verbose') {
			return AttendanceState.formatVerbose(safeSeconds);
		}
		if (format === 'compact') {
			return AttendanceState.formatCompact(safeSeconds);
		}
		return AttendanceState.formatDigital(safeSeconds);
	});

	const formattedOvertime = $derived.by(() => {
		const h = Math.floor(overtimeSeconds / 3600);
		const m = Math.floor((overtimeSeconds % 3600) / 60);
		if (h > 0) {
			return `+${h}h ${m}m OT`;
		}
		return `+${m}m OT`;
	});

	// Status helpers
	const isWorking = $derived(status === 'working' || status === 'active');
	const isOnBreak = $derived(status === 'on_break');
	const isCheckedOut = $derived(status === 'checked_out' || status === 'paused');

	// Styling sizes mapping
	const sizeClasses: Record<WorkTimerSize, { container: string; time: string; dot: string; icon: string }> = {
		xs: {
			container: 'gap-1.5 text-xs',
			time: 'text-xs font-mono font-semibold',
			dot: 'h-1.5 w-1.5',
			icon: 'h-3 w-3'
		},
		sm: {
			container: 'gap-1.5 text-xs sm:text-sm',
			time: 'text-xs sm:text-sm font-mono font-bold tracking-tight',
			dot: 'h-2 w-2',
			icon: 'h-3.5 w-3.5'
		},
		md: {
			container: 'gap-2 text-sm sm:text-base',
			time: 'text-sm sm:text-base font-mono font-bold tracking-tight',
			dot: 'h-2.5 w-2.5',
			icon: 'h-4 w-4'
		},
		lg: {
			container: 'gap-2.5 text-lg sm:text-xl',
			time: 'text-lg sm:text-xl font-mono font-bold tracking-tight',
			dot: 'h-3 w-3',
			icon: 'h-5 w-5'
		},
		xl: {
			container: 'gap-3 text-2xl sm:text-3xl md:text-4xl',
			time: 'text-2xl sm:text-3xl md:text-4xl font-mono font-extrabold tracking-tight',
			dot: 'h-3.5 w-3.5',
			icon: 'h-7 w-7'
		}
	};

	const currentSize = $derived(sizeClasses[size] || sizeClasses.md);
</script>

<div class={cn('inline-flex items-center', currentSize.container, className)}>
	<!-- Pulsing Activity Indicator Dot -->
	{#if showPulse}
		<span class="relative flex {currentSize.dot} shrink-0 items-center justify-center">
			{#if isWorking}
				<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
				<span class="relative inline-flex {currentSize.dot} rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
			{:else if isOnBreak}
				<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
				<span class="relative inline-flex {currentSize.dot} rounded-full bg-amber-500 shadow-xs shadow-amber-500/50"></span>
			{:else}
				<span class="relative inline-flex {currentSize.dot} rounded-full bg-slate-400 dark:bg-zinc-600"></span>
			{/if}
		</span>
	{/if}

	<!-- Optional Leading Icon -->
	{#if showIcon}
		{#if isWorking}
			<Clock class="{currentSize.icon} text-emerald-600 dark:text-emerald-400 shrink-0" />
		{:else if isOnBreak}
			<Coffee class="{currentSize.icon} text-amber-600 dark:text-amber-400 shrink-0" />
		{:else}
			<Clock class="{currentSize.icon} text-muted-foreground shrink-0" />
		{/if}
	{/if}

	<!-- Digital / Verbose Stopwatch Digits -->
	<span
		class={cn(
			'tabular-nums transition-colors',
			currentSize.time,
			isWorking && 'text-foreground font-bold',
			isOnBreak && 'text-amber-700 dark:text-amber-300 font-semibold',
			isCheckedOut && 'text-muted-foreground font-medium'
		)}
	>
		{formattedTime}
	</span>

	<!-- Overtime Indicator Badge (> 8h) -->
	{#if showOvertimeBadge && isOvertime && isWorking}
		<span
			class="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 shadow-2xs dark:border-orange-900/50 dark:bg-orange-950/50 dark:text-orange-300 animate-in fade-in-0 zoom-in-95 duration-200"
			title="Overtime accumulated beyond standard 8-hour workday"
		>
			<Flame class="h-3 w-3 text-orange-600 dark:text-orange-400 animate-pulse" />
			<span>{formattedOvertime}</span>
		</span>
	{/if}
</div>
