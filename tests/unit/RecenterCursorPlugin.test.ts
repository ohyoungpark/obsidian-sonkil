import { RecenterCursorPlugin } from '../../src/RecenterCursorPlugin';
import { AddCommand } from '../../src/types';
import { Editor } from 'obsidian';
import { EditorView } from '@codemirror/view';

interface EditorWithCM extends Editor {
    cm: EditorView;
}

describe('RecenterCursorPlugin', () => {
    let plugin: RecenterCursorPlugin;
    let mockAddCommand: jest.MockedFunction<AddCommand>;

    beforeEach(() => {
        mockAddCommand = jest.fn();
        plugin = new RecenterCursorPlugin(mockAddCommand);
    });

    test('should initialize plugin with correct command', () => {
        expect(plugin).toBeDefined();
        expect(mockAddCommand).toHaveBeenCalledTimes(1);

        const command = mockAddCommand.mock.calls[0][0];
        expect(command.id).toBe('sonkil-recenter');
        expect(command.name).toBe('Recenter editor view');
        expect(command.hotkeys).toEqual([{ modifiers: ['Ctrl'], key: 'l' }]);
    });

    test('should recenter editor view when command is executed', () => {
        const mockEditor = {
            cm: {
                state: {
                    selection: {
                        main: {
                            head: 10
                        }
                    },
                    doc: {
                        lineAt: jest.fn().mockReturnValue({
                            from: 5,
                            to: 15
                        })
                    }
                },
                dispatch: jest.fn()
            }
        } as unknown as EditorWithCM;

        // Get the editorCallback from the registered command
        const command = mockAddCommand.mock.calls[0][0];
        command.editorCallback(mockEditor);

        // First call should be 'center'
        expect(mockEditor.cm.dispatch).toHaveBeenCalledWith({
            effects: EditorView.scrollIntoView(5, {
                y: 'center',
                x: 'nearest'
            })
        });

        // Second call should be 'start'
        command.editorCallback(mockEditor);
        expect(mockEditor.cm.dispatch).toHaveBeenCalledWith({
            effects: EditorView.scrollIntoView(5, {
                y: 'start',
                x: 'nearest'
            })
        });

        // Third call should be 'end'
        command.editorCallback(mockEditor);
        expect(mockEditor.cm.dispatch).toHaveBeenCalledWith({
            effects: EditorView.scrollIntoView(5, {
                y: 'end',
                x: 'nearest'
            })
        });

        // Fourth call should cycle back to 'center'
        command.editorCallback(mockEditor);
        expect(mockEditor.cm.dispatch).toHaveBeenCalledWith({
            effects: EditorView.scrollIntoView(5, {
                y: 'center',
                x: 'nearest'
            })
        });
    });

    test('should reset to center mode', () => {
        const mockEditor = {
            cm: {
                state: {
                    selection: {
                        main: {
                            head: 10
                        }
                    },
                    doc: {
                        lineAt: jest.fn().mockReturnValue({
                            from: 5,
                            to: 15
                        })
                    }
                },
                dispatch: jest.fn()
            }
        } as unknown as EditorWithCM;

        const command = mockAddCommand.mock.calls[0][0];

        // Move to 'start' mode
        command.editorCallback(mockEditor);
        command.editorCallback(mockEditor);

        // Reset
        plugin.reset();

        // Should be back to 'center'
        command.editorCallback(mockEditor);
        expect(mockEditor.cm.dispatch).toHaveBeenCalledWith({
            effects: EditorView.scrollIntoView(5, {
                y: 'center',
                x: 'nearest'
            })
        });
    });
});