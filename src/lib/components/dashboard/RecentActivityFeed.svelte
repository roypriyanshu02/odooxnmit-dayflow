<script lang="ts">
	import {
		Clock,
		CheckCircle2,
		Plane,
		Coins,
		Sparkles
	} from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	interface ActivityItem {
		id: string;
		type: 'checkin' | 'leave_approval' | 'salary_run' | 'onboarding' | 'profile_update';
		title: string;
		description: string;
		timestamp: string;
		authorName?: string;
	}

	interface Props {
		activities?: ActivityItem[];
	}

	let {
		activities = [
			{
				id: '1',
				type: 'leave_approval',
				title: 'Leave Approved',
				description: 'Paid Time Off request (Aug 20-22) approved for Priyanshu Roy.',
				timestamp: '10 mins ago',
				authorName: 'HR Administration'
			},
			{
				id: '2',
				type: 'salary_run',
				title: 'Monthly Batch Payroll Run',
				description: 'August 2026 payroll processed for 12 employees (Total: ₹9,85,000).',
				timestamp: '1 hour ago',
				authorName: 'Automation Engine'
			},
			{
				id: '3',
				type: 'checkin',
				title: 'Shift Attendance Started',
				description: 'Arnav Kini logged shift check-in at 09:02 AM.',
				timestamp: '2 hours ago',
				authorName: 'Arnav Kini'
			},
			{
				id: '4',
				type: 'onboarding',
				title: 'New Profile Onboarded',
				description: 'Sanchit Pandey joined Systems & Infrastructure Department.',
				timestamp: 'Yesterday',
				authorName: 'HR Team'
			}
		]
	}: Props = $props();
</script>

<Card.Root class="p-5 shadow-2xs">
	<!-- Header -->
	<div class="flex items-center justify-between pb-4 mb-4 border-b border-border/80">
		<div class="flex items-center gap-2.5">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
				<Clock class="h-4 w-4" />
			</div>
			<div>
				<h3 class="text-sm font-bold text-foreground">Recent Organization Activity</h3>
				<p class="text-[11px] text-muted-foreground">Real-time event stream across departments</p>
			</div>
		</div>

		<Badge variant="outline" class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
			Live Stream
		</Badge>
	</div>

	<!-- Activity Timeline -->
	<div class="space-y-4">
		{#each activities as item (item.id)}
			<div class="flex items-start gap-3 text-xs">
				<!-- Icon Badge -->
				<div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border {item.type === 'leave_approval'
					? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
					: item.type === 'salary_run'
						? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
						: item.type === 'checkin'
							? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
							: 'bg-muted text-muted-foreground border-border'}">
					{#if item.type === 'leave_approval'}
						<Plane class="h-3.5 w-3.5" />
					{:else if item.type === 'salary_run'}
						<Coins class="h-3.5 w-3.5" />
					{:else if item.type === 'checkin'}
						<CheckCircle2 class="h-3.5 w-3.5" />
					{:else}
						<Sparkles class="h-3.5 w-3.5" />
					{/if}
				</div>

				<!-- Details -->
				<div class="flex-1 space-y-0.5">
					<div class="flex items-center justify-between">
						<span class="font-bold text-foreground">{item.title}</span>
						<span class="text-[10px] font-mono text-muted-foreground">{item.timestamp}</span>
					</div>
					<p class="text-muted-foreground leading-relaxed">{item.description}</p>
				</div>
			</div>
		{/each}
	</div>
</Card.Root>
