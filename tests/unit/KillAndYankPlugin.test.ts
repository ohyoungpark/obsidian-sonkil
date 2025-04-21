import { KillAndYankPlugin } from '../../src/KillAndYankPlugin';
import { AddCommand } from '../../src/types';
import { Editor, EditorPosition } from 'obsidian';
import { IStatusBarManager } from '../../src/StatusBarManager';
import { ClipboardInterface } from '../../src/KillRing';

describe('KillAndYankPlugin', () => {
    let plugin: KillAndYankPlugin;
    let mockAddCommand: jest.MockedFunction<AddCommand>;
    let mockEditor: Editor;
    let mockStatusBarManager: IStatusBarManager;
    let mockClipboard: ClipboardInterface;
    let editorContents: string[];

    beforeEach(() => {
        mockAddCommand = jest.fn();
        mockStatusBarManager = {
            getText: jest.fn().mockReturnValue(''),
            clear: jest.fn(),
            getElement: jest.fn().mockReturnValue(null),
            setStatus: jest.fn(),
            getStatus: jest.fn(),
            isEmpty: jest.fn(),
        };
        mockClipboard = {
            writeText: jest.fn().mockResolvedValue(undefined),
            readText: jest.fn().mockResolvedValue(''),
        };
        plugin = new KillAndYankPlugin(mockAddCommand, mockStatusBarManager, mockClipboard);

        editorContents = [
            'This is a very short line',
            '',
            'This is a much longer line with more content and words to test different scenarios',
            '    This line has leading spaces',
            '',
            '',
            'This line has trailing spaces    ',
            'This line has    multiple    spaces    between    words',
            '',
            'This is the last line'
        ];

        mockEditor = {
            getCursor: jest.fn(),
            getLine: jest.fn((line: number) => editorContents[line]),
            lineCount: jest.fn().mockReturnValue(editorContents.length),
            replaceRange: jest.fn(),
            getSelection: jest.fn(),
            setCursor: jest.fn(),
            listSelections: jest.fn().mockReturnValue([]),
            replaceSelection: jest.fn(),
            setSelections: jest.fn(),
            getRange: jest.fn(),
            posToOffset: jest.fn(),
        } as unknown as Editor;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize plugin with correct commands', () => {
        expect(plugin).toBeDefined();
        expect(mockAddCommand).toHaveBeenCalledTimes(6);

        const commands = mockAddCommand.mock.calls;

        expect(commands[0][0].id).toBe('sonkil-set-mark');
        expect(commands[0][0].name).toBe('Set mark');
        expect(commands[0][0].hotkeys).toEqual([{ modifiers: ['Ctrl'], key: ' ' }]);

        expect(commands[1][0].id).toBe('sonkil-kill-line');
        expect(commands[1][0].name).toBe('Kill line');
        expect(commands[1][0].hotkeys).toEqual([{ modifiers: ['Ctrl'], key: 'k' }]);

        expect(commands[2][0].id).toBe('sonkil-kill-region');
        expect(commands[2][0].name).toBe('Kill region');
        expect(commands[2][0].hotkeys).toEqual([{ modifiers: ['Ctrl'], key: 'w' }]);

        expect(commands[3][0].id).toBe('sonkil-copy-region');
        expect(commands[3][0].name).toBe('Copy region');
        expect(commands[3][0].hotkeys).toEqual([{ modifiers: ['Alt'], key: 'w' }]);

        expect(commands[4][0].id).toBe('sonkil-yank');
        expect(commands[4][0].name).toBe('Yank');
        expect(commands[4][0].hotkeys).toEqual([{ modifiers: ['Ctrl'], key: 'y' }]);

        expect(commands[5][0].id).toBe('sonkil-yank-pop');
        expect(commands[5][0].name).toBe('Yank pop');
        expect(commands[5][0].hotkeys).toEqual([{ modifiers: ['Alt'], key: 'y' }]);
    });

    test('should kill line correctly', () => {
        const mockPosition: EditorPosition = { line: 1, ch: 0 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(mockPosition);
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ head: mockPosition }]);

        const command = mockAddCommand.mock.calls[1][0];
        command.editorCallback(mockEditor);

        expect(mockEditor.replaceRange).toHaveBeenCalledWith('', { line: 1, ch: 0 }, { line: 1, ch: editorContents[1].length });
    });

    test('should kill region correctly', () => {
        const startPosition: EditorPosition = { line: 1, ch: 0 };
        const endPosition: EditorPosition = { line: 2, ch: 10 };

        (mockEditor.getCursor as jest.Mock).mockReturnValue(startPosition);
        const setMarkCommand = mockAddCommand.mock.calls[0][0];
        setMarkCommand.editorCallback(mockEditor);

        (mockEditor.getCursor as jest.Mock).mockReturnValue(endPosition);
        (mockEditor.getRange as jest.Mock).mockReturnValue(editorContents[1] + '\n' + editorContents[2].slice(0, 10));

        const killRegionCommand = mockAddCommand.mock.calls[2][0];
        killRegionCommand.editorCallback(mockEditor);

        expect(mockEditor.replaceRange).toHaveBeenCalledWith('', startPosition, endPosition);
    });

    test('should copy region correctly', () => {
        const startPosition: EditorPosition = { line: 1, ch: 0 };
        const endPosition: EditorPosition = { line: 2, ch: 10 };

        (mockEditor.getCursor as jest.Mock).mockReturnValue(startPosition);
        const setMarkCommand = mockAddCommand.mock.calls[0][0];
        setMarkCommand.editorCallback(mockEditor);

        (mockEditor.getCursor as jest.Mock).mockReturnValue(endPosition);
        (mockEditor.getRange as jest.Mock).mockReturnValue(editorContents[1] + '\n' + editorContents[2].slice(0, 10));

        const copyRegionCommand = mockAddCommand.mock.calls[3][0];
        copyRegionCommand.editorCallback(mockEditor);

        expect(mockClipboard.writeText).toHaveBeenCalledWith(editorContents[1] + '\n' + editorContents[2].slice(0, 10));
        expect(mockEditor.replaceRange).not.toHaveBeenCalled();
    });

    test('should yank text correctly', async () => {
        const clipboardText = 'text from clipboard';
        const cursorPosition: EditorPosition = { line: 0, ch: 0 };

        (mockEditor.getCursor as jest.Mock).mockReturnValue(cursorPosition);
        (mockClipboard.readText as jest.Mock).mockResolvedValue(clipboardText);

        const yankCommand = mockAddCommand.mock.calls[4][0];
        await yankCommand.editorCallback(mockEditor);

        expect(mockEditor.replaceSelection).toHaveBeenCalledWith(clipboardText);
    });

    test('should handle empty line correctly when killing line', () => {
        const mockPosition: EditorPosition = { line: 1, ch: 0 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(mockPosition);
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ head: mockPosition }]);

        const command = mockAddCommand.mock.calls[1][0];
        command.editorCallback(mockEditor);

        expect(mockEditor.replaceRange).toHaveBeenCalledWith('', { line: 1, ch: 0 }, { line: 1, ch: 0 });
    });

    test('should handle kill line at the end of file', () => {
        const lastLineIndex = editorContents.length - 1;
        const mockPosition: EditorPosition = { line: lastLineIndex, ch: 0 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(mockPosition);
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ head: mockPosition }]);

        const command = mockAddCommand.mock.calls[1][0];
        command.editorCallback(mockEditor);

        expect(mockEditor.replaceRange).toHaveBeenCalledWith('', { line: lastLineIndex, ch: 0 }, { line: lastLineIndex, ch: editorContents[lastLineIndex].length });
    });

    test('should handle kill region when mark is not set', () => {
        const endPosition: EditorPosition = { line: 2, ch: 10 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(endPosition);

        const killRegionCommand = mockAddCommand.mock.calls[2][0];
        killRegionCommand.editorCallback(mockEditor);

        expect(mockEditor.replaceRange).not.toHaveBeenCalled();
    });

    test('should handle yank when clipboard is empty', async () => {
        const cursorPosition: EditorPosition = { line: 0, ch: 0 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(cursorPosition);
        (mockClipboard.readText as jest.Mock).mockResolvedValue('');
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ head: cursorPosition }]);

        const yankCommand = mockAddCommand.mock.calls[4][0];
        await yankCommand.editorCallback(mockEditor);

        expect(mockEditor.replaceSelection).not.toHaveBeenCalled();
    });

    test('should handle yank-pop correctly', async () => {
        const cursorPosition: EditorPosition = { line: 0, ch: 0 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(cursorPosition);

        (mockClipboard.readText as jest.Mock).mockResolvedValueOnce('first text');
        const yankCommand = mockAddCommand.mock.calls[4][0];
        await yankCommand.editorCallback(mockEditor);

        (mockClipboard.readText as jest.Mock).mockResolvedValueOnce('second text');
        await yankCommand.editorCallback(mockEditor);

        const yankPopCommand = mockAddCommand.mock.calls[5][0];
        await yankPopCommand.editorCallback(mockEditor);

        expect(mockEditor.replaceSelection).toHaveBeenCalledWith('first text');
    });
});