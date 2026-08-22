<script lang="ts">
	import {
		Users,
		CheckCircle2,
		Plane,
		Coins,
		TrendingUp,
		ArrowUpRight,
		Clock,
		Sparkles
	} from '@lucide/svelte';

	interface Metrics {
		totalEmployees: number;
		presentToday: number;
		onLeaveToday: number;
		absentToday: number;
		pendingLeaves: number;
		monthlyPayrollCost: number;
		attendanceRatePercent: number;
	}

	interface Props {
		metrics: Metrics;
	}

	let { metrics }: Props = $props();
</script>

<div class="grid grid-cols-2 gap-3.5 lg:grid-cols-4 lg:gap-4">
	<!-- 1. Total Workforce -->
	<div class="rounded-2xl border border-border bg-card p-5 shadow-2xs hover:shadow-xs transition-shadow">
		<div class="flex items-center justify-between text-xs font-semibold text-muted-foreground">
			<span>Active Workforce</span>
			<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
				<Users class="h-4 w-4" />
			</div>
		</div>
		<div class="mt-3 text-3xl font-black font-mono text-foreground tracking-tight">
			{metrics.totalEmployees}
		</div>
		<div class="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
			<TrendingUp class="h-3.5 w-3.5" />
			<span>100% active staff</span>
		</div>
	</div>

	<!-- 2. Present Today -->
	<div class="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20 shadow-2xs hover:shadow-xs transition-shadow">
		<div class="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
			<span>Present Today</span>
			<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
				<CheckCircle2 class="h-4 w-4" />
			</div>
		</div>
		<div class="mt-3 text-3xl font-black font-mono text-emerald-900 dark:text-emerald-100 tracking-tight">
			{metrics.presentToday}
		</div>
		<div class="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
			<span>{metrics.attendanceRatePercent}% attendance rate</span>
		</div>
	</div>

	<!-- 3. On Leave / Pending Approvals -->
	<div class="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20 shadow-2xs hover:shadow-xs transition-shadow">
		<div class="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-300">
			<span>On Leave Today</span>
			<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
				<Plane class="h-4 w-4" />
			</div>
		</div>
		<div class="mt-3 text-3xl font-black font-mono text-blue-900 dark:text-blue-100 tracking-tight">
			{metrics.onLeaveToday}
		</div>
		<div class="mt-2 flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 font-medium">
			<Clock class="h-3.5 w-3.5" />
			<span>{metrics.pendingLeaves} pending approvals</span>
		</div>
	</div>

	<!-- 4. Monthly Payroll Liability -->
	<div class="rounded-2xl border border-border bg-card p-5 shadow-2xs hover:shadow-xs transition-shadow">
		<div class="flex items-center justify-between text-xs font-semibold text-muted-foreground">
			<span>Monthly Payroll</span>
			<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
				<Coins class="h-4 w-4" />
			</div>
		</div>
		<div class="mt-3 text-3xl font-black font-mono text-foreground tracking-tight">
			₹{(metrics.monthlyPayrollCost / 100000).toFixed(2)}<span class="text-sm font-sans font-semibold text-muted-foreground ml-1">L</span>
		</div>
		<div class="mt-2 flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 font-medium">
			<span>₹{metrics.monthlyPayrollCost.toLocaleString('en-IN')} total liability</span>
		</div>
	</div>
</div>
