<script lang="ts">
	import { auth } from '$lib/state/auth.svelte';
	import { palette } from '$lib/state/palette.svelte';
	import type { Component } from 'svelte';
	import {
		Users,
		Clock,
		CalendarDays,
		ReceiptText,
		LayoutDashboard,
		ArrowRight,
		Sparkles,
		ShieldCheck,
		UserCheck,
		User,
		Command,
		Timer,
		CheckCircle2,
		Layers
	} from '@lucide/svelte';

	const currentUser = $derived(auth.user);

	interface ModuleCard {
		title: string;
		description: string;
		href: string;
		icon: Component<any>;
		badge: string;
		color: string;
	}

	const modules: ModuleCard[] = [
		{
			title: 'Employee Directory',
			description: 'Manage 360° employee profiles, organizational structure, resumes, and private statutory details.',
			href: '/employees',
			icon: Users,
			badge: '12 Active Staff',
			color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40'
		},
		{
			title: 'Attendance & Time Tracking',
			description: 'Real-time check-in/out stopwatch, daily break logging, overtime tracking, and timesheet exports.',
			href: '/attendance',
			icon: Clock,
			badge: 'Live Session Active',
			color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40'
		},
		{
			title: 'Time Off & Leave Management',
			description: 'Request paid time off or sick leave, track dynamic leave balance quotas, and review multi-tier approval workflows.',
			href: '/leaves',
			icon: CalendarDays,
			badge: '24 Days PTO Quota',
			color: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40'
		},
		{
			title: 'Payroll & Compensation',
			description: 'Automated salary breakdown engine with Basic, HRA, Standard Allowance, PF deductions, and PDF payslip generation.',
			href: '/payroll',
			icon: ReceiptText,
			badge: 'August 2026 Batch',
			color: 'from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/40'
		}
	];
</script>

<div class="space-y-8">
	<!-- Hero Welcome Banner -->
	<section class="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-8 shadow-xs">
		<div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
			<div class="space-y-2 max-w-2xl">
				<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
					<Sparkles class="h-3.5 w-3.5" />
					<span>Dayflow HRMS • Odoo-Inspired Enterprise Architecture</span>
				</div>
				<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
					Welcome back, {currentUser.name}!
				</h1>
				<p class="text-sm sm:text-base text-muted-foreground leading-relaxed">
					Operating as <span class="font-semibold text-foreground">{currentUser.roleTitle}</span> ({currentUser.department}). Seamlessly manage employees, record attendance, review leave workflows, and run payroll.
				</p>
			</div>

			<!-- Quick Actions / Mode Pill -->
			<div class="flex flex-wrap items-center gap-3">
				<button
					type="button"
					onclick={() => palette.open()}
					class="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-accent transition-all"
				>
					<Command class="h-3.5 w-3.5 text-primary" />
					<span>Command Palette (⌘K)</span>
				</button>

				<a
					href="/dashboard"
					class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
				>
					<span>Open HR Dashboard</span>
					<ArrowRight class="h-3.5 w-3.5" />
				</a>
			</div>
		</div>

		<!-- Subtle Background Decoration -->
		<div class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-bl from-purple-500/10 via-indigo-500/5 to-transparent blur-2xl"></div>
	</section>

	<!-- Main Navigation Grid -->
	<section class="space-y-4">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-lg font-bold tracking-tight text-foreground">Core HR Modules</h2>
				<p class="text-xs text-muted-foreground">Select a business unit to view and manage organizational operations.</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
			{#each modules as mod (mod.title)}
				{@const ModIcon = mod.icon}
				<a
					href={mod.href}
					class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md"
				>
					<div>
						<div class="flex items-center justify-between mb-4">
							<div class="flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br {mod.color}">
								<ModIcon class="h-5 w-5" />
							</div>
							<span class="rounded-md border border-border/80 bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
								{mod.badge}
							</span>
						</div>

						<h3 class="text-base font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
							{mod.title}
							<ArrowRight class="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
						</h3>
						<p class="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
							{mod.description}
						</p>
					</div>

					<div class="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
						<span>Explore module</span>
						<ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
					</div>
				</a>
			{/each}
		</div>
	</section>
</div>
