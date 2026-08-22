<script lang="ts">
	import { auth, DEMO_USERS, type DemoUser } from '$lib/state/auth.svelte';
	import type { UserRole } from '$lib/types';
	import { 
		ShieldCheck, 
		UserCheck, 
		User as UserIcon, 
		ChevronDown, 
		Check, 
		Sparkles,
		Building2,
		Shield
	} from '@lucide/svelte';

	let isOpen = $state(false);
	let menuRef = $state<HTMLDivElement | null>(null);

	const currentUser = $derived(auth.user);

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function handleSelect(user: DemoUser) {
		auth.setUser(user);
		isOpen = false;
	}

	function getRoleConfig(role: UserRole) {
		switch (role) {
			case 'admin':
				return {
					label: 'Admin',
					badgeClass: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/80',
					activeDotClass: 'bg-purple-500',
					avatarClass: 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white',
					icon: ShieldCheck
				};
			case 'hr':
				return {
					label: 'HR Officer',
					badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80',
					activeDotClass: 'bg-emerald-500',
					avatarClass: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white',
					icon: UserCheck
				};
			case 'employee':
			default:
				return {
					label: 'Employee',
					badgeClass: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/80',
					activeDotClass: 'bg-sky-500',
					avatarClass: 'bg-gradient-to-br from-blue-600 to-cyan-700 text-white',
					icon: UserIcon
				};
		}
	}

	const currentRoleConfig = $derived(getRoleConfig(currentUser.role));
	const ActiveRoleIcon = $derived(currentRoleConfig.icon);

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			closeDropdown();
		}
	}

	function handleWindowClick(event: MouseEvent) {
		if (isOpen && menuRef && !menuRef.contains(event.target as Node)) {
			closeDropdown();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} onclick={handleWindowClick} />

<div class="relative inline-block text-left" bind:this={menuRef}>
	<!-- Trigger Button -->
	<button
		type="button"
		class="group flex items-center gap-2.5 rounded-full border border-border bg-card/80 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-xs backdrop-blur-xs transition-all hover:border-border/80 hover:bg-accent/60 focus:outline-hidden focus:ring-2 focus:ring-ring"
		onclick={toggleDropdown}
		aria-haspopup="true"
		aria-expanded={isOpen}
		title="Switch Active Persona / Role"
	>
		<!-- Avatar / Initials with Status Dot -->
		<div class="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-xs {currentRoleConfig.avatarClass}">
			<span>{currentUser.initials}</span>
			<span class="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-background {currentRoleConfig.activeDotClass}"></span>
		</div>

		<!-- User details (visible on md screens and up) -->
		<div class="hidden flex-col items-start text-left sm:flex">
			<div class="flex items-center gap-1.5">
				<span class="font-semibold text-foreground tracking-tight text-[13px]">{currentUser.name}</span>
			</div>
			<div class="flex items-center gap-1">
				<span class="text-[11px] text-muted-foreground">{currentUser.jobTitle}</span>
			</div>
		</div>

		<!-- Role Badge -->
		<span class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider {currentRoleConfig.badgeClass}">
			<ActiveRoleIcon class="h-3 w-3" />
			{currentRoleConfig.label}
		</span>

		<ChevronDown
			class="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 {isOpen ? 'rotate-180 text-foreground' : 'group-hover:text-foreground'}"
		/>
	</button>

	<!-- Dropdown Popover -->
	{#if isOpen}
		<div
			class="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-xl border border-border bg-popover/95 p-1.5 text-popover-foreground shadow-xl backdrop-blur-md transition-all focus:outline-hidden animate-in fade-in-0 zoom-in-95"
			role="menu"
			aria-orientation="vertical"
			tabindex="-1"
		>
			<!-- Header -->
			<div class="border-b border-border/80 px-3 py-2.5">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
						<Sparkles class="h-3.5 w-3.5 text-amber-500" />
						<span>Demo Persona Switcher</span>
					</div>
					<span class="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Live Preview</span>
				</div>
				<p class="mt-1 text-[11px] text-muted-foreground leading-snug">
					Select a simulated persona to instantly experience role-based capabilities and access tiers.
				</p>
			</div>

			<!-- User List -->
			<div class="py-1" role="none">
				{#each DEMO_USERS as user (user.id)}
					{@const config = getRoleConfig(user.role)}
					{@const isSelected = user.id === currentUser.id}
					<button
						type="button"
						class="group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-accent focus:bg-accent focus:outline-hidden {isSelected ? 'bg-accent/70' : ''}"
						onclick={() => handleSelect(user)}
						role="menuitem"
						tabindex="-1"
					>
						<div class="flex items-center gap-2.5 min-w-0">
							<div class="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold {config.avatarClass}">
								<span>{user.initials}</span>
								{#if isSelected}
									<span class="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-background bg-emerald-500"></span>
								{/if}
							</div>
							<div class="flex flex-col min-w-0">
								<div class="flex items-center gap-1.5">
									<span class="font-medium text-foreground truncate">{user.name}</span>
								</div>
								<span class="text-[11px] text-muted-foreground truncate">{user.jobTitle}</span>
								<span class="text-[10px] text-muted-foreground/70 truncate">{user.email}</span>
							</div>
						</div>

						<div class="flex items-center gap-2 shrink-0 ml-2">
							<span class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium {config.badgeClass}">
								{config.label}
							</span>
							{#if isSelected}
								<Check class="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
							{:else}
								<div class="w-4 shrink-0"></div>
							{/if}
						</div>
					</button>
				{/each}
			</div>

			<!-- Footer info -->
			<div class="border-t border-border/70 px-3 py-2 text-[10px] text-muted-foreground bg-muted/30 rounded-b-lg flex items-center justify-between">
				<span class="flex items-center gap-1">
					<Shield class="h-3 w-3 text-muted-foreground" />
					Zero login needed for demo
				</span>
				<span class="font-mono text-[9px] uppercase tracking-wider bg-background px-1.5 py-0.5 rounded border border-border">Svelte 5</span>
			</div>
		</div>
	{/if}
</div>
