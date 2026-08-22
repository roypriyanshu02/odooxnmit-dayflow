<script lang="ts">
	import type { LeaveType, LeaveBalance, CreateLeaveRequestPayload } from '$lib/types/leaves';
	import { LEAVE_TYPES_CONFIG, calculateWorkingDays } from '$lib/types/leaves';
	import {
		X,
		CalendarDays,
		Clock,
		AlertCircle,
		CheckCircle2,
		Palmtree,
		HeartPulse,
		Upload,
		FileText,
		Trash2,
		Sparkles,
		ShieldAlert,
		Loader2
	} from '@lucide/svelte';

	interface Props {
		open: boolean;
		initialType?: LeaveType;
		balance?: LeaveBalance | null;
		onSubmit?: (payload: CreateLeaveRequestPayload) => Promise<boolean | void> | boolean | void;
		onClose: () => void;
	}

	let {
		open = $bindable(false),
		initialType = 'paid_time_off',
		balance = null,
		onSubmit,
		onClose
	}: Props = $props();

	// Form State
	let leaveType = $state<LeaveType>('paid_time_off');
	let startDate = $state('');
	let endDate = $state('');
	let reason = $state('');
	let attachmentFile = $state<File | null>(null);
	let attachmentUrl = $state<string | null>(null);
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	// Sync initial type whenever modal opens
	$effect(() => {
		if (open) {
			leaveType = initialType;
			errorMessage = null;
			successMessage = null;
			// Default start date to today if empty
			if (!startDate) {
				const today = new Date().toISOString().split('T')[0];
				startDate = today;
				endDate = today;
			}
		}
	});

	// Calculated business working days
	const calculation = $derived(calculateWorkingDays(startDate, endDate));
	const workingDays = $derived(calculation.workingDays);

	// Available balance calculations
	const ptoTotal = $derived(balance?.paidTimeOffTotal ?? 24);
	const ptoUsed = $derived(balance?.paidTimeOffUsed ?? 0);
	const ptoRemaining = $derived(Math.max(0, ptoTotal - ptoUsed));

	const sickTotal = $derived(balance?.sickLeaveTotal ?? 7);
	const sickUsed = $derived(balance?.sickLeaveUsed ?? 0);
	const sickRemaining = $derived(Math.max(0, sickTotal - sickUsed));

	const currentRemaining = $derived(
		leaveType === 'paid_time_off'
			? ptoRemaining
			: leaveType === 'sick_leave'
				? sickRemaining
				: Infinity
	);

	// Validation Warnings & Checks
	const isExceedingBalance = $derived(
		leaveType !== 'unpaid_leave' && workingDays > 0 && workingDays > currentRemaining
	);

	const isDateOrderInvalid = $derived(
		startDate !== '' && endDate !== '' && new Date(startDate) > new Date(endDate)
	);

	const isMedicalProofRecommended = $derived(
		leaveType === 'sick_leave' && workingDays >= 3
	);

	const isFormValid = $derived(
		startDate !== '' &&
		endDate !== '' &&
		!isDateOrderInvalid &&
		workingDays > 0 &&
		reason.trim().length >= 3 &&
		!isSubmitting
	);

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];
			attachmentFile = file;
			attachmentUrl = URL.createObjectURL(file);
		}
	}

	function removeAttachment() {
		attachmentFile = null;
		attachmentUrl = null;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!isFormValid) return;

		isSubmitting = true;
		errorMessage = null;

		try {
			const payload: CreateLeaveRequestPayload = {
				employeeId: balance?.employeeId || 'demo-emp-03',
				leaveType,
				startDate,
				endDate,
				totalDays: workingDays,
				reason: reason.trim(),
				attachmentUrl: attachmentFile ? `mock://${attachmentFile.name}` : null,
				attachmentName: attachmentFile ? attachmentFile.name : null
			};

			if (onSubmit) {
				const result = await onSubmit(payload);
				if (result === false) {
					isSubmitting = false;
					return;
				}
			}

			successMessage = 'Leave request submitted successfully!';
			setTimeout(() => {
				isSubmitting = false;
				handleClose();
			}, 600);
		} catch (err: any) {
			errorMessage = err?.message || 'Failed to submit leave request. Please try again.';
			isSubmitting = false;
		}
	}

	function handleClose() {
		if (isSubmitting) return;
		open = false;
		onClose?.();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
	<!-- Accessible Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) handleClose();
		}}
	>
		<!-- Accessible Dialog Modal -->
		<div
			class="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border/80 px-6 py-4.5 bg-muted/20">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<CalendarDays class="h-5 w-5" />
					</div>
					<div>
						<h2 id="modal-title" class="text-base font-bold tracking-tight text-foreground">
							Apply for Time Off
						</h2>
						<p class="text-xs text-muted-foreground">
							Submit your leave application for manager & HR review
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={handleClose}
					class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					aria-label="Close leave dialog"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
				{#if errorMessage}
					<div class="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
						<AlertCircle class="h-4 w-4 shrink-0" />
						<span>{errorMessage}</span>
					</div>
				{/if}

				{#if successMessage}
					<div class="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-300">
						<CheckCircle2 class="h-4 w-4 shrink-0" />
						<span>{successMessage}</span>
					</div>
				{/if}

				<!-- 1. Leave Type Selector -->
				<div>
					<span class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
						1. Select Leave Type <span class="text-destructive">*</span>
					</span>
					<div class="grid grid-cols-3 gap-2.5">
						<!-- PTO -->
						<button
							type="button"
							onclick={() => (leaveType = 'paid_time_off')}
							class="flex flex-col items-start p-3 rounded-xl border text-left transition-all {leaveType === 'paid_time_off'
								? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
								: 'border-border bg-card hover:bg-muted/40 text-foreground'}"
						>
							<div class="flex w-full items-center justify-between">
								<Palmtree class="h-4 w-4 {leaveType === 'paid_time_off' ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}" />
								<span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
									{ptoRemaining} left
								</span>
							</div>
							<span class="mt-2 text-xs font-bold leading-tight">Paid Time Off</span>
							<span class="text-[10px] text-muted-foreground mt-0.5">Vacation & Rest</span>
						</button>

						<!-- Sick Leave -->
						<button
							type="button"
							onclick={() => (leaveType = 'sick_leave')}
							class="flex flex-col items-start p-3 rounded-xl border text-left transition-all {leaveType === 'sick_leave'
								? 'border-teal-600 bg-teal-50/70 text-teal-950 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-200 ring-2 ring-teal-500/20 shadow-xs'
								: 'border-border bg-card hover:bg-muted/40 text-foreground'}"
						>
							<div class="flex w-full items-center justify-between">
								<HeartPulse class="h-4 w-4 {leaveType === 'sick_leave' ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'}" />
								<span class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
									{sickRemaining} left
								</span>
							</div>
							<span class="mt-2 text-xs font-bold leading-tight">Sick Leave</span>
							<span class="text-[10px] text-muted-foreground mt-0.5">Medical & Health</span>
						</button>

						<!-- Unpaid Leave -->
						<button
							type="button"
							onclick={() => (leaveType = 'unpaid_leave')}
							class="flex flex-col items-start p-3 rounded-xl border text-left transition-all {leaveType === 'unpaid_leave'
								? 'border-amber-600 bg-amber-50/70 text-amber-950 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-xs'
								: 'border-border bg-card hover:bg-muted/40 text-foreground'}"
						>
							<div class="flex w-full items-center justify-between">
								<AlertCircle class="h-4 w-4 {leaveType === 'unpaid_leave' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}" />
								<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
									Loss of Pay
								</span>
							</div>
							<span class="mt-2 text-xs font-bold leading-tight">Unpaid Leave</span>
							<span class="text-[10px] text-muted-foreground mt-0.5">No quota limit</span>
						</button>
					</div>
				</div>

				<!-- 2. Date Range Pickers -->
				<div>
					<span class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
						2. Leave Duration <span class="text-destructive">*</span>
					</span>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label for="start-date-input" class="block text-xs font-medium text-foreground mb-1">
								Start Date
							</label>
							<input
								id="start-date-input"
								type="date"
								bind:value={startDate}
								required
								class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary shadow-2xs"
							/>
						</div>
						<div>
							<label for="end-date-input" class="block text-xs font-medium text-foreground mb-1">
								End Date
							</label>
							<input
								id="end-date-input"
								type="date"
								bind:value={endDate}
								min={startDate}
								required
								class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary shadow-2xs"
							/>
						</div>
					</div>

					<!-- Realtime Working Day Calculation Box -->
					<div class="mt-3 rounded-xl border border-border/80 bg-muted/40 p-3 text-xs">
						{#if isDateOrderInvalid}
							<div class="flex items-center gap-2 text-destructive font-medium">
								<AlertCircle class="h-4 w-4 shrink-0" />
								<span>End date cannot be earlier than start date.</span>
							</div>
						{:else if workingDays > 0}
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<div class="flex items-center gap-2">
									<div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-mono font-bold text-xs">
										{workingDays}
									</div>
									<span class="font-semibold text-foreground">
										{workingDays === 1 ? '1 Working Day' : `${workingDays} Working Days`} requested
									</span>
								</div>

								<div class="flex items-center gap-2 text-muted-foreground text-[11px]">
									{#if calculation.weekendDays > 0}
										<span class="rounded bg-background px-1.5 py-0.5 border border-border">
											{calculation.weekendDays} weekend {calculation.weekendDays === 1 ? 'day' : 'days'} excluded
										</span>
									{/if}
									<span class="text-muted-foreground">({calculation.totalCalendarDays} total days)</span>
								</div>
							</div>
						{:else}
							<span class="text-muted-foreground">Select start and end dates to compute working days automatically.</span>
						{/if}
					</div>

					<!-- Balance Validation Alerts -->
					{#if isExceedingBalance}
						<div class="mt-2.5 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-800 dark:text-amber-200">
							<ShieldAlert class="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
							<div>
								<p class="font-semibold">Insufficient {leaveType === 'paid_time_off' ? 'PTO' : 'Sick'} Balance</p>
								<p class="text-[11px] opacity-90">
									You have requested {workingDays} working days, but have only {currentRemaining} days left. The excess will convert to Unpaid Leave (Loss of Pay).
								</p>
							</div>
						</div>
					{/if}

					<!-- Sick Leave 3+ Days Document Tip -->
					{#if isMedicalProofRecommended}
						<div class="mt-2.5 flex items-start gap-2 rounded-xl bg-teal-500/10 border border-teal-500/20 p-2.5 text-xs text-teal-800 dark:text-teal-200">
							<Sparkles class="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
							<p class="text-[11px]">
								HR Policy requires a medical certificate / doctor prescription for sick leaves extending 3 or more business days.
							</p>
						</div>
					{/if}
				</div>

				<!-- 3. Reason Textarea -->
				<div>
					<label for="leave-reason-input" class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
						3. Reason for Leave <span class="text-destructive">*</span>
					</label>
					<textarea
						id="leave-reason-input"
						bind:value={reason}
						rows="3"
						required
						placeholder="Please explain the context or reason for your leave request..."
						class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary shadow-2xs resize-none"
					></textarea>
					<div class="mt-1 flex justify-between text-[11px] text-muted-foreground">
						<span>Minimum 3 characters required</span>
						<span>{reason.length} chars</span>
					</div>
				</div>

				<!-- 4. Optional Attachment File -->
				<div>
					<span class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
						4. Supporting Document (Optional)
					</span>

					{#if attachmentFile}
						<div class="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-2.5">
							<div class="flex items-center gap-2.5 overflow-hidden">
								<FileText class="h-5 w-5 shrink-0 text-primary" />
								<div class="truncate">
									<p class="text-xs font-medium text-foreground truncate">{attachmentFile.name}</p>
									<p class="text-[10px] text-muted-foreground">{(attachmentFile.size / 1024).toFixed(1)} KB</p>
								</div>
							</div>
							<button
								type="button"
								onclick={removeAttachment}
								class="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
								title="Remove attachment"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						</div>
					{:else}
						<label
							class="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-4 px-3 text-center transition-colors hover:bg-muted/40 hover:border-primary/50"
						>
							<Upload class="h-5 w-5 text-muted-foreground mb-1" />
							<span class="text-xs font-medium text-foreground">Click to upload medical slip, certificate or note</span>
							<span class="text-[10px] text-muted-foreground mt-0.5">PDF, PNG, JPG up to 10MB</span>
							<input
								type="file"
								accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
								class="hidden"
								onchange={handleFileChange}
							/>
						</label>
					{/if}
				</div>

				<!-- Modal Actions Footer -->
				<div class="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
					<button
						type="button"
						onclick={handleClose}
						disabled={isSubmitting}
						class="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
					>
						Cancel
					</button>

					<button
						type="submit"
						disabled={!isFormValid}
						class="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isSubmitting}
							<Loader2 class="h-4 w-4 animate-spin" />
							<span>Submitting...</span>
						{:else}
							<CheckCircle2 class="h-4 w-4" />
							<span>Submit Application ({workingDays} {workingDays === 1 ? 'Day' : 'Days'})</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
