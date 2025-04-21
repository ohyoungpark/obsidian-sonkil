import { MultiCursorPlugin } from '../../src/MultiCursorPlugin';
import { AddCommand } from '../../src/types';
import { Editor, EditorPosition } from 'obsidian';

describe('MultiCursorPlugin', () => {
    let plugin: MultiCursorPlugin;
    let mockAddCommand: jest.MockedFunction<AddCommand>;
    let mockEditor: Editor;

    beforeEach(() => {
        mockAddCommand = jest.fn();
        plugin = new MultiCursorPlugin(mockAddCommand);

        mockEditor = {
            listSelections: jest.fn().mockReturnValue([]),
            getCursor: jest.fn().mockReturnValue({ line: 0, ch: 0 }),
            getLine: jest.fn().mockReturnValue('test line'),
            lineCount: jest.fn().mockReturnValue(10),
            setSelections: jest.fn(),
            setCursor: jest.fn()
        } as unknown as Editor;
    });

    test('should initialize plugin with correct commands', () => {
        expect(plugin).toBeDefined();
        expect(mockAddCommand).toHaveBeenCalledTimes(2);

        const commands = mockAddCommand.mock.calls;

        // Test add-cursor-up command
        expect(commands[0][0].id).toBe('sonkil-add-cursor-up');
        expect(commands[0][0].name).toBe('Add cursor up');
        expect(commands[0][0].hotkeys).toEqual([{ modifiers: ['Ctrl', 'Shift'], key: 'ArrowUp' }]);

        // Test add-cursor-down command
        expect(commands[1][0].id).toBe('sonkil-add-cursor-down');
        expect(commands[1][0].name).toBe('Add cursor down');
        expect(commands[1][0].hotkeys).toEqual([{ modifiers: ['Ctrl', 'Shift'], key: 'ArrowDown' }]);
    });

    test('should add cursor up', () => {
        const mockMainPosition: EditorPosition = { line: 5, ch: 3 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(mockMainPosition);
        (mockEditor.getLine as jest.Mock).mockReturnValue('test line');
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ anchor: mockMainPosition, head: mockMainPosition }]);

        const command = mockAddCommand.mock.calls[0][0];
        command.editorCallback(mockEditor);

        expect(mockEditor.setSelections).toHaveBeenCalledWith([
            { anchor: mockMainPosition, head: mockMainPosition },
            { anchor: { line: 4, ch: 3 }, head: { line: 4, ch: 3 } }
        ]);
    });

    test('should add cursor down', () => {
        const mockMainPosition: EditorPosition = { line: 5, ch: 3 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(mockMainPosition);
        (mockEditor.getLine as jest.Mock).mockReturnValue('test line');
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ anchor: mockMainPosition, head: mockMainPosition }]);

        const command = mockAddCommand.mock.calls[1][0];
        command.editorCallback(mockEditor);

        expect(mockEditor.setSelections).toHaveBeenCalledWith([
            { anchor: mockMainPosition, head: mockMainPosition },
            { anchor: { line: 6, ch: 3 }, head: { line: 6, ch: 3 } }
        ]);
    });

    test('should handle different line lengths correctly', () => {
        // Setup lines with different lengths
        (mockEditor.getLine as jest.Mock).mockImplementation((line: number) => {
            switch (line) {
                case 0: return '1234567';  // 7 chars
                case 1: return '12345';    // 5 chars
                case 2: return '1234567890'; // 10 chars
                default: return '';
            }
        });

        // Start at line 0, column 5 (6th character)
        const mockMainPosition: EditorPosition = { line: 0, ch: 5 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(mockMainPosition);
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ anchor: mockMainPosition, head: mockMainPosition }]);

        const downCommand = mockAddCommand.mock.calls[1][0];

        // First down: should be at column 5 (6th character) of line 1
        downCommand.editorCallback(mockEditor);
        expect(mockEditor.setSelections).toHaveBeenCalledWith([
            { anchor: mockMainPosition, head: mockMainPosition },
            { anchor: { line: 1, ch: 5 }, head: { line: 1, ch: 5 } }
        ]);

        // Clear previous calls
        (mockEditor.setSelections as jest.Mock).mockClear();
        (mockEditor.listSelections as jest.Mock).mockReturnValue([
            { anchor: mockMainPosition, head: mockMainPosition },
            { anchor: { line: 1, ch: 5 }, head: { line: 1, ch: 5 } }
        ]);

        // Second down: should be at column 5 (6th character) of line 2
        downCommand.editorCallback(mockEditor);
        expect(mockEditor.setSelections).toHaveBeenCalledWith([
            { anchor: mockMainPosition, head: mockMainPosition },
            { anchor: { line: 1, ch: 5 }, head: { line: 1, ch: 5 } },
            { anchor: { line: 2, ch: 5 }, head: { line: 2, ch: 5 } }
        ]);
    });

    test('should not add cursor when at document boundaries', () => {
        const mockMainPosition: EditorPosition = { line: 0, ch: 0 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(mockMainPosition);
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ anchor: mockMainPosition, head: mockMainPosition }]);

        // Try to add cursor up at the top of the document
        const upCommand = mockAddCommand.mock.calls[0][0];
        upCommand.editorCallback(mockEditor);
        expect(mockEditor.setSelections).not.toHaveBeenCalled();

        // Try to add cursor down at the bottom of the document
        (mockEditor.getCursor as jest.Mock).mockReturnValue({ line: 9, ch: 0 });
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ anchor: { line: 9, ch: 0 }, head: { line: 9, ch: 0 } }]);

        const downCommand = mockAddCommand.mock.calls[1][0];
        downCommand.editorCallback(mockEditor);
        expect(mockEditor.setSelections).not.toHaveBeenCalled();
    });

    test('should reset to main position', () => {
        const mockMainPosition: EditorPosition = { line: 5, ch: 3 };
        const mockSelections = [
            { anchor: mockMainPosition, head: mockMainPosition },
            { anchor: { line: 6, ch: 3 }, head: { line: 6, ch: 3 } }
        ];

        (mockEditor.listSelections as jest.Mock).mockReturnValue(mockSelections);
        (mockEditor.getCursor as jest.Mock).mockReturnValue(mockMainPosition);

        // Add a cursor to set mainPosition
        const command = mockAddCommand.mock.calls[1][0];
        command.editorCallback(mockEditor);

        // Reset
        plugin.reset(mockEditor);

        expect(mockEditor.setCursor).toHaveBeenCalledWith(mockMainPosition);
    });
});