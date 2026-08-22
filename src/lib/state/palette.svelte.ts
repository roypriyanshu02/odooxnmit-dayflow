class CommandPaletteState {
	isOpen = $state<boolean>(false);

	open() {
		this.isOpen = true;
	}

	close() {
		this.isOpen = false;
	}

	toggle() {
		this.isOpen = !this.isOpen;
	}
}

export const palette = new CommandPaletteState();
