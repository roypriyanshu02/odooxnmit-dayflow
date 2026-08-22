<script lang="ts">
	import type { LeaveType, LeaveStatus } from '$lib/types';
	import {
		Calendar,
		CalendarDays,
		Clock,
		CheckCircle2,
		XCircle,
		AlertCircle,
		Search,
		Filter,
		ChevronRight,
		Info,
		UserCheck,
		FileText,
		Sparkles,
		X,
		RotateCcw,
		CalendarRange,
		ShieldAlert,
		Briefcase
	} from '@lucide/svelte';

	export interface LeaveHistoryItem {
		id: string;
		employeeId: string;
		leaveType: LeaveType;
		startDate: string; // YYYY-MM-DD
		endDate: string; // YYYY-MM-DD
		totalDays: number;
		businessDays?: number;
		reason: string;
		status: LeaveStatus;
		approvedBy?: string | null;
		rejectionReason?: string | null;
		attachmentUrl?: string | null;
		createdAt: string;
		updatedAt: string;
		employee?: {
			id: string;
			firstName: string;
			lastName: string;
			email: string;
			avatarUrl?: string | null;
			jobTitle?: string;
			department?: string;
		};
		approver?: {
			id: string;
			name: string;
			email: string;
			role: string;
		} | null;
	}

	interface Props {
		leaves?: LeaveHistoryItem[];
		isLoading?: boolean;
		showEmployeeColumn?: boolean;
		status?: string;
		type?: string;
		year?: number | string;
		onRequestLeave?: () => void;
		onLeaveSelect?: (leave: LeaveHistoryItem) => void;
	}

	let {
		leaves = [],
		isLoading = false,
		showEmployeeColumn = false,
		status = 'all',
		type = 'all',
		year = 2026,
		onRequestLeave,
		onLeaveSelect
	}: Props = $props();

	// Reactive Filter State
	let statusFilter = $state<string>('all');
	let typeFilter = $state<string>('all');
	let yearFilter = $state<string | number>(2026);
	let searchFilter = $state('');

	$effect(() => {
		if (status !== undefined) statusFilter = status;
	});

	$effect(() => {
		if (type !== undefined) typeFilter = type;
	});

	$effect(() => {
		if (year !== undefined) yearFilter = year;
	});

	// Active popover / modal for rejection or approver notes
	let activeNoteLeave = $state<LeaveHistoryItem | null>(null);

	// Status tabs definition
	const statusTabs = [
		{ id: 'all', label: 'All Requests' },
		{ id: 'pending', label: 'Pending' },
		{ id: 'approved', label: 'Approved' },
		{ id: 'rejected', label: 'Rejected' }
	];

	// Available years list
	const availableYears = [2026, 2025, 2024];

	// Helper to format dates cleanly (e.g. "14 Jul 2026")
	function formatDate(dateStr: string): string {
		if (!dateStr) return '—';
		const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00Z'));
		if (isNaN(date.getTime())) return dateStr;
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(date);
	}

	function formatShortDate(dateStr: string): string {
		if (!dateStr) return '—';
		const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00Z'));
		if (isNaN(date.getTime())) return dateStr;
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric'
		}).format(date);
	}

	// Calculate working business days between two dates if not already present
	function getBusinessDays(item: LeaveHistoryItem): number {
		if (item.businessDays && item.businessDays > 0) {
			return item.businessDays;
		}
		const start = new Date(item.startDate + 'T00:00:00Z');
		const end = new Date(item.endDate + 'T00:00:00Z');
		if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
			return item.totalDays || 1;
		}
		let count = 0;
		const current = new Date(start);
		while (current <= end) {
			const day = current.getUTCDay();
			if (day !== 0 && day !== 6) count++;
			current.setUTCDate(current.getUTCDate() + 1);
		}
		return count === 0 ? 1 : count;
	}

	// Filtered leaves derived computation
	const filteredLeaves = $derived(() => {
		return leaves.filter((item) => {
			// Status Filter
			if (statusFilter !== 'all' && item.status !== statusFilter) {
				return false;
			}

			// Type Filter
			if (typeFilter !== 'all' && item.leaveType !== typeFilter) {
				return false;
			}

			// Year Filter
			if (yearFilter && yearFilter !== 'all') {
				const yr = String(yearFilter);
				const startsInYear = item.startDate.startsWith(yr);
				const endsInYear = item.endDate.startsWith(yr);
				if (!startsInYear && !endsInYear) return false;
			}

			// Search Filter (reason, employee name, approver name)
			if (searchFilter.trim() !== '') {
				const query = searchFilter.toLowerCase().trim();
				const matchReason = item.reason?.toLowerCase().includes(query);
				const matchType = item.leaveType.toLowerCase().includes(query);
				const matchEmployee =
					item.employee &&
					`${item.employee.firstName} ${item.employee.lastName}`.toLowerCase().includes(query);
				const matchApprover = item.approver && item.approver.name.toLowerCase().includes(query);
				const matchRejection = item.rejectionReason?.toLowerCase().includes(query);
				if (!matchReason && !matchType && !matchEmployee && !matchApprover && !matchRejection) {
					return false;
				}
			}

			return true;
		});
	});

	// Status counts for badge tabs
	const statusCounts = $derived(() => {
		const counts = { all: leaves.length, pending: 0, approved: 0, rejected: 0 };
		for (const l of leaves) {
			if (l.status in counts) {
				counts[l.status as keyof typeof counts]++;
			}
		}
		return counts;
	});

	function resetFilters() {
		statusFilter = 'all';
		typeFilter = 'all';
		yearFilter = 2026;
		searchFilter = '';
	}

	function openNotesModal(leave: LeaveHistoryItem, e: MouseEvent) {
		e.stopPropagation();
		activeNoteLeave = leave;
	}

	function closeNotesModal() {
		activeNoteLeave = null;
	}
</script>

<div class="w-full space-y-4">
	<!-- Control Bar: Status Tabs, Type Selector, Year Filter, and Search -->
	<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
		<!-- Status Tabs -->
		<div class="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/60 p-1 border border-border/80">
			{#each statusTabs as tab (tab.id)}
				{@const count = statusCounts()[tab.id as keyof ReturnType<typeof statusCounts>]}
				{@const active = statusFilter === tab.id}
				<button
					type="button"
					onclick={() => (statusFilter = tab.id)}
					class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-primary/40 {active
						? 'bg-card text-foreground shadow-2xs font-bold ring-1 ring-border/50'
						: 'text-muted-foreground hover:bg-card/50 hover:text-foreground'}"
				>
					<span>{tab.label}</span>
					<span
						class="rounded-full px-1.5 py-0.2 text-[10px] font-bold transition-colors {active
							? tab.id === 'pending'
								? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
								: tab.id === 'approved'
									? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
									: tab.id === 'rejected'
										? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
										: 'bg-primary/10 text-primary'
							: 'bg-muted text-muted-foreground'}"
					>
						{count}
					</span>
				</button>
			{/each}
		</div>

		<!-- Filters & Search Toolbar -->
		<div class="flex flex-wrap items-center gap-2">
			<!-- Search Bar -->
			<div class="relative min-w-[200px] flex-1 sm:flex-initial">
				<Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					bind:value={searchFilter}
					placeholder="Search reason or tags..."
					class="h-8.5 w-full rounded-lg border border-border/80 bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
				/>
				{#if searchFilter}
					<button
						type="button"
						onclick={() => (searchFilter = '')}
						class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					>
						<X class="h-3 w-3" />
					</button>
				{/if}
			</div>

			<!-- Leave Type Dropdown Filter -->
			<div class="relative">
				<select
					bind:value={typeFilter}
					class="h-8.5 appearance-none rounded-lg border border-border/80 bg-card px-3 pr-7 text-xs font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
				>
					<option value="all">All Types</option>
					<option value="paid_time_off">Paid Time Off (PTO)</option>
					<option value="sick_leave">Sick Leave</option>
					<option value="unpaid_leave">Unpaid Leave</option>
				</select>
				<Filter class="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
			</div>

			<!-- Year Selector -->
			<div class="relative">
				<select
					bind:value={yearFilter}
					class="h-8.5 appearance-none rounded-lg border border-border/80 bg-card px-3 pr-7 text-xs font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
				>
					{#each availableYears as yr}
						<option value={yr}>Year {yr}</option>
					{/each}
					<option value="all">All Years</option>
				</select>
				<Calendar class="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
			</div>

			{#if statusFilter !== 'all' || typeFilter !== 'all' || searchFilter !== '' || yearFilter !== 2026}
				<button
					type="button"
					onclick={resetFilters}
					class="flex h-8.5 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					title="Reset all filters"
				>
					<RotateCcw class="h-3 w-3" />
					<span class="hidden sm:inline">Reset</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Results Table / Card Grid Container -->
	<div class="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
		{#if isLoading}
			<!-- Loading Skeleton State -->
			<div class="divide-y divide-border/60 p-4 space-y-4">
				<div class="flex items-center justify-between pb-3">
					<div class="h-4 w-32 animate-pulse rounded bg-muted"></div>
					<div class="h-4 w-20 animate-pulse rounded bg-muted"></div>
				</div>
				{#each Array(4) as _}
					<div class="flex items-center justify-between py-3">
						<div class="flex items-center gap-3">
							<div class="h-8 w-8 animate-pulse rounded-lg bg-muted"></div>
							<div class="space-y-1.5">
								<div class="h-3.5 w-28 animate-pulse rounded bg-muted"></div>
								<div class="h-2.5 w-44 animate-pulse rounded bg-muted"></div>
							</div>
						</div>
						<div class="flex items-center gap-4">
							<div class="h-4 w-20 animate-pulse rounded bg-muted"></div>
							<div class="h-6 w-16 animate-pulse rounded-full bg-muted"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if filteredLeaves().length === 0}
			<!-- Empty State -->
			<div class="flex flex-col items-center justify-center px-4 py-12 text-center">
				<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-8 ring-muted/20">
					<CalendarDays class="h-7 w-7 text-muted-foreground" />
				</div>
				<h3 class="mt-4 text-sm font-semibold text-foreground">No leave records found</h3>
				<p class="mt-1 max-w-sm text-xs text-muted-foreground">
					{searchFilter || statusFilter !== 'all' || typeFilter !== 'all'
						? 'No leave requests match your active filter criteria. Try adjusting the search query or status tab.'
						: 'There are no leave applications recorded for this period yet.'}
				</p>
				<div class="mt-5 flex items-center gap-2">
					{#if searchFilter || statusFilter !== 'all' || typeFilter !== 'all' || yearFilter !== 2026}
						<button
							type="button"
							onclick={resetFilters}
							class="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
						>
							Clear Filters
						</button>
					{/if}
					{#if onRequestLeave}
						<button
							type="button"
							onclick={onRequestLeave}
							class="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90"
						>
							<Sparkles class="h-3.5 w-3.5" />
							<span>Apply for Leave</span>
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Desktop Viewport: Tabular Data Grid (hidden on xs screens) -->
			<div class="hidden md:block overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead class="border-b border-border/70 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
						<tr>
							{#if showEmployeeColumn}
								<th class="px-4 py-3">Employee</th>
							{/if}
							<th class="px-4 py-3">Leave Type</th>
							<th class="px-4 py-3">Duration & Dates</th>
							<th class="px-4 py-3">Business Days</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3">Reason / Details</th>
							<th class="px-4 py-3 text-right">Approver / Decision</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border/60">
						{#each filteredLeaves() as leave (leave.id)}
							{@const bDays = getBusinessDays(leave)}
							<tr
								class="group transition-colors hover:bg-muted/40 cursor-pointer"
								onclick={() => onLeaveSelect?.(leave)}
							>
								<!-- Employee Column (Conditional for HR/Admin) -->
								{#if showEmployeeColumn}
									<td class="px-4 py-3">
										<div class="flex items-center gap-2.5">
											<div class="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
												{#if leave.employee?.avatarUrl}
													<img
														src={leave.employee.avatarUrl}
														alt={leave.employee.firstName}
														class="h-7 w-7 rounded-full object-cover"
													/>
												{:else if leave.employee}
													{leave.employee.firstName[0]}{leave.employee.lastName[0]}
												{:else}
													EMP
												{/if}
											</div>
											<div class="flex flex-col">
												<span class="font-semibold text-foreground">
													{leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : leave.employeeId}
												</span>
												<span class="text-[10px] text-muted-foreground">
													{leave.employee?.department || leave.employeeId}
												</span>
											</div>
										</div>
									</td>
								{/if}

								<!-- Leave Type Tag -->
								<td class="px-4 py-3 whitespace-nowrap">
									<div class="flex items-center gap-2">
										{#if leave.leaveType === 'paid_time_off'}
											<span class="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-800/30">
												<CalendarRange class="h-3 w-3 text-indigo-500" />
												<span>Paid Time Off (PTO)</span>
											</span>
										{:else if leave.leaveType === 'sick_leave'}
											<span class="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-700/10 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/30">
												<Briefcase class="h-3 w-3 text-amber-500" />
												<span>Sick Leave</span>
											</span>
										{:else}
											<span class="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-600/10 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800">
												<Clock class="h-3 w-3 text-slate-500" />
												<span>Unpaid Leave</span>
											</span>
										{/if}
									</div>
								</td>

								<!-- Dates Range -->
								<td class="px-4 py-3 whitespace-nowrap">
									<div class="flex flex-col">
										<span class="font-medium text-foreground">
											{formatShortDate(leave.startDate)} &rarr; {formatDate(leave.endDate)}
										</span>
										<span class="text-[10px] text-muted-foreground">
											Applied {formatShortDate(leave.createdAt)}
										</span>
									</div>
								</td>

								<!-- Working Days Count -->
								<td class="px-4 py-3 whitespace-nowrap">
									<div class="flex items-center gap-1.5">
										<span class="font-bold text-foreground">{leave.totalDays}</span>
										<span class="text-[10px] font-medium text-muted-foreground">
											({bDays} {bDays === 1 ? 'biz day' : 'biz days'})
										</span>
									</div>
								</td>

								<!-- Status Badge -->
								<td class="px-4 py-3 whitespace-nowrap">
									{#if leave.status === 'approved'}
										<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800">
											<CheckCircle2 class="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
											<span>Approved</span>
										</span>
									{:else if leave.status === 'pending'}
										<span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800 animate-pulse">
											<Clock class="h-3 w-3 text-amber-600 dark:text-amber-400" />
											<span>Pending</span>
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-800">
											<XCircle class="h-3 w-3 text-rose-600 dark:text-rose-400" />
											<span>Rejected</span>
										</span>
									{/if}
								</td>

								<!-- Reason / Notes -->
								<td class="px-4 py-3 max-w-xs">
									<div class="line-clamp-2 text-foreground font-normal" title={leave.reason}>
										{leave.reason}
									</div>
								</td>

								<!-- Approver Info / Rejection Details -->
								<td class="px-4 py-3 text-right whitespace-nowrap">
									{#if leave.status === 'approved'}
										<div class="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
											<UserCheck class="h-3.5 w-3.5 text-emerald-600" />
											<span class="font-medium text-foreground">
												{leave.approver?.name || 'HR Manager'}
											</span>
										</div>
									{:else if leave.status === 'rejected'}
										<button
											type="button"
											onclick={(e) => openNotesModal(leave, e)}
											class="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900 transition-colors"
											title="Click to view rejection reason"
										>
											<ShieldAlert class="h-3 w-3 text-rose-600" />
											<span>Rejection Note</span>
										</button>
									{:else}
										<span class="text-[11px] font-normal text-muted-foreground italic">
											Pending HR Review
										</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile Viewport: Responsive Card Stream (visible on < md screens) -->
			<div class="divide-y divide-border/60 md:hidden">
				{#each filteredLeaves() as leave (leave.id)}
					{@const bDays = getBusinessDays(leave)}
					<div
						class="p-4 space-y-3 transition-colors hover:bg-muted/30 cursor-pointer"
						onclick={() => onLeaveSelect?.(leave)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && onLeaveSelect?.(leave)}
					>
						<div class="flex items-center justify-between gap-2">
							<!-- Type Badge -->
							{#if leave.leaveType === 'paid_time_off'}
								<span class="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
									<CalendarRange class="h-3 w-3" /> Paid Time Off
								</span>
							{:else if leave.leaveType === 'sick_leave'}
								<span class="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
									<Briefcase class="h-3 w-3" /> Sick Leave
								</span>
							{:else}
								<span class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
									<Clock class="h-3 w-3" /> Unpaid Leave
								</span>
							{/if}

							<!-- Status Badge -->
							{#if leave.status === 'approved'}
								<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300">
									<CheckCircle2 class="h-2.5 w-2.5" /> Approved
								</span>
							{:else if leave.status === 'pending'}
								<span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300">
									<Clock class="h-2.5 w-2.5" /> Pending
								</span>
							{:else}
								<span class="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300">
									<XCircle class="h-2.5 w-2.5" /> Rejected
								</span>
							{/if}
						</div>

						<div class="flex items-center justify-between text-xs">
							<div class="flex items-center gap-1.5 font-medium text-foreground">
								<Calendar class="h-3.5 w-3.5 text-muted-foreground" />
								<span>{formatShortDate(leave.startDate)} &rarr; {formatDate(leave.endDate)}</span>
							</div>
							<span class="font-semibold text-foreground text-[11px]">
								{leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'} ({bDays} biz)
							</span>
						</div>

						<p class="text-xs text-foreground/80 font-normal line-clamp-2">
							{leave.reason}
						</p>

						{#if leave.status === 'rejected' && leave.rejectionReason}
							<div class="rounded-lg bg-rose-50/80 p-2 text-[11px] text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40">
								<div class="flex items-center gap-1 font-semibold">
									<ShieldAlert class="h-3 w-3 text-rose-600" />
									<span>Rejection Note:</span>
								</div>
								<p class="mt-0.5">{leave.rejectionReason}</p>
							</div>
						{/if}

						<div class="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t border-border/40">
							<span>Submitted {formatShortDate(leave.createdAt)}</span>
							{#if leave.approver}
								<span>Reviewer: {leave.approver.name}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Table Footer Information Summary -->
		<div class="flex items-center justify-between border-t border-border/80 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
			<span>
				Showing <strong class="font-semibold text-foreground">{filteredLeaves().length}</strong> of{' '}
				<strong class="font-semibold text-foreground">{leaves.length}</strong> applications
			</span>
			<span class="text-[11px]">
				Filtered by Year {yearFilter === 'all' ? 'All' : yearFilter}
			</span>
		</div>
	</div>
</div>

<!-- Rejection Reason & Approver Detail Modal Popover -->
{#if activeNoteLeave}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0 duration-150"
		role="presentation"
		onclick={closeNotesModal}
		onkeydown={(e) => e.key === 'Escape' && closeNotesModal()}
	>
		<div
			class="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl animate-in zoom-in-95 duration-150"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between border-b border-border pb-3">
				<div class="flex items-center gap-2">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
						<ShieldAlert class="h-4 w-4" />
					</div>
					<div>
						<h4 id="modal-title" class="text-sm font-semibold text-foreground">Leave Application Decision</h4>
						<p class="text-[11px] text-muted-foreground">
							{formatDate(activeNoteLeave.startDate)} to {formatDate(activeNoteLeave.endDate)}
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={closeNotesModal}
					class="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
					aria-label="Close dialog"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="space-y-3 py-4 text-xs">
				<div>
					<span class="font-medium text-muted-foreground">Employee Reason:</span>
					<p class="mt-1 rounded-lg bg-muted/40 p-2.5 text-foreground font-normal">
						{activeNoteLeave.reason}
					</p>
				</div>

				{#if activeNoteLeave.rejectionReason}
					<div>
						<span class="font-medium text-rose-700 dark:text-rose-400">Rejection Feedback:</span>
						<p class="mt-1 rounded-lg border border-rose-200 bg-rose-50/60 p-2.5 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
							{activeNoteLeave.rejectionReason}
						</p>
					</div>
				{/if}

				{#if activeNoteLeave.approver}
					<div class="flex items-center justify-between pt-2 text-[11px] text-muted-foreground border-t border-border/60">
						<span>Reviewed By:</span>
						<span class="font-semibold text-foreground">
							{activeNoteLeave.approver.name} ({activeNoteLeave.approver.role.toUpperCase()})
						</span>
					</div>
				{/if}
			</div>

			<div class="flex justify-end pt-2">
				<button
					type="button"
					onclick={closeNotesModal}
					class="rounded-lg bg-secondary px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
