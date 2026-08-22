<script lang="ts">
	import type { EmployeeFiltersProps } from './types';
	import type { Department, EmployeeStatus, EmployeeViewMode } from '$lib/types/employee';
	import {
		Search,
		X,
		LayoutGrid,
		List,
		Plus,
		RotateCcw,
		Building2
	} from '@lucide/svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';

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

<Card.Root class="p-4 sm:p-5 shadow-2xs space-y-4">
	<!-- Top Bar: Search Bar, Status Filters, View Mode Toggle, and Actions -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
		<!-- Search Bar with Debounce -->
		<div class="relative flex-1 max-w-lg">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
				<Search class="h-4 w-4" />
			</div>
			<Input
				type="text"
				bind:value={searchQuery}
				oninput={handleSearchInput}
				placeholder="Search by name, role, department, skills, or email..."
				class="pl-9 pr-9 h-9 text-xs sm:text-sm"
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
			<div class="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 shadow-2xs">
				{#each statusOptions as opt (opt.value)}
					{@const active = (filters.status || 'all') === opt.value}
					<Button
						variant={active ? 'default' : 'ghost'}
						size="xs"
						onclick={() => selectStatus(opt.value as any)}
						class="gap-1.5 text-xs font-semibold h-7"
					>
						{#if opt.dotClass}
							<span class="h-2 w-2 rounded-full {opt.dotClass}"></span>
						{:else if opt.icon}
							<span class="text-[10px]">{opt.icon}</span>
						{/if}
						<span>{opt.label}</span>
					</Button>
				{/each}
			</div>

			<!-- View Mode Switcher: Kanban / Grid vs List -->
			<div class="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 shadow-2xs" role="group" aria-label="View mode">
				<Button
					variant={filters.viewMode !== 'list' ? 'secondary' : 'ghost'}
					size="xs"
					onclick={() => setViewMode('kanban')}
					class="gap-1.5 text-xs font-semibold h-7"
					title="Kanban Grid View"
					aria-pressed={filters.viewMode !== 'list'}
				>
					<LayoutGrid class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">Kanban</span>
				</Button>

				<Button
					variant={filters.viewMode === 'list' ? 'secondary' : 'ghost'}
					size="xs"
					onclick={() => setViewMode('list')}
					class="gap-1.5 text-xs font-semibold h-7"
					title="List View"
					aria-pressed={filters.viewMode === 'list'}
				>
					<List class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">List</span>
				</Button>
			</div>

			<!-- Create Employee Button if provided -->
			{#if onCreateNew}
				<Button
					size="sm"
					onclick={onCreateNew}
					class="gap-1.5 text-xs font-semibold h-8"
				>
					<Plus class="h-3.5 w-3.5" />
					<span>New Employee</span>
				</Button>
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
				<Button
					variant={active ? 'secondary' : 'outline'}
					size="xs"
					onclick={() => selectDepartment(dept.value)}
					class="shrink-0 h-6 text-xs {active ? 'font-bold bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground'}"
				>
					{dept.label}
				</Button>
			{/each}
		</div>

		<!-- Reset Filters & Count Summary -->
		<div class="flex items-center justify-between sm:justify-end gap-3 text-xs shrink-0">
			<span class="text-muted-foreground">
				Showing <strong class="text-foreground">{filteredCount}</strong> of <strong class="text-foreground">{totalCount}</strong> employees
			</span>

			{#if hasActiveFilters}
				<Button
					variant="ghost"
					size="xs"
					onclick={handleReset}
					class="gap-1 text-xs font-semibold text-destructive hover:text-destructive h-6 p-0"
					title="Reset all active filters"
				>
					<RotateCcw class="h-3 w-3" />
					<span>Reset Filters</span>
				</Button>
			{/if}
		</div>
	</div>
</Card.Root>
