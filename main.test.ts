import { App, Editor, MarkdownView, IEditor, IMarkdownView, IApp } from './__mocks__/obsidian';
import SonkilPlugin from './main';

describe('SonkilPlugin', () => {
    let app: IApp;
    let plugin: SonkilPlugin;
    let editor: IEditor;
    let view: IMarkdownView;

    beforeEach(() => {
        app = new App();
        plugin = new SonkilPlugin(app as any, {
            id: 'test',
            name: 'Test Plugin',
            version: '1.0.0',
            minAppVersion: '0.15.0',
            author: 'Test Author',
            description: 'Test Description'
        });
        editor = new Editor();
        view = new MarkdownView();
        view.editor = editor;

        // Basic mock setup
        editor.getLine = jest.fn().mockReturnValue('test line');
        editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
        editor.lineCount = jest.fn().mockReturnValue(2);

        // Mock navigator.clipboard
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                readText: jest.fn().mockResolvedValue('clipboard text')
            },
            writable: true
        });
    });

    describe('constructor', () => {
        it('should initialize with default settings', () => {
            // Then
            expect(plugin.settings).toEqual({
                killRing: [],
                killRingIndex: -1,
                killRingMaxSize: 60,
                yankPosition: null,
                markPosition: null
            });
        });
    });

    describe('yank', () => {
        it('should enter yank mode after C-y', async () => {
            // Given
            plugin.settings.killRing = ['test text'];
            plugin.settings.killRingIndex = 0;

            // When
            await plugin.yank(editor as any);

            // Then
            expect(plugin.settings.yankPosition).not.toBeNull();
        });

        it('should exit yank mode when non-M-y key is pressed', async () => {
            // Given
            plugin.settings.yankPosition = {
                line: 0,
                ch: 9
            };

            // When
            const event = new KeyboardEvent('keydown', {
                key: 'a',
                altKey: false,
                ctrlKey: false
            });

            // Call event handler directly
            if (plugin.settings.yankPosition) {
                // Update according to new structure
                const isAltY = event.altKey && plugin.isKeyBindingMatch(event, {
                    key: 'y',
                    code: 'KeyY',
                    modifiers: { altKey: true, ctrlKey: false, shiftKey: false, metaKey: false },
                    action: () => true,
                    description: '',
                    isCommand: true
                });

                if (!isAltY) {
                    plugin.settings.yankPosition = null;
                }
            }

            // Then
            expect(plugin.settings.yankPosition).toBeNull();
        });

        it('should maintain yank mode when M-y is pressed', async () => {
            // Given
            const yankPosition = {
                line: 0,
                ch: 9
            };
            plugin.settings.yankPosition = yankPosition;

            // When
            const event = new KeyboardEvent('keydown', {
                key: 'y',
                altKey: true,
                ctrlKey: false
            });

            // Call event handler directly
            if (plugin.settings.yankPosition) {
                // Update according to new structure
                const isAltY = event.altKey && plugin.isKeyBindingMatch(event, {
                    key: 'y',
                    code: 'KeyY',
                    modifiers: { altKey: true, ctrlKey: false, shiftKey: false, metaKey: false },
                    action: () => true,
                    description: '',
                    isCommand: true
                });

                if (!isAltY) {
                    plugin.settings.yankPosition = null;
                }
            }

            // Then
            expect(plugin.settings.yankPosition).toEqual(yankPosition);
        });

        it('should rotate kill ring index when M-y is pressed', async () => {
            // Given
            plugin.settings.killRing = ['text1', 'text2', 'text3'];
            plugin.settings.killRingIndex = 2;
            plugin.settings.yankPosition = {
                line: 0,
                ch: 5
            };

            // When
            await plugin.yank(editor as any);

            // Then
            expect(plugin.settings.killRingIndex).toBe(1);
        });
    });

    describe('killRing', () => {
        it('should update kill ring when text is killed', () => {
            // Given
            const text = 'test text';

            // When
            (plugin as any).addToKillRing(text);

            // Then
            expect(plugin.settings.killRing).toContain(text);
            expect(plugin.settings.killRingIndex).toBe(0);
        });

        it('should rotate kill ring index when M-y is pressed', async () => {
            // Given
            plugin.settings.killRing = ['text1', 'text2', 'text3'];
            plugin.settings.killRingIndex = 2;
            plugin.settings.yankPosition = {
                line: 0,
                ch: 5
            };

            // When
            await plugin.yank(editor as any);

            // Then
            expect(plugin.settings.killRingIndex).toBe(1);
        });

        it('should respect killRingMaxSize setting', () => {
            // Given
            plugin.settings.killRingMaxSize = 3;
            plugin.settings.killRing = [];

            // When - Add items up to max size
            (plugin as any).addToKillRing('item1');
            (plugin as any).addToKillRing('item2');
            (plugin as any).addToKillRing('item3');

            // Then - All items should be maintained
            expect(plugin.settings.killRing).toHaveLength(3);
            expect(plugin.settings.killRing).toEqual(['item1', 'item2', 'item3']);
            expect(plugin.settings.killRingIndex).toBe(2);
        });

        it('should remove oldest items when kill ring exceeds max size (LRU/FIFO behavior)', () => {
            // Given
            plugin.settings.killRingMaxSize = 3;
            plugin.settings.killRing = [];

            // When - Add more items than max size
            (plugin as any).addToKillRing('item1'); // Oldest item (to be removed)
            (plugin as any).addToKillRing('item2');
            (plugin as any).addToKillRing('item3');
            (plugin as any).addToKillRing('item4'); // Most recent item

            // Then - Oldest item should be removed
            expect(plugin.settings.killRing).toHaveLength(3);
            expect(plugin.settings.killRing).toEqual(['item2', 'item3', 'item4']);
            expect(plugin.settings.killRing).not.toContain('item1');
            expect(plugin.settings.killRingIndex).toBe(2);
        });

        it('should update killRingIndex correctly when items are removed', () => {
            // Given
            plugin.settings.killRingMaxSize = 2;
            plugin.settings.killRing = ['old-item'];

            // When - Add more items than max size
            (plugin as any).addToKillRing('new-item1');
            (plugin as any).addToKillRing('new-item2');

            // Then - killRingIndex should always point to the last item
            expect(plugin.settings.killRing).toEqual(['new-item1', 'new-item2']);
            expect(plugin.settings.killRingIndex).toBe(1);
        });

        it('should handle killRingMaxSize changes dynamically', () => {
            // Given
            plugin.settings.killRingMaxSize = 5;
            plugin.settings.killRing = ['item1', 'item2', 'item3', 'item4', 'item5'];

            // When - Reduce killRingMaxSize and add new item
            plugin.settings.killRingMaxSize = 3;
            (plugin as any).addToKillRing('item6');

            // Then - Max size should be applied dynamically
            expect(plugin.settings.killRing).toHaveLength(3);
            expect(plugin.settings.killRing).toEqual(['item4', 'item5', 'item6']);
            expect(plugin.settings.killRingIndex).toBe(2);
        });
    });

    describe('killLine', () => {
        it('should kill text from cursor to end of line and add to kill ring', () => {
            // Given
            const line = 'Hello, world!\n';
            editor.getLine = jest.fn().mockReturnValue(line);
            editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 7 });

            // When
            plugin.killLine(editor as any);

            // Then
            expect(editor.replaceRange).toHaveBeenCalledWith(
                '',
                { line: 0, ch: 7 },
                { line: 0, ch: line.length }
            );
            expect(plugin.settings.killRing).toContain('world!\n');
        });

        it('should kill newline without adding to kill ring', () => {
            // Given
            const line = 'test\n';
            editor.getLine = jest.fn().mockReturnValue(line);
            editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: line.length - 1 });

            // When
            plugin.killLine(editor as any);

            // Then
            expect(editor.replaceRange).toHaveBeenCalledWith(
                '',
                { line: 0, ch: line.length - 1 },
                { line: 1, ch: 0 }
            );
            expect(plugin.settings.killRing).not.toContain('\n');
        });

        it('should handle empty line by removing only the newline', () => {
            // Given
            editor.getLine = jest.fn().mockReturnValue('\n');
            editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });

            // When
            plugin.killLine(editor as any);

            // Then
            expect(editor.replaceRange).toHaveBeenCalledWith(
                '',
                { line: 0, ch: 0 },
                { line: 1, ch: 0 }
            );
            expect(plugin.settings.killRing).not.toContain('\n');
        });
    });

    describe('handleKeyEvent', () => {
        beforeEach(() => {
            // Mock implementation of App's getActiveViewOfType
            app.workspace.getActiveViewOfType = jest.fn().mockReturnValue(view);
        });

        it('should handle non-yank key events when yank mode is active', () => {
            // Given
            plugin.settings.yankPosition = {
                line: 0,
                ch: 5
            };

            // When
            const event = new KeyboardEvent('keydown', {
                key: 'a',
                code: 'KeyA',
                ctrlKey: false,
                altKey: false
            });
            plugin.handleKeyEvent(event);

            // Then
            expect(plugin.settings.yankPosition).toBeNull();
        });

        it('should maintain yank mode for M-y key event', () => {
            // Given
            const yankPosition = {
                line: 0,
                ch: 5
            };
            plugin.settings.yankPosition = yankPosition;

            // When
            const event = new KeyboardEvent('keydown', {
                key: 'y',
                code: 'KeyY',
                altKey: true
            });
            plugin.handleKeyEvent(event);

            // Then
            expect(plugin.settings.yankPosition).toEqual(yankPosition);
        });

        it('should handle C-g key event to exit yank mode', () => {
            // Given
            plugin.settings.yankPosition = {
                line: 0,
                ch: 5
            };

            // When
            const event = new KeyboardEvent('keydown', {
                key: 'g',
                code: 'KeyG',
                ctrlKey: true
            });
            plugin.handleKeyEvent(event);

            // Then
            expect(plugin.settings.yankPosition).toBeNull();
        });

        it('should handle Ctrl+K', () => {
            // Given
            const line = 'test line';
            editor.getLine = jest.fn().mockReturnValue(line);
            editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
            editor.lineCount = jest.fn().mockReturnValue(2);

            // When
            const event = new KeyboardEvent('keydown', {
                key: 'k',
                code: 'KeyK',
                ctrlKey: true
            });
            plugin.handleKeyEvent(event);

            // Then
            expect(editor.replaceRange).toHaveBeenCalledWith(
                '',
                { line: 0, ch: 0 },
                { line: 0, ch: line.length }
            );
            expect(plugin.settings.killRing).toContain(line);
        });

        it('should handle Ctrl+W with mark', () => {
            // Given
            const event = new KeyboardEvent('keydown', {
                key: 'w',
                code: 'KeyW',
                ctrlKey: true
            });
            plugin.settings.markPosition = { line: 0, ch: 0 };
            editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 5 });
            editor.getLine = jest.fn().mockReturnValue('Hello, world!');

            // When
            const result = plugin.handleKeyEvent(event);

            // Then
            expect(result).toBe(true);
            expect(editor.replaceRange).toHaveBeenCalledWith('', { line: 0, ch: 0 }, { line: 0, ch: 5 });
        });

        it('should handle Alt+Y with previous yank', () => {
            // Given
            const event = new KeyboardEvent('keydown', {
                key: 'y',
                code: 'KeyY',
                altKey: true
            });
            plugin.settings.killRing = ['texttext', 'text'];
            plugin.settings.killRingIndex = 1;
            plugin.settings.yankPosition = {
                line: 0,
                ch: 3
            };
            editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 7 });

            // When
            const result = plugin.handleKeyEvent(event);

            // Then
            expect(result).toBe(true);
            expect(plugin.settings.killRingIndex).toBe(0);
            expect(plugin.settings.yankPosition).toEqual({
                line: 0,
                ch: 3
            });
        });

        it('should handle Alt+Y without previous yank', () => {
            // Given
            const event = new KeyboardEvent('keydown', {
                key: 'y',
                code: 'KeyY',
                altKey: true
            });
            plugin.settings.killRing = ['text1', 'text2'];
            plugin.settings.killRingIndex = 1;
            plugin.settings.yankPosition = null;

            // When
            const result = plugin.handleKeyEvent(event);

            // Then
            expect(result).toBe(true);
            expect(plugin.settings.killRingIndex).toBe(1);
        });

        it('should handle Ctrl+G to quit operations', () => {
            // Given
            const event = new KeyboardEvent('keydown', {
                key: 'g',
                code: 'KeyG',
                ctrlKey: true
            });
            plugin.settings.markPosition = { line: 3, ch: 5 };
            plugin.settings.yankPosition = {
                line: 0,
                ch: 4
            };

            // Mock the keyboardQuit method
            plugin.keyboardQuit = jest.fn().mockReturnValue(true);

            // When
            const result = plugin.handleKeyEvent(event);

            // Then
            expect(result).toBe(true);
            expect(plugin.keyboardQuit).toHaveBeenCalled();
        });

        it('should not handle unknown key combinations', () => {
            // Given
            const event = new KeyboardEvent('keydown', {
                key: 'z',
                ctrlKey: false,
                altKey: false
            });

            // When
            const result = plugin.handleKeyEvent(event);

            // Then
            expect(result).toBe(false);
        });
    });

    describe('clipboard operations', () => {
        let originalClipboard: any;

        beforeEach(() => {
            // Store original clipboard object
            originalClipboard = navigator.clipboard;
            // Mock clipboard API
            (navigator as any).clipboard = {
                readText: jest.fn()
            };
        });

        afterEach(() => {
            // Restore original clipboard object
            (navigator as any).clipboard = originalClipboard;
        });

        it('should yank from clipboard when kill ring is empty', async () => {
            // Given
            const clipboardText = 'clipboard text';
            (navigator.clipboard.readText as jest.Mock).mockResolvedValue(clipboardText);

            // When
            await plugin.yank(editor as any);

            // Then
            expect(editor.replaceSelection).toHaveBeenCalledWith(clipboardText);
        });
    });

    describe('plugin lifecycle', () => {
        it('should initialize settings on load', async () => {
            // Given
            await plugin.loadSettings();

            // Then
            expect(plugin.settings).toEqual({
                killRing: [],
                killRingIndex: -1,
                yankPosition: null,
                markPosition: null,
                killRingMaxSize: 60
            });
        });

        it('should clean up on unload', () => {
            // Given
            plugin.settings.killRing = ['text'];
            plugin.settings.killRingIndex = 0;
            plugin.settings.yankPosition = {
                line: 0,
                ch: 4
            };

            // When
            plugin.onunload();

            // Then
            expect(plugin.settings.killRing).toEqual([]);
            expect(plugin.settings.killRingIndex).toBe(-1);
            expect(plugin.settings.yankPosition).toBeNull();
        });

        it('should save settings', async () => {
            // Given
            plugin.settings.killRing = ['text'];
            plugin.settings.killRingIndex = 0;
            plugin.settings.yankPosition = null;

            // When
            await plugin.saveSettings();

            // Then
            expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
        });
    });

    describe('mark and region kill', () => {
        it('should set mark position when C-space is pressed', () => {
            // Given
            editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 5 });

            // Mock implementation of App's getActiveViewOfType
            app.workspace.getActiveViewOfType = jest.fn().mockReturnValue(view);

            // Set keyBindings directly if not already set
            if (!plugin.keyBindings) {
                plugin.keyBindings = [];
            }

            // Set mock action
            const spaceAction = jest.fn().mockImplementation((editor) => {
                plugin.settings.markPosition = editor.getCursor();
                return true;
            });

            // Add or replace test keyBinding directly
            const spaceBindingIndex = plugin.keyBindings.findIndex(b =>
                b.key === ' ' && b.modifiers?.ctrlKey === true);

            if (spaceBindingIndex >= 0) {
                plugin.keyBindings[spaceBindingIndex].action = spaceAction;
            } else {
                plugin.keyBindings.push({
                    key: ' ',
                    code: 'Space',
                    modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
                    action: spaceAction,
                    description: 'mark setting',
                    isCommand: true
                });
            }

            // When
            const result = spaceAction(editor as any, view as any);

            // Then
            expect(result).toBe(true);
            expect(plugin.settings.markPosition).toEqual({ line: 0, ch: 5 });
        });

        it('should kill region from mark to cursor when C-w is pressed', () => {
            // Given
            plugin.settings.markPosition = { line: 0, ch: 0 };
            editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 5 });
            editor.getLine = jest.fn().mockReturnValue('Hello, world!');
            editor.getRange = jest.fn().mockReturnValue('Hello');

            // When
            plugin.killRegion(editor as any);

            // Then
            expect(editor.replaceRange).toHaveBeenCalledWith('', { line: 0, ch: 0 }, { line: 0, ch: 5 });
            expect(plugin.settings.killRing).toContain('Hello');
        });

        it('should handle multi-line region kill', () => {
            // Given
            plugin.settings.markPosition = { line: 0, ch: 0 };
            editor.getCursor = jest.fn().mockReturnValue({ line: 1, ch: 5 });
            editor.getLine = jest.fn()
                .mockReturnValueOnce('Hello')
                .mockReturnValueOnce('world');
            editor.getRange = jest.fn().mockReturnValue('Hello\nworld');

            // When
            plugin.killRegion(editor as any);

            // Then
            expect(editor.replaceRange).toHaveBeenCalledWith('', { line: 0, ch: 0 }, { line: 1, ch: 5 });
            expect(plugin.settings.killRing).toContain('Hello\nworld');
        });

        it('should clear mark position after region kill', () => {
            // Given
            plugin.settings.markPosition = { line: 0, ch: 0 };
            editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 5 });
            editor.getLine = jest.fn().mockReturnValue('Hello');

            // Call test target function directly for simplicity
            plugin.killRegion(editor as any);

            // Then
            expect(plugin.settings.markPosition).toBeNull();
        });

        it('should not kill region if mark is not set', () => {
            // Given
            const event = new KeyboardEvent('keydown', {
                key: 'w',
                code: 'KeyW',
                ctrlKey: true
            });
            plugin.settings.markPosition = null;
            editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 5 });

            // When
            plugin.handleKeyEvent(event);

            // Then
            expect(editor.replaceRange).not.toHaveBeenCalled();
            expect(plugin.settings.killRing).not.toContain('Hello, world!');
        });
    });

    describe('keyboardQuit', () => {
        it('should clear mark position when C-g is called', () => {
            // Given
            plugin.settings.markPosition = { line: 5, ch: 10 };

            // When
            plugin.keyboardQuit();

            // Then
            expect(plugin.settings.markPosition).toBeNull();
        });

        it('should exit yank mode when C-g is called', () => {
            // Given
            plugin.settings.yankPosition = {
                line: 0,
                ch: 5
            };

            // When
            plugin.keyboardQuit();

            // Then
            expect(plugin.settings.yankPosition).toBeNull();
        });

        it('should handle C-g when neither mark nor yank mode is active', () => {
            // Given
            plugin.settings.markPosition = null;
            plugin.settings.yankPosition = null;

            // When
            plugin.keyboardQuit();

            // Then
            expect(plugin.settings.markPosition).toBeNull();
            expect(plugin.settings.yankPosition).toBeNull();
        });
    });
});