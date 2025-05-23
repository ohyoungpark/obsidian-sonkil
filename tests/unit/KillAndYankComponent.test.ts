import { AddCommand } from '../../src/types';
import { Editor, EditorPosition } from 'obsidian';
import { IStatusBarManager } from '../../src/StatusBarManager';
import { ClipboardInterface } from '../../src/KillRing';
import { TestKillRing } from './TestKillRing';
import { MockKillAndYankComponent } from './__mocks__/KillAndYankComponent';

describe('KillAndYankComponent', () => {
    let component: MockKillAndYankComponent;
    let mockAddCommand: jest.MockedFunction<AddCommand>;
    let mockEditor: Editor;
    let mockStatusBarManager: IStatusBarManager;
    let mockClipboard: ClipboardInterface;
    let editorContents: string[];
    let testKillRing: TestKillRing;

    function createMockEditor(): Editor {
        const mock = {
            getCursor: jest.fn().mockReturnValue({ line: 0, ch: 0 }),
            getSelection: jest.fn().mockReturnValue(''),
            setSelection: jest.fn(),
            replaceSelection: jest.fn(),
            getValue: jest.fn().mockReturnValue(''),
            setValue: jest.fn(),
            listSelections: jest.fn().mockReturnValue([{ head: { line: 0, ch: 0 } }]),
            setSelections: jest.fn(),
            getLine: jest.fn(),
            getRange: jest.fn(),
            replaceRange: jest.fn(),
            posToOffset: jest.fn().mockImplementation((pos: EditorPosition) => {
                let offset = 0;
                for (let i = 0; i < pos.line; i++) {
                    offset += (editorContents[i]?.length ?? 0) + 1;
                }
                offset += pos.ch;
                return offset;
            }),
            offsetToPos: jest.fn().mockImplementation((offset: number) => {
                let currentOffset = 0;
                for (let line = 0; line < editorContents.length; line++) {
                    const lineLength = editorContents[line]?.length ?? 0;
                    const lineLengthWithNewline = lineLength + 1;
                    if (currentOffset + lineLengthWithNewline > offset) {
                        return { line: line, ch: offset - currentOffset };
                    }
                    currentOffset += lineLengthWithNewline;
                }
                const lastLine = editorContents.length - 1;
                return { line: lastLine, ch: editorContents[lastLine]?.length ?? 0 };
            }),
            transaction: jest.fn().mockImplementation((tx: { changes?: { from: EditorPosition, to: EditorPosition, text: string }[] }) => {
                if (tx.changes) {
                    for (let i = tx.changes.length - 1; i >= 0; i--) {
                        const change = tx.changes[i];
                        mock.replaceRange(change.text, change.from, change.to);
                    }
                }
            }),
        } as unknown as Editor;
        return mock;
    }

    beforeEach(() => {
        mockAddCommand = jest.fn();
        mockStatusBarManager = {
            getText: jest.fn().mockReturnValue(''),
            clear: jest.fn(),
            getElement: jest.fn().mockReturnValue(null),
            setStatus: jest.fn(),
            getStatus: jest.fn(),
            isEmpty: jest.fn().mockReturnValue(true),
        };
        mockClipboard = {
            writeText: jest.fn().mockResolvedValue(undefined),
            readText: jest.fn().mockResolvedValue(''),
        };
        testKillRing = new TestKillRing(mockClipboard);
        component = new MockKillAndYankComponent(mockAddCommand, mockStatusBarManager, mockClipboard);
        (component as unknown as { killRing: TestKillRing }).killRing = testKillRing;
        (component as unknown as { resetMarkSelection: jest.Mock }).resetMarkSelection = jest.fn();

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

        mockEditor = createMockEditor();
        (mockEditor.getLine as jest.Mock).mockImplementation((line: number) => editorContents[line]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize plugin with correct commands', () => {
        // Given: 플러그인이 초기화되었을 때
        // When: 명령어들이 등록되면
        // Then: 6개의 명령어가 올바른 ID, 이름, 단축키와 함께 등록되어야 함
        expect(component).toBeDefined();
        expect(mockAddCommand).toHaveBeenCalledTimes(6);

        const commands = mockAddCommand.mock.calls;

        expect(commands[0][0].id).toBe('set-mark');
        expect(commands[0][0].name).toBe('Set mark');

        expect(commands[1][0].id).toBe('kill-line');
        expect(commands[1][0].name).toBe('Kill line');

        expect(commands[2][0].id).toBe('kill-region');
        expect(commands[2][0].name).toBe('Kill region');

        expect(commands[3][0].id).toBe('copy-region');
        expect(commands[3][0].name).toBe('Copy region');

        expect(commands[4][0].id).toBe('yank');
        expect(commands[4][0].name).toBe('Yank');

        expect(commands[5][0].id).toBe('yank-pop');
        expect(commands[5][0].name).toBe('Yank pop');
    });

    test('should kill line correctly', () => {
        // Given: 커서가 특정 위치에 있을 때
        const mockPosition: EditorPosition = { line: 1, ch: 0 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(mockPosition);
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ head: mockPosition }]);

        // When: kill line 명령을 실행하면
        const command = mockAddCommand.mock.calls[1][0];
        command.editorCallback(mockEditor);

        // Then: 해당 라인의 내용이 삭제되고 kill ring에 추가되어야 함
        expect(mockEditor.replaceRange).toHaveBeenCalledWith('', { line: 1, ch: 0 }, { line: 1, ch: editorContents[1].length });
    });

    test('should copy region correctly with mark position and cursor position', () => {
        // Given: 마크 위치와 커서 위치가 설정되어 있을 때
        const startPosition: EditorPosition = { line: 1, ch: 0 };
        const endPosition: EditorPosition = { line: 2, ch: 10 };
        const selectedText = editorContents[1] + '\n' + editorContents[2].slice(0, 10);

        // Set mark position
        (mockEditor.getCursor as jest.Mock).mockReturnValue(startPosition);
        const setMarkCommand = mockAddCommand.mock.calls[0][0];
        setMarkCommand.editorCallback(mockEditor);

        // Set cursor position and get selected text
        (mockEditor.getCursor as jest.Mock).mockReturnValue(endPosition);
        (mockEditor.getRange as jest.Mock).mockReturnValue(selectedText);
        (mockEditor.getSelection as jest.Mock).mockReturnValue(selectedText);

        // Mock cm for resetMarkSelection
        const mockCm = {
            dispatch: jest.fn()
        };
        (mockEditor as unknown as { cm: typeof mockCm }).cm = mockCm;

        // When: copy region 명령을 실행하면
        const copyRegionCommand = mockAddCommand.mock.calls[3][0];
        copyRegionCommand.editorCallback(mockEditor);

        // Then: 선택된 영역이 kill ring에 추가되고 resetMarkSelection이 호출되어야 함
        expect(testKillRing.getItems()).toContain(selectedText);
        expect(mockEditor.replaceSelection).not.toHaveBeenCalled();
        expect(component.resetMarkSelection).toHaveBeenCalled();
    });

    test('should copy region correctly with selection', () => {
        // Given: 텍스트가 선택되어 있을 때
        const startPosition: EditorPosition = { line: 1, ch: 0 };
        const endPosition: EditorPosition = { line: 2, ch: 10 };
        const selectedText = editorContents[1] + '\n' + editorContents[2].slice(0, 10);

        // Set selection directly
        (mockEditor.getSelection as jest.Mock).mockReturnValue(selectedText);
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ anchor: startPosition, head: endPosition }]);

        // When: copy region 명령을 실행하면
        const copyRegionCommand = mockAddCommand.mock.calls[3][0];
        copyRegionCommand.editorCallback(mockEditor);

        // Then: 선택된 영역이 kill ring에 추가되어야 함
        expect(testKillRing.getItems()).toContain(selectedText);
        expect(mockEditor.replaceSelection).not.toHaveBeenCalled();
    });

    test('should kill region correctly with mark position and cursor position', () => {
        // Given: 마크 위치와 커서 위치가 설정되어 있을 때
        const startPosition: EditorPosition = { line: 1, ch: 0 };
        const endPosition: EditorPosition = { line: 2, ch: 10 };
        const selectedText = editorContents[1] + '\n' + editorContents[2].slice(0, 10);

        // Set mark position
        (mockEditor.getCursor as jest.Mock).mockReturnValue(startPosition);
        const setMarkCommand = mockAddCommand.mock.calls[0][0];
        setMarkCommand.editorCallback(mockEditor);

        // Set cursor position and get selected text
        (mockEditor.getCursor as jest.Mock).mockReturnValue(endPosition);
        (mockEditor.getRange as jest.Mock).mockReturnValue(selectedText);
        (mockEditor.getSelection as jest.Mock).mockReturnValue(selectedText);

        // When: kill region 명령을 실행하면
        const killRegionCommand = mockAddCommand.mock.calls[2][0];
        killRegionCommand.editorCallback(mockEditor);

        // Then: 선택된 영역이 삭제되고 kill ring에 추가되어야 함
        expect(testKillRing.getItems()).toContain(selectedText);
        expect(mockEditor.replaceSelection).toHaveBeenCalledWith('');
        expect(component.resetMarkSelection).toHaveBeenCalled();
        expect(component.getMarkPosition()).toEqual(startPosition);
    });

    test('should kill region correctly with selection', () => {
        // Given: 텍스트가 선택되어 있을 때
        const startPosition: EditorPosition = { line: 1, ch: 0 };
        const endPosition: EditorPosition = { line: 2, ch: 10 };
        const selectedText = editorContents[1] + '\n' + editorContents[2].slice(0, 10);

        // Set selection directly
        (mockEditor.getSelection as jest.Mock).mockReturnValue(selectedText);
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ anchor: startPosition, head: endPosition }]);

        // When: kill region 명령을 실행하면
        const killRegionCommand = mockAddCommand.mock.calls[2][0];
        killRegionCommand.editorCallback(mockEditor);

        // Then: 선택된 영역이 삭제되고 kill ring에 추가되어야 함
        expect(testKillRing.getItems()).toContain(selectedText);
        expect(mockEditor.replaceSelection).toHaveBeenCalledWith('');
    });

    test('should handle empty line correctly when killing line', () => {
        // Given: 빈 라인에 커서가 있을 때
        const mockPosition: EditorPosition = { line: 1, ch: 0 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(mockPosition);
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ head: mockPosition }]);

        // When: kill line 명령을 실행하면
        const command = mockAddCommand.mock.calls[1][0];
        command.editorCallback(mockEditor);

        // Then: 빈 라인이 삭제되어야 함
        expect(mockEditor.replaceRange).toHaveBeenCalledWith('', { line: 1, ch: 0 }, { line: 1, ch: 0 });
    });

    test('should handle kill line at the end of file', () => {
        // Given: 파일의 마지막 라인에 커서가 있을 때
        const lastLineIndex = editorContents.length - 1;
        const mockPosition: EditorPosition = { line: lastLineIndex, ch: 0 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(mockPosition);
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ head: mockPosition }]);

        // When: kill line 명령을 실행하면
        const command = mockAddCommand.mock.calls[1][0];
        command.editorCallback(mockEditor);

        // Then: 마지막 라인이 삭제되어야 함
        expect(mockEditor.replaceRange).toHaveBeenCalledWith('', { line: lastLineIndex, ch: 0 }, { line: lastLineIndex, ch: editorContents[lastLineIndex].length });
    });

    test('should kill lines correctly with multiple cursors at different positions', () => {
        // Given: 여러 커서가 다른 위치에 있을 때
        const selections = [
            { head: { line: 0, ch: 5 } },  // "This is a very short line" -> kill "is a very short line"
            { head: { line: 2, ch: 10 } }, // "This is a much longer line..." -> kill "much longer line..."
            { head: { line: 6, ch: 15 } }  // "This line has trailing spaces    " -> kill "railing spaces    "
        ];

        (mockEditor.listSelections as jest.Mock).mockReturnValue(selections);

        // Mock getLine to return the correct line content for each call
        (mockEditor.getLine as jest.Mock)
            .mockReturnValueOnce('This is a very short line')
            .mockReturnValueOnce('This is a much longer line with more content and words to test different scenarios')
            .mockReturnValueOnce('This line has trailing spaces    ');

        // When: kill line 명령을 실행하면
        const command = mockAddCommand.mock.calls[1][0];
        command.editorCallback(mockEditor);

        // Then: 각 커서 위치의 라인 내용이 삭제되고 kill ring에 추가되어야 함
        expect(mockEditor.replaceRange).toHaveBeenCalledTimes(selections.length);
        // Verify calls were made in reverse order of selections due to mock transaction logic
        selections.forEach((_, index) => {
            const callIndex = index + 1; // nthCalled is 1-based
            // The call number corresponds to processing the selections array in reverse
            const originalSelectionIndex = selections.length - callIndex;
            const selection = selections[originalSelectionIndex];
            const lineContent = editorContents[selection.head.line]; // Get the correct line content for this selection
            expect(mockEditor.replaceRange).toHaveBeenNthCalledWith(
                callIndex,
                '',
                selection.head,
                { line: selection.head.line, ch: lineContent?.length ?? 0 } // Use correct line content length
            );
        });

        // Verify the killed text was added to kill ring
        const expectedKilledText = [
            'is a very short line',
            'much longer line with more content and words to test different scenarios',
            'railing spaces    '
        ].join('\n');
        expect(testKillRing.getItems()[0]).toBe(expectedKilledText);
    });

    test('should handle kill region when mark is not set', () => {
        // Given: 마크가 설정되지 않았을 때
        const endPosition: EditorPosition = { line: 2, ch: 10 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(endPosition);

        // When: kill region 명령을 실행하면
        const killRegionCommand = mockAddCommand.mock.calls[2][0];
        killRegionCommand.editorCallback(mockEditor);

        // Then: 아무 동작도 하지 않아야 함
        expect(mockEditor.replaceRange).not.toHaveBeenCalled();
    });

    test('should handle yank when clipboard is empty', async () => {
        // Given: 클립보드가 비어있을 때
        const cursorPosition: EditorPosition = { line: 0, ch: 0 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(cursorPosition);
        (mockClipboard.readText as jest.Mock).mockResolvedValue('');
        (mockEditor.listSelections as jest.Mock).mockReturnValue([{ head: cursorPosition }]);

        // When: yank 명령을 실행하면
        const yankCommand = mockAddCommand.mock.calls[4][0];
        await yankCommand.editorCallback(mockEditor);

        // Then: 아무 동작도 하지 않아야 함
        expect(mockEditor.replaceSelection).not.toHaveBeenCalled();
    });

    test('should handle yank-pop correctly', async () => {
        // Given: 여러 텍스트가 kill ring에 있을 때
        const cursorPosition: EditorPosition = { line: 0, ch: 0 };
        (mockEditor.getCursor as jest.Mock).mockReturnValue(cursorPosition);

        (mockClipboard.readText as jest.Mock).mockResolvedValueOnce('first text');
        const yankCommand = mockAddCommand.mock.calls[4][0];
        await yankCommand.editorCallback(mockEditor);

        (mockClipboard.readText as jest.Mock).mockResolvedValueOnce('second text');
        await yankCommand.editorCallback(mockEditor);

        // When: yank-pop 명령을 실행하면
        const yankPopCommand = mockAddCommand.mock.calls[5][0];
        await yankPopCommand.editorCallback(mockEditor);

        // Then: 이전에 yank한 텍스트가 삽입되어야 함
        expect(mockEditor.replaceSelection).toHaveBeenCalledWith('first text');
    });

    describe('setMark', () => {
        it('should set status to MarkActivated when markPosition exists and current status is MarkDeactivated', () => {
            const editor = createMockEditor();
            component.setMarkPosition({ line: 0, ch: 0 });
            (mockStatusBarManager.getStatus as jest.Mock).mockReturnValue('MarkDeactivated');

            const setMarkCommand = mockAddCommand.mock.calls[0][0];
            setMarkCommand.editorCallback(editor);

            expect(mockStatusBarManager.setStatus).toHaveBeenCalledWith('MarkActivated');
            expect(component.getMarkPosition()).toEqual({ line: 0, ch: 0 });
        });

        it('should set status to MarkSet when markPosition exists and current status is empty', () => {
            const editor = createMockEditor();
            component.setMarkPosition({ line: 0, ch: 0 });
            (mockStatusBarManager.getStatus as jest.Mock).mockReturnValue('');
            (mockStatusBarManager.isEmpty as jest.Mock).mockReturnValue(true);

            const setMarkCommand = mockAddCommand.mock.calls[0][0];
            setMarkCommand.editorCallback(editor);

            expect(mockStatusBarManager.setStatus).toHaveBeenCalledWith('MarkSet');
            expect(component.getMarkPosition()).toEqual({ line: 0, ch: 0 });
        });

        it('should set status to MarkDeactivated when markPosition exists and current status is MarkSet', () => {
            const editor = createMockEditor();
            component.setMarkPosition({ line: 0, ch: 0 });
            (mockStatusBarManager.getStatus as jest.Mock).mockReturnValue('MarkSet');
            (mockStatusBarManager.isEmpty as jest.Mock).mockReturnValue(false);

            const setMarkCommand = mockAddCommand.mock.calls[0][0];
            setMarkCommand.editorCallback(editor);

            expect(mockStatusBarManager.setStatus).toHaveBeenCalledWith('MarkDeactivated');
            expect(component.getMarkPosition()).toEqual({ line: 0, ch: 0 });
        });

        it('should set status to MarkDeactivated when markPosition exists and current status is MarkActivated', () => {
            const editor = createMockEditor();
            component.setMarkPosition({ line: 0, ch: 0 });
            (mockStatusBarManager.getStatus as jest.Mock).mockReturnValue('MarkActivated');
            (mockStatusBarManager.isEmpty as jest.Mock).mockReturnValue(false);

            const setMarkCommand = mockAddCommand.mock.calls[0][0];
            setMarkCommand.editorCallback(editor);

            expect(mockStatusBarManager.setStatus).toHaveBeenCalledWith('MarkDeactivated');
            expect(component.getMarkPosition()).toEqual({ line: 0, ch: 0 });
        });

        it('should set status to MarkSet when markPosition does not exist and current status is empty', () => {
            const editor = createMockEditor();
            component.setMarkPosition(null);
            (mockStatusBarManager.getStatus as jest.Mock).mockReturnValue('');
            (mockStatusBarManager.isEmpty as jest.Mock).mockReturnValue(true);

            const setMarkCommand = mockAddCommand.mock.calls[0][0];
            setMarkCommand.editorCallback(editor);

            expect(mockStatusBarManager.setStatus).toHaveBeenCalledWith('MarkSet');
            expect(component.getMarkPosition()).toEqual({ line: 0, ch: 0 });
        });

        it('should set status to MarkActivated when markPosition does not exist and current status is not empty', () => {
            const editor = createMockEditor();
            component.setMarkPosition(null);
            (mockStatusBarManager.getStatus as jest.Mock).mockReturnValue('MarkDeactivated');
            (mockStatusBarManager.isEmpty as jest.Mock).mockReturnValue(false);

            const setMarkCommand = mockAddCommand.mock.calls[0][0];
            setMarkCommand.editorCallback(editor);

            expect(mockStatusBarManager.setStatus).toHaveBeenCalledWith('MarkActivated');
            expect(component.getMarkPosition()).toEqual({ line: 0, ch: 0 });
        });
    });
});