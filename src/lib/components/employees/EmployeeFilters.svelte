<script lang="ts">
	import type { EmployeeFiltersProps } from './types';
	import type { EmployeeFilter, EmployeeViewMode, Department, EmployeeStatus } from '$lib/types/employee';
	import {
		Search,
		X,
		SlidersHorizontal,
		LayoutGrid,
		List,
		Plus,
		RotateCcw,
		Filter,
		Building2,
		Users,
		Sparkles
	} from '@lucide/svelte';

	let {
		filters,
		departments = [
			'Engineering',
			'Product',
			'Design',
			'Marketing',
			'Sales',
			'Human Resources',
			'Finance'
		],
		totalCount = 0,
		filteredCount = 0,
		isLoading = false,
		onFilterChange,
		onReset,
		onSearchInput,
		onCreateNew
	}: EmployeeFiltersProps = $props();

	// Local search input buffer for responsive debounce
	let searchQuery = $state('');
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Keep local query in sync if filters.search changes externally
	$effect(() => {
		searchQuery = filters.search || '';
	});

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;

		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			onFilterChange({
				...filters,
				search: searchQuery
			});
			if (onSearchInput) {
				onSearchInput(searchQuery);
			}
		}, 250);
	}

	function clearSearch() {
		searchQuery = '';
		if (debounceTimer) clearTimeout(debounceTimer);
		onFilterChange({
			...filters,
			search: ''
		});
		if (onSearchInput) {
			onSearchInput('');
		}
	}

	function selectDepartment(dept: Department | 'all') {
		onFilterChange({
			...filters,
			department: dept
		});
	}

	function selectStatus(status: EmployeeStatus | 'all' | 'present' | 'on_leave' | 'absent') {
		onFilterChange({
			...filters,
			status: status as any
		});
	}

	function setViewMode(mode: EmployeeViewMode) {
		onFilterChange({
			...filters,
			viewMode: mode
		});
	}

	function handleReset() {
		searchQuery = '';
		if (debounceTimer) clearTimeout(debounceTimer);
		if (onReset) {
			onReset();
		} else {
			onFilterChange({
				search: '',
				department: 'all',
				status: 'all',
				viewMode: filters.viewMode || 'kanban'
			});
		}
	}

	const hasActiveFilters = $derived(
		Boolean(
			(filters.search && filters.search.trim() !== '') ||
			(filters.department && filters.department !== 'all') ||
			(filters.status && filters.status !== 'all')
		)
	);

	// Curated list of quick department pills
	const quickDepartments: { label: string; value: string }[] = [
		{ label: 'All Depts', value: 'all' },
		{ label: 'Engineering', value: 'Engineering' },
		{ label: 'Product', value: 'Product' },
		{ label: 'Design', value: 'Design' },
		{ label: 'Marketing', value: 'Marketing' },
		{ label: 'Sales', value: 'Sales' },
		{ label: 'HR', value: 'HR' }
	];

	// Status options
	const statusOptions: { label: string; value: string; icon?: string; dotClass?: string }[] = [
		{ label: 'All Status', value: 'all' },
		{ label: 'Present', value: 'present', dotClass: 'bg-emerald-500' },
		{ label: 'On Leave', value: 'on_leave', icon: '✈️' },
		{ label: 'Absent', value: 'absent', dotClass: 'bg-amber-400' }
	];
</script>

<div class="space-y-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs">
	<!-- Top Bar: Search Bar, Status Filters, View Mode Toggle, and Actions -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
		<!-- Search Bar with Debounce -->
		<div class="relative flex-1 max-w-lg">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
				<Search class="h-4 w-4" />
			</div>
			<input
				type="text"
				bind:value={searchQuery}
				oninput={handleSearchInput}
				placeholder="Search by name, role, department, skills, or email..."
				class="w-full rounded-xl border border-border/80 bg-background/80 py-2 pl-10 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
			/>
			{#if searchQuery}
				<button
					type="button"
					onclick={clearSearch}
					class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
					title="Clear search"
				>
					<X class="h-4 w-4" />
				</button>
			{/if}
		</div>

		<!-- Right Controls: Status Selector, View Switcher, Create Action -->
		<div class="flex flex-wrap items-center gap-2 sm:gap-3">
			<!-- Status Dropdown / Pill selector -->
			<div class="flex items-center rounded-xl border border-border/80 bg-background p-1 shadow-2xs">
				{#each statusOptions as opt (opt.value)}
					{@const active = (filters.status || 'all') === opt.value}
					<button
						type="button"
						onclick={() => selectStatus(opt.value as any)}
						class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all {active
							? 'bg-primary text-primary-foreground shadow-2xs'
							: 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}"
					>
						{#if opt.dotClass}
							<span class="h-2 w-2 rounded-full {opt.dotClass}"></span>
						{:else if opt.icon}
							<span class="text-[10px]">{opt.icon}</span>
						{/if}
						<span>{opt.label}</span>
					</button>
				{/each}
			</div>

			<!-- View Mode Switcher: Kanban / Grid vs List -->
			<div class="flex items-center rounded-xl border border-border/80 bg-background p-1 shadow-2xs" role="group" aria-label="View mode">
				<button
					type="button"
					onclick={() => setViewMode('kanban')}
					class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all {filters.viewMode !== 'list'
						? 'bg-accent text-accent-foreground shadow-2xs'
						: 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}"
					title="Kanban Grid View"
					aria-pressed={filters.viewMode !== 'list'}
				>
					<LayoutGrid class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">Kanban</span>
				</button>

				<button
					type="button"
					onclick={() => setViewMode('list')}
					class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all {filters.viewMode === 'list'
						? 'bg-accent text-accent-foreground shadow-2xs'
						: 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}"
					title="List View"
					aria-pressed={filters.viewMode === 'list'}
				>
					<List class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">List</span>
				</button>
			</div>

			<!-- Create Employee Button if provided -->
			{#if onCreateNew}
				<button
					type="button"
					onclick={onCreateNew}
					class="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
				>
					<Plus class="h-3.5 w-3.5" />
					<span>New Employee</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Bottom Bar: Department Filter Pills & Active Filter Reset -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-border/60">
		<!-- Department Quick Pills -->
		<div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
			<span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
				<Building2 class="h-3.5 w-3.5" />
				Depts:
			</span>

			{#each quickDepartments as dept (dept.value)}
				{@const active = (filters.department || 'all').toLowerCase() === dept.value.toLowerCase()}
				<button
					type="button"
					onclick={() => selectDepartment(dept.value)}
					class="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border {active
						? 'bg-primary/10 text-primary border-primary/30 font-bold'
						: 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground'}"
				>
					{dept.label}
				</button>
			{/each}
		</div>

		<!-- Reset Filters & Count Summary -->
		<div class="flex items-center justify-between sm:justify-end gap-3 text-xs shrink-0">
			<span class="text-muted-foreground">
				Showing <strong class="text-foreground">{filteredCount}</strong> of <strong class="text-foreground">{totalCount}</strong> employees
			</span>

			{#if hasActiveFilters}
				<button
					type="button"
					onclick={handleReset}
					class="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline transition-colors"
					title="Reset all active filters"
				>
					<RotateCcw class="h-3 w-3" />
					<span>Reset Filters</span>
				</button>
			{/if}
		</div>
	</div>
</div>
