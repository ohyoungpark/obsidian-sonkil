import { Editor, EditorPosition } from 'obsidian';
import { AddCommand } from './types';

export class MultiCursorComponent {
  private mainPosition: EditorPosition | null = null;

  constructor(private addCommand: AddCommand) {
    this.registerCommands();
  }

  private registerCommands() {
    this.addCommand({
      id: 'sonkil-add-cursor-up',
      name: 'Add cursor up',
      editorCallback: (editor: Editor) => {
        this.addCursor(editor, 'up');
      },
    });

    this.addCommand({
      id: 'sonkil-add-cursor-down',
      name: 'Add cursor down',
      editorCallback: (editor: Editor) => {
        this.addCursor(editor, 'down');
      },
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
      ch: Math.min(this.mainPosition.ch, editor.getLine(currentLine).length),
    };

    cursors.push({ anchor: newCursor, head: newCursor });
    editor.setSelections(cursors);
  }

  public reset(editor: Editor): void {
    const selections = editor.listSelections();
    if (selections.length > 1) {
      if (this.mainPosition) {
        editor.setCursor(this.mainPosition);
      } else {
        editor.setCursor(selections[0].anchor);
      }
    }
    this.mainPosition = null;
  }
}
