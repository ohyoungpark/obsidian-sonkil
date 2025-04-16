import { Editor, EditorPosition } from 'obsidian';

export class MultiCursorPlugin {
    private mainPosition: EditorPosition | null = null;

    public addCursor(editor: Editor, direction: 'up' | 'down'): void {
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

    public resetMultiCursors(editor: Editor): void {
        if (this.mainPosition) {
            editor.setCursor(this.mainPosition);
            this.mainPosition = null;
        }
    }

    public reset(): void {
        this.mainPosition = null;
    }
}