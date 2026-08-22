/**
 * Global Keyboard Shortcuts Manager
 */

export interface ShortcutKeyEvent {
	key: string;
	altKey?: boolean;
	ctrlKey?: boolean;
	metaKey?: boolean;
	shiftKey?: boolean;
}

export interface ShortcutDefinition {
	key: string;
	altKey?: boolean;
	ctrlOrMetaKey?: boolean;
	shiftKey?: boolean;
	description: string;
	category: 'Navigation' | 'Actions' | 'General';
	action: () => void;
}

/**
 * Returns true if event target is an active text input element.
 */
export function isInputElement(target: EventTarget | any): boolean {
	if (!target || typeof target !== 'object') {
		return false;
	}

	const tagName = (target.tagName || '').toLowerCase();
	const isEditable = Boolean(target.isContentEditable);
	return (
		tagName === 'input' ||
		tagName === 'textarea' ||
		tagName === 'select' ||
		isEditable
	);
}

/**
 * Matches a KeyboardEvent against shortcut conditions.
 */
export function matchShortcut(
	event: ShortcutKeyEvent,
	shortcut: {
		key: string;
		altKey?: boolean;
		ctrlOrMetaKey?: boolean;
		shiftKey?: boolean;
	}
): boolean {
	const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

	const altMatch = Boolean(shortcut.altKey) === Boolean(event.altKey);
	const shiftMatch = Boolean(shortcut.shiftKey) === Boolean(event.shiftKey);
	const ctrlOrMetaMatch = Boolean(shortcut.ctrlOrMetaKey)
		? Boolean(event.ctrlKey || event.metaKey)
		: !event.ctrlKey && !event.metaKey;

	return keyMatch && altMatch && shiftMatch && ctrlOrMetaMatch;
}
