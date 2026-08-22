<script lang="ts">
	import {
		X,
		Play,
		CheckCircle2,
		AlertTriangle,
		Building2,
		Calendar,
		Sparkles,
		RotateCcw,
		Loader2
	} from '@lucide/svelte';

	interface Props {
		open?: boolean;
		departments?: string[];
		onClose?: () => void;
		onSuccess?: (summary: any) => void;
	}

	let {
		open = false,
		departments = [],
		onClose,
		onSuccess
	}: Props = $props();

	// Form state
	let selectedMonth = $state(8); // August
	let selectedYear = $state(2026);
	let selectedDept = $state('all');
	let overwriteExisting = $state(true);

	// Processing state
	let isProcessing = $state(false);
	let errorMessage = $state<string | null>(null);
	let resultSummary = $state<any | null>(null);

	const months = [
		{ value: 1, label: 'January' },
		{ value: 2, label: 'February' },
		{ value: 3, label: 'March' },
		{ value: 4, label: 'April' },
		{ value: 5, label: 'May' },
		{ value: 6, label: 'June' },
		{ value: 7, label: 'July' },
		{ value: 8, label: 'August' },
		{ value: 9, label: 'September' },
		{ value: 10, label: 'October' },
		{ value: 11, label: 'November' },
		{ value: 12, label: 'December' }
	];

	async function handleRunBatch() {
		isProcessing = true;
		errorMessage = null;
		resultSummary = null;

		try {
			const res = await fetch('/api/payroll/batch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					month: selectedMonth,
					year: selectedYear,
					department: selectedDept,
					overwrite: overwriteExisting
				})
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				throw new Error(data.error || 'Failed to execute batch payroll run.');
			}

			resultSummary = data;
			if (onSuccess) {
				onSuccess(data);
			}
		} catch (err: any) {
			errorMessage = err.message || 'An unexpected error occurred.';
		} finally {
			isProcessing = false;
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<div
			class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
			onclick={onClose}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Escape' && onClose?.()}
		></div>

		<!-- Dialog Modal -->
		<div
			class="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all animate-in fade-in-0 zoom-in-95"
			role="dialog"
			aria-modal="true"
		>
			<!-- Close Button -->
			<button
				type="button"
				class="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
				onclick={onClose}
				aria-label="Close dialog"
			>
				<X class="h-5 w-5" />
			</button>

			<!-- Header -->
			<div class="flex items-center gap-3 mb-5">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
					<Sparkles class="h-5 w-5" />
				</div>
				<div>
					<h2 class="text-lg font-bold text-foreground">One-Click Batch Payroll Run</h2>
					<p class="text-xs text-muted-foreground">Compute attendance-based statutory salary slips in bulk.</p>
				</div>
			</div>

			{#if resultSummary}
				<!-- Success State -->
				<div class="space-y-4 py-2">
					<div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
						<div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
							<CheckCircle2 class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
							<span>Batch Payroll Completed Successfully!</span>
						</div>
						<p class="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
							Processed <strong>{resultSummary.processedCount}</strong> employee payslips for {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}.
						</p>
					</div>

					<!-- Summary Totals Grid -->
					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-lg border border-border bg-muted/30 p-3">
							<span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Gross Payroll</span>
							<div class="text-base font-bold font-mono text-foreground mt-0.5">
								₹{resultSummary.summary.totalGross.toLocaleString('en-IN')}
							</div>
						</div>
						<div class="rounded-lg border border-border bg-muted/30 p-3">
							<span class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Net Payable</span>
							<div class="text-base font-bold font-mono text-primary mt-0.5">
								₹{resultSummary.summary.totalNet.toLocaleString('en-IN')}
							</div>
						</div>
					</div>

					<div class="flex justify-end gap-2 pt-2">
						<button
							type="button"
							class="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
							onclick={onClose}
						>
							Done & View Payslips
						</button>
					</div>
				</div>
			{:else}
				<!-- Form Input State -->
				<div class="space-y-4">
					{#if errorMessage}
						<div class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
							<AlertTriangle class="h-4 w-4 shrink-0" />
							<span>{errorMessage}</span>
						</div>
					{/if}

					<!-- Month & Year Selector -->
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="month-select" class="block text-xs font-semibold text-foreground mb-1.5">Payroll Month</label>
							<select
								id="month-select"
								bind:value={selectedMonth}
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
							>
								{#each months as m}
									<option value={m.value}>{m.label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="year-select" class="block text-xs font-semibold text-foreground mb-1.5">Calendar Year</label>
							<input
								id="year-select"
								type="number"
								bind:value={selectedYear}
								min="2020"
								max="2030"
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
							/>
						</div>
					</div>

					<!-- Department Filter -->
					<div>
						<label for="dept-select" class="block text-xs font-semibold text-foreground mb-1.5">Department Filter</label>
						<select
							id="dept-select"
							bind:value={selectedDept}
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
						>
							<option value="all">All Departments (Company-Wide)</option>
							{#each departments as dept}
								<option value={dept}>{dept}</option>
							{/each}
						</select>
					</div>

					<!-- Overwrite Option -->
					<div class="flex items-center gap-2.5 rounded-lg border border-border bg-muted/20 p-3">
						<input
							type="checkbox"
							id="overwrite"
							bind:checked={overwriteExisting}
							class="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
						/>
						<label for="overwrite" class="text-xs text-muted-foreground">
							Overwrite and recompute existing payslips if already generated for this cycle.
						</label>
					</div>

					<!-- Action Buttons -->
					<div class="flex justify-end gap-2 pt-3">
						<button
							type="button"
							class="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
							onclick={onClose}
							disabled={isProcessing}
						>
							Cancel
						</button>
						<button
							type="button"
							class="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50"
							onclick={handleRunBatch}
							disabled={isProcessing}
						>
							{#if isProcessing}
								<Loader2 class="h-3.5 w-3.5 animate-spin" />
								<span>Computing Batch...</span>
							{:else}
								<Play class="h-3.5 w-3.5 fill-current" />
								<span>Execute Batch Run</span>
							{/if}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
