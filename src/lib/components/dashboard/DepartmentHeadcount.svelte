<script lang="ts">
	import { Building2, Users } from '@lucide/svelte';

	interface DepartmentStat {
		name: string;
		count: number;
		percentage: number;
		color: string;
	}

	interface Props {
		departments?: DepartmentStat[];
		totalStaff?: number;
	}

	let {
		departments = [
			{ name: 'Engineering', count: 4, percentage: 33, color: 'bg-indigo-500' },
			{ name: 'Product', count: 2, percentage: 17, color: 'bg-cyan-500' },
			{ name: 'Design', count: 2, percentage: 17, color: 'bg-pink-500' },
			{ name: 'Sales', count: 2, percentage: 17, color: 'bg-amber-500' },
			{ name: 'Marketing', count: 1, percentage: 8, color: 'bg-emerald-500' },
			{ name: 'HR', count: 1, percentage: 8, color: 'bg-purple-500' }
		],
		totalStaff = 12
	}: Props = $props();
</script>

<div class="rounded-2xl border border-border bg-card p-5 shadow-2xs">
	<!-- Header -->
	<div class="flex items-center justify-between pb-4 mb-4 border-b border-border/80">
		<div class="flex items-center gap-2.5">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
				<Building2 class="h-4 w-4" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-foreground">Department Distribution</h3>
				<p class="text-[11px] text-muted-foreground">Staff allocation and headcount density</p>
			</div>
		</div>

		<span class="text-xs font-mono font-bold text-muted-foreground">
			{totalStaff} Team Members
		</span>
	</div>

	<!-- Department List with Progress Bars -->
	<div class="space-y-4">
		{#each departments as dept (dept.name)}
			<div class="space-y-1.5">
				<div class="flex items-center justify-between text-xs">
					<span class="font-bold text-foreground">{dept.name}</span>
					<div class="flex items-center gap-2 font-mono">
						<span class="text-muted-foreground">{dept.count} members</span>
						<span class="font-bold text-foreground">{dept.percentage}%</span>
					</div>
				</div>

				<!-- Progress Bar -->
				<div class="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
					<div
						class="h-full rounded-full {dept.color} transition-all duration-500"
						style="width: {dept.percentage}%;"
					></div>
				</div>
			</div>
		{/each}
	</div>
</div>
