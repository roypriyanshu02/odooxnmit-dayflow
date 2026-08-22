<script lang="ts">
	import { page } from '$app/state';
	import { palette } from '$lib/state/palette.svelte';
	import RoleSwitcher from './RoleSwitcher.svelte';
	import SystrayStopwatch from '$lib/components/attendance/SystrayStopwatch.svelte';
	import type { Component } from 'svelte';
	import {
		LayoutDashboard,
		Users,
		Clock,
		CalendarDays,
		ReceiptText,
		Search,
		Timer,
		Command,
		Menu,
		X,
		Sparkles,
		Flame,
		CheckCircle2,
		Layers
	} from '@lucide/svelte';

	let mobileMenuOpen = $state(false);

	// Systray attendance widget simulated state
	let isCheckedIn = $state(true);
	let elapsedMinutes = $state(264); // 4h 24m

	const formatTimer = $derived(() => {
		const hours = Math.floor(elapsedMinutes / 60);
		const mins = elapsedMinutes % 60;
		return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
	});

	interface NavLink {
		href: string;
		label: string;
		icon: Component<any>;
	}

	const navLinks: NavLink[] = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/employees', label: 'Employees', icon: Users },
		{ href: '/attendance', label: 'Attendance', icon: Clock },
		{ href: '/leaves', label: 'Time Off', icon: CalendarDays },
		{ href: '/payroll', label: 'Payroll', icon: ReceiptText }
	];

	function isRouteActive(href: string): boolean {
		const currentPath: string = page.url.pathname;
		if (href === '/dashboard' && (currentPath === '/' || currentPath === '/dashboard')) {
			return true;
		}
		return currentPath.startsWith(href);
	}

	function toggleAttendance() {
		isCheckedIn = !isCheckedIn;
	}
</script>

<header class="sticky top-0 z-40 w-full border-b border-border/80 bg-card/90 backdrop-blur-md transition-all">
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Left: Brand Logo & Navigation Links -->
		<div class="flex items-center gap-6 md:gap-8">
			<!-- Brand Logo -->
			<a
				href="/dashboard"
				class="group flex items-center gap-2.5 transition-transform hover:scale-[1.02] focus:outline-hidden"
			>
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20 ring-1 ring-purple-400/30">
					<Layers class="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
				</div>
				<div class="flex flex-col">
					<div class="flex items-center gap-1.5 leading-none">
						<span class="font-bold text-foreground tracking-tight text-base font-sans">Dayflow</span>
						<span class="rounded bg-primary/10 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/20">HRMS</span>
					</div>
					<span class="text-[10px] text-muted-foreground font-medium">Enterprise Suite</span>
				</div>
			</a>

			<!-- Desktop Nav Tabs -->
			<nav class="hidden md:flex items-center gap-1">
				{#each navLinks as link (link.href)}
					{@const active = isRouteActive(link.href)}
					{@const LinkIcon = link.icon}
					<a
						href={link.href}
						class="group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {active
							? 'bg-accent text-accent-foreground shadow-2xs font-bold'
							: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
					>
						<LinkIcon
							class="h-3.5 w-3.5 transition-colors {active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}"
						/>
						<span>{link.label}</span>

						{#if active}
							<!-- Subtle Active bottom indicator line -->
							<span class="absolute -bottom-[9px] left-2 right-2 h-0.5 rounded-full bg-primary animate-in fade-in-0 duration-200"></span>
						{/if}
					</a>
				{/each}
			</nav>
		</div>

		<!-- Right: Command Palette Trigger, Systray Attendance Stopwatch, Role Switcher -->
		<div class="flex items-center gap-2 sm:gap-3">
			<!-- Quick Search / Command Palette Button -->
			<button
				type="button"
				class="hidden sm:flex items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
				onclick={() => palette.open()}
				title="Search modules & actions (Cmd+K / Ctrl+K)"
			>
				<Search class="h-3.5 w-3.5 text-muted-foreground" />
				<span class="font-normal text-muted-foreground">Search...</span>
				<kbd class="flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground shadow-2xs">
					<Command class="h-2.5 w-2.5" /> K
				</kbd>
			</button>

			<!-- Live Systray Attendance Stopwatch Widget -->
			<SystrayStopwatch />

			<!-- Embedded Role Switcher Component -->
			<RoleSwitcher />

			<!-- Mobile Menu Toggle Button -->
			<button
				type="button"
				class="flex md:hidden items-center justify-center rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Toggle Navigation Menu"
			>
				{#if mobileMenuOpen}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Drawer Menu -->
	{#if mobileMenuOpen}
		<div class="border-b border-border bg-card px-4 py-3 md:hidden animate-in slide-in-from-top-2 duration-150">
			<!-- Mobile Search Trigger -->
			<button
				type="button"
				class="flex w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground mb-3"
				onclick={() => {
					mobileMenuOpen = false;
					palette.open();
				}}
			>
				<div class="flex items-center gap-2">
					<Search class="h-4 w-4" />
					<span>Search modules or commands...</span>
				</div>
				<kbd class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
			</button>

			<!-- Mobile Nav Links -->
			<div class="space-y-1">
				{#each navLinks as link (link.href)}
					{@const active = isRouteActive(link.href)}
					{@const LinkIcon = link.icon}
					<a
						href={link.href}
						class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors {active
							? 'bg-accent text-accent-foreground font-semibold'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
						onclick={() => (mobileMenuOpen = false)}
					>
						<LinkIcon class="h-4 w-4 {active ? 'text-primary' : 'text-muted-foreground'}" />
						<span>{link.label}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</header>
