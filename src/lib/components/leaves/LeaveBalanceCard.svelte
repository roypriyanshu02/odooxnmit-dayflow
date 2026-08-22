<script lang="ts">
	import type { LeaveType } from '$lib/types/leaves';
	import { LEAVE_TYPES_CONFIG } from '$lib/types/leaves';
	import {
		Palmtree,
		HeartPulse,
		AlertCircle,
		ArrowUpRight,
		Clock,
		CheckCircle2
	} from '@lucide/svelte';

	interface Props {
		type: LeaveType;
		total?: number;
		used?: number;
		remaining?: number;
		onApply?: (type: LeaveType) => void;
		class?: string;
	}

	let {
		type,
		total: customTotal,
		used = 0,
		remaining: customRemaining,
		onApply,
		class: className = ''
	}: Props = $props();

	const config = $derived(LEAVE_TYPES_CONFIG[type] ?? LEAVE_TYPES_CONFIG.paid_time_off);

	const total = $derived(
		customTotal !== undefined ? customTotal : config.defaultAllowance
	);

	const remaining = $derived(
		customRemaining !== undefined
			? customRemaining
			: type === 'unpaid_leave'
				? used
				: Math.max(0, total - used)
	);

	const percentage = $derived(
		type === 'unpaid_leave'
			? 100
			: total <= 0
				? 0
				: Math.min(100, Math.round((used / total) * 100))
	);

	// SVG Ring properties
	const radius = 32;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = $derived(
		type === 'unpaid_leave'
			? 0
			: circumference - (percentage / 100) * circumference
	);

	const iconMap = {
		paid_time_off: Palmtree,
		sick_leave: HeartPulse,
		unpaid_leave: AlertCircle
	};

	const IconComponent = $derived(iconMap[type] || Palmtree);
</script>

<div
	class="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-border hover:-translate-y-0.5 {className}"
>
	<!-- Subtle ambient background glow -->
	<div
		class="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-15 transition-opacity duration-300 group-hover:opacity-25"
		style="background-color: {config.color.primary};"
	></div>

	<!-- Top Header: Icon & Badges -->
	<div class="flex items-start justify-between gap-3">
		<div class="flex items-center gap-3">
			<div
				class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 shadow-xs {config.color.badgeBg} {config.color.text}"
			>
				<IconComponent class="h-5 w-5" />
			</div>
			<div>
				<h3 class="font-semibold text-foreground text-sm sm:text-base leading-snug tracking-tight">
					{config.title}
				</h3>
				<p class="text-xs text-muted-foreground line-clamp-1">
					{config.shortName} &bull; {config.allowanceUnit}
				</p>
			</div>
		</div>

		<!-- Status Badge -->
		{#if type === 'unpaid_leave'}
			<span
				class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold {config.color.badgeBg} {config.color.badgeText}"
			>
				<Clock class="h-3 w-3" />
				Loss of Pay
			</span>
		{:else if remaining > 0}
			<span
				class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
			>
				<CheckCircle2 class="h-3 w-3" />
				Available
			</span>
		{:else}
			<span
				class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
			>
				Exhausted
			</span>
		{/if}
	</div>

	<!-- Main Stats & Circular Ring / Progress -->
	<div class="mt-5 flex items-center justify-between gap-4">
		<!-- Left: Numerical stats -->
		<div class="space-y-1">
			<div class="flex items-baseline gap-1.5">
				<span class="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-foreground">
					{type === 'unpaid_leave' ? used : remaining}
				</span>
				<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
					{type === 'unpaid_leave' ? 'Days Used' : 'Days Left'}
				</span>
			</div>
			<div class="text-xs text-muted-foreground">
				{#if type === 'unpaid_leave'}
					<span>Recorded unpaid absence</span>
				{:else}
					<span><strong class="font-semibold text-foreground">{used}</strong> used of <strong class="font-semibold text-foreground">{total}</strong> allowance</span>
				{/if}
			</div>
		</div>

		<!-- Right: Circular Radial Progress Ring -->
		<div class="relative flex h-18 w-18 shrink-0 items-center justify-center">
			<svg class="h-full w-full -rotate-90 transform" viewBox="0 0 80 80">
				<!-- Track Circle -->
				<circle
					cx="40"
					cy="40"
					r={radius}
					class="stroke-muted"
					stroke-width="7"
					fill="transparent"
				/>
				<!-- Active Ring Stroke -->
				<circle
					cx="40"
					cy="40"
					r={radius}
					class="{config.color.ring} transition-all duration-700 ease-out"
					stroke-width="7"
					stroke-linecap="round"
					stroke-dasharray={circumference}
					stroke-dashoffset={strokeDashoffset}
					fill="transparent"
				/>
			</svg>
			<div class="absolute flex flex-col items-center justify-center text-center">
				{#if type === 'unpaid_leave'}
					<span class="text-[11px] font-bold text-amber-700 dark:text-amber-300 font-mono">
						{used}d
					</span>
				{:else}
					<span class="text-[11px] font-bold font-mono text-foreground">
						{percentage}%
					</span>
					<span class="text-[9px] uppercase tracking-tighter text-muted-foreground">used</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Linear Bar Indicator -->
	<div class="mt-4 pt-3 border-t border-border/60">
		<div class="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
			<span>Quota Utilization</span>
			<span class="font-mono font-medium">{type === 'unpaid_leave' ? `${used} days total` : `${remaining} remaining`}</span>
		</div>
		<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
			<div
				class="h-full rounded-full transition-all duration-500 bg-gradient-to-r {config.color.gradient}"
				style="width: {percentage}%;"
			></div>
		</div>
	</div>

	<!-- Bottom Action / CTA Button -->
	{#if onApply}
		<div class="mt-4 pt-2">
			<button
				type="button"
				onclick={() => onApply?.(type)}
				class="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-muted/30 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary focus:outline-hidden focus:ring-2 focus:ring-ring"
			>
				<span>Request {config.shortName}</span>
				<ArrowUpRight class="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
			</button>
		</div>
	{/if}
</div>
