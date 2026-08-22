<script lang="ts">
	import { Calendar, BarChart3, TrendingUp } from '@lucide/svelte';

	interface DailyAttendanceData {
		date: string;
		dayLabel: string;
		presentCount: number;
		onLeaveCount: number;
		absentCount: number;
	}

	interface Props {
		data?: DailyAttendanceData[];
		totalEmployees?: number;
	}

	let {
		data = [
			{ date: '2026-08-17', dayLabel: 'Mon', presentCount: 11, onLeaveCount: 1, absentCount: 0 },
			{ date: '2026-08-18', dayLabel: 'Tue', presentCount: 12, onLeaveCount: 0, absentCount: 0 },
			{ date: '2026-08-19', dayLabel: 'Wed', presentCount: 10, onLeaveCount: 2, absentCount: 0 },
			{ date: '2026-08-20', dayLabel: 'Thu', presentCount: 11, onLeaveCount: 1, absentCount: 0 },
			{ date: '2026-08-21', dayLabel: 'Fri', presentCount: 12, onLeaveCount: 0, absentCount: 0 },
			{ date: '2026-08-22', dayLabel: 'Sat', presentCount: 10, onLeaveCount: 2, absentCount: 0 },
			{ date: '2026-08-23', dayLabel: 'Sun', presentCount: 0, onLeaveCount: 0, absentCount: 0 }
		],
		totalEmployees = 12
	}: Props = $props();

	const maxCapacity = 14;
</script>

<div class="rounded-2xl border border-border bg-card p-5 shadow-2xs">
	<!-- Header -->
	<div class="flex items-center justify-between pb-4 mb-4 border-b border-border/80">
		<div class="flex items-center gap-2.5">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
				<BarChart3 class="h-4 w-4" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-foreground">7-Day Attendance Trend</h3>
				<p class="text-[11px] text-muted-foreground">Daily distribution of present, on leave, and absent staff</p>
			</div>
		</div>

		<!-- Legend -->
		<div class="flex items-center gap-3 text-xs">
			<div class="flex items-center gap-1.5">
				<span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
				<span class="text-muted-foreground text-[11px]">Present</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
				<span class="text-muted-foreground text-[11px]">On Leave</span>
			</div>
		</div>
	</div>

	<!-- Visual Stacked Bar Chart -->
	<div class="grid grid-cols-7 gap-3 pt-6 pb-2 items-end min-h-[220px]">
		{#each data as day (day.date)}
			<div class="flex flex-col items-center gap-2 group h-full justify-end">
				<!-- Tooltip on hover -->
				<div class="opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-foreground px-2 py-1 text-[10px] font-mono text-background shadow-xs pointer-events-none mb-1 text-center whitespace-nowrap">
					{day.presentCount} Present • {day.onLeaveCount} Leave
				</div>

				<!-- Bar Container -->
				<div class="w-full max-w-[42px] h-36 rounded-xl bg-muted/40 p-1 flex flex-col justify-end gap-1 relative overflow-hidden">
					{#if day.presentCount > 0 || day.onLeaveCount > 0}
						<!-- On Leave Bar Segment -->
						{#if day.onLeaveCount > 0}
							<div
								class="w-full rounded-lg bg-blue-500 transition-all"
								style="height: {(day.onLeaveCount / maxCapacity) * 100}%;"
								title="On Leave: {day.onLeaveCount}"
							></div>
						{/if}

						<!-- Present Bar Segment -->
						{#if day.presentCount > 0}
							<div
								class="w-full rounded-lg bg-emerald-500 transition-all"
								style="height: {(day.presentCount / maxCapacity) * 100}%;"
								title="Present: {day.presentCount}"
							></div>
						{/if}
					{:else}
						<div class="w-full h-1 bg-border rounded-full my-auto"></div>
					{/if}
				</div>

				<!-- Label -->
				<div class="text-center mt-1">
					<span class="text-xs font-bold text-foreground block">{day.dayLabel}</span>
					<span class="text-[10px] font-mono text-muted-foreground">{day.date.slice(8)}</span>
				</div>
			</div>
		{/each}
	</div>
</div>
