<script lang="ts">
	import type { PageData } from './$types';
	import BatchProcessorModal from '$lib/components/payroll/BatchProcessorModal.svelte';
	import {
		ReceiptText,
		Sparkles,
		Play,
		Search,
		Filter,
		Building2,
		Eye,
		Download,
		CheckCircle2,
		Clock,
		Coins,
		DollarSign,
		ArrowUpRight,
		FileText
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// Local state
	let payslips = $derived((data.payslips || []) as any[]);
	let departments = $derived((data.departments || []) as string[]);
	let stats = $derived(data.stats || { totalCount: 0, totalGross: 0, totalNet: 0, totalDeductions: 0, totalPf: 0 });

	let isBatchModalOpen = $state(false);
	let searchQuery = $state('');
	let selectedDepartment = $state('all');
	let selectedMonth = $state<number | 'all'>('all');
	let selectedYear = $state<number | 'all'>('all');

	const monthNames = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
	];

	// Filtered list of payslips
	const filteredPayslips = $derived(
		payslips.filter((p: any) => {
			const q = searchQuery.toLowerCase().trim();
			const matchesQuery =
				q === '' ||
				p.employeeName.toLowerCase().includes(q) ||
				p.employeeId.toLowerCase().includes(q) ||
				p.jobTitle.toLowerCase().includes(q) ||
				p.id.toLowerCase().includes(q);

			const matchesDept = selectedDepartment === 'all' || p.department === selectedDepartment;
			const matchesMonth = selectedMonth === 'all' || p.month === selectedMonth;
			const matchesYear = selectedYear === 'all' || p.year === selectedYear;

			return matchesQuery && matchesDept && matchesMonth && matchesYear;
		})
	);

	function handleBatchSuccess(summary: any) {
		// Reload page or update payslips
		window.location.reload();
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
				<span>Compensation &amp; Benefits</span>
				<span>/</span>
				<span class="text-primary font-bold">Payroll Hub</span>
			</div>
			<div class="flex items-center gap-2.5">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
					<ReceiptText class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-2xl font-bold tracking-tight text-foreground font-sans">Monthly Payroll &amp; Payslips</h1>
					<p class="text-xs text-muted-foreground">Automated salary computation, loss of pay deductions, statutory compliance, and batch processing.</p>
				</div>
			</div>
		</div>

		<!-- Action: Batch Run -->
		<button
			type="button"
			class="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
			onclick={() => (isBatchModalOpen = true)}
		>
			<Sparkles class="h-4 w-4" />
			<span>One-Click Batch Payroll</span>
		</button>
	</div>

	<!-- KPI Summary Overview -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
		<!-- Total Gross Payroll -->
		<div class="rounded-xl border border-border bg-card p-4 shadow-2xs">
			<div class="flex items-center justify-between text-xs font-medium text-muted-foreground">
				<span>Gross Payroll</span>
				<Coins class="h-4 w-4 text-primary" />
			</div>
			<div class="mt-2 text-2xl font-black text-foreground font-mono">
				₹{stats.totalGross.toLocaleString('en-IN')}
			</div>
			<p class="mt-1 text-[11px] text-muted-foreground">Total salary expenditure</p>
		</div>

		<!-- Total Net Payable -->
		<div class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 shadow-2xs">
			<div class="flex items-center justify-between text-xs font-medium text-emerald-800 dark:text-emerald-300">
				<span>Net Payable</span>
				<CheckCircle2 class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
			</div>
			<div class="mt-2 text-2xl font-black text-emerald-900 dark:text-emerald-100 font-mono">
				₹{stats.totalNet.toLocaleString('en-IN')}
			</div>
			<p class="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">Direct bank transfer total</p>
		</div>

		<!-- Total Statutory Deductions -->
		<div class="rounded-xl border border-border bg-card p-4 shadow-2xs">
			<div class="flex items-center justify-between text-xs font-medium text-muted-foreground">
				<span>Total Deductions</span>
				<ReceiptText class="h-4 w-4 text-muted-foreground" />
			</div>
			<div class="mt-2 text-2xl font-black text-foreground font-mono">
				₹{stats.totalDeductions.toLocaleString('en-IN')}
			</div>
			<p class="mt-1 text-[11px] text-muted-foreground">PF + PT Statutory contributions</p>
		</div>

		<!-- Processed Payslips Count -->
		<div class="rounded-xl border border-border bg-card p-4 shadow-2xs">
			<div class="flex items-center justify-between text-xs font-medium text-muted-foreground">
				<span>Generated Payslips</span>
				<FileText class="h-4 w-4 text-primary" />
			</div>
			<div class="mt-2 text-2xl font-black text-foreground font-mono">
				{stats.totalCount}
			</div>
			<p class="mt-1 text-[11px] text-muted-foreground">Vouchers issued</p>
		</div>
	</div>

	<!-- Filters & Table Section -->
	<div class="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
		<!-- Search & Filter Bar -->
		<div class="border-b border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20">
			<!-- Search Input -->
			<div class="relative w-full sm:w-72">
				<Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
				<input
					type="text"
					placeholder="Search employee or payslip ID..."
					bind:value={searchQuery}
					class="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
				/>
			</div>

			<!-- Dropdown Filters -->
			<div class="flex items-center gap-2 flex-wrap">
				<!-- Department Dropdown -->
				<select
					bind:value={selectedDepartment}
					class="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
				>
					<option value="all">All Departments</option>
					{#each departments as dept}
						<option value={dept}>{dept}</option>
					{/each}
				</select>

				<!-- Month Filter -->
				<select
					bind:value={selectedMonth}
					class="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
				>
					<option value="all">All Months</option>
					{#each monthNames as m, idx}
						<option value={idx + 1}>{m}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs border-collapse">
				<thead>
					<tr class="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
						<th class="py-3 px-4">Employee</th>
						<th class="py-3 px-4">Cycle</th>
						<th class="py-3 px-4">Attendance</th>
						<th class="py-3 px-4">Gross Salary</th>
						<th class="py-3 px-4">Deductions</th>
						<th class="py-3 px-4">Net Salary</th>
						<th class="py-3 px-4">Status</th>
						<th class="py-3 px-4 text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#if filteredPayslips.length === 0}
						<tr>
							<td colspan="8" class="py-8 text-center text-xs text-muted-foreground">
								No payslip records found matching your filters.
							</td>
						</tr>
					{:else}
						{#each filteredPayslips as slip (slip.id)}
							<tr class="hover:bg-muted/30 transition-colors">
								<!-- Employee Details -->
								<td class="py-3 px-4">
									<div class="flex items-center gap-2.5">
										<div class="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
											{slip.employeeFirstName?.[0] || ''}{slip.employeeLastName?.[0] || ''}
										</div>
										<div>
											<span class="font-bold text-foreground block">{slip.employeeName}</span>
											<span class="text-[10px] font-mono text-muted-foreground">{slip.employeeId} • {slip.department}</span>
										</div>
									</div>
								</td>

								<!-- Cycle -->
								<td class="py-3 px-4 font-medium text-foreground">
									{monthNames[slip.month - 1]} {slip.year}
								</td>

								<!-- Attendance -->
								<td class="py-3 px-4">
									<div class="flex items-center gap-1 font-mono text-[11px]">
										<span class="text-emerald-600 dark:text-emerald-400 font-bold">{slip.payableDays}</span>
										<span class="text-muted-foreground">/ {slip.totalWorkingDays}d</span>
									</div>
								</td>

								<!-- Gross -->
								<td class="py-3 px-4 font-mono font-semibold text-foreground">
									₹{(slip.grossSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
								</td>

								<!-- Deductions -->
								<td class="py-3 px-4 font-mono text-destructive">
									₹{(slip.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
								</td>

								<!-- Net Salary -->
								<td class="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
									₹{(slip.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
								</td>

								<!-- Status Badge -->
								<td class="py-3 px-4">
									<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider {slip.status === 'paid'
										? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
										: 'bg-primary/10 text-primary border border-primary/20'}">
										<CheckCircle2 class="h-2.5 w-2.5" />
										<span>{slip.status}</span>
									</span>
								</td>

								<!-- Actions -->
								<td class="py-3 px-4 text-right">
									<a
										href="/payroll/{slip.id}"
										class="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
									>
										<Eye class="h-3.5 w-3.5" />
										<span>View Slip</span>
									</a>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Batch Processor Modal Component -->
<BatchProcessorModal
	open={isBatchModalOpen}
	{departments}
	onClose={() => (isBatchModalOpen = false)}
	onSuccess={handleBatchSuccess}
/>
