<script lang="ts">
	import type { PageData } from './$types';
	import type { EmployeeWithRelations, EmployeeFilter, EmployeeViewMode } from '$lib/types/employee';
	import EmployeeFilters from '$lib/components/employees/EmployeeFilters.svelte';
	import EmployeeGrid from '$lib/components/employees/EmployeeGrid.svelte';
	import { auth } from '$lib/state/auth.svelte';
	import {
		Users,
		UserPlus,
		Sparkles,
		ShieldCheck,
		Briefcase,
		Building2,
		Clock,
		Plane,
		TrendingUp,
		Filter
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// State initialized and updated via $effect
	let employees = $state<EmployeeWithRelations[]>([]);
	let departments = $state<string[]>([]);
	let isLoading = $state(false);
	let selectedEmployeeId = $state<string | null>(null);

	// Filters State
	let filters = $state<EmployeeFilter>({
		search: '',
		department: 'all',
		status: 'all',
		viewMode: 'kanban'
	});

	// Stats State
	let stats = $state({
		total: 0,
		active: 0,
		present: 0,
		onLeave: 0
	});

	$effect(() => {
		if (data?.initialEmployees) {
			employees = data.initialEmployees;
		}
		if (data?.departments) {
			departments = data.departments as string[];
		}
		if (data?.stats) {
			stats = data.stats;
		}
	});

	// Fetch filtered employees from API endpoint
	async function fetchEmployees(currentFilters: EmployeeFilter) {
		isLoading = true;
		try {
			const params = new URLSearchParams();
			if (currentFilters.search) params.set('query', currentFilters.search);
			if (currentFilters.department && currentFilters.department !== 'all') {
				params.set('department', currentFilters.department);
			}
			if (currentFilters.status && currentFilters.status !== 'all') {
				params.set('status', currentFilters.status);
			}

			const res = await fetch(`/api/employees?${params.toString()}`);
			if (res.ok) {
				const result = await res.json();
				if (result.success) {
					employees = result.employees;
					if (result.departments && result.departments.length > 0) {
						departments = result.departments;
					}
					if (result.stats) {
						stats = result.stats;
					}
				}
			}
		} catch (err) {
			console.error('Error fetching employees from API:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleFilterChange(newFilters: EmployeeFilter) {
		const prevSearch = filters.search;
		const prevDept = filters.department;
		const prevStatus = filters.status;
		filters = newFilters;

		// If search, department, or status changed, query the API
		if (
			prevSearch !== newFilters.search ||
			prevDept !== newFilters.department ||
			prevStatus !== newFilters.status
		) {
			fetchEmployees(newFilters);
		}
	}

	function handleReset() {
		filters = {
			search: '',
			department: 'all',
			status: 'all',
			viewMode: filters.viewMode || 'kanban'
		};
		fetchEmployees(filters);
	}

	function handleSelectEmployee(emp: any) {
		selectedEmployeeId = emp.id;
	}

	// Computed counts for stats display
	const presentCount = $derived(
		employees.filter((e) => e.attendanceStatus === 'present').length
	);
	const onLeaveCount = $derived(
		employees.filter((e) => e.attendanceStatus === 'on_leave' || e.status === 'on_leave').length
	);
	const absentCount = $derived(
		employees.filter((e) => e.attendanceStatus === 'absent' && e.status !== 'on_leave').length
	);
</script>

<svelte:head>
	<title>Employee Directory | Dayflow HRMS</title>
	<meta name="description" content="Dayflow HRMS Employee Directory - Search, filter, and view 360° employee profiles, organizational structures, and presence status." />
</svelte:head>

<div class="space-y-6">
	<!-- Top Page Header & Operational Stats Bar -->
	<section class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-5">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary border border-primary/20">
					<Users class="h-3 w-3" />
					Workforce Management
				</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
				Employee Directory
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground mt-1">
				Browse and manage company personnel, organizational hierarchies, and presence metrics.
			</p>
		</div>

		<!-- Real-time Presence Metrics Pills -->
		<div class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
			<!-- Total Count -->
			<div class="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 shadow-2xs">
				<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
					<Users class="h-4 w-4" />
				</div>
				<div>
					<div class="text-[10px] uppercase font-semibold text-muted-foreground">Total Staff</div>
					<div class="font-bold text-foreground text-sm leading-none">{stats.total || employees.length}</div>
				</div>
			</div>

			<!-- Present Pill -->
			<div class="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 shadow-2xs">
				<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
					<span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
				</div>
				<div>
					<div class="text-[10px] uppercase font-semibold text-muted-foreground">Present</div>
					<div class="font-bold text-emerald-600 dark:text-emerald-400 text-sm leading-none">{presentCount}</div>
				</div>
			</div>

			<!-- On Leave Pill -->
			<div class="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 shadow-2xs">
				<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
					<span class="text-xs">✈️</span>
				</div>
				<div>
					<div class="text-[10px] uppercase font-semibold text-muted-foreground">On Leave</div>
					<div class="font-bold text-sky-600 dark:text-sky-400 text-sm leading-none">{onLeaveCount}</div>
				</div>
			</div>

			<!-- Absent Pill -->
			<div class="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2 shadow-2xs">
				<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
					<span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
				</div>
				<div>
					<div class="text-[10px] uppercase font-semibold text-muted-foreground">Absent</div>
					<div class="font-bold text-amber-600 dark:text-amber-400 text-sm leading-none">{absentCount}</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Search & Filter Controls -->
	<section>
		<EmployeeFilters
			{filters}
			{departments}
			totalCount={stats.total || employees.length}
			filteredCount={employees.length}
			{isLoading}
			onFilterChange={handleFilterChange}
			onReset={handleReset}
		/>
	</section>

	<!-- Employee Grid / Kanban / List -->
	<section>
		<EmployeeGrid
			{employees}
			viewMode={filters.viewMode || 'kanban'}
			{isLoading}
			selectedId={selectedEmployeeId}
			canEdit={auth.isHR || auth.isAdmin}
			onSelect={handleSelectEmployee}
		/>
	</section>
</div>
