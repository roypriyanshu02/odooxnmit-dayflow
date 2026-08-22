<script lang="ts">
	import type { PageData } from './$types';
	import {
		WorkTimer,
		BreakModal,
		WeeklySummaryCard
	} from '$lib/components/attendance';
	import {
		Clock,
		Coffee,
		LogIn,
		LogOut,
		CalendarDays,
		ShieldCheck,
		ArrowRight,
		Flame,
		CheckCircle2,
		Sparkles
	} from '@lucide/svelte';
	import { auth } from '$lib/state/auth.svelte';

	let { data }: { data: PageData } = $props();

	let records = $derived(data.records || []);
	let isBreakModalOpen = $state(false);

	// Local check-in state
	let isCheckedIn = $state(true);
	let checkInTime = $state('09:00 AM');
	let checkOutTime = $state<string | null>(null);

	function toggleCheckIn() {
		if (isCheckedIn) {
			isCheckedIn = false;
			checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else {
			isCheckedIn = true;
			checkOutTime = null;
			checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
				<span>Attendance &amp; Shifts</span>
				<span>/</span>
				<span class="text-primary font-bold">My Attendance</span>
			</div>
			<div class="flex items-center gap-2.5">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
					<Clock class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-2xl font-bold tracking-tight text-foreground font-sans">Attendance &amp; Time Tracking</h1>
					<p class="text-xs text-muted-foreground">Log daily shift hours, take tracked breaks, and review weekly timesheets.</p>
				</div>
			</div>
		</div>

		<!-- Quick Admin Link -->
		{#if auth.user.role === 'admin' || auth.user.role === 'hr'}
			<a
				href="/attendance/admin"
				class="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
			>
				<ShieldCheck class="h-4 w-4 text-primary" />
				<span>Company Attendance Records</span>
				<ArrowRight class="h-3.5 w-3.5" />
			</a>
		{/if}
	</div>

	<!-- Live Work Timer & Action Card Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<!-- Live Timer Widget -->
		<div class="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-2xs flex flex-col justify-between">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<span class="h-2.5 w-2.5 rounded-full {isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}"></span>
					<span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
						{isCheckedIn ? 'Currently On Shift' : 'Checked Out'}
					</span>
				</div>
				<span class="text-xs font-mono text-muted-foreground">Today: 2026-08-22</span>
			</div>

			<div class="my-4 flex flex-col items-center justify-center py-2">
				<div class="text-xs font-semibold text-muted-foreground mb-1">Elapsed Work Time</div>
				<div class="text-5xl font-black font-mono text-foreground tracking-tight">
					06:45:18
				</div>
				<div class="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
					<span>Shift: <strong>09:00 AM – 06:00 PM</strong></span>
					<span>•</span>
					<span>Target: <strong>8.0 Hours</strong></span>
				</div>
			</div>

			<!-- Action Controls -->
			<div class="flex items-center justify-center gap-3 pt-4 border-t border-border/80">
				<button
					type="button"
					onclick={toggleCheckIn}
					class="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold shadow-xs transition-all {isCheckedIn
						? 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20'
						: 'bg-primary text-primary-foreground hover:bg-primary/90'}"
				>
					{#if isCheckedIn}
						<LogOut class="h-4 w-4" />
						<span>Check Out</span>
					{:else}
						<LogIn class="h-4 w-4" />
						<span>Check In</span>
					{/if}
				</button>

				<button
					type="button"
					onclick={() => (isBreakModalOpen = true)}
					class="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 transition-all"
				>
					<Coffee class="h-4 w-4 text-amber-600" />
					<span>Take Break</span>
				</button>
			</div>
		</div>

		<!-- Daily Breakdown Highlights -->
		<div class="rounded-2xl border border-border bg-card p-5 shadow-2xs flex flex-col justify-between">
			<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Today's Metrics</h3>
			
			<div class="space-y-3">
				<div class="rounded-xl border border-border/80 bg-muted/20 p-3 flex items-center justify-between">
					<span class="text-xs text-muted-foreground">Check-In Time</span>
					<span class="text-xs font-mono font-bold text-foreground">{checkInTime}</span>
				</div>

				<div class="rounded-xl border border-border/80 bg-muted/20 p-3 flex items-center justify-between">
					<span class="text-xs text-muted-foreground">Break Taken</span>
					<span class="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">45 mins</span>
				</div>

				<div class="rounded-xl border border-border/80 bg-muted/20 p-3 flex items-center justify-between">
					<span class="text-xs text-muted-foreground">Net Productive</span>
					<span class="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">6.0 hrs</span>
				</div>
			</div>

			<div class="mt-4 pt-3 border-t border-border/80 text-[11px] text-muted-foreground flex items-center gap-1.5">
				<Sparkles class="h-3.5 w-3.5 text-primary" />
				<span>Automatic overtime activates after 8 hours.</span>
			</div>
		</div>
	</div>

	<!-- Weekly Summary Card Component -->
	<WeeklySummaryCard attendanceRecords={records} currentDateStr="2026-08-22" />

	<!-- Recent Personal Attendance History -->
	<div class="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
		<div class="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<CalendarDays class="h-4 w-4 text-primary" />
				<h3 class="text-xs font-bold uppercase tracking-wider text-foreground">Recent Attendance History</h3>
			</div>
			<span class="text-xs font-mono text-muted-foreground">{records.length} records logged</span>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs border-collapse">
				<thead>
					<tr class="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
						<th class="py-3 px-4">Date</th>
						<th class="py-3 px-4">Check In</th>
						<th class="py-3 px-4">Check Out</th>
						<th class="py-3 px-4">Work Duration</th>
						<th class="py-3 px-4">Break Duration</th>
						<th class="py-3 px-4">Overtime</th>
						<th class="py-3 px-4">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#if records.length === 0}
						<tr>
							<td colspan="7" class="py-8 text-center text-xs text-muted-foreground">
								No attendance records found.
							</td>
						</tr>
					{:else}
						{#each records as r (r.id)}
							<tr class="hover:bg-muted/30 transition-colors">
								<td class="py-3 px-4 font-mono font-medium text-foreground">{r.date}</td>
								<td class="py-3 px-4 font-mono text-muted-foreground">{r.checkIn || '—'}</td>
								<td class="py-3 px-4 font-mono text-muted-foreground">{r.checkOut || '—'}</td>
								<td class="py-3 px-4 font-mono font-semibold text-foreground">
									{((r.totalWorkMinutes || 0) / 60).toFixed(1)} hrs
								</td>
								<td class="py-3 px-4 font-mono text-muted-foreground">
									{r.totalBreakMinutes || 0} mins
								</td>
								<td class="py-3 px-4 font-mono text-purple-700 dark:text-purple-300">
									{#if (r.overtimeMinutes || 0) > 0}
										<span class="inline-flex items-center gap-0.5">
											<Flame class="h-3 w-3 text-purple-600" />
											<span>+{((r.overtimeMinutes || 0) / 60).toFixed(1)}h</span>
										</span>
									{:else}
										<span>0h</span>
									{/if}
								</td>
								<td class="py-3 px-4">
									<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider {r.status === 'present'
										? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
										: r.status === 'on_leave'
											? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
											: 'bg-muted text-muted-foreground border border-border'}">
										<CheckCircle2 class="h-2.5 w-2.5" />
										<span>{r.status}</span>
									</span>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Break Modal Component -->
<BreakModal
	open={isBreakModalOpen}
	employeeId={data.employeeId}
	onClose={() => (isBreakModalOpen = false)}
/>
