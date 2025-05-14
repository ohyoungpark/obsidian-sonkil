import { RecenterCursorComponent } from '../../src/RecenterCursorComponent';
import { AddCommand } from '../../src/types';
import { Editor } from 'obsidian';
import { EditorView } from '@codemirror/view';

interface EditorWithCM extends Editor {
    cm: EditorView;
}

describe('RecenterCursorComponent', () => {
    let component: RecenterCursorComponent;
    let mockAddCommand: jest.MockedFunction<AddCommand>;

    beforeEach(() => {
        mockAddCommand = jest.fn();
        component = new RecenterCursorComponent(mockAddCommand);
    });

    test('should initialize plugin with correct command', () => {
        expect(component).toBeDefined();
        expect(mockAddCommand).toHaveBeenCalledTimes(1);

        const command = mockAddCommand.mock.calls[0][0];
        expect(command.id).toBe('recenter');
        expect(command.name).toBe('Recenter editor view');
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
        component.reset();

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