<script lang="ts">
	import {
		Play,
		CheckCircle2,
		AlertTriangle,
		Sparkles,
		Loader2
	} from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		open?: boolean;
		departments?: string[];
		onClose?: () => void;
		onSuccess?: (summary: any) => void;
	}

	let {
		open = $bindable(false),
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

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			onClose?.();
		}
	}

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

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-lg">
		<!-- Header -->
		<Dialog.Header class="flex flex-row items-center gap-3 space-y-0 mb-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
				<Sparkles class="h-5 w-5" />
			</div>
			<div>
				<Dialog.Title class="text-lg font-bold text-foreground">One-Click Batch Payroll Run</Dialog.Title>
				<Dialog.Description class="text-xs text-muted-foreground">Compute attendance-based statutory salary slips in bulk.</Dialog.Description>
			</div>
		</Dialog.Header>

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

				<Dialog.Footer class="pt-2">
					<Button
						size="sm"
						onclick={() => { open = false; onClose?.(); }}
					>
						Done & View Payslips
					</Button>
				</Dialog.Footer>
			</div>
		{:else}
			<!-- Form Input State -->
			<div class="space-y-4 py-1">
				{#if errorMessage}
					<div class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
						<AlertTriangle class="h-4 w-4 shrink-0" />
						<span>{errorMessage}</span>
					</div>
				{/if}

				<!-- Month & Year Selector -->
				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1.5">
						<Label for="month-select">Payroll Month</Label>
						<select
							id="month-select"
							bind:value={selectedMonth}
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
						>
							{#each months as m}
								<option value={m.value}>{m.label}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-1.5">
						<Label for="year-select">Calendar Year</Label>
						<Input
							id="year-select"
							type="number"
							bind:value={selectedYear}
							min="2020"
							max="2030"
							class="h-8.5 text-xs font-mono"
						/>
					</div>
				</div>

				<!-- Department Filter -->
				<div class="space-y-1.5">
					<Label for="dept-select">Department Filter</Label>
					<select
						id="dept-select"
						bind:value={selectedDept}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
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
						class="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
					/>
					<label for="overwrite" class="text-xs text-muted-foreground cursor-pointer">
						Overwrite and recompute existing payslips if already generated for this cycle.
					</label>
				</div>

				<!-- Action Buttons -->
				<Dialog.Footer class="flex justify-end gap-2 pt-3">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={() => { open = false; onClose?.(); }}
						disabled={isProcessing}
					>
						Cancel
					</Button>
					<Button
						type="button"
						size="sm"
						class="gap-1.5"
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
					</Button>
				</Dialog.Footer>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
