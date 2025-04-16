import { Editor, EditorPosition } from 'obsidian';
import { KillRing } from './KillRing';

export interface PositionsInterface {
  mark: EditorPosition | null;
  yank: EditorPosition | null;
}

export class KillAndYankPlugin {
  protected positions: PositionsInterface;
  protected killRing: KillRing;

  constructor(maxRingSize: number = 60) {
    this.killRing = new KillRing(maxRingSize);
    this.positions = {
      mark: null,
      yank: null
    };
  }

  setKillRingMaxSize(size: number): void {
    this.killRing.setMaxSize(size);
  }

  private sortPositions(a: EditorPosition, b: EditorPosition): [EditorPosition, EditorPosition] {
    return a.line < b.line || (a.line === b.line && a.ch <= b.ch) ? [a, b] : [b, a];
  }

  killLine(editor: Editor): void {
    const cursorPosition: EditorPosition = editor.getCursor();
    const line = editor.getLine(cursorPosition.line);

    const text = line.slice(cursorPosition.ch);

    if (text.trim() === '') {
      const nextLineFirstCharPosition: EditorPosition = { line: cursorPosition.line + 1, ch: 0 };
      editor.replaceRange('', cursorPosition, nextLineFirstCharPosition);
      return;
    }

    this.killRing.add(text);
    const lastCharPosition: EditorPosition = { line: cursorPosition.line, ch: line.length };
    editor.replaceRange('', cursorPosition, lastCharPosition);
  }

  killRegion(editor: Editor): void {
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

  copyRegion(editor: Editor): void {
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

  async setMark(editor: Editor): Promise<void> {
    const cursorPosition: EditorPosition = editor.getCursor();
    this.positions.mark = cursorPosition;
  }

  resetYankPosition(): void {
    this.positions.yank = null;
  }

  resetMarkPosition(): void {
    this.positions.mark = null;
  }

  reset(): void {
    this.resetYankPosition();
    this.resetMarkPosition();
  }
}
