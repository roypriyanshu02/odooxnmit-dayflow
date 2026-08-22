<script lang="ts">
	import { auth } from '$lib/state/auth.svelte';
	import { calculateSalaryBreakdown, formatINR } from '$lib/utils/salary';
	import {
		ReceiptText,
		ShieldAlert,
		ShieldCheck,
		Lock,
		Coins,
		TrendingUp,
		ArrowDownRight,
		Percent,
		Building2,
		Wallet,
		CheckCircle2,
		Info
	} from '@lucide/svelte';

	interface EmployeeSalaryData {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		jobTitle: string;
		department: string;
		monthlyWage?: number;
	}

	let {
		employee
	}: {
		employee: EmployeeSalaryData;
	} = $props();

	// Check permissions
	// Admin and HR have full access; an employee can only see their own salary if their email matches
	const canViewSalary = $derived(() => {
		if (auth.isAdmin || auth.isHR) return true;
		if (auth.user.email && employee.email && auth.user.email.toLowerCase() === employee.email.toLowerCase()) {
			return true;
		}
		return false;
	});

	const monthlyWage = $derived(employee.monthlyWage || 0);
	const breakdown = $derived(calculateSalaryBreakdown(monthlyWage));
	const annualCTC = $derived(monthlyWage * 12);
</script>

<div class="space-y-6">
	{#if !canViewSalary()}
		<!-- Restricted Access Guard Banner -->
		<div class="rounded-2xl border border-border/80 bg-card p-8 sm:p-12 text-center shadow-2xs">
			<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
				<Lock class="h-8 w-8" />
			</div>
			<h3 class="text-lg font-bold text-foreground">Confidential Compensation Information</h3>
			<p class="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
				Salary structures, wage configurations, and itemized deduction breakdown are restricted by role-based access control. Switch to an <span class="font-semibold text-foreground">HR Officer</span> or <span class="font-semibold text-foreground">Admin</span> profile using the top navbar to inspect compensation details.
			</p>
			<div class="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-xs font-semibold text-muted-foreground">
				<ShieldAlert class="h-3.5 w-3.5 text-amber-500" />
				<span>Access Level: Restricted for {auth.roleTitle}</span>
			</div>
		</div>
	{:else}
		<!-- Header / Compliance Notice -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/80 bg-muted/30 p-5 shadow-2xs">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
					<Coins class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-foreground">Formula-Driven Compensation Structure</h3>
					<p class="text-xs text-muted-foreground">Standardized Indian Payroll compliance with automated PF & Tax deductions</p>
				</div>
			</div>

			<div class="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
				<ShieldCheck class="h-3.5 w-3.5" />
				<span>Authorized HR View</span>
			</div>
		</div>

		<!-- Summary Top Cards -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<!-- Monthly Wage -->
			<div class="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
				<div class="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
					<span>Configured Monthly Wage</span>
					<Wallet class="h-4 w-4 text-primary" />
				</div>
				<div class="text-2xl font-extrabold text-foreground tracking-tight">
					{formatINR(breakdown.monthlyWage)}
				</div>
				<p class="text-[11px] text-muted-foreground mt-1">Base monthly rate for standard 30-day month</p>
			</div>

			<!-- Gross Monthly Earnings -->
			<div class="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
				<div class="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
					<span>Gross Monthly Salary</span>
					<TrendingUp class="h-4 w-4 text-emerald-500" />
				</div>
				<div class="text-2xl font-extrabold text-foreground tracking-tight">
					{formatINR(breakdown.grossSalary)}
				</div>
				<p class="text-[11px] text-muted-foreground mt-1">Sum of all basic and allowance components</p>
			</div>

			<!-- Annual CTC -->
			<div class="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
				<div class="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
					<span>Annual CTC Package</span>
					<Building2 class="h-4 w-4 text-purple-500" />
				</div>
				<div class="text-2xl font-extrabold text-primary tracking-tight">
					{formatINR(annualCTC)}
				</div>
				<p class="text-[11px] text-muted-foreground mt-1">Total annualized company cost (12 months)</p>
			</div>
		</div>

		<!-- Two-Column Itemized Breakdown Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Column 1: Earnings Components -->
			<div class="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs flex flex-col justify-between">
				<div>
					<div class="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
						<div class="flex items-center gap-2">
							<div class="h-2 w-2 rounded-full bg-emerald-500"></div>
							<h4 class="text-sm font-bold text-foreground uppercase tracking-wider">Earnings & Allowances</h4>
						</div>
						<span class="text-xs font-semibold text-muted-foreground">Formula Rate</span>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between text-xs sm:text-sm">
							<div>
								<span class="font-semibold text-foreground">Basic Salary</span>
								<p class="text-[11px] text-muted-foreground">50% of Monthly Wage</p>
							</div>
							<span class="font-mono font-bold text-foreground">{formatINR(breakdown.basicSalary)}</span>
						</div>

						<div class="flex items-center justify-between text-xs sm:text-sm">
							<div>
								<span class="font-semibold text-foreground">House Rent Allowance (HRA)</span>
								<p class="text-[11px] text-muted-foreground">50% of Basic Salary</p>
							</div>
							<span class="font-mono font-bold text-foreground">{formatINR(breakdown.hra)}</span>
						</div>

						<div class="flex items-center justify-between text-xs sm:text-sm">
							<div>
								<span class="font-semibold text-foreground">Standard Allowance</span>
								<p class="text-[11px] text-muted-foreground">Statutory Standard Allowance</p>
							</div>
							<span class="font-mono font-bold text-foreground">{formatINR(breakdown.standardAllowance)}</span>
						</div>

						<div class="flex items-center justify-between text-xs sm:text-sm">
							<div>
								<span class="font-semibold text-foreground">Performance Bonus</span>
								<p class="text-[11px] text-muted-foreground">8.33% of Basic Salary</p>
							</div>
							<span class="font-mono font-bold text-foreground">{formatINR(breakdown.performanceBonus)}</span>
						</div>

						<div class="flex items-center justify-between text-xs sm:text-sm">
							<div>
								<span class="font-semibold text-foreground">Leave Travel Allowance (LTA)</span>
								<p class="text-[11px] text-muted-foreground">8.33% of Basic Salary</p>
							</div>
							<span class="font-mono font-bold text-foreground">{formatINR(breakdown.lta)}</span>
						</div>

						<div class="flex items-center justify-between text-xs sm:text-sm">
							<div>
								<span class="font-semibold text-foreground">Fixed Special Allowance</span>
								<p class="text-[11px] text-muted-foreground">Balancing residual component</p>
							</div>
							<span class="font-mono font-bold text-foreground">{formatINR(breakdown.fixedAllowance)}</span>
						</div>
					</div>
				</div>

				<div class="mt-6 pt-4 border-t border-border/80 flex items-center justify-between">
					<span class="text-sm font-bold text-foreground">Total Gross Earnings</span>
					<span class="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
						{formatINR(breakdown.grossSalary)}
					</span>
				</div>
			</div>

			<!-- Column 2: Deductions & Net Take-Home -->
			<div class="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs flex flex-col justify-between">
				<div>
					<div class="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
						<div class="flex items-center gap-2">
							<div class="h-2 w-2 rounded-full bg-destructive"></div>
							<h4 class="text-sm font-bold text-foreground uppercase tracking-wider">Statutory Deductions</h4>
						</div>
						<span class="text-xs font-semibold text-muted-foreground">Statutory Rate</span>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between text-xs sm:text-sm">
							<div>
								<span class="font-semibold text-foreground">Employee PF Contribution</span>
								<p class="text-[11px] text-muted-foreground">12% of Basic Salary (EPFO)</p>
							</div>
							<span class="font-mono font-bold text-destructive">-{formatINR(breakdown.employeePf)}</span>
						</div>

						<div class="flex items-center justify-between text-xs sm:text-sm">
							<div>
								<span class="font-semibold text-foreground">Employer PF Match</span>
								<p class="text-[11px] text-muted-foreground">12% of Basic Salary (Direct by Company)</p>
							</div>
							<span class="font-mono font-semibold text-muted-foreground">{formatINR(breakdown.employerPf)}</span>
						</div>

						<div class="flex items-center justify-between text-xs sm:text-sm">
							<div>
								<span class="font-semibold text-foreground">Professional Tax (PT)</span>
								<p class="text-[11px] text-muted-foreground">State statutory tax</p>
							</div>
							<span class="font-mono font-bold text-destructive">-{formatINR(breakdown.professionalTax)}</span>
						</div>

						<div class="rounded-xl border border-border/60 bg-muted/20 p-3 mt-4">
							<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Info class="h-3.5 w-3.5 text-primary" />
								<span>Employer PF is matched automatically and does not reduce employee net take-home pay.</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Net Take-Home Salary Highlight Card -->
				<div class="mt-6 pt-4 border-t border-border/80">
					<div class="flex items-center justify-between mb-2">
						<span class="text-xs font-medium text-muted-foreground">Total Monthly Deductions</span>
						<span class="font-mono text-xs font-bold text-destructive">-{formatINR(breakdown.totalDeductions)}</span>
					</div>

					<div class="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 flex items-center justify-between">
						<div>
							<div class="text-xs font-bold uppercase tracking-wider text-primary">Net Take-Home Salary</div>
							<div class="text-[11px] text-muted-foreground">Deposited directly on 30th / 31st</div>
						</div>
						<div class="font-mono text-xl font-extrabold text-primary">
							{formatINR(breakdown.netSalary)}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
