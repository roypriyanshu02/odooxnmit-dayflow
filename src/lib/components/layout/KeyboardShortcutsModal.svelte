<script lang="ts">
	import { X, Command, Keyboard, Sparkles } from '@lucide/svelte';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = false, onClose }: Props = $props();

	const shortcutSections = [
		{
			title: 'Navigation Shortcuts',
			items: [
				{ keys: ['Alt', 'D'], desc: 'Go to Executive Dashboard' },
				{ keys: ['Alt', 'E'], desc: 'Go to Employee Directory' },
				{ keys: ['Alt', 'A'], desc: 'Go to My Attendance' },
				{ keys: ['Alt', 'L'], desc: 'Go to Leave Management' },
				{ keys: ['Alt', 'P'], desc: 'Go to Payroll Hub' }
			]
		},
		{
			title: 'Action Shortcuts',
			items: [
				{ keys: ['⌘ / Ctrl', 'K'], desc: 'Open Command Palette & Global Search' },
				{ keys: ['Alt', 'C'], desc: 'Toggle Shift Check-In / Check-Out' },
				{ keys: ['Alt', 'B'], desc: 'Trigger Break Launcher Modal' }
			]
		},
		{
			title: 'General',
			items: [
				{ keys: ['?'], desc: 'Open Keyboard Shortcuts Help' },
				{ keys: ['Esc'], desc: 'Close open dialogs or modals' }
			]
		}
	];
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<div
			class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
			onclick={onClose}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Escape' && onClose?.()}
		></div>

		<!-- Dialog Modal -->
		<div
			class="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all animate-in fade-in-0 zoom-in-95"
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border pb-4 mb-4">
				<div class="flex items-center gap-3">
					<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
						<Keyboard class="h-5 w-5" />
					</div>
					<div>
						<h2 class="text-base font-bold text-foreground">Keyboard Shortcuts Reference</h2>
						<p class="text-xs text-muted-foreground">Power navigation and actions across Dayflow HRMS</p>
					</div>
				</div>

				<button
					type="button"
					class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					onclick={onClose}
					aria-label="Close"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Shortcuts List -->
			<div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
				{#each shortcutSections as section}
					<div>
						<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
							{section.title}
						</h3>
						<div class="space-y-1.5">
							{#each section.items as item}
								<div class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs">
									<span class="text-foreground">{item.desc}</span>
									<div class="flex items-center gap-1">
										{#each item.keys as k}
											<kbd class="rounded border border-border bg-background px-2 py-0.5 font-mono text-[11px] font-bold text-foreground shadow-2xs">
												{k}
											</kbd>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
				<span>Press <kbd class="rounded border border-border bg-muted px-1.5 py-0.2 font-mono text-[10px]">Esc</kbd> to close</span>
				<button
					type="button"
					class="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
					onclick={onClose}
				>
					Got It
				</button>
			</div>
		</div>
	</div>
{/if}
