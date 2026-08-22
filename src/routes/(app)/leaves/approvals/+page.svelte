<script lang="ts">
	import type { PageData } from './$types';
	import type { LeaveRequestWithEmployee, LeaveStatus } from '$lib/types/leaves';
	import { auth } from '$lib/state/auth.svelte';
	import ApprovalQueueCard from '$lib/components/leaves/ApprovalQueueCard.svelte';
	import {
		ShieldCheck,
		Clock,
		CheckCircle2,
		XCircle,
		Building2,
		Search,
		ChevronRight,
		ArrowLeft,
		Filter,
		Sparkles,
		RotateCcw,
		CalendarRange,
		Layers
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// Reactive state initialized from server data
	let requests = $state<LeaveRequestWithEmployee[]>([]);
	let departments = $state<string[]>([]);

	$effect(() => {
		if (data.requests) {
			requests = data.requests;
		}
		if (data.departments) {
			departments = data.departments;
		}
	});

	// Filter states
	let activeStatusFilter = $state<LeaveStatus | 'all'>('pending');
	let selectedDepartment = $state<string>('all');
	let searchQuery = $state<string>('');

	// Toast state
	let toastMessage = $state<{
		title: string;
		desc: string;
		type: 'success' | 'error' | 'info';
	} | null>(null);

	function showToast(title: string, desc: string, type: 'success' | 'error' | 'info' = 'success') {
		toastMessage = { title, desc, type };
		setTimeout(() => {
			toastMessage = null;
		}, 4000);
	}

	// Computed KPIs calculated reactively from current requests state
	const totalPending = $derived(requests.filter((r) => r.status === 'pending').length);
	const totalApproved = $derived(requests.filter((r) => r.status === 'approved').length);
	const totalRejected = $derived(requests.filter((r) => r.status === 'rejected').length);
	const pendingDepartmentsCount = $derived(
		new Set(
			requests
				.filter((r) => r.status === 'pending' && r.employee?.department)
				.map((r) => r.employee!.department)
		).size
	);

	// Filtered requests computation
	const filteredRequests = $derived(
		requests.filter((req) => {
			// Status match
			const matchesStatus =
				activeStatusFilter === 'all' ? true : req.status === activeStatusFilter;

			// Department match
			const matchesDept =
				selectedDepartment === 'all'
					? true
					: req.employee?.department === selectedDepartment;

			// Search query match
			const q = searchQuery.trim().toLowerCase();
			const empName = req.employee
				? `${req.employee.firstName} ${req.employee.lastName}`.toLowerCase()
				: '';
			const empId = (req.employee?.id || req.employeeId || '').toLowerCase();
			const jobTitle = (req.employee?.jobTitle || '').toLowerCase();
			const reason = (req.reason || '').toLowerCase();
			const reqId = req.id.toLowerCase();

			const matchesSearch =
				q === '' ||
				empName.includes(q) ||
				empId.includes(q) ||
				jobTitle.includes(q) ||
				reason.includes(q) ||
				reqId.includes(q);

			return matchesStatus && matchesDept && matchesSearch;
		})
	);

	function resetFilters() {
		activeStatusFilter = 'all';
		selectedDepartment = 'all';
		searchQuery = '';
	}

	// Approve handler: calls POST /api/leaves/approve
	async function handleApprove(requestId: string) {
		try {
			const targetRequest = requests.find((r) => r.id === requestId);
			const employeeName = targetRequest?.employee
				? `${targetRequest.employee.firstName} ${targetRequest.employee.lastName}`
				: 'Employee';

			const res = await fetch('/api/leaves/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leaveRequestId: requestId,
					action: 'approve',
					approvedBy: auth.user.id
				})
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || 'Failed to approve leave request');
			}

			// Update state locally
			requests = requests.map((r) => {
				if (r.id === requestId) {
					return {
						...r,
						status: 'approved' as LeaveStatus,
						approvedBy: auth.user.id,
						approver: {
							id: auth.user.id,
							name: auth.user.name,
							email: auth.user.email
						},
						updatedAt: new Date().toISOString()
					};
				}
				return r;
			});

			showToast(
				'Leave Request Approved',
				`Successfully approved leave request for ${employeeName}. Leave quota has been deducted.`,
				'success'
			);
		} catch (err: any) {
			console.error('Approve action failed:', err);
			showToast('Approval Error', err?.message || 'Could not approve request.', 'error');
			throw err;
		}
	}

	// Reject handler: calls POST /api/leaves/approve
	async function handleReject(requestId: string, rejectionReason: string) {
		try {
			const targetRequest = requests.find((r) => r.id === requestId);
			const employeeName = targetRequest?.employee
				? `${targetRequest.employee.firstName} ${targetRequest.employee.lastName}`
				: 'Employee';

			const res = await fetch('/api/leaves/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leaveRequestId: requestId,
					action: 'reject',
					rejectionReason,
					approvedBy: auth.user.id
				})
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || 'Failed to reject leave request');
			}

			// Update state locally
			requests = requests.map((r) => {
				if (r.id === requestId) {
					return {
						...r,
						status: 'rejected' as LeaveStatus,
						approvedBy: auth.user.id,
						rejectionReason,
						approver: {
							id: auth.user.id,
							name: auth.user.name,
							email: auth.user.email
						},
						updatedAt: new Date().toISOString()
					};
				}
				return r;
			});

			showToast(
				'Leave Request Rejected',
				`Rejected request for ${employeeName}. Reason has been logged to audit trail.`,
				'info'
			);
		} catch (err: any) {
			console.error('Reject action failed:', err);
			showToast('Rejection Error', err?.message || 'Could not reject request.', 'error');
			throw err;
		}
	}
</script>

<svelte:head>
	<title>Leave Approval Queue | Dayflow HRMS</title>
</svelte:head>

<div class="space-y-7 pb-12 animate-in fade-in-50 duration-300">
	<!-- Toast Alert Banner -->
	{#if toastMessage}
		<div
			class="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-xl max-w-md animate-in slide-in-from-bottom-5 duration-300 {toastMessage.type ===
			'error'
				? 'border-rose-500/30 shadow-rose-500/10'
				: toastMessage.type === 'info'
					? 'border-amber-500/30 shadow-amber-500/10'
					: 'border-emerald-500/30 shadow-emerald-500/10'}"
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl {toastMessage.type ===
				'error'
					? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
					: toastMessage.type === 'info'
						? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
						: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}"
			>
				{#if toastMessage.type === 'error'}
					<XCircle class="h-4 w-4" />
				{:else if toastMessage.type === 'info'}
					<Clock class="h-4 w-4" />
				{:else}
					<CheckCircle2 class="h-4 w-4" />
				{/if}
			</div>
			<div class="flex-1">
				<h4 class="text-xs font-bold text-foreground">{toastMessage.title}</h4>
				<p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{toastMessage.desc}</p>
			</div>
		</div>
	{/if}

	<!-- Header Banner & Navigation Breadcrumbs -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex items-center gap-2 text-xs text-muted-foreground mb-1">
				<a href="/leaves" class="hover:text-foreground transition-colors flex items-center gap-1">
					<ArrowLeft class="h-3 w-3" />
					<span>Time Off & Leaves</span>
				</a>
				<ChevronRight class="h-3 w-3" />
				<span class="font-medium text-foreground">HR Approval Queue</span>
			</div>
			<div class="flex items-center gap-2.5">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
					<ShieldCheck class="h-5 w-5" />
				</div>
				<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
					Leave Approval Queue
				</h1>
			</div>
			<p class="text-xs sm:text-sm text-muted-foreground mt-1">
				Review, authorize, or reject pending employee leave requests with automated quota balance deductions.
			</p>
		</div>

		<!-- Right Action CTA -->
		<div class="flex items-center gap-2.5">
			<a
				href="/leaves"
				class="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
			>
				<CalendarRange class="h-4 w-4 text-muted-foreground" />
				<span>My Leaves & Quotas</span>
			</a>
		</div>
	</div>

	<!-- Section 1: KPI Metric Summary Cards (4 Cards) -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- KPI 1: Total Pending -->
		<div
			class="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-amber-500/30"
		>
			<div class="flex items-start justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Total Pending
					</p>
					<h3 class="mt-2 text-3xl font-extrabold font-mono text-foreground tracking-tight">
						{totalPending}
					</h3>
					<p class="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
						Awaiting review decision
					</p>
				</div>
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
				>
					<Clock class="h-5 w-5 {totalPending > 0 ? 'animate-pulse' : ''}" />
				</div>
			</div>
		</div>

		<!-- KPI 2: Approved This Month -->
		<div
			class="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-emerald-500/30"
		>
			<div class="flex items-start justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Approved Requests
					</p>
					<h3 class="mt-2 text-3xl font-extrabold font-mono text-foreground tracking-tight">
						{totalApproved}
					</h3>
					<p class="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
						Quota balances updated
					</p>
				</div>
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
				>
					<CheckCircle2 class="h-5 w-5" />
				</div>
			</div>
		</div>

		<!-- KPI 3: Rejected This Month -->
		<div
			class="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-rose-500/30"
		>
			<div class="flex items-start justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Rejected Requests
					</p>
					<h3 class="mt-2 text-3xl font-extrabold font-mono text-foreground tracking-tight">
						{totalRejected}
					</h3>
					<p class="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
						Reasons recorded in audit
					</p>
				</div>
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400"
				>
					<XCircle class="h-5 w-5" />
				</div>
			</div>
		</div>

		<!-- KPI 4: Departments Affected -->
		<div
			class="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-indigo-500/30"
		>
			<div class="flex items-start justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Departments Affected
					</p>
					<h3 class="mt-2 text-3xl font-extrabold font-mono text-foreground tracking-tight">
						{pendingDepartmentsCount}
					</h3>
					<p class="mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
						Teams with active queue
					</p>
				</div>
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
				>
					<Building2 class="h-5 w-5" />
				</div>
			</div>
		</div>
	</div>

	<!-- Section 2: Filter Toolbar (Status Tabs, Department Filter, Search) -->
	<div
		class="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4"
	>
		<!-- Left: Status Filter Tabs -->
		<div class="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60 overflow-x-auto">
			<button
				type="button"
				onclick={() => (activeStatusFilter = 'pending')}
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap {activeStatusFilter ===
				'pending'
					? 'bg-background text-foreground shadow-2xs font-bold'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<Clock class="h-3.5 w-3.5 text-amber-500" />
				<span>Pending</span>
				{#if totalPending > 0}
					<span
						class="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300"
					>
						{totalPending}
					</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={() => (activeStatusFilter = 'approved')}
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap {activeStatusFilter ===
				'approved'
					? 'bg-background text-foreground shadow-2xs font-bold'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
				<span>Approved ({totalApproved})</span>
			</button>

			<button
				type="button"
				onclick={() => (activeStatusFilter = 'rejected')}
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap {activeStatusFilter ===
				'rejected'
					? 'bg-background text-foreground shadow-2xs font-bold'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<XCircle class="h-3.5 w-3.5 text-rose-500" />
				<span>Rejected ({totalRejected})</span>
			</button>

			<button
				type="button"
				onclick={() => (activeStatusFilter = 'all')}
				class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap {activeStatusFilter ===
				'all'
					? 'bg-background text-foreground shadow-2xs font-bold'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				All ({requests.length})
			</button>
		</div>

		<!-- Right: Department Filter & Search Input -->
		<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
			<!-- Department Dropdown Selector -->
			<div class="relative min-w-[160px]">
				<select
					bind:value={selectedDepartment}
					class="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-primary shadow-2xs appearance-none pr-8 cursor-pointer"
				>
					<option value="all">All Departments</option>
					{#each departments as dept (dept)}
						<option value={dept}>{dept}</option>
					{/each}
				</select>
				<Building2 class="pointer-events-none absolute right-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
			</div>

			<!-- Search Input -->
			<div class="relative min-w-[220px]">
				<Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
				<input
					type="text"
					placeholder="Search employee, ID, reason..."
					bind:value={searchQuery}
					class="w-full rounded-xl border border-input bg-background pl-8.5 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary shadow-2xs"
				/>
			</div>

			<!-- Clear Filters Button (shown if any filter is customized) -->
			{#if activeStatusFilter !== 'all' || selectedDepartment !== 'all' || searchQuery.trim() !== ''}
				<button
					type="button"
					onclick={resetFilters}
					class="inline-flex items-center justify-center gap-1 rounded-xl border border-border/80 bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					title="Reset all filters"
				>
					<RotateCcw class="h-3 w-3" />
					<span class="hidden sm:inline">Reset</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Section 3: Leave Requests Queue / Cards List -->
	<div>
		<div class="flex items-center justify-between mb-3.5">
			<div class="flex items-center gap-2">
				<Sparkles class="h-4 w-4 text-primary" />
				<h2 class="text-sm font-bold tracking-tight text-foreground uppercase">
					Applications ({filteredRequests.length})
				</h2>
			</div>
			<span class="text-xs text-muted-foreground">
				Logged in as: <strong class="text-foreground">{auth.user.name}</strong> ({auth.roleTitle})
			</span>
		</div>

		{#if filteredRequests.length === 0}
			<!-- Empty State -->
			<div
				class="rounded-2xl border border-dashed border-border/80 bg-card/60 p-12 text-center animate-in fade-in duration-200"
			>
				<div class="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
					>
						<CheckCircle2 class="h-6 w-6" />
					</div>
					<h3 class="text-base font-bold text-foreground">
						No leave requests matching your filter
					</h3>
					<p class="text-xs text-muted-foreground leading-relaxed">
						{#if activeStatusFilter === 'pending'}
							Great job! There are currently no pending leave requests awaiting approval.
						{:else if searchQuery || selectedDepartment !== 'all'}
							No applications found matching "{searchQuery}" in {selectedDepartment === 'all'
								? 'all departments'
								: selectedDepartment}.
						{:else}
							No records available in this category.
						{/if}
					</p>

					{#if activeStatusFilter !== 'all' || selectedDepartment !== 'all' || searchQuery}
						<button
							type="button"
							onclick={resetFilters}
							class="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
						>
							<RotateCcw class="h-3.5 w-3.5" />
							<span>View All Applications</span>
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Cards Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
				{#each filteredRequests as request (request.id)}
					<ApprovalQueueCard
						{request}
						onApprove={handleApprove}
						onReject={handleReject}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>
