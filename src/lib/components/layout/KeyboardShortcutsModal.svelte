<script lang="ts">
	import { Keyboard } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			onClose?.();
		}
	}

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

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-lg p-6">
		<Dialog.Header class="flex flex-row items-center gap-3 space-y-0 pb-2 border-b border-border">
			<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
				<Keyboard class="h-5 w-5" />
			</div>
			<div class="space-y-0.5">
				<Dialog.Title class="text-base font-bold text-foreground">Keyboard Shortcuts Reference</Dialog.Title>
				<Dialog.Description class="text-xs text-muted-foreground">Power navigation and actions across Dayflow HRMS</Dialog.Description>
			</div>
		</Dialog.Header>

		<!-- Shortcuts List -->
		<div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1 py-2">
			{#each shortcutSections as section}
				<div>
					<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
						{section.title}
					</h3>
					<div class="space-y-1.5">
						{#each section.items as item}
							<div class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs">
								<span class="text-foreground font-medium">{item.desc}</span>
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

		<Dialog.Footer class="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
			<span>Press <kbd class="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to close</span>
			<Button
				size="sm"
				class="text-xs font-semibold"
				onclick={() => {
					open = false;
					onClose?.();
				}}
			>
				Got It
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
