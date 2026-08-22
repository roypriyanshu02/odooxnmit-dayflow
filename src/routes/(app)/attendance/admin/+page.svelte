<script lang="ts">
	import type { PageData } from './$types';
	import AttendanceTable from '$lib/components/attendance/AttendanceTable.svelte';
	import {
		Clock,
		Users,
		Coffee,
		Flame,
		CheckCircle2,
		ShieldAlert,
		CalendarDays,
		ArrowLeft,
		Sparkles
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let records = $derived((data.records || []) as any[]);
	let departments = $derived((data.departments || []) as string[]);
	let kpi = $derived(
		data.kpi || {
			totalRecords: 0,
			presentToday: 0,
			onBreakToday: 0,
			totalOvertimeHours: 0
		}
	);
</script>

<div class="space-y-6">
	<!-- Top Header & Breadcrumb -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
				<a href="/attendance" class="hover:text-foreground transition-colors flex items-center gap-1">
					<ArrowLeft class="h-3.5 w-3.5" /> Attendance Portal
				</a>
				<span>/</span>
				<span class="text-primary font-bold">Admin Records</span>
			</div>
			<div class="flex items-center gap-2.5">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
					<Clock class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-2xl font-bold tracking-tight text-foreground font-sans">Company Attendance Logs</h1>
					<p class="text-xs text-muted-foreground">Monitor real-time shifts, break thresholds, overtime, and export company audit logs.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- KPI Overview Cards -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
		<!-- Present Today -->
		<div class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 shadow-2xs">
			<div class="flex items-center justify-between text-xs font-medium text-emerald-800 dark:text-emerald-300">
				<span>Present Today</span>
				<CheckCircle2 class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
			</div>
			<div class="mt-2 text-2xl font-black text-emerald-900 dark:text-emerald-100 font-mono">
				{kpi.presentToday}
			</div>
			<p class="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">Active on shifts</p>
		</div>

		<!-- Currently on Break -->
		<div class="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 shadow-2xs">
			<div class="flex items-center justify-between text-xs font-medium text-amber-800 dark:text-amber-300">
				<span>Active Breaks</span>
				<Coffee class="h-4 w-4 text-amber-600 dark:text-amber-400" />
			</div>
			<div class="mt-2 text-2xl font-black text-amber-900 dark:text-amber-100 font-mono">
				{kpi.onBreakToday}
			</div>
			<p class="mt-1 text-[11px] text-amber-700/80 dark:text-amber-400/80">On break status</p>
		</div>

		<!-- Overtime Hours -->
		<div class="rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900/40 dark:bg-purple-950/20 shadow-2xs">
			<div class="flex items-center justify-between text-xs font-medium text-purple-800 dark:text-purple-300">
				<span>Total Overtime</span>
				<Flame class="h-4 w-4 text-purple-600 dark:text-purple-400" />
			</div>
			<div class="mt-2 text-2xl font-black text-purple-900 dark:text-purple-100 font-mono">
				{kpi.totalOvertimeHours}<span class="text-sm font-sans font-normal ml-0.5">h</span>
			</div>
			<p class="mt-1 text-[11px] text-purple-700/80 dark:text-purple-400/80">&gt; 8 hours shifts</p>
		</div>

		<!-- Total Records -->
		<div class="rounded-xl border border-border bg-card p-4 shadow-2xs">
			<div class="flex items-center justify-between text-xs font-medium text-muted-foreground">
				<span>Total Logs</span>
				<CalendarDays class="h-4 w-4 text-primary" />
			</div>
			<div class="mt-2 text-2xl font-black text-foreground font-mono">
				{kpi.totalRecords}
			</div>
			<p class="mt-1 text-[11px] text-muted-foreground">Historical records</p>
		</div>
	</div>

	<!-- Main Attendance Table Component -->
	<div class="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
		<AttendanceTable {records} {departments} isAdminView={true} showEmployeeColumns={true} />
	</div>
</div>
