<script lang="ts">
	import type { EmployeeGridProps } from './types';
	import type { Employee, EmployeeWithRelations } from '$lib/types/employee';
	import EmployeeCard from '$lib/components/employees/EmployeeCard.svelte';
	import { Users, SearchX, UserX, Plus, Sparkles } from '@lucide/svelte';

	let {
		employees = [],
		viewMode = 'kanban',
		isLoading = false,
		selectedId = null,
		emptyMessage = 'No employees matched your search or active filters.',
		canEdit = false,
		onSelect,
		onEdit,
		onDelete
	}: EmployeeGridProps = $props();
</script>

{#if isLoading}
	<!-- Loading Skeleton States -->
	{#if viewMode === 'list'}
		<div class="space-y-3">
			{#each Array(6) as _, i (i)}
				<div class="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card/60 animate-pulse">
					<div class="flex items-center gap-3.5">
						<div class="h-11 w-11 rounded-full bg-muted"></div>
						<div class="space-y-2">
							<div class="h-4 w-36 rounded bg-muted"></div>
							<div class="h-3 w-24 rounded bg-muted/60"></div>
						</div>
					</div>
					<div class="hidden sm:flex items-center gap-6">
						<div class="h-6 w-24 rounded-full bg-muted/60"></div>
						<div class="h-4 w-32 rounded bg-muted/60"></div>
					</div>
					<div class="h-8 w-20 rounded-lg bg-muted"></div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Kanban Skeleton Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
			{#each Array(8) as _, i (i)}
				<div class="flex flex-col justify-between rounded-2xl border border-border/60 bg-card/60 p-5 space-y-4 animate-pulse">
					<div>
						<div class="flex items-center justify-between mb-4">
							<div class="h-5 w-24 rounded-full bg-muted"></div>
							<div class="h-4 w-16 rounded bg-muted/60"></div>
						</div>
						<div class="flex items-start gap-3.5">
							<div class="h-14 w-14 rounded-2xl bg-muted shrink-0"></div>
							<div class="space-y-2 flex-1 pt-1">
								<div class="h-4 w-3/4 rounded bg-muted"></div>
								<div class="h-3 w-1/2 rounded bg-muted/60"></div>
							</div>
						</div>
						<div class="mt-4 space-y-2 border-t border-border/40 pt-3">
							<div class="h-3 w-4/5 rounded bg-muted/60"></div>
							<div class="h-3 w-3/5 rounded bg-muted/60"></div>
						</div>
					</div>
					<div class="pt-3 border-t border-border/40">
						<div class="h-8 w-full rounded-xl bg-muted"></div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{:else if employees.length === 0}
	<!-- Empty State -->
	<div class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 p-8 sm:p-12 text-center shadow-2xs">
		<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground mb-4">
			<SearchX class="h-8 w-8" />
		</div>
		<h3 class="text-base sm:text-lg font-bold text-foreground tracking-tight">
			No employees found
		</h3>
		<p class="mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
			{emptyMessage}
		</p>
	</div>
{:else}
	<!-- Populated Employee Grid / List -->
	{#if viewMode === 'list'}
		<div class="space-y-2.5 sm:space-y-3">
			{#each employees as employee (employee.id)}
				<EmployeeCard
					{employee}
					viewMode="list"
					isSelected={selectedId === employee.id}
					{canEdit}
					{onSelect}
					{onEdit}
					{onDelete}
				/>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
			{#each employees as employee (employee.id)}
				<EmployeeCard
					{employee}
					viewMode="kanban"
					isSelected={selectedId === employee.id}
					{canEdit}
					{onSelect}
					{onEdit}
					{onDelete}
				/>
			{/each}
		</div>
	{/if}
{/if}
