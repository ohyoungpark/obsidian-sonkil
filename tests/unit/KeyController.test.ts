import { KeyController } from '../../src/KeyController';
import { KeyDownEventResult } from '../../src/types';
import { MockApp, MockPlugin, MockMarkdownView } from './__mocks__/KeyControllerMocks';

describe('KeyController', () => {
    let keyController: KeyController;
    let mockApp: MockApp;
    let mockPlugin: MockPlugin;
    let mockView: MockMarkdownView;
    let mockTarget: HTMLElement;

    beforeEach(() => {
        mockApp = new MockApp();
        mockPlugin = new MockPlugin(mockApp);
        mockView = new MockMarkdownView();
        keyController = new KeyController(mockPlugin as any);
        mockTarget = document.createElement('div');
    });

    test('should initialize with empty key bindings', () => {
        expect(mockApp.commands.executeCommandById).not.toHaveBeenCalled();
    });

    test('should handle key event with active view', () => {
        mockApp.workspace.setActiveView(mockView);
        const event = new KeyboardEvent('keydown', {
            key: 'k',
            code: 'KeyK',
            ctrlKey: true
        });
        Object.defineProperty(event, 'target', { value: mockTarget });

        const result = keyController.handleKeyEvent(event as any);
        expect(result).toBe(KeyDownEventResult.RESET_YANK);
    });

    test('should not handle key event without active view', () => {
        mockApp.workspace.setActiveView(null);
        const event = new KeyboardEvent('keydown', {
            key: 'k',
            code: 'KeyK',
            ctrlKey: true
        });
        Object.defineProperty(event, 'target', { value: mockTarget });

        const result = keyController.handleKeyEvent(event as any);
        expect(result).toBe(KeyDownEventResult.DO_NOTHING);
    });

    test('should handle special keys correctly', () => {
        mockApp.workspace.setActiveView(mockView);

        // Test Escape key
        const escapeEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape'
        });
        Object.defineProperty(escapeEvent, 'target', { value: mockTarget });
        expect(keyController.handleKeyEvent(escapeEvent as any)).toBe(KeyDownEventResult.RESET_YANK);

        // Test Control key (left)
        const ctrlLeftEvent = new KeyboardEvent('keydown', {
            key: 'Control',
            code: 'ControlLeft'
        });
        Object.defineProperty(ctrlLeftEvent, 'target', { value: mockTarget });
        expect(keyController.handleKeyEvent(ctrlLeftEvent as any)).toBe(KeyDownEventResult.DO_NOTHING);

        // Test Control key (right)
        const ctrlRightEvent = new KeyboardEvent('keydown', {
            key: 'Control',
            code: 'ControlRight'
        });
        Object.defineProperty(ctrlRightEvent, 'target', { value: mockTarget });
        expect(keyController.handleKeyEvent(ctrlRightEvent as any)).toBe(KeyDownEventResult.DO_NOTHING);

        // Test Alt key (left)
        const altLeftEvent = new KeyboardEvent('keydown', {
            key: 'Alt',
            code: 'AltLeft'
        });
        Object.defineProperty(altLeftEvent, 'target', { value: mockTarget });
        expect(keyController.handleKeyEvent(altLeftEvent as any)).toBe(KeyDownEventResult.DO_NOTHING);

        // Test Alt key (right)
        const altRightEvent = new KeyboardEvent('keydown', {
            key: 'Alt',
            code: 'AltRight'
        });
        Object.defineProperty(altRightEvent, 'target', { value: mockTarget });
        expect(keyController.handleKeyEvent(altRightEvent as any)).toBe(KeyDownEventResult.DO_NOTHING);
    });

    test('should handle key bindings with modifiers', () => {
        mockApp.workspace.setActiveView(mockView);

        // Add a test command
        mockApp.commands.commands['test-plugin:sonkil-test'] = {
            name: 'Test Command',
            hotkeys: [{
                modifiers: ['Ctrl'],
                key: 'k'
            }]
        };

        // Reinitialize key bindings
        keyController = new KeyController(mockPlugin as any);

        const event = new KeyboardEvent('keydown', {
            key: 'k',
            code: 'KeyK',
            ctrlKey: true
        });
        Object.defineProperty(event, 'target', { value: mockTarget });

        const result = keyController.handleKeyEvent(event as any);
        expect(result).toBe(KeyDownEventResult.BLOCK_AND_EXECUTE);
        expect(mockApp.commands.executeCommandById).toHaveBeenCalledWith('test-plugin:sonkil-test');
    });
});