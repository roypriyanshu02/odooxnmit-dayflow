<script lang="ts">
	import type { PageData } from './$types';
	import type { LeaveType, LeaveStatus, LeaveRequest, LeaveBalance, CreateLeaveRequestPayload } from '$lib/types/leaves';
	import { LEAVE_TYPES_CONFIG } from '$lib/types/leaves';
	import { auth } from '$lib/state/auth.svelte';
	import LeaveBalanceCard from '$lib/components/leaves/LeaveBalanceCard.svelte';
	import LeaveApplyModal from '$lib/components/leaves/LeaveApplyModal.svelte';
	import {
		CalendarDays,
		Plus,
		Search,
		Clock,
		CheckCircle2,
		XCircle,
		AlertCircle,
		Palmtree,
		HeartPulse,
		FileText,
		CalendarRange,
		ChevronRight,
		ShieldCheck,
		Sparkles
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// Reactive local state initialized from server data
	let balance = $state<LeaveBalance>({
		id: 'lb-default-01',
		employeeId: 'demo-emp-03',
		year: 2026,
		paidTimeOffTotal: 24,
		paidTimeOffUsed: 5,
		sickLeaveTotal: 7,
		sickLeaveUsed: 2,
		unpaidLeaveUsed: 0,
		updatedAt: new Date().toISOString()
	});

	let requests = $state<LeaveRequest[]>([]);

	$effect(() => {
		if (data.balance) {
			balance = data.balance;
		}
		if (data.requests) {
			requests = data.requests;
		}
	});

	// Modal State
	let isModalOpen = $state(false);
	let selectedLeaveType = $state<LeaveType>('paid_time_off');

	// Filtering & Searching State
	let activeStatusFilter = $state<LeaveStatus | 'all'>('all');
	let searchQuery = $state('');

	// Toast feedback state
	let toastMessage = $state<{ title: string; desc: string; type: 'success' | 'info' } | null>(null);

	function showToast(title: string, desc: string, type: 'success' | 'info' = 'success') {
		toastMessage = { title, desc, type };
		setTimeout(() => {
			toastMessage = null;
		}, 4000);
	}

	function openApplyModal(type: LeaveType = 'paid_time_off') {
		selectedLeaveType = type;
		isModalOpen = true;
	}

	function handleApplySubmit(payload: CreateLeaveRequestPayload) {
		const newId = `LR-2026-${String(requests.length + 1).padStart(3, '0')}`;
		const newRequest: LeaveRequest = {
			id: newId,
			employeeId: payload.employeeId,
			leaveType: payload.leaveType,
			startDate: payload.startDate,
			endDate: payload.endDate,
			totalDays: payload.totalDays,
			reason: payload.reason,
			status: 'pending',
			attachmentUrl: payload.attachmentUrl,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Add to requests list at the top
		requests = [newRequest, ...requests];

		// If PTO, update pending or deduct used
		if (payload.leaveType === 'paid_time_off') {
			balance = {
				...balance,
				paidTimeOffUsed: balance.paidTimeOffUsed + payload.totalDays
			};
		} else if (payload.leaveType === 'sick_leave') {
			balance = {
				...balance,
				sickLeaveUsed: balance.sickLeaveUsed + payload.totalDays
			};
		} else if (payload.leaveType === 'unpaid_leave') {
			balance = {
				...balance,
				unpaidLeaveUsed: balance.unpaidLeaveUsed + payload.totalDays
			};
		}

		showToast(
			'Leave Application Submitted',
			`Your request for ${payload.totalDays} day(s) (${payload.startDate} to ${payload.endDate}) has been submitted for manager approval.`
		);

		return true;
	}

	// Filtered requests computation
	const filteredRequests = $derived(
		requests.filter((req) => {
			const matchesStatus =
				activeStatusFilter === 'all' ? true : req.status === activeStatusFilter;
			const q = searchQuery.trim().toLowerCase();
			const matchesSearch =
				q === '' ||
				req.reason.toLowerCase().includes(q) ||
				req.id.toLowerCase().includes(q) ||
				req.leaveType.toLowerCase().includes(q) ||
				req.startDate.includes(q) ||
				req.endDate.includes(q);

			return matchesStatus && matchesSearch;
		})
	);

	// Status stats
	const pendingCount = $derived(requests.filter((r) => r.status === 'pending').length);
	const approvedCount = $derived(requests.filter((r) => r.status === 'approved').length);
	const rejectedCount = $derived(requests.filter((r) => r.status === 'rejected').length);

	function formatDate(dateStr: string): string {
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
</script>

<svelte:head>
	<title>Time Off & Leave Management | Dayflow HRMS</title>
</svelte:head>

<div class="space-y-7 pb-12 animate-in fade-in-50 duration-300">
	<!-- Toast Alert Banner -->
	{#if toastMessage}
		<div
			class="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-card p-4 shadow-xl shadow-emerald-500/10 max-w-md animate-in slide-in-from-bottom-5 duration-300"
		>
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
				<CheckCircle2 class="h-4 w-4" />
			</div>
			<div class="flex-1">
				<h4 class="text-xs font-bold text-foreground">{toastMessage.title}</h4>
				<p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{toastMessage.desc}</p>
			</div>
		</div>
	{/if}

	<!-- Header Banner & Action Bar -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex items-center gap-2 text-xs text-muted-foreground mb-1">
				<span>Dayflow Enterprise</span>
				<ChevronRight class="h-3 w-3" />
				<span class="font-medium text-foreground">Time Off & Leaves</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
				Leave & Time Off
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
				Track leave balances, view your request history, and apply for time off.
			</p>
		</div>

		<!-- Action Buttons -->
		<div class="flex items-center gap-2.5">
			{#if auth.isHR}
				<a
					href="/leaves/approvals"
					class="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
				>
					<ShieldCheck class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
					<span>Approval Queue</span>
					{#if pendingCount > 0}
						<span class="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
							{pendingCount}
						</span>
					{/if}
				</a>
			{/if}

			<button
				type="button"
				onclick={() => openApplyModal('paid_time_off')}
				class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
			>
				<Plus class="h-4 w-4" />
				<span>Apply for Leave</span>
			</button>
		</div>
	</div>

	<!-- Section 1: Leave Balance Visual Cards -->
	<div>
		<div class="flex items-center justify-between mb-3.5">
			<div class="flex items-center gap-2">
				<Sparkles class="h-4 w-4 text-primary" />
				<h2 class="text-sm font-bold tracking-tight text-foreground uppercase">
					Annual Leave Quotas ({balance.year})
				</h2>
			</div>
			<span class="text-xs text-muted-foreground">
				Logged in as: <strong class="text-foreground">{auth.user.name}</strong> ({auth.roleTitle})
			</span>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
			<!-- Card 1: Paid Time Off (PTO - 24 Total) -->
			<LeaveBalanceCard
				type="paid_time_off"
				total={balance.paidTimeOffTotal}
				used={balance.paidTimeOffUsed}
				onApply={(t) => openApplyModal(t)}
			/>

			<!-- Card 2: Sick Leave (Sick - 7 Total) -->
			<LeaveBalanceCard
				type="sick_leave"
				total={balance.sickLeaveTotal}
				used={balance.sickLeaveUsed}
				onApply={(t) => openApplyModal(t)}
			/>

			<!-- Card 3: Unpaid Leave (Loss of Pay) -->
			<LeaveBalanceCard
				type="unpaid_leave"
				total={0}
				used={balance.unpaidLeaveUsed}
				onApply={(t) => openApplyModal(t)}
			/>
		</div>
	</div>

	<!-- Section 2: Leave History Table & Filter Controls -->
	<div class="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
		<!-- Table Header & Toolbar -->
		<div class="p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div>
				<h3 class="text-base font-bold text-foreground">Leave Applications & History</h3>
				<p class="text-xs text-muted-foreground mt-0.5">
					Showing all submitted leave requests and approval status
				</p>
			</div>

			<!-- Filter Tabs & Search -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
				<!-- Search Input -->
				<div class="relative min-w-[200px]">
					<Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search by reason, type, date..."
						bind:value={searchQuery}
						class="w-full rounded-xl border border-input bg-background pl-8.5 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary shadow-2xs"
					/>
				</div>

				<!-- Status Tabs -->
				<div class="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60">
					<button
						type="button"
						onclick={() => (activeStatusFilter = 'all')}
						class="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all {activeStatusFilter === 'all'
							? 'bg-background text-foreground shadow-2xs font-bold'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						All ({requests.length})
					</button>

					<button
						type="button"
						onclick={() => (activeStatusFilter = 'pending')}
						class="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all {activeStatusFilter === 'pending'
							? 'bg-background text-foreground shadow-2xs font-bold'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						<span>Pending</span>
						{#if pendingCount > 0}
							<span class="rounded-full bg-amber-500/20 px-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">
								{pendingCount}
							</span>
						{/if}
					</button>

					<button
						type="button"
						onclick={() => (activeStatusFilter = 'approved')}
						class="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all {activeStatusFilter === 'approved'
							? 'bg-background text-foreground shadow-2xs font-bold'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						Approved ({approvedCount})
					</button>

					<button
						type="button"
						onclick={() => (activeStatusFilter = 'rejected')}
						class="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all {activeStatusFilter === 'rejected'
							? 'bg-background text-foreground shadow-2xs font-bold'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						Rejected ({rejectedCount})
					</button>
				</div>
			</div>
		</div>

		<!-- Table View -->
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs border-collapse">
				<thead>
					<tr class="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
						<th class="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Request ID</th>
						<th class="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Leave Type</th>
						<th class="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Duration & Dates</th>
						<th class="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Working Days</th>
						<th class="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Reason / Context</th>
						<th class="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
						<th class="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Requested On</th>
					</tr>
				</thead>

				<tbody class="divide-y divide-border/50">
					{#if filteredRequests.length === 0}
						<tr>
							<td colspan="7" class="py-12 text-center text-muted-foreground">
								<div class="flex flex-col items-center justify-center gap-2">
									<div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
										<CalendarRange class="h-5 w-5" />
									</div>
									<p class="text-sm font-semibold text-foreground">No leave applications found</p>
									<p class="text-xs text-muted-foreground max-w-sm">
										{#if searchQuery}
											No leave requests matching "{searchQuery}". Clear your search query to see all records.
										{:else}
											You haven't submitted any leave requests under this filter category yet.
										{/if}
									</p>
								</div>
							</td>
						</tr>
					{:else}
						{#each filteredRequests as req (req.id)}
							{@const typeConfig = LEAVE_TYPES_CONFIG[req.leaveType] ?? LEAVE_TYPES_CONFIG.paid_time_off}
							<tr class="hover:bg-muted/20 transition-colors">
								<!-- ID -->
								<td class="py-3.5 px-4 font-mono font-bold text-foreground">
									{req.id}
								</td>

								<!-- Leave Type Badge -->
								<td class="py-3.5 px-4">
									<div class="flex items-center gap-2">
										<span
											class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold {typeConfig.color.badgeBg} {typeConfig.color.badgeText}"
										>
											{#if req.leaveType === 'paid_time_off'}
												<Palmtree class="h-3 w-3" />
											{:else if req.leaveType === 'sick_leave'}
												<HeartPulse class="h-3 w-3" />
											{:else}
												<AlertCircle class="h-3 w-3" />
											{/if}
											{typeConfig.shortName}
										</span>
									</div>
								</td>

								<!-- Dates Range -->
								<td class="py-3.5 px-4">
									<div class="flex items-center gap-1.5 font-medium text-foreground">
										<CalendarDays class="h-3.5 w-3.5 text-muted-foreground" />
										<span>{formatDate(req.startDate)} &rarr; {formatDate(req.endDate)}</span>
									</div>
								</td>

								<!-- Working Days -->
								<td class="py-3.5 px-4">
									<span class="font-mono font-bold text-foreground px-2 py-0.5 rounded-md bg-muted/60">
										{req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
									</span>
								</td>

								<!-- Reason & Attachment -->
								<td class="py-3.5 px-4 max-w-xs">
									<p class="truncate text-foreground font-normal" title={req.reason}>
										{req.reason}
									</p>
									{#if req.attachmentUrl}
										<div class="mt-1 flex items-center gap-1 text-[10px] text-primary">
											<FileText class="h-3 w-3" />
											<span>Attachment attached</span>
										</div>
									{/if}
								</td>

								<!-- Status Badge -->
								<td class="py-3.5 px-4">
									{#if req.status === 'approved'}
										<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
											<CheckCircle2 class="h-3 w-3" />
											Approved
										</span>
									{:else if req.status === 'rejected'}
										<span class="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
											<XCircle class="h-3 w-3" />
											Rejected
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
											<Clock class="h-3 w-3" />
											Pending Review
										</span>
									{/if}
								</td>

								<!-- Created Date -->
								<td class="py-3.5 px-4 text-right text-muted-foreground font-mono text-[11px]">
									{formatDate(req.createdAt.split('T')[0])}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Modal Dialog Component -->
	<LeaveApplyModal
		bind:open={isModalOpen}
		initialType={selectedLeaveType}
		{balance}
		onSubmit={handleApplySubmit}
		onClose={() => (isModalOpen = false)}
	/>
</div>
