<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import CommandPalette from '$lib/components/layout/CommandPalette.svelte';
	import KeyboardShortcutsModal from '$lib/components/layout/KeyboardShortcutsModal.svelte';
	import { goto } from '$app/navigation';
	import { palette } from '$lib/state/palette.svelte';
	import { attendanceState } from '$lib/state/attendance.svelte';
	import { isInputElement } from '$lib/utils/keyboard-shortcuts';

	let { children } = $props();
	let isShortcutsModalOpen = $state(false);

	function handleGlobalKeydown(e: KeyboardEvent) {
		// If user is actively typing in an input/textarea, do not trigger navigation shortcuts
		if (isInputElement(e.target)) {
			return;
		}

		// Cmd / Ctrl + K: Command palette
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			palette.open();
			return;
		}

		// Shift + / or ?: Shortcuts Cheat Sheet
		if (e.key === '?' && !e.altKey && !e.ctrlKey && !e.metaKey) {
			e.preventDefault();
			isShortcutsModalOpen = true;
			return;
		}

		// Alt + Key combinations
		if (e.altKey && !e.ctrlKey && !e.metaKey) {
			const k = e.key.toLowerCase();
			if (k === 'd') {
				e.preventDefault();
				goto('/dashboard');
			} else if (k === 'e') {
				e.preventDefault();
				goto('/employees');
			} else if (k === 'a') {
				e.preventDefault();
				goto('/attendance');
			} else if (k === 'l') {
				e.preventDefault();
				goto('/leaves');
			} else if (k === 'p') {
				e.preventDefault();
				goto('/payroll');
			} else if (k === 'c') {
				e.preventDefault();
				attendanceState.toggleCheckIn();
			} else if (k === 'b') {
				e.preventDefault();
				attendanceState.toggleBreak();
			}
		}
	}
</script>

<svelte:head>
	<title>Dayflow HRMS | Enterprise Human Resource Suite</title>
	<meta name="description" content="Dayflow HRMS - Odoo-inspired human resource management system featuring employee directory, attendance time tracking, leave approvals, and payroll processing." />
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="flex min-h-screen flex-col bg-slate-50/50 text-foreground antialiased dark:bg-zinc-950 selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-300">
	<!-- Global Enterprise Navbar -->
	<Navbar />

	<!-- Main Viewport Content Area -->
	<main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{@render children()}
	</main>

	<!-- Global Command Palette Modal -->
	<CommandPalette />

	<!-- Global Keyboard Shortcuts Modal -->
	<KeyboardShortcutsModal
		open={isShortcutsModalOpen}
		onClose={() => (isShortcutsModalOpen = false)}
	/>
</div>
