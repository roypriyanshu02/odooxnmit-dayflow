<script lang="ts">
	import type { PageData } from './$types';
	import {
		MetricCards,
		AttendanceChart,
		DepartmentHeadcount,
		RecentActivityFeed
	} from '$lib/components/dashboard';
	import {
		LayoutDashboard,
		Sparkles,
		Users,
		CalendarRange,
		ReceiptText,
		ArrowRight,
		ShieldCheck
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let metrics = $derived(data.metrics);
	let departments = $derived(data.departments);
</script>

<div class="space-y-6">
	<!-- Top Executive Banner -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
				<span>Enterprise Overview</span>
				<span>/</span>
				<span class="text-primary font-bold">Executive Dashboard</span>
			</div>
			<div class="flex items-center gap-2.5">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
					<LayoutDashboard class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-2xl font-bold tracking-tight text-foreground font-sans">Human Resources Executive Suite</h1>
					<p class="text-xs text-muted-foreground">Real-time attendance telemetry, leave pipeline, compensation liability, and team analytics.</p>
				</div>
			</div>
		</div>

		<!-- Quick Navigation Shortcuts -->
		<div class="flex items-center gap-2 flex-wrap">
			<a
				href="/employees"
				class="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
			>
				<Users class="h-3.5 w-3.5 text-primary" />
				<span>Employees</span>
			</a>
			<a
				href="/leaves/approvals"
				class="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
			>
				<CalendarRange class="h-3.5 w-3.5 text-blue-600" />
				<span>Approvals</span>
			</a>
			<a
				href="/payroll"
				class="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
			>
				<ReceiptText class="h-3.5 w-3.5" />
				<span>Payroll Hub</span>
			</a>
		</div>
	</div>

	<!-- Top Metric KPI Cards -->
	<MetricCards {metrics} />

	<!-- Visual Analytics Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- 7-Day Attendance Trend Chart (2 Cols) -->
		<div class="lg:col-span-2">
			<AttendanceChart totalEmployees={metrics.totalEmployees} />
		</div>

		<!-- Department Headcount Distribution (1 Col) -->
		<div>
			<DepartmentHeadcount {departments} totalStaff={metrics.totalEmployees} />
		</div>
	</div>

	<!-- Real-Time Activity Stream -->
	<div class="grid grid-cols-1">
		<RecentActivityFeed />
	</div>
</div>
