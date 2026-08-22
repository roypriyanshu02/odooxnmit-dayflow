<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, DEMO_USERS } from '$lib/state/auth.svelte';
	import { palette } from '$lib/state/palette.svelte';
	import type { UserRole } from '$lib/types';
	import type { Component } from 'svelte';
	import {
		Search,
		LayoutDashboard,
		Users,
		Clock,
		CalendarDays,
		ReceiptText,
		Sparkles,
		CheckCircle2,
		ShieldCheck,
		UserCheck,
		User as UserIcon,
		FileText,
		ArrowRight,
		X,
		Command,
		CornerDownLeft,
		PlusCircle,
		LogOut,
		Timer
	} from '@lucide/svelte';

	interface CommandItem {
		id: string;
		title: string;
		subtitle?: string;
		category: 'navigation' | 'actions' | 'roles';
		icon: Component<any>;
		shortcut?: string;
		badge?: string;
		action: () => void;
	}

	let searchQuery = $state('');
	let selectedIndex = $state(0);
	let searchInputRef = $state<HTMLInputElement | null>(null);

	const isOpen = $derived(palette.isOpen);

	const allCommands = $derived<CommandItem[]>([
		// Navigation items
		{
			id: 'nav-dashboard',
			title: 'Go to Dashboard',
			subtitle: 'KPIs, attendance metrics & department analytics',
			category: 'navigation',
			icon: LayoutDashboard,
			shortcut: 'G D',
			action: () => navigateTo('/dashboard')
		},
		{
			id: 'nav-employees',
			title: 'Go to Employee Directory',
			subtitle: 'Employee profiles, org hierarchy, skills & compensation',
			category: 'navigation',
			icon: Users,
			shortcut: 'G E',
			action: () => navigateTo('/employees')
		},
		{
			id: 'nav-attendance',
			title: 'Go to Attendance & Time Tracking',
			subtitle: 'Daily check-ins, break management, overtime & logs',
			category: 'navigation',
			icon: Clock,
			shortcut: 'G A',
			action: () => navigateTo('/attendance')
		},
		{
			id: 'nav-leaves',
			title: 'Go to Time Off & Leaves',
			subtitle: 'Leave requests, approval queue, balances & calendar',
			category: 'navigation',
			icon: CalendarDays,
			shortcut: 'G L',
			action: () => navigateTo('/leaves')
		},
		{
			id: 'nav-payroll',
			title: 'Go to Payroll & Compensation',
			subtitle: 'Salary structures, monthly payslips & breakdown batches',
			category: 'navigation',
			icon: ReceiptText,
			shortcut: 'G P',
			action: () => navigateTo('/payroll')
		},

		// Quick Actions
		{
			id: 'act-checkin',
			title: 'Check In / Out Now',
			subtitle: 'Quickly toggle your current attendance session',
			category: 'actions',
			icon: Timer,
			badge: 'Quick Action',
			action: () => navigateTo('/attendance?action=toggle')
		},
		{
			id: 'act-apply-leave',
			title: 'Apply for Leave',
			subtitle: 'Submit a new PTO, Sick Leave, or Unpaid Leave request',
			category: 'actions',
			icon: PlusCircle,
			badge: 'Time Off',
			action: () => navigateTo('/leaves?action=apply')
		},
		{
			id: 'act-payslip',
			title: 'View My Latest Payslip',
			subtitle: 'Inspect earnings, deductions, PF, and tax breakdown',
			category: 'actions',
			icon: FileText,
			badge: 'Salary',
			action: () => navigateTo('/payroll?view=latest')
		},
		{
			id: 'act-new-employee',
			title: 'Create Employee Profile',
			subtitle: 'Onboard a new team member into the directory',
			category: 'actions',
			icon: Users,
			badge: 'Admin / HR',
			action: () => navigateTo('/employees?action=new')
		},

		// Switch Demo Roles
		{
			id: 'role-admin',
			title: 'Switch Persona: Priyanshu Roy',
			subtitle: 'Role: System Administrator (Executive & IT)',
			category: 'roles',
			icon: ShieldCheck,
			badge: 'Admin',
			action: () => switchRole('admin')
		},
		{
			id: 'role-hr',
			title: 'Switch Persona: Arnav Kini',
			subtitle: 'Role: HR Officer (People Operations)',
			category: 'roles',
			icon: UserCheck,
			badge: 'HR Officer',
			action: () => switchRole('hr')
		},
		{
			id: 'role-employee',
			title: 'Switch Persona: Sanchit Kumar Pandey',
			subtitle: 'Role: Senior Full Stack Engineer (Engineering)',
			category: 'roles',
			icon: UserIcon,
			badge: 'Employee',
			action: () => switchRole('employee')
		}
	]);

	const filteredCommands = $derived.by(() => {
		const q = searchQuery.toLowerCase().trim();
		if (!q) return allCommands;
		return allCommands.filter(
			(cmd) =>
				cmd.title.toLowerCase().includes(q) ||
				(cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
				cmd.category.toLowerCase().includes(q) ||
				(cmd.badge && cmd.badge.toLowerCase().includes(q))
		);
	});

	// Reset selectedIndex whenever filtered results change
	$effect(() => {
		if (filteredCommands.length > 0 && selectedIndex >= filteredCommands.length) {
			selectedIndex = 0;
		}
	});

	// Focus input when modal opens
	$effect(() => {
		if (isOpen) {
			searchQuery = '';
			selectedIndex = 0;
			setTimeout(() => {
				searchInputRef?.focus();
			}, 30);
		}
	});

	function navigateTo(url: string) {
		palette.close();
		goto(url);
	}

	function switchRole(role: UserRole) {
		auth.switchUser(role);
		palette.close();
	}

	function executeSelected() {
		if (filteredCommands.length > 0 && filteredCommands[selectedIndex]) {
			filteredCommands[selectedIndex].action();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		// Global shortcut toggle Cmd+K or Ctrl+K
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			palette.toggle();
			return;
		}

		if (!isOpen) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			palette.close();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = (selectedIndex + 1) % Math.max(1, filteredCommands.length);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = (selectedIndex - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			executeSelected();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop Blur Overlay -->
	<div
		class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in-0"
		onclick={() => palette.close()}
		role="presentation"
	></div>

	<!-- Modal Container -->
	<div class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20">
		<div
			class="w-full max-w-2xl transform overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl transition-all focus:outline-hidden animate-in fade-in-0 zoom-in-95"
			role="dialog"
			aria-modal="true"
			aria-label="Command Palette"
			tabindex="-1"
		>
			<!-- Search Bar -->
			<div class="flex items-center border-b border-border/80 px-4 py-3.5">
				<Search class="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
				<input
					bind:this={searchInputRef}
					bind:value={searchQuery}
					type="text"
					placeholder="Type a command or search modules, actions, personas..."
					class="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-hidden"
				/>
				{#if searchQuery}
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground p-1 rounded-md"
						onclick={() => (searchQuery = '')}
					>
						<X class="h-4 w-4" />
					</button>
				{/if}
				<kbd class="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground font-semibold ml-2">
					ESC
				</kbd>
			</div>

			<!-- Command List -->
			<div class="max-h-[380px] overflow-y-auto p-2">
				{#if filteredCommands.length === 0}
					<div class="py-12 text-center text-sm text-muted-foreground">
						<Search class="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
						<p class="font-medium text-foreground">No matching commands or routes found</p>
						<p class="text-xs text-muted-foreground mt-1">Try searching for "attendance", "leaves", "payslip", or "admin"</p>
					</div>
				{:else}
					<!-- Render Grouped Items -->
					{@const navGroup = filteredCommands.filter((c) => c.category === 'navigation')}
					{@const actGroup = filteredCommands.filter((c) => c.category === 'actions')}
					{@const roleGroup = filteredCommands.filter((c) => c.category === 'roles')}

					{#if navGroup.length > 0}
						<div class="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
							Navigation
						</div>
						{#each navGroup as cmd (cmd.id)}
							{@const overallIndex = filteredCommands.findIndex((c) => c.id === cmd.id)}
							{@const isSelected = overallIndex === selectedIndex}
							{@const CmdIcon = cmd.icon}
							<button
								type="button"
								class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all {isSelected
									? 'bg-primary text-primary-foreground shadow-xs'
									: 'text-foreground hover:bg-accent/80'}"
								onclick={() => cmd.action()}
								onmouseenter={() => (selectedIndex = overallIndex)}
							>
								<div class="flex items-center gap-3 min-w-0">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border {isSelected
											? 'border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground'
											: 'border-border bg-muted/50 text-foreground'}"
									>
										<CmdIcon class="h-4 w-4" />
									</div>
									<div class="flex flex-col min-w-0">
										<span class="font-medium truncate">{cmd.title}</span>
										{#if cmd.subtitle}
											<span class="text-xs truncate {isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}">
												{cmd.subtitle}
											</span>
										{/if}
									</div>
								</div>

								<div class="flex items-center gap-2 shrink-0 ml-2">
									{#if cmd.shortcut}
										<span
											class="font-mono text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 {isSelected
												? 'bg-primary-foreground/20 text-primary-foreground'
												: 'bg-muted text-muted-foreground border border-border'}"
										>
											{cmd.shortcut}
										</span>
									{/if}
									{#if isSelected}
										<CornerDownLeft class="h-3.5 w-3.5 opacity-80" />
									{/if}
								</div>
							</button>
						{/each}
					{/if}

					{#if actGroup.length > 0}
						<div class="mt-2.5 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
							Quick Actions
						</div>
						{#each actGroup as cmd (cmd.id)}
							{@const overallIndex = filteredCommands.findIndex((c) => c.id === cmd.id)}
							{@const isSelected = overallIndex === selectedIndex}
							{@const CmdIcon = cmd.icon}
							<button
								type="button"
								class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all {isSelected
									? 'bg-primary text-primary-foreground shadow-xs'
									: 'text-foreground hover:bg-accent/80'}"
								onclick={() => cmd.action()}
								onmouseenter={() => (selectedIndex = overallIndex)}
							>
								<div class="flex items-center gap-3 min-w-0">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border {isSelected
											? 'border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground'
											: 'border-border bg-muted/50 text-foreground'}"
									>
										<CmdIcon class="h-4 w-4" />
									</div>
									<div class="flex flex-col min-w-0">
										<span class="font-medium truncate">{cmd.title}</span>
										{#if cmd.subtitle}
											<span class="text-xs truncate {isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}">
												{cmd.subtitle}
											</span>
										{/if}
									</div>
								</div>

								<div class="flex items-center gap-2 shrink-0 ml-2">
									{#if cmd.badge}
										<span
											class="text-[10px] font-semibold rounded px-1.5 py-0.5 {isSelected
												? 'bg-primary-foreground/20 text-primary-foreground'
												: 'bg-primary/10 text-primary'}"
										>
											{cmd.badge}
										</span>
									{/if}
									{#if isSelected}
										<CornerDownLeft class="h-3.5 w-3.5 opacity-80" />
									{/if}
								</div>
							</button>
						{/each}
					{/if}

					{#if roleGroup.length > 0}
						<div class="mt-2.5 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
							Demo Role Switching
						</div>
						{#each roleGroup as cmd (cmd.id)}
							{@const overallIndex = filteredCommands.findIndex((c) => c.id === cmd.id)}
							{@const isSelected = overallIndex === selectedIndex}
							{@const CmdIcon = cmd.icon}
							<button
								type="button"
								class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all {isSelected
									? 'bg-primary text-primary-foreground shadow-xs'
									: 'text-foreground hover:bg-accent/80'}"
								onclick={() => cmd.action()}
								onmouseenter={() => (selectedIndex = overallIndex)}
							>
								<div class="flex items-center gap-3 min-w-0">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border {isSelected
											? 'border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground'
											: 'border-border bg-muted/50 text-foreground'}"
									>
										<CmdIcon class="h-4 w-4" />
									</div>
									<div class="flex flex-col min-w-0">
										<span class="font-medium truncate">{cmd.title}</span>
										{#if cmd.subtitle}
											<span class="text-xs truncate {isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}">
												{cmd.subtitle}
											</span>
										{/if}
									</div>
								</div>

								<div class="flex items-center gap-2 shrink-0 ml-2">
									{#if cmd.badge}
										<span
											class="text-[10px] font-semibold rounded px-1.5 py-0.5 {isSelected
												? 'bg-primary-foreground/20 text-primary-foreground'
												: 'bg-muted text-muted-foreground border border-border'}"
										>
											{cmd.badge}
										</span>
									{/if}
									{#if isSelected}
										<CornerDownLeft class="h-3.5 w-3.5 opacity-80" />
									{/if}
								</div>
							</button>
						{/each}
					{/if}
				{/if}
			</div>

			<!-- Footer Helper -->
			<div class="flex items-center justify-between border-t border-border/80 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
				<div class="flex items-center gap-4">
					<span class="flex items-center gap-1">
						<kbd class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold">↑</kbd>
						<kbd class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold">↓</kbd>
						Navigate
					</span>
					<span class="flex items-center gap-1">
						<kbd class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold">↵</kbd>
						Select
					</span>
					<span class="flex items-center gap-1">
						<kbd class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold">ESC</kbd>
						Close
					</span>
				</div>
				<div class="flex items-center gap-1 text-[11px]">
					<Sparkles class="h-3 w-3 text-amber-500" />
					<span>Dayflow HRMS</span>
				</div>
			</div>
		</div>
	</div>
{/if}
