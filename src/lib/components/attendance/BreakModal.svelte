<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AttendanceBreak } from '$lib/types';
	import {
		BREAK_PRESETS,
		BREAK_THRESHOLD_MINUTES,
		calculateBreakDuration,
		formatStopwatch,
		formatDurationHuman,
		getBreakElapsedSeconds,
		isBreakExceededThreshold,
		type BreakPreset
	} from '$lib/utils/break';
	import {
		Coffee,
		Utensils,
		Armchair,
		Sliders,
		Play,
		Square,
		Clock,
		AlertTriangle,
		AlertCircle,
		X,
		Check,
		Timer,
		Sparkles,
		Flame,
		CircleDot
	} from '@lucide/svelte';

	interface Props {
		open?: boolean;
		employeeId?: string;
		activeBreak?: AttendanceBreak | null;
		onStart?: (breakRecord: AttendanceBreak) => void;
		onEnd?: (breakRecord: AttendanceBreak, durationMinutes: number) => void;
		onClose?: () => void;
	}

	let {
		open = $bindable(false),
		employeeId = 'OIROVE20260003', // Demo employee default
		activeBreak = $bindable(null),
		onStart,
		onEnd,
		onClose
	}: Props = $props();

	// Local State
	let selectedPresetId = $state<'coffee' | 'lunch' | 'rest' | 'custom'>('coffee');
	let customMinutes = $state<number>(20);
	let customReason = $state<string>('');
	let elapsedSeconds = $state<number>(0);
	let isSubmitting = $state<boolean>(false);
	let errorMessage = $state<string | null>(null);
	let timerInterval = $state<ReturnType<typeof setInterval> | null>(null);

	// Derived State
	const isActiveBreak = $derived(Boolean(activeBreak && !activeBreak.endTime));
	const selectedPreset = $derived(
		BREAK_PRESETS.find((p) => p.id === selectedPresetId) || BREAK_PRESETS[0]
	);

	const targetMinutes = $derived(
		selectedPresetId === 'custom' ? Math.max(1, customMinutes || 1) : selectedPreset.durationMinutes
	);

	const targetSeconds = $derived(targetMinutes * 60);

	const isOverThreshold = $derived(
		elapsedSeconds >= BREAK_THRESHOLD_MINUTES * 60 ||
			(activeBreak?.startTime ? isBreakExceededThreshold(activeBreak.startTime) : false)
	);

	const formattedElapsed = $derived(formatStopwatch(elapsedSeconds));

	const progressPercent = $derived(
		Math.min(100, Math.round((elapsedSeconds / Math.max(1, targetSeconds)) * 100))
	);

	const effectiveReason = $derived(
		selectedPresetId === 'custom'
			? customReason.trim() || 'Custom Break'
			: selectedPreset.label
	);

	// Helper icon component resolver
	function getPresetIcon(iconName: string) {
		switch (iconName) {
			case 'Coffee':
				return Coffee;
			case 'Utensils':
				return Utensils;
			case 'Armchair':
				return Armchair;
			case 'Sliders':
			default:
				return Sliders;
		}
	}

	// Calculate and tick stopwatch
	function updateTimer() {
		if (activeBreak?.startTime) {
			elapsedSeconds = getBreakElapsedSeconds(activeBreak.startTime);
		} else {
			elapsedSeconds = 0;
		}
	}

	// Effect to manage live stopwatch interval
	$effect(() => {
		if (isActiveBreak && open) {
			updateTimer();
			if (!timerInterval) {
				timerInterval = setInterval(updateTimer, 1000);
			}
		} else {
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
		}

		return () => {
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
		};
	});

	// Handle Escape key listener
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			handleClose();
		}
	}

	function handleClose() {
		errorMessage = null;
		open = false;
		onClose?.();
	}

	// Start Break API handler
	async function handleStartBreak() {
		isSubmitting = true;
		errorMessage = null;

		try {
			const res = await fetch('/api/attendance/break', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'start',
					employeeId,
					reason: effectiveReason,
					startTime: new Date().toISOString()
				})
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				throw new Error(data.error || 'Failed to start break.');
			}

			activeBreak = data.break;
			elapsedSeconds = 0;
			onStart?.(data.break);
		} catch (err: any) {
			errorMessage = err.message || 'An error occurred while starting break.';
		} finally {
			isSubmitting = false;
		}
	}

	// End Break API handler
	async function handleEndBreak() {
		isSubmitting = true;
		errorMessage = null;

		try {
			const res = await fetch('/api/attendance/break', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'end',
					employeeId,
					breakId: activeBreak?.id,
					endTime: new Date().toISOString()
				})
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				throw new Error(data.error || 'Failed to end break.');
			}

			const endedBreak = data.break;
			const duration = data.durationMinutes || 0;
			activeBreak = null;
			elapsedSeconds = 0;
			onEnd?.(endedBreak, duration);
			handleClose();
		} catch (err: any) {
			errorMessage = err.message || 'An error occurred while ending break.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Modal Backdrop Overlay -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in-0 duration-200"
		role="dialog"
		aria-modal="true"
		aria-labelledby="break-modal-title"
	>
		<!-- Click Outside Surface (closes modal if break is not active, or minimizes) -->
		<div
			class="fixed inset-0 -z-10"
			onclick={handleClose}
			aria-hidden="true"
		></div>

		<!-- Modal Container -->
		<div
			class="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all animate-in zoom-in-95 duration-200"
		>
			<!-- Accent glow header line -->
			<div
				class="h-1.5 w-full {isActiveBreak
					? isOverThreshold
						? 'bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse'
						: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400'
					: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}"
			></div>

			<!-- Header Section -->
			<div class="flex items-center justify-between border-b border-border/70 px-6 py-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-xl transition-colors {isActiveBreak
							? isOverThreshold
								? 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 ring-1 ring-red-500/30'
								: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 ring-1 ring-amber-500/30'
							: 'bg-primary/10 text-primary ring-1 ring-primary/20'}"
					>
						{#if isActiveBreak}
							<Timer class="h-5 w-5 {isOverThreshold ? 'animate-bounce' : 'animate-spin-slow'}" />
						{:else}
							<Coffee class="h-5 w-5" />
						{/if}
					</div>
					<div>
						<h2 id="break-modal-title" class="text-base font-bold text-foreground tracking-tight">
							{isActiveBreak ? 'Active Break in Progress' : 'Start a Break'}
						</h2>
						<p class="text-xs text-muted-foreground">
							{isActiveBreak
								? `Reason: ${activeBreak?.reason || 'Work Pause'}`
								: 'Select a preset or customize your break duration'}
						</p>
					</div>
				</div>

				<!-- Close Button -->
				<button
					type="button"
					onclick={handleClose}
					class="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground transition-all focus:outline-hidden focus:ring-2 focus:ring-ring"
					aria-label="Close modal"
					title="Close (Esc)"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<!-- Modal Body -->
			<div class="px-6 py-5 space-y-5">
				<!-- Error Banner -->
				{#if errorMessage}
					<div
						class="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in-0"
						role="alert"
					>
						<AlertCircle class="h-4 w-4 shrink-0" />
						<span>{errorMessage}</span>
					</div>
				{/if}

				<!-- ACTIVE BREAK STATE: Stopwatch, Threshold Banner, & Progress -->
				{#if isActiveBreak}
					<!-- 1-HOUR THRESHOLD POLICY WARNING BANNER -->
					{#if isOverThreshold}
						<div
							class="relative overflow-hidden rounded-xl border-2 border-red-500/50 bg-red-50/80 dark:bg-red-950/40 p-4 text-red-900 dark:text-red-200 shadow-sm animate-in fade-in-0 slide-in-from-top-1"
							role="alert"
						>
							<div class="flex items-start gap-3">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white shadow-xs">
									<AlertTriangle class="h-4 w-4" />
								</div>
								<div class="space-y-1">
									<h4 class="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
										1-Hour Break Threshold Exceeded
									</h4>
									<p class="text-xs leading-relaxed text-red-800 dark:text-red-200/90 font-medium">
										This break has surpassed the <strong>60-minute policy threshold</strong> ({Math.floor(elapsedSeconds / 60)} minutes elapsed). Please conclude your break and resume your shift or inform your supervisor.
									</p>
								</div>
							</div>
						</div>
					{/if}

					<!-- Stopwatch Timer Display Card -->
					<div
						class="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border p-6 text-center transition-all {isOverThreshold
							? 'border-red-300 bg-red-500/5 dark:border-red-900/60 dark:bg-red-950/20'
							: 'border-amber-200 bg-amber-500/5 dark:border-amber-900/50 dark:bg-amber-950/20'}"
					>
						<!-- Active Status Badge -->
						<div class="mb-3 flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold {isOverThreshold ? 'border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/50 dark:text-red-300' : 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/50 dark:text-amber-300'}">
							<span class="relative flex h-2 w-2">
								<span class="absolute inline-flex h-full w-full animate-ping rounded-full {isOverThreshold ? 'bg-red-400' : 'bg-amber-400'} opacity-75"></span>
								<span class="relative inline-flex h-2 w-2 rounded-full {isOverThreshold ? 'bg-red-500' : 'bg-amber-500'}"></span>
							</span>
							<span>{isOverThreshold ? 'Threshold Alert Active' : 'Break In Progress'}</span>
						</div>

						<!-- Big Stopwatch Readout -->
						<div class="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground select-none">
							{formattedElapsed}
						</div>

						<p class="mt-2 text-xs font-medium text-muted-foreground">
							Started at: <span class="font-mono">{activeBreak?.startTime ? new Date(activeBreak.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Recently'}</span>
						</p>

						<!-- Progress Bar (Elapsed vs 60m Threshold) -->
						<div class="mt-5 w-full space-y-1.5">
							<div class="flex justify-between text-[11px] font-semibold text-muted-foreground">
								<span>Elapsed: {formatDurationHuman(Math.floor(elapsedSeconds / 60))}</span>
								<span>Threshold: 60m</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full transition-all duration-500 {isOverThreshold
										? 'bg-red-500'
										: elapsedSeconds >= 45 * 60
											? 'bg-amber-500'
											: 'bg-emerald-500'}"
									style="width: {Math.min(100, Math.round((elapsedSeconds / 3600) * 100))}%"
								></div>
							</div>
						</div>
					</div>

				<!-- START BREAK STATE: Preset Selector & Custom Controls -->
				{:else}
					<!-- Preset Grid Selection -->
					<div class="space-y-3">
						<div class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Select Break Preset
						</div>

						<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
							{#each BREAK_PRESETS as preset (preset.id)}
								{@const IconComp = getPresetIcon(preset.iconName)}
								{@const isSelected = selectedPresetId === preset.id}

								<button
									type="button"
									onclick={() => (selectedPresetId = preset.id)}
									class="group relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all focus:outline-hidden focus:ring-2 focus:ring-ring {isSelected
										? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-1 ring-primary/30'
										: 'border-border/80 bg-card hover:border-border hover:bg-muted/50'}"
									aria-pressed={isSelected}
								>
									<div class="flex w-full items-center justify-between">
										<div
											class="flex h-7 w-7 items-center justify-center rounded-lg transition-colors {isSelected
												? 'bg-primary text-primary-foreground'
												: 'bg-muted text-muted-foreground group-hover:text-foreground'}"
										>
											<IconComp class="h-3.5 w-3.5" />
										</div>

										<span
											class="rounded-md px-1.5 py-0.5 text-[10px] font-bold {isSelected
												? 'bg-primary/15 text-primary'
												: 'bg-muted text-muted-foreground'}"
										>
											{preset.id === 'custom' ? 'Custom' : `${preset.durationMinutes}m`}
										</span>
									</div>

									<div class="mt-1">
										<div class="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
											{preset.label}
										</div>
										<p class="text-[11px] text-muted-foreground line-clamp-1">
											{preset.description}
										</p>
									</div>

									{#if isSelected}
										<div class="absolute top-2 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
											<Check class="h-2.5 w-2.5" />
										</div>
									{/if}
								</button>
							{/each}
						</div>
					</div>

					<!-- Custom Duration & Reason Inputs if Custom Selected -->
					{#if selectedPresetId === 'custom'}
						<div class="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-3.5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div class="space-y-1">
									<label for="custom-duration" class="text-xs font-medium text-foreground">
										Duration (minutes)
									</label>
									<input
										id="custom-duration"
										type="number"
										min="1"
										max="240"
										bind:value={customMinutes}
										class="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground focus:border-ring focus:outline-hidden focus:ring-2 focus:ring-ring"
									/>
								</div>

								<div class="space-y-1">
									<label for="custom-reason" class="text-xs font-medium text-foreground">
										Break Reason / Note
									</label>
									<input
										id="custom-reason"
										type="text"
										placeholder="e.g. Doctor appointment, errands"
										bind:value={customReason}
										class="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-hidden focus:ring-2 focus:ring-ring"
									/>
								</div>
							</div>
						</div>
					{/if}

					<!-- Policy Reminder Box -->
					<div class="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
						<Clock class="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
						<div class="leading-relaxed">
							<span class="font-semibold text-foreground">Company Attendance Policy:</span>
							Continuous breaks exceeding <strong class="text-foreground">60 minutes</strong> trigger a visual threshold alert. Total break duration is tracked and factored into working hours.
						</div>
					</div>
				{/if}
			</div>

			<!-- Modal Footer Actions -->
			<div class="flex items-center justify-between border-t border-border/70 bg-muted/20 px-6 py-4">
				{#if isActiveBreak}
					<!-- In-progress Footer Actions -->
					<button
						type="button"
						onclick={handleClose}
						class="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-all focus:outline-hidden focus:ring-2 focus:ring-ring"
					>
						Keep Running in Background
					</button>

					<button
						type="button"
						onclick={handleEndBreak}
						disabled={isSubmitting}
						class="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
					>
						{#if isSubmitting}
							<CircleDot class="h-3.5 w-3.5 animate-spin" />
							<span>Ending Break...</span>
						{:else}
							<Square class="h-3.5 w-3.5 fill-current" />
							<span>End Break & Resume Work</span>
						{/if}
					</button>
				{:else}
					<!-- Start Mode Footer Actions -->
					<button
						type="button"
						onclick={handleClose}
						class="rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-all focus:outline-hidden focus:ring-2 focus:ring-ring"
					>
						Cancel
					</button>

					<button
						type="button"
						onclick={handleStartBreak}
						disabled={isSubmitting}
						class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
					>
						{#if isSubmitting}
							<CircleDot class="h-3.5 w-3.5 animate-spin" />
							<span>Starting Break...</span>
						{:else}
							<Play class="h-3.5 w-3.5 fill-current" />
							<span>Start {selectedPreset.label} ({targetMinutes}m)</span>
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
