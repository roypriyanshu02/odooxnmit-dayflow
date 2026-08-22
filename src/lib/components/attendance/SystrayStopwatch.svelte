<script lang="ts">
	import { cn } from '$lib/utils';
	import { attendanceState, AttendanceState } from '$lib/state/attendance.svelte';
	import WorkTimer from './WorkTimer.svelte';
	import {
		Clock,
		Play,
		Coffee,
		LogOut,
		LogIn,
		ChevronDown,
		Flame,
		AlertTriangle,
		Timer,
		Utensils,
		RotateCcw,
		Zap,
		Square
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import * as Card from '$lib/components/ui/card';

	interface Props {
		class?: string;
		compact?: boolean;
	}

	let { class: className = '', compact = false }: Props = $props();

	// Local UI states
	let isDropdownOpen = $state(false);
	let showBreakReasonPicker = $state(false);
	let dropdownRef: HTMLDivElement | null = $state(null);

	// Predefined quick break options
	const breakPresets: { label: string; icon: typeof Coffee }[] = [
		{ label: 'Coffee / Tea', icon: Coffee },
		{ label: 'Lunch Break', icon: Utensils },
		{ label: 'Quick Rest', icon: Timer },
		{ label: 'Team Meeting', icon: Zap }
	];

	// Close on click outside
	function handleDocumentClick(event: MouseEvent) {
		if (isDropdownOpen && dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isDropdownOpen = false;
			showBreakReasonPicker = false;
		}
	}

	// Close on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isDropdownOpen) {
			isDropdownOpen = false;
			showBreakReasonPicker = false;
		}
	}

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
		if (!isDropdownOpen) {
			showBreakReasonPicker = false;
		}
	}

	function handleCheckIn() {
		attendanceState.checkIn();
	}

	function handleCheckOut() {
		attendanceState.checkOut();
		isDropdownOpen = false;
	}

	function handleStartBreak(reason: string) {
		attendanceState.startBreak(reason);
		showBreakReasonPicker = false;
	}

	function handleEndBreak() {
		attendanceState.endBreak();
	}

	// Format helpers
	const formattedBreakElapsed = $derived(
		AttendanceState.formatDigital(attendanceState.currentBreakSeconds)
	);
	const formattedTotalBreak = $derived(
		AttendanceState.formatCompact(attendanceState.totalBreakSeconds)
	);
	const formattedCheckInTime = $derived(
		AttendanceState.formatTimeOnly(attendanceState.checkInTime)
	);
</script>

<svelte:window onclick={handleDocumentClick} onkeydown={handleKeydown} />

<div class={cn('relative inline-block text-left', className)} bind:this={dropdownRef}>
	<!-- Systray Top Navbar Trigger Button -->
	<Button
		variant="outline"
		size="sm"
		onclick={toggleDropdown}
		aria-expanded={isDropdownOpen}
		aria-haspopup="true"
		class={cn(
			'group h-8 gap-2 px-2.5 text-xs font-medium transition-all duration-150 select-none',
			attendanceState.status === 'working' &&
				'border-emerald-200/80 bg-emerald-50/70 text-emerald-950 hover:bg-emerald-100/80 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50 shadow-2xs',
			attendanceState.status === 'on_break' &&
				'border-amber-200/80 bg-amber-50/80 text-amber-950 hover:bg-amber-100/80 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50 shadow-2xs',
			attendanceState.status === 'checked_out' &&
				'border-border/80 bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground'
		)}
		title={attendanceState.status === 'working'
			? 'Status: Working (Live Stopwatch Active)'
			: attendanceState.status === 'on_break'
				? 'Status: On Break'
				: 'Status: Checked Out (Off Duty)'}
	>
		<!-- Work Timer & Status Indicator -->
		<WorkTimer
			seconds={attendanceState.elapsedWorkSeconds}
			status={attendanceState.status}
			format="digital"
			size="xs"
			showPulse={true}
			showOvertimeBadge={false}
		/>

		<!-- Status Label Badge -->
		{#if !compact}
			<Badge
				variant="secondary"
				class={cn(
					'hidden sm:inline-block px-1 py-0 text-[10px] font-semibold uppercase tracking-wider',
					attendanceState.status === 'working' && 'bg-emerald-200/60 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
					attendanceState.status === 'on_break' && 'bg-amber-200/60 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 animate-pulse',
					attendanceState.status === 'checked_out' && 'bg-muted text-muted-foreground'
				)}
			>
				{attendanceState.status === 'working'
					? 'Active'
					: attendanceState.status === 'on_break'
						? 'Break'
						: 'Off'}
			</Badge>
		{/if}

		<!-- Overtime Flame Indicator (Navbar Pill) -->
		{#if attendanceState.isOvertime && attendanceState.status === 'working'}
			<span class="flex items-center text-orange-600 dark:text-orange-400" title="Overtime Active">
				<Flame class="h-3.5 w-3.5 animate-pulse" />
			</span>
		{/if}

		<!-- Chevron Toggle Indicator -->
		<ChevronDown
			class={cn(
				'h-3 w-3 text-muted-foreground transition-transform duration-200',
				isDropdownOpen && 'rotate-180 text-foreground'
			)}
		/>
	</Button>

	<!-- Systray Detailed Popover Dropdown -->
	{#if isDropdownOpen}
		<div
			class="absolute right-0 top-full mt-2 w-80 sm:w-92 z-50 rounded-xl border border-border/80 bg-card p-4 text-card-foreground shadow-xl ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in-0 zoom-in-95 duration-150"
			role="dialog"
			aria-label="Attendance Session Panel"
		>
			<!-- Top Status Header -->
			<div class="flex items-center justify-between border-b border-border/60 pb-3">
				<div class="flex items-center gap-2">
					<div
						class={cn(
							'flex h-8 w-8 items-center justify-center rounded-lg shadow-2xs',
							attendanceState.status === 'working' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
							attendanceState.status === 'on_break' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20',
							attendanceState.status === 'checked_out' && 'bg-muted text-muted-foreground border border-border'
						)}
					>
						{#if attendanceState.status === 'working'}
							<Clock class="h-4 w-4" />
						{:else if attendanceState.status === 'on_break'}
							<Coffee class="h-4 w-4 animate-bounce" />
						{:else}
							<Clock class="h-4 w-4" />
						{/if}
					</div>
					<div>
						<h4 class="text-xs font-bold text-foreground">
							{attendanceState.status === 'working'
								? 'Working Shift'
								: attendanceState.status === 'on_break'
									? `On Break (${attendanceState.breakReason || 'Rest'})`
									: 'Shift Inactive'}
						</h4>
						<p class="text-[11px] text-muted-foreground">
							{attendanceState.status === 'checked_out'
								? 'Ready to check in for today'
								: `Checked in at ${formattedCheckInTime}`}
						</p>
					</div>
				</div>

				<!-- Reset Session Demo Button -->
				<Button
					variant="ghost"
					size="icon"
					onclick={() => attendanceState.resetSession(false)}
					class="h-6 w-6 text-muted-foreground"
					title="Reset simulated session for testing"
				>
					<RotateCcw class="h-3 w-3" />
				</Button>
			</div>

			<!-- Big Hero Live Work Stopwatch Display -->
			<div class="my-4 flex flex-col items-center justify-center rounded-lg bg-muted/40 p-3.5 border border-border/50">
				<span class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
					{attendanceState.status === 'on_break' ? 'Effective Work Time (Paused)' : 'Live Work Stopwatch'}
				</span>

				<WorkTimer
					seconds={attendanceState.elapsedWorkSeconds}
					status={attendanceState.status}
					format="digital"
					size="xl"
					showPulse={true}
					showOvertimeBadge={true}
				/>

				{#if attendanceState.status === 'on_break'}
					<Badge variant="secondary" class="mt-2 gap-1.5 bg-amber-100/80 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40">
						<Coffee class="h-3 w-3" />
						<span>Break Time: {formattedBreakElapsed}</span>
					</Badge>
				{/if}
			</div>

			<!-- 8-Hour Workday Progress Bar -->
			<div class="mb-4 space-y-1.5">
				<div class="flex items-center justify-between text-[11px]">
					<span class="font-medium text-muted-foreground">Daily Shift Progress</span>
					<span class="font-mono font-bold text-foreground">
						{attendanceState.shiftProgressPercent}% (8h Goal)
					</span>
				</div>
				<Progress value={attendanceState.shiftProgressPercent} class="h-2" />
			</div>

			<!-- Daily Metrics Summary Grid -->
			<div class="mb-4 grid grid-cols-3 gap-2 text-center">
				<div class="rounded-md border border-border/60 bg-card/60 p-2 shadow-2xs">
					<span class="block text-[10px] text-muted-foreground">Check In</span>
					<span class="font-mono text-xs font-bold text-foreground">{formattedCheckInTime}</span>
				</div>
				<div class="rounded-md border border-border/60 bg-card/60 p-2 shadow-2xs">
					<span class="block text-[10px] text-muted-foreground">Total Breaks</span>
					<span class="font-mono text-xs font-bold text-foreground">{formattedTotalBreak}</span>
				</div>
				<div class="rounded-md border border-border/60 bg-card/60 p-2 shadow-2xs">
					<span class="block text-[10px] text-muted-foreground">Overtime</span>
					<span
						class={cn(
							'font-mono text-xs font-bold',
							attendanceState.isOvertime ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
						)}
					>
						{attendanceState.isOvertime
							? AttendanceState.formatCompact(attendanceState.overtimeSeconds)
							: '0m'}
					</span>
				</div>
			</div>

			<!-- Break Warning if on break > 60m -->
			{#if attendanceState.status === 'on_break' && attendanceState.currentBreakSeconds > 3600}
				<div class="mb-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50/90 p-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
					<AlertTriangle class="h-4 w-4 shrink-0 text-amber-600" />
					<span class="text-[11px] leading-tight">Break exceeded 1 hour standard threshold.</span>
				</div>
			{/if}

			<!-- Primary Action Buttons -->
			<div class="space-y-2">
				{#if attendanceState.status === 'checked_out'}
					<!-- Check In Button -->
					<Button
						onclick={handleCheckIn}
						class="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
					>
						<LogIn class="h-4 w-4" />
						<span>Check In & Start Shift</span>
					</Button>
				{:else if attendanceState.status === 'working'}
					<!-- Break Reason Selection Drawer or Quick Action -->
					{#if showBreakReasonPicker}
						<div class="rounded-lg border border-border bg-muted/30 p-2.5 space-y-2 animate-in fade-in duration-150">
							<div class="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
								<span>Select Break Type</span>
								<Button
									variant="link"
									size="xs"
									onclick={() => (showBreakReasonPicker = false)}
									class="text-[10px] p-0 h-auto"
								>
									Cancel
								</Button>
							</div>
							<div class="grid grid-cols-2 gap-1.5">
								{#each breakPresets as preset}
									{@const IconComponent = preset.icon}
									<Button
										variant="outline"
										size="sm"
										onclick={() => handleStartBreak(preset.label)}
										class="justify-start gap-2 h-8 text-xs font-medium"
									>
										<IconComponent class="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
										<span class="truncate">{preset.label}</span>
									</Button>
								{/each}
							</div>
						</div>
					{:else}
						<div class="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								onclick={() => (showBreakReasonPicker = true)}
								class="gap-1.5 border-amber-300/80 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60 font-bold"
							>
								<Coffee class="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
								<span>Take Break</span>
							</Button>

							<Button
								variant="outline"
								onclick={handleCheckOut}
								class="gap-1.5 border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60 font-bold"
							>
								<LogOut class="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
								<span>Check Out</span>
							</Button>
						</div>
					{/if}
				{:else if attendanceState.status === 'on_break'}
					<div class="grid grid-cols-2 gap-2">
						<Button
							onclick={handleEndBreak}
							class="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
						>
							<Play class="h-3.5 w-3.5" />
							<span>Resume Work</span>
						</Button>

						<Button
							variant="outline"
							onclick={handleCheckOut}
							class="gap-1.5 font-semibold"
						>
							<LogOut class="h-3.5 w-3.5" />
							<span>End Day</span>
						</Button>
					</div>
				{/if}
			</div>

			<!-- Recent Breaks History (Today) -->
			{#if attendanceState.breaks.length > 0}
				<div class="mt-3 border-t border-border/60 pt-2.5">
					<span class="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
						Today's Breaks ({attendanceState.breaks.length})
					</span>
					<div class="max-h-24 space-y-1 overflow-y-auto pr-1">
						{#each attendanceState.breaks as brk (brk.id)}
							<div class="flex items-center justify-between rounded bg-muted/30 px-2 py-1 text-[11px]">
								<span class="text-foreground font-medium">{brk.reason || 'Break'}</span>
								<span class="font-mono text-muted-foreground">{brk.durationMinutes}m</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
