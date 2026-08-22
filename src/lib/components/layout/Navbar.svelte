<script lang="ts">
	import { page } from '$app/state';
	import { palette } from '$lib/state/palette.svelte';
	import RoleSwitcher from './RoleSwitcher.svelte';
	import SystrayStopwatch from '$lib/components/attendance/SystrayStopwatch.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { Component } from 'svelte';
	import {
		LayoutDashboard,
		Users,
		Clock,
		CalendarDays,
		ReceiptText,
		Search,
		Command,
		Menu,
		X
	} from '@lucide/svelte';

	let mobileMenuOpen = $state(false);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && mobileMenuOpen) {
			mobileMenuOpen = false;
		}
	}

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
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Left: Navigation Links -->
		<div class="flex items-center gap-6 md:gap-8">
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
			<Button
				variant="outline"
				size="sm"
				class="hidden sm:flex items-center gap-2 h-8 px-2.5 text-xs text-muted-foreground font-normal bg-muted/40 hover:bg-muted"
				onclick={() => palette.open()}
				title="Search modules & actions (Cmd+K / Ctrl+K)"
			>
				<Search class="h-3.5 w-3.5 text-muted-foreground" />
				<span class="font-normal text-muted-foreground">Search...</span>
				<kbd class="flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground shadow-2xs">
					<Command class="h-2.5 w-2.5" /> K
				</kbd>
			</Button>

			<!-- Live Systray Attendance Stopwatch Widget -->
			<SystrayStopwatch />

			<!-- Embedded Role Switcher Component -->
			<RoleSwitcher />

			<!-- Mobile Menu Toggle Button -->
			<Button
				variant="outline"
				size="icon-sm"
				class="flex md:hidden"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Toggle Navigation Menu"
			>
				{#if mobileMenuOpen}
					<X class="h-4 w-4" />
				{:else}
					<Menu class="h-4 w-4" />
				{/if}
			</Button>
		</div>
	</div>

	<!-- Mobile Drawer Menu -->
	{#if mobileMenuOpen}
		<div class="border-b border-border bg-card px-4 py-3 md:hidden animate-in slide-in-from-top-2 duration-150">
			<!-- Mobile Search Trigger -->
			<Button
				variant="outline"
				class="w-full justify-between h-9 text-xs text-muted-foreground mb-3 font-normal"
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
			</Button>

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
