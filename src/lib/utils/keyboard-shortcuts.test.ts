import { describe, it, expect } from 'bun:test';
import { isInputElement, matchShortcut } from './keyboard-shortcuts';

describe('Global Keyboard Shortcuts (keyboard-shortcuts.ts)', () => {
	it('should accurately match simple shortcuts without modifiers', () => {
		const evt = { key: '?' };
		const matched = matchShortcut(evt, { key: '?' });
		expect(matched).toBe(true);
	});

	it('should accurately match Alt+Key combinations', () => {
		const evt = { key: 'c', altKey: true };
		expect(matchShortcut(evt, { key: 'c', altKey: true })).toBe(true);
		expect(matchShortcut(evt, { key: 'c', altKey: false })).toBe(false);
	});

	it('should accurately match Cmd / Ctrl + K combinations for command palette', () => {
		const metaEvt = { key: 'k', metaKey: true };
		expect(matchShortcut(metaEvt, { key: 'k', ctrlOrMetaKey: true })).toBe(true);

		const ctrlEvt = { key: 'k', ctrlKey: true };
		expect(matchShortcut(ctrlEvt, { key: 'k', ctrlOrMetaKey: true })).toBe(true);

		const plainEvt = { key: 'k' };
		expect(matchShortcut(plainEvt, { key: 'k', ctrlOrMetaKey: true })).toBe(false);
	});

	it('should return false for non-matching key names', () => {
		const evt = { key: 'b', altKey: true };
		expect(matchShortcut(evt, { key: 'c', altKey: true })).toBe(false);
	});

	it('should identify input and textarea elements to prevent accidental triggers', () => {
		expect(isInputElement({ tagName: 'INPUT' })).toBe(true);
		expect(isInputElement({ tagName: 'TEXTAREA' })).toBe(true);
		expect(isInputElement({ tagName: 'SELECT' })).toBe(true);
		expect(isInputElement({ tagName: 'DIV', isContentEditable: true })).toBe(true);
		expect(isInputElement({ tagName: 'BUTTON' })).toBe(false);
		expect(isInputElement({ tagName: 'DIV' })).toBe(false);
		expect(isInputElement(null)).toBe(false);
	});
});
