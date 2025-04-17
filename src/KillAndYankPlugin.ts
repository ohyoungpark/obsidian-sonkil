import { Editor, EditorPosition, Plugin } from 'obsidian';
import { KillRing } from './KillRing';

interface PositionsInterface {
  mark: EditorPosition | null;
  yank: EditorPosition | null;
}

export class KillAndYankPlugin {
  protected positions: PositionsInterface;
  private killRing: KillRing;

  constructor(private plugin: Plugin) {
    this.positions = {
      mark: null,
      yank: null
    };
    this.killRing = new KillRing();
    this.registerCommands();
  }

  private registerCommands() {
        this.plugin.addCommand({
            id: 'sonkil-set-mark',
            name: 'Set mark',
            hotkeys: [{ modifiers: ['Ctrl'], key: ' ' }],
            editorCallback: (editor: Editor) => {
                this.setMark(editor);
            }
        });

        this.plugin.addCommand({
            id: 'sonkil-kill-line',
            name: 'Kill line',
            hotkeys: [{ modifiers: ['Ctrl'], key: 'k' }],
            editorCallback: (editor: Editor) => {
                this.killLines(editor);
            }
        });

        this.plugin.addCommand({
            id: 'sonkil-kill-region',
            name: 'Kill region',
            hotkeys: [{ modifiers: ['Ctrl'], key: 'w' }],
            editorCallback: (editor: Editor) => {
                this.killRegion(editor);
            }
        });

        this.plugin.addCommand({
            id: 'sonkil-copy-region',
            name: 'Copy region',
            hotkeys: [{ modifiers: ['Alt'], key: 'w' }],
            editorCallback: (editor: Editor) => {
                this.copyRegion(editor);
            }
        });

        this.plugin.addCommand({
            id: 'sonkil-yank',
            name: 'Yank',
            hotkeys: [{ modifiers: ['Ctrl'], key: 'y' }],
            editorCallback: (editor: Editor) => {
                this.reset();
                this.yank(editor);
            }
        });

        this.plugin.addCommand({
            id: 'sonkil-yank-pop',
            name: 'Yank pop',
            hotkeys: [{ modifiers: ['Alt'], key: 'y' }],
            editorCallback: (editor: Editor) => {
                this.yank(editor);
            }
        });
    }

    private sortPositions(a: EditorPosition, b: EditorPosition): [EditorPosition, EditorPosition] {
        return a.line < b.line || (a.line === b.line && a.ch <= b.ch) ? [a, b] : [b, a];
    }

    protected killLines(editor: Editor): void {
        const selections = editor.listSelections();
        const killedTexts: string[] = [];

        selections.forEach(selection => {
            const line = editor.getLine(selection.head.line);
            const text = line.slice(selection.head.ch);
            killedTexts.push(text);

            const lastCharPosition: EditorPosition = { line: selection.head.line, ch: line.length };
            editor.replaceRange('', selection.head, lastCharPosition);
        });

        const combinedText = killedTexts.join('\n');
        if (combinedText.trim() === '') {
            const firstLine = selections[0].head.line;
            const lastLine = selections[selections.length - 1].head.line;
            const firstCharPosition: EditorPosition = { line: firstLine, ch: selections[0].head.ch };
            const lastCharPosition: EditorPosition = { line: lastLine + 1, ch: 0 };
            editor.replaceRange('', firstCharPosition, lastCharPosition);
            return;
        }

        this.killRing.add(combinedText);
    }

    protected killRegion(editor: Editor): void {
        if (this.positions.mark) {
            const from = this.positions.mark;
            const to = editor.getCursor();

            const [start, end] = this.sortPositions(from, to);
            const text = editor.getRange(start, end);

            this.killRing.add(text);
            editor.replaceRange('', start, end);
            this.positions.mark = null;
        } else {
            const selection = editor.getSelection();
            if (selection) {
                this.killRing.add(selection);
                editor.replaceSelection('');
            }
        }
    }

    protected copyRegion(editor: Editor): void {
        if (this.positions.mark) {
            const from = this.positions.mark;
            const to = editor.getCursor();

            const [start, end] = this.sortPositions(from, to);
            const text = editor.getRange(start, end);

            this.killRing.add(text);
            this.positions.mark = null;
        } else {
            const selection = editor.getSelection();
            if (selection) {
                this.killRing.add(selection);
            }
        }
    }

    async yank(editor: Editor): Promise<void> {
        if (this.killRing.getCurrentItem() === null) {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText) {
                this.killRing.add(clipboardText);
            }
        }

        const cursorPosition: EditorPosition = editor.getCursor();

        if (!this.positions.yank) {
            this.positions.yank = cursorPosition;
        } else {
            this.killRing.decreaseCurrentIndex();
        }

        const currentItem = this.killRing.getCurrentItem();
        if (currentItem) {
            editor.setSelection(this.positions.yank, cursorPosition);
            editor.replaceSelection(currentItem);
        }
    }

    protected setMark(editor: Editor): void {
        const cursorPosition: EditorPosition = editor.getCursor();
        this.positions.mark = cursorPosition;
    }

    public reset(): void {
        this.positions.yank = null;
        this.positions.mark = null;
    }
}
