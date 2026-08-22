<script lang="ts">
	import type { LeaveType, LeaveStatus, LeaveRequestWithEmployee, LeaveApprovalQueueItem } from '$lib/types/leaves';
	import { LEAVE_TYPES_CONFIG, calculateWorkingDays } from '$lib/types/leaves';
	import {
		CalendarDays,
		Clock,
		CheckCircle2,
		XCircle,
		Palmtree,
		HeartPulse,
		AlertCircle,
		Paperclip,
		FileText,
		Briefcase,
		AlertTriangle,
		Check,
		X,
		Loader2,
		ExternalLink,
		MessageSquare
	} from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';

	interface Props {
		request: (LeaveRequestWithEmployee | LeaveApprovalQueueItem | any);
		onApprove?: (requestId: string) => Promise<void> | void;
		onReject?: (requestId: string, reason: string) => Promise<void> | void;
		class?: string;
	}

	let {
		request,
		onApprove,
		onReject,
		class: className = ''
	}: Props = $props();

	// Local UI state
	let isApproving = $state(false);
	let isRejecting = $state(false);
	let isRejectModalOpen = $state(false);
	let rejectionReason = $state('');
	let rejectionError = $state('');
	let approvedSuccess = $state(false);
	let rejectedSuccess = $state(false);
	let showAttachmentModal = $state(false);

	// Derived Employee & Request Details
	const employeeName = $derived.by(() => {
		if (request.employee) {
			const fn = request.employee.firstName || '';
			const ln = request.employee.lastName || '';
			return `${fn} ${ln}`.trim() || 'Employee';
		}
		return request.employeeName || 'Employee';
	});

	const employeeAvatar = $derived(
		request.employee?.avatarUrl || request.employeeAvatar || null
	);

	const employeeId = $derived(
		request.employee?.id || request.employeeId || ''
	);

	const department = $derived(
		request.employee?.department || request.department || 'General'
	);

	const jobTitle = $derived(
		request.employee?.jobTitle || request.jobTitle || 'Employee'
	);

	const employeeEmail = $derived(
		request.employee?.email || ''
	);

	const initials = $derived.by(() => {
		const parts = employeeName.split(' ');
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
		}
		return employeeName.slice(0, 2).toUpperCase() || 'EM';
	});

	const leaveType = $derived<LeaveType>(request.leaveType || 'paid_time_off');
	const typeConfig = $derived(LEAVE_TYPES_CONFIG[leaveType] ?? LEAVE_TYPES_CONFIG.paid_time_off);

	// Business Days / Weekday calculation
	const workingDaysInfo = $derived(
		calculateWorkingDays(request.startDate, request.endDate)
	);

	const businessDaysCount = $derived(
		request.totalDays ?? (workingDaysInfo.isValid ? workingDaysInfo.workingDays : 1)
	);

	// Department Color Mapping
	function getDepartmentColor(dept: string): { bg: string; text: string; border: string; dot: string } {
		const d = dept?.toLowerCase() || '';
		if (d.includes('eng')) {
			return {
				bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
				text: 'text-indigo-700 dark:text-indigo-300',
				border: 'border-indigo-200/60 dark:border-indigo-800/40',
				dot: 'bg-indigo-500'
			};
		}
		if (d.includes('prod')) {
			return {
				bg: 'bg-amber-500/10 dark:bg-amber-500/20',
				text: 'text-amber-700 dark:text-amber-300',
				border: 'border-amber-200/60 dark:border-amber-800/40',
				dot: 'bg-amber-500'
			};
		}
		if (d.includes('design')) {
			return {
				bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20',
				text: 'text-fuchsia-700 dark:text-fuchsia-300',
				border: 'border-fuchsia-200/60 dark:border-fuchsia-800/40',
				dot: 'bg-fuchsia-500'
			};
		}
		if (d.includes('sales')) {
			return {
				bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
				text: 'text-emerald-700 dark:text-emerald-300',
				border: 'border-emerald-200/60 dark:border-emerald-800/40',
				dot: 'bg-emerald-500'
			};
		}
		if (d.includes('market')) {
			return {
				bg: 'bg-purple-500/10 dark:bg-purple-500/20',
				text: 'text-purple-700 dark:text-purple-300',
				border: 'border-purple-200/60 dark:border-purple-800/40',
				dot: 'bg-purple-500'
			};
		}
		if (d.includes('hr') || d.includes('human')) {
			return {
				bg: 'bg-rose-500/10 dark:bg-rose-500/20',
				text: 'text-rose-700 dark:text-rose-300',
				border: 'border-rose-200/60 dark:border-rose-800/40',
				dot: 'bg-rose-500'
			};
		}
		return {
			bg: 'bg-slate-500/10 dark:bg-slate-500/20',
			text: 'text-slate-700 dark:text-slate-300',
			border: 'border-slate-200/60 dark:border-slate-800/40',
			dot: 'bg-slate-500'
		};
	}

	const deptTheme = $derived(getDepartmentColor(department));

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		try {
			const d = new Date(dateStr + 'T00:00:00');
			return d.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return dateStr;
		}
	}

	function formatDateTime(dateStr: string): string {
		if (!dateStr) return '';
		try {
			const d = new Date(dateStr);
			return d.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return dateStr;
		}
	}

	async function handleApprove() {
		if (isApproving || isRejecting) return;
		isApproving = true;
		try {
			if (onApprove) {
				await onApprove(request.id);
			}
			approvedSuccess = true;
		} catch (err) {
			console.error('Approval failed:', err);
		} finally {
			isApproving = false;
		}
	}

	function openRejectModal() {
		rejectionReason = '';
		rejectionError = '';
		isRejectModalOpen = true;
	}

	function closeRejectModal() {
		isRejectModalOpen = false;
		rejectionReason = '';
		rejectionError = '';
	}

	async function submitReject() {
		if (!rejectionReason || rejectionReason.trim().length < 3) {
			rejectionError = 'Please enter a valid rejection reason (minimum 3 characters).';
			return;
		}

		isRejecting = true;
		rejectionError = '';

		try {
			if (onReject) {
				await onReject(request.id, rejectionReason.trim());
			}
			rejectedSuccess = true;
			closeRejectModal();
		} catch (err: any) {
			console.error('Rejection failed:', err);
			rejectionError = err?.message || 'Failed to reject request. Please try again.';
		} finally {
			isRejecting = false;
		}
	}

	// Dynamic status: account for local optimistic updates
	const currentStatus = $derived<LeaveStatus>(
		approvedSuccess
			? 'approved'
			: rejectedSuccess
				? 'rejected'
				: request.status || 'pending'
	);
</script>

<Card.Root
	class="group relative flex flex-col justify-between p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md hover:border-border {className}"
>
	<!-- Top Section: Header with Employee Info & Status Badge -->
	<div>
		<!-- Top Bar: Dynamic ID, Leave Type Badge & Status -->
		<div class="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border/60">
			<div class="flex items-center gap-2 flex-wrap">
				<!-- Request ID -->
				<Badge variant="outline" class="font-mono text-xs font-bold">
					{request.id}
				</Badge>

				<!-- Leave Type Badge -->
				<Badge
					variant="secondary"
					class="gap-1 text-xs font-semibold {typeConfig.color.badgeBg} {typeConfig.color.badgeText}"
				>
					{#if leaveType === 'paid_time_off'}
						<Palmtree class="h-3.5 w-3.5" />
					{:else if leaveType === 'sick_leave'}
						<HeartPulse class="h-3.5 w-3.5" />
					{:else}
						<AlertCircle class="h-3.5 w-3.5" />
					{/if}
					{typeConfig.label}
				</Badge>

				<!-- Department Pill -->
				<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border {deptTheme.bg} {deptTheme.text} {deptTheme.border}">
					<span class="h-1.5 w-1.5 rounded-full {deptTheme.dot}"></span>
					{department}
				</span>
			</div>

			<!-- Status Indicator Badge -->
			<div>
				{#if currentStatus === 'approved'}
					<Badge variant="secondary" class="gap-1.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
						<CheckCircle2 class="h-3.5 w-3.5" />
						Approved
					</Badge>
				{:else if currentStatus === 'rejected'}
					<Badge variant="secondary" class="gap-1.5 bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">
						<XCircle class="h-3.5 w-3.5" />
						Rejected
					</Badge>
				{:else}
					<Badge variant="secondary" class="gap-1.5 bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
						<Clock class="h-3.5 w-3.5 animate-pulse" />
						Pending HR Approval
					</Badge>
				{/if}
			</div>
		</div>

		<!-- Middle Section: Employee Identity & Submission Timestamp -->
		<div class="mt-4 flex items-start gap-4">
			<!-- Avatar with Initials Fallback -->
			<Avatar.Root class="h-12 w-12 rounded-2xl border border-border/80 shadow-2xs">
				{#if employeeAvatar}
					<Avatar.Image src={employeeAvatar} alt={employeeName} class="object-cover" />
				{/if}
				<Avatar.Fallback class="rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold text-sm border border-indigo-200/50">
					{initials}
				</Avatar.Fallback>
			</Avatar.Root>

			<!-- Name, Job Title & ID Details -->
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2 flex-wrap">
					<h3 class="text-base font-bold text-foreground tracking-tight">
						{employeeName}
					</h3>
					{#if employeeId}
						<Badge variant="outline" class="font-mono text-[11px] font-normal">
							{employeeId}
						</Badge>
					{/if}
				</div>

				<div class="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
					<span class="flex items-center gap-1">
						<Briefcase class="h-3.5 w-3.5" />
						{jobTitle}
					</span>
					{#if employeeEmail}
						<span class="hidden sm:inline">&bull;</span>
						<span class="hidden sm:inline font-mono">{employeeEmail}</span>
					{/if}
					{#if request.createdAt}
						<span>&bull;</span>
						<span class="text-[11px]">Applied {formatDateTime(request.createdAt)}</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Date Range, Business Day Counter & Leave Details -->
		<div class="mt-4 rounded-xl bg-muted/40 p-3.5 border border-border/60">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<!-- Requested Date Span -->
				<div class="flex items-center gap-2.5">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-background border border-border/70 text-foreground shadow-2xs">
						<CalendarDays class="h-4 w-4 text-primary" />
					</div>
					<div>
						<span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
							Requested Date Span
						</span>
						<div class="font-semibold text-foreground text-sm flex items-center gap-1.5">
							<span>{formatDate(request.startDate)}</span>
							<span class="text-muted-foreground font-normal">&rarr;</span>
							<span>{formatDate(request.endDate)}</span>
						</div>
					</div>
				</div>

				<!-- Working Business Days Counter -->
				<div class="flex items-center gap-2 self-start sm:self-auto">
					<div class="text-right">
						<span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
							Duration
						</span>
						<div class="flex items-center gap-1.5">
							<span class="font-mono text-sm font-extrabold text-foreground bg-background px-2.5 py-0.5 rounded-lg border border-border/80 shadow-2xs">
								{businessDaysCount} {businessDaysCount === 1 ? 'Business Day' : 'Business Days'}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Additional quota context if available -->
			{#if request.ptoRemaining !== undefined || request.sickLeaveRemaining !== undefined}
				<div class="mt-2.5 pt-2.5 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
					{#if request.ptoRemaining !== undefined}
						<span>PTO Balance: <strong class="text-foreground font-mono">{request.ptoRemaining}d</strong> remaining</span>
					{/if}
					{#if request.sickLeaveRemaining !== undefined}
						<span>Sick Leave: <strong class="text-foreground font-mono">{request.sickLeaveRemaining}d</strong> remaining</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Reason Callout Box -->
		<div class="mt-3.5">
			<div class="rounded-xl border border-border/70 bg-card p-3.5">
				<span class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
					<MessageSquare class="h-3 w-3" />
					Applicant Reason / Note:
				</span>
				<p class="text-xs sm:text-sm text-foreground leading-relaxed italic">
					"{request.reason || 'No additional reason provided.'}"
				</p>
			</div>
		</div>

		<!-- Attachment Preview Chip (if attached) -->
		{#if request.attachmentUrl}
			<div class="mt-3 flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2">
				<div class="flex items-center gap-2 min-w-0">
					<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Paperclip class="h-3.5 w-3.5" />
					</div>
					<div class="min-w-0">
						<p class="text-xs font-semibold text-foreground truncate">
							{request.attachmentUrl.split('/').pop() || 'Medical Certificate / Documentation'}
						</p>
						<p class="text-[10px] text-muted-foreground">Supporting document attached</p>
					</div>
				</div>

				<Button
					variant="link"
					size="xs"
					onclick={() => (showAttachmentModal = true)}
					class="gap-1 text-xs font-semibold text-primary shrink-0 ml-2"
				>
					<span>Preview</span>
					<ExternalLink class="h-3 w-3" />
				</Button>
			</div>
		{/if}

		<!-- Rejection Reason Note (if rejected) -->
		{#if currentStatus === 'rejected' && (request.rejectionReason || rejectionReason)}
			<div class="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
				<span class="font-bold flex items-center gap-1.5 mb-0.5">
					<XCircle class="h-3.5 w-3.5" />
					Rejection Reason:
				</span>
				<p class="leading-relaxed">{request.rejectionReason || rejectionReason}</p>
			</div>
		{/if}

		<!-- Approver Info (if approved) -->
		{#if currentStatus === 'approved' && request.approver}
			<div class="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
				<CheckCircle2 class="h-3.5 w-3.5 shrink-0" />
				<span>Approved by <strong>{request.approver.name || 'HR Admin'}</strong></span>
			</div>
		{/if}
	</div>

	<!-- Bottom Section: Approval & Rejection Actions -->
	{#if currentStatus === 'pending'}
		<div class="mt-5 pt-4 border-t border-border/60 flex items-center justify-end gap-2.5">
			<!-- Reject Button -->
			<Button
				variant="outline"
				size="sm"
				onclick={openRejectModal}
				disabled={isApproving || isRejecting}
				class="gap-1.5 border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:border-rose-500/50 font-bold"
			>
				<X class="h-3.5 w-3.5" />
				<span>Reject</span>
			</Button>

			<!-- Approve Button with Inline Loading/Success State -->
			<Button
				size="sm"
				onclick={handleApprove}
				disabled={isApproving || isRejecting}
				class="gap-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold"
			>
				{#if isApproving}
					<Loader2 class="h-3.5 w-3.5 animate-spin" />
					<span>Approving...</span>
				{:else}
					<Check class="h-3.5 w-3.5" />
					<span>Approve Leave</span>
				{/if}
			</Button>
		</div>
	{/if}
</Card.Root>

<!-- Rejection Reason Dialog -->
<Dialog.Root bind:open={isRejectModalOpen} onOpenChange={(val) => { if (!val) closeRejectModal(); }}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header class="flex flex-row items-center gap-2.5 space-y-0 pb-2">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
				<AlertTriangle class="h-5 w-5" />
			</div>
			<div>
				<Dialog.Title class="text-base font-bold text-foreground">
					Reject Leave Request
				</Dialog.Title>
				<Dialog.Description class="text-xs text-muted-foreground">
					{request.id} &bull; {employeeName}
				</Dialog.Description>
			</div>
		</Dialog.Header>

		<p class="text-xs text-muted-foreground leading-relaxed">
			Please provide a clear reason for rejecting this leave application. This note will be recorded in the audit trail and shared with the applicant.
		</p>

		<div class="space-y-1.5 my-2">
			<Label for="rejection-reason" class="text-xs font-semibold text-foreground">
				Rejection Reason <span class="text-rose-500">*</span>
			</Label>
			<textarea
				id="rejection-reason"
				bind:value={rejectionReason}
				placeholder="e.g. Critical sprint release scheduled during these dates; please coordinate with your team lead."
				rows="3"
				class="w-full rounded-md border border-input bg-transparent p-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
			></textarea>

			{#if rejectionError}
				<p class="text-xs font-medium text-rose-500 mt-1 flex items-center gap-1">
					<AlertCircle class="h-3.5 w-3.5 shrink-0" />
					{rejectionError}
				</p>
			{/if}
		</div>

		<Dialog.Footer class="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
			<Button
				type="button"
				variant="outline"
				size="sm"
				onclick={closeRejectModal}
				disabled={isRejecting}
			>
				Cancel
			</Button>

			<Button
				type="button"
				variant="destructive"
				size="sm"
				onclick={submitReject}
				disabled={isRejecting || rejectionReason.trim().length < 3}
				class="gap-1.5"
			>
				{#if isRejecting}
					<Loader2 class="h-3.5 w-3.5 animate-spin" />
					<span>Rejecting...</span>
				{:else}
					<XCircle class="h-3.5 w-3.5" />
					<span>Confirm Rejection</span>
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Attachment Preview Dialog -->
<Dialog.Root bind:open={showAttachmentModal}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header class="flex flex-row items-center gap-2 pb-2 space-y-0">
			<FileText class="h-5 w-5 text-primary" />
			<Dialog.Title class="text-sm font-bold text-foreground">Attachment Preview</Dialog.Title>
		</Dialog.Header>

		<div class="my-3 rounded-xl border border-border/80 bg-muted/30 p-4 text-center">
			<p class="font-mono text-xs text-foreground font-semibold mb-1">
				{request.attachmentUrl}
			</p>
			<p class="text-xs text-muted-foreground">
				Attached supporting medical or legal documentation for Leave Request {request.id}.
			</p>
		</div>

		<Dialog.Footer class="flex justify-end pt-2">
			<Button
				size="sm"
				onclick={() => (showAttachmentModal = false)}
			>
				Close Preview
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
