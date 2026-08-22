<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import CommandPalette from '$lib/components/layout/CommandPalette.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Dayflow HRMS | Enterprise Human Resource Suite</title>
	<meta name="description" content="Dayflow HRMS - Odoo-inspired human resource management system featuring employee directory, attendance time tracking, leave approvals, and payroll processing." />
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col bg-slate-50/50 text-foreground antialiased dark:bg-zinc-950 selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-300">
	<!-- Global Enterprise Navbar -->
	<Navbar />

	<!-- Main Viewport Content Area -->
	<main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{@render children()}
	</main>

	<!-- Global Command Palette Modal Skeleton -->
	<CommandPalette />
</div>
