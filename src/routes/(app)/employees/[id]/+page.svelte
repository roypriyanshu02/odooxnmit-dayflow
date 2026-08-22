<script lang="ts">
	import type { PageData } from './$types';
	import { auth } from '$lib/state/auth.svelte';
	import AboutTab from '$lib/components/employees/tabs/AboutTab.svelte';
	import ResumeTab from '$lib/components/employees/tabs/ResumeTab.svelte';
	import PrivateInfoTab from '$lib/components/employees/tabs/PrivateInfoTab.svelte';
	import SalaryInfoTab from '$lib/components/employees/tabs/SalaryInfoTab.svelte';
	import type { Component } from 'svelte';
	import {
		ArrowLeft,
		Copy,
		Check,
		Mail,
		Phone,
		Building2,
		Briefcase,
		Calendar,
		ShieldCheck,
		Lock,
		User,
		FileText,
		Printer,
		Share2,
		Sparkles,
		CheckCircle2,
		Plane,
		CircleDot
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const employee = $derived(data.employee);
	const manager = $derived(data.manager);
	const subordinates = $derived(data.subordinates);
	const presenceStatus = $derived(data.presenceStatus);

	type TabKey = 'about' | 'resume' | 'private' | 'salary';
	let activeTab = $state<TabKey>('about');
	let copiedId = $state(false);

	function copyId(id: string) {
		if (!id) return;
		navigator.clipboard.writeText(id);
		copiedId = true;
		setTimeout(() => {
			copiedId = false;
		}, 2000);
	}

	const tabs: { id: TabKey; label: string; icon: Component<any>; restricted?: boolean }[] = [
		{ id: 'about', label: 'About', icon: User },
		{ id: 'resume', label: 'Resume', icon: FileText },
		{ id: 'private', label: 'Private Info', icon: Lock },
		{ id: 'salary', label: 'Salary Info', icon: ShieldCheck, restricted: true }
	];

	// Calculate formatted tenure
	const tenureString = $derived(() => {
		if (!employee.joinDate) return 'Recently Joined';
		try {
			const start = new Date(employee.joinDate);
			const now = new Date('2026-08-22');
			const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
			const years = Math.floor(diffMonths / 12);
			const months = diffMonths % 12;
			if (years > 0 && months > 0) return `${years}y ${months}m at Dayflow`;
			if (years > 0) return `${years} ${years === 1 ? 'year' : 'years'} at Dayflow`;
			return `${Math.max(1, months)} ${months === 1 ? 'month' : 'months'} at Dayflow`;
		} catch {
			return 'Active Tenured';
		}
	});
</script>

<svelte:head>
	<title>{employee.firstName} {employee.lastName} ({employee.id}) | Dayflow Employee Profile</title>
</svelte:head>

<div class="space-y-6 pb-12">
	<!-- Top Navigation & Action Header (Odoo Breadcrumb Style) -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<!-- Breadcrumb Trail -->
		<div class="flex items-center gap-2 text-xs sm:text-sm">
			<a
				href="/employees"
				class="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
			>
				<ArrowLeft class="h-3.5 w-3.5" />
				<span>Employees</span>
			</a>
			<span class="text-muted-foreground/60">/</span>
			<span class="font-bold text-foreground truncate max-w-[200px] sm:max-w-none">
				{employee.firstName} {employee.lastName}
			</span>
		</div>

		<!-- Action Controls -->
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => window.print()}
				class="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-2xs"
				title="Print Profile"
			>
				<Printer class="h-3.5 w-3.5" />
				<span class="hidden sm:inline">Print Profile</span>
			</button>

			<a
				href="/employees"
				class="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-all shadow-2xs"
			>
				<ArrowLeft class="h-3.5 w-3.5" />
				<span>Directory</span>
			</a>
		</div>
	</div>

	<!-- Main Odoo-Style Profile Card -->
	<section class="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs relative overflow-hidden">
		<!-- Top Ambient Gradient Accent -->
		<div class="pointer-events-none absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

		<div class="flex flex-col md:flex-row md:items-start justify-between gap-6 pt-2">
			<!-- Left: Avatar & Identity Details -->
			<div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
				<!-- High-Res Avatar with Dynamic Presence Dot -->
				<div class="relative shrink-0">
					<img
						src={employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.firstName + ' ' + employee.lastName)}&background=6366f1&color=fff`}
						alt="{employee.firstName} {employee.lastName}"
						class="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover ring-4 ring-background shadow-md border border-border"
					/>

					<!-- Presence Status Dot Badge -->
					{#if presenceStatus === 'present'}
						<span
							class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-background ring-2 ring-emerald-500/20 shadow-xs"
							title="Presence Status: Checked In & Active"
						>
							<span class="relative flex h-3.5 w-3.5">
								<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
								<span class="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500"></span>
							</span>
						</span>
					{:else if presenceStatus === 'on_leave'}
						<span
							class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 ring-2 ring-amber-500/30 text-amber-600 shadow-xs"
							title="Presence Status: On Approved Leave"
						>
							<Plane class="h-3.5 w-3.5" />
						</span>
					{:else}
						<span
							class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 ring-2 ring-border text-muted-foreground shadow-xs"
							title="Presence Status: Absent / Off Duty"
						>
							<CircleDot class="h-3.5 w-3.5" />
						</span>
					{/if}
				</div>

				<!-- Name, Title, Badges -->
				<div class="space-y-2.5">
					<div class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
						<h1 class="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
							{employee.firstName} {employee.lastName}
						</h1>

						<!-- Dynamic Employee ID Badge (with copy button) -->
						<button
							type="button"
							onclick={() => copyId(employee.id)}
							class="group inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-mono font-bold text-primary hover:bg-primary/10 transition-all shadow-2xs"
							title="Click to copy Employee ID ({employee.id})"
						>
							<span>{employee.id}</span>
							{#if copiedId}
								<Check class="h-3 w-3 text-emerald-600 animate-in zoom-in-50" />
							{:else}
								<Copy class="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
							{/if}
						</button>
					</div>

					<!-- Role and Department Pill Row -->
					<div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
						<span class="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/60 px-2.5 py-1 font-semibold text-foreground">
							<Briefcase class="h-3 w-3 text-primary" />
							<span>{employee.jobTitle}</span>
						</span>

						<span class="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-2.5 py-1 font-medium text-muted-foreground">
							<Building2 class="h-3 w-3 text-primary/70" />
							<span>{employee.department}</span>
						</span>

						<!-- Presence Label Pill -->
						{#if presenceStatus === 'present'}
							<span class="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs">
								<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
								<span>Present Today</span>
							</span>
						{:else if presenceStatus === 'on_leave'}
							<span class="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 text-xs">
								<Plane class="h-3 w-3" />
								<span>On Approved Leave</span>
							</span>
						{:else}
							<span class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1 font-medium text-muted-foreground text-xs">
								<CircleDot class="h-3 w-3" />
								<span>Off Duty / Absent</span>
							</span>
						{/if}
					</div>

					<!-- Direct Contact Row -->
					<div class="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-1">
						{#if employee.email}
							<a
								href="mailto:{employee.email}"
								class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
							>
								<Mail class="h-3.5 w-3.5 text-primary" />
								<span>{employee.email}</span>
							</a>
						{/if}

						{#if employee.phone}
							<a
								href="tel:{employee.phone}"
								class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
							>
								<Phone class="h-3.5 w-3.5 text-primary" />
								<span>{employee.phone}</span>
							</a>
						{/if}

						<div class="inline-flex items-center gap-1.5 text-muted-foreground">
							<Calendar class="h-3.5 w-3.5 text-primary/70" />
							<span>{tenureString()}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Right: Quick Stat Chips / Smart Buttons (Odoo Pattern) -->
			<div class="flex flex-row md:flex-col items-center sm:items-end justify-center gap-2 shrink-0 pt-2 md:pt-0">
				{#if manager}
					<a
						href="/employees/{manager.id}"
						class="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 p-2 text-xs transition-colors"
						title="Reports to {manager.firstName} {manager.lastName}"
					>
						<img
							src={manager.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(manager.firstName + ' ' + manager.lastName)}&background=6366f1&color=fff`}
							alt="{manager.firstName}"
							class="h-7 w-7 rounded-lg object-cover ring-1 ring-border"
						/>
						<div class="text-left hidden sm:block">
							<div class="text-[10px] text-muted-foreground leading-tight">Manager</div>
							<div class="font-bold text-foreground text-xs">{manager.firstName} {manager.lastName}</div>
						</div>
					</a>
				{/if}

				<div class="rounded-xl border border-border/70 bg-muted/20 px-3 py-1.5 text-center text-xs">
					<div class="text-[10px] text-muted-foreground uppercase font-semibold">Direct Reports</div>
					<div class="font-bold text-foreground text-sm">{subordinates.length}</div>
				</div>
			</div>
		</div>

		<!-- Odoo Tab Bar Navigation -->
		<div class="mt-8 border-b border-border/80 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
			{#each tabs as tab (tab.id)}
				{@const active = activeTab === tab.id}
				{@const TabIcon = tab.icon}
				<button
					type="button"
					onclick={() => (activeTab = tab.id)}
					class="relative flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all rounded-t-lg {active
						? 'text-primary font-bold bg-muted/40'
						: 'text-muted-foreground hover:text-foreground hover:bg-muted/20'}"
				>
					<TabIcon class="h-4 w-4 {active ? 'text-primary' : 'text-muted-foreground'}" />
					<span>{tab.label}</span>

					{#if tab.restricted}
						<span class="rounded bg-primary/10 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/20">
							RBAC
						</span>
					{/if}

					{#if active}
						<!-- Active Underline Indicator -->
						<span class="absolute -bottom-px left-0 right-0 h-0.5 bg-primary rounded-full animate-in fade-in-0 duration-200"></span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Tab Content Panes -->
		<div class="mt-6">
			{#if activeTab === 'about'}
				<AboutTab {employee} {manager} {subordinates} />
			{:else if activeTab === 'resume'}
				<ResumeTab {employee} />
			{:else if activeTab === 'private'}
				<PrivateInfoTab {employee} />
			{:else if activeTab === 'salary'}
				<SalaryInfoTab {employee} />
			{/if}
		</div>
	</section>
</div>
