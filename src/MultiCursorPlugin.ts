import { Editor, EditorPosition, Plugin } from 'obsidian';

export class MultiCursorPlugin {
    private mainPosition: EditorPosition | null = null;

    constructor(private plugin: Plugin) {
        this.registerCommands();
    }

    private registerCommands() {
        this.plugin.addCommand({
            id: 'sonkil-add-cursor-up',
            name: 'Add cursor up',
            hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'ArrowUp' }],
            editorCallback: (editor: Editor) => {
                this.addCursor(editor, 'up');
            }
        });

        this.plugin.addCommand({
            id: 'sonkil-add-cursor-down',
            name: 'Add cursor down',
            hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'ArrowDown' }],
            editorCallback: (editor: Editor) => {
                this.addCursor(editor, 'down');
            }
        });
    }

    protected addCursor(editor: Editor, direction: 'up' | 'down'): void {
        const cursors = editor.listSelections();
        let currentLine: number;

        if (direction === 'up') {
            currentLine = cursors[0].anchor.line - 1;
        } else {
            currentLine = cursors[cursors.length - 1].anchor.line + 1;
        }

        if (currentLine < 0 || currentLine >= editor.lineCount()) {
            return;
        }

        if (!this.mainPosition) {
            this.mainPosition = editor.getCursor();
        }

        const newCursor = {
            line: currentLine,
            ch: Math.min(
                this.mainPosition.ch,
                editor.getLine(currentLine).length
            ),
        };

        cursors.push({ anchor: newCursor, head: newCursor });
        editor.setSelections(cursors);
    }

    public reset(editor: Editor): void {
        if (this.mainPosition) {
            editor.setCursor(this.mainPosition);
            this.mainPosition = null;
        }
    }
}