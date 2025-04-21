import { Editor, EditorPosition } from 'obsidian';
import { KillRing, ClipboardInterface } from './KillRing';
import { Prec, StateEffect, StateField } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { IStatusBarManager } from './StatusBarManager';
import { AddCommand } from './types';

export interface MarkSelectionRange {
  from: number;
  to: number;
}

export const markSelectionEffect = StateEffect.define<MarkSelectionRange>();

export const markSelectionField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    value = value.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(markSelectionEffect)) {
        const range = e.value as MarkSelectionRange;
        if (range.from === -1 && range.to === -1) {
          value = Decoration.none;
        } else {
          value = Decoration.set([
            Decoration.mark({
              class: 'mark-selection',
              attributes: { style: 'background-color: rgba(0, 120, 215, 0.2);' }
            }).range(range.from, range.to)
          ]);
        }
      }
    }
    return value;
  },
  provide: f => Prec.highest(EditorView.decorations.from(f))
});

export class KillAndYankPlugin {
  protected markPosition: EditorPosition | null = null;
  protected yankPositions: EditorPosition[] = [];
  private killRing: KillRing;
  private clipboard: ClipboardInterface;

  get markSelectionField() { return markSelectionField; }

  constructor(
    private addCommand: AddCommand,
    private statusBarManager: IStatusBarManager,
    clipboard: ClipboardInterface = navigator.clipboard
  ) {
    this.clipboard = clipboard;
    this.killRing = new KillRing(clipboard);
    this.registerCommands();
  }

  private registerCommands() {
    this.addCommand({
      id: 'sonkil-set-mark',
      name: 'Set mark',
      hotkeys: [{ modifiers: ['Ctrl'], key: ' ' }],
      editorCallback: (editor: Editor) => {
        this.setMark(editor);
      },
    });

    this.addCommand({
      id: 'sonkil-kill-line',
      name: 'Kill line',
      hotkeys: [{ modifiers: ['Ctrl'], key: 'k' }],
      editorCallback: (editor: Editor) => {
        this.killLines(editor);
      },
    });

    this.addCommand({
      id: 'sonkil-kill-region',
      name: 'Kill region',
      hotkeys: [{ modifiers: ['Ctrl'], key: 'w' }],
      editorCallback: (editor: Editor) => {
        this.killRegion(editor);
      },
    });

    this.addCommand({
      id: 'sonkil-copy-region',
      name: 'Copy region',
      hotkeys: [{ modifiers: ['Alt'], key: 'w' }],
      editorCallback: (editor: Editor) => {
        this.copyRegion(editor);
      },
    });

    this.addCommand({
      id: 'sonkil-yank',
      name: 'Yank',
      hotkeys: [{ modifiers: ['Ctrl'], key: 'y' }],
      editorCallback: (editor: Editor) => {
        this.yank(editor);
      },
    });

    this.addCommand({
      id: 'sonkil-yank-pop',
      name: 'Yank pop',
      hotkeys: [{ modifiers: ['Alt'], key: 'y' }],
      editorCallback: (editor: Editor) => {
        this.yankPop(editor);
      },
    });
  }

  private sortPositions(a: EditorPosition, b: EditorPosition): [EditorPosition, EditorPosition] {
    return a.line < b.line || (a.line === b.line && a.ch <= b.ch) ? [a, b] : [b, a];
  }

  private sortNumbers(a: number, b: number): [number, number] {
    return a <= b ? [a, b] : [b, a];
  }

  protected killLines(editor: Editor): void {
    const selections = editor.listSelections();
    const killedTexts: string[] = [];

    selections.forEach((selection) => {
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
    if (this.markPosition) {
      const from = this.markPosition;
      const to = editor.getCursor();

      const [start, end] = this.sortPositions(from, to);
      const text = editor.getRange(start, end);

      this.killRing.add(text);
      editor.replaceRange('', start, end);
      this.resetMarkSelection(editor);
    } else {
      const selection = editor.getSelection();
      if (selection) {
        this.killRing.add(selection);
        editor.replaceSelection('');
      }
    }
  }

  protected copyRegion(editor: Editor): void {
    if (this.markPosition) {
      const from = this.markPosition;
      const to = editor.getCursor();

      const [start, end] = this.sortPositions(from, to);
      const text = editor.getRange(start, end);

      this.killRing.add(text);
      this.resetMarkSelection(editor);
    } else {
      const selection = editor.getSelection();
      if (selection) {
        this.killRing.add(selection);
      }
    }
  }

  async yank(editor: Editor): Promise<void> {
    this.resetYank();
    await this.yankPop(editor);
  }

  async yankPop(editor: Editor): Promise<void> {
    if (this.killRing.getCurrentItem() === null) {
      const clipboardText = await this.clipboard.readText();
      if (clipboardText) {
        this.killRing.add(clipboardText);
      }
    }

    const selections = editor.listSelections();
    const cursorPositions = selections.map(selection => selection.head);

    if (!this.yankPositions.length) {
      this.yankPositions = cursorPositions;
    } else {
      this.killRing.decreaseCurrentIndex();
    }

    const currentItem = this.killRing.getCurrentItem();
    if (currentItem) {
      // Create selections for all cursors
      const selections = cursorPositions.map((cursorPos, i) => ({
        anchor: this.yankPositions[i],
        head: cursorPos
      }));

      // Set all selections at once
      editor.setSelections(selections);
      editor.replaceSelection(currentItem);
    }
  }

  protected setMark(editor: Editor): void {
    const cursorPosition: EditorPosition = editor.getCursor();

    if (this.markPosition) {
      this.resetMarkSelection(editor);
      if (this.statusBarManager.getStatus() === 'MarkDeactivated') {
        this.statusBarManager.setStatus('MarkActivated');
      } else if (this.statusBarManager.isEmpty()) {
        this.statusBarManager.setStatus('MarkSet');
      } else {
        this.statusBarManager.setStatus('MarkDeactivated');
        return;
      }
    } else {
      if (this.statusBarManager.isEmpty()) {
        this.statusBarManager.setStatus('MarkSet');
      } else {
        this.statusBarManager.setStatus('MarkActivated');
      }
    }

    this.markPosition = cursorPosition;
  }

  public reset(editor: Editor): void {
    this.resetYank();
    this.resetMarkSelection(editor);
  }

  public resetYank(): void {
    this.yankPositions = [];
  }

  public updateMarkSelection(editor: Editor, pos: number): void {
    this.statusBarManager.clear();
    if (!this.markPosition) return;

    const cm = (editor as unknown as { cm: EditorView }).cm;
    if (!cm) return;

    const start = editor.posToOffset(this.markPosition);
    const end = pos;
    const [from, to] = this.sortNumbers(start, end);

    if (from === to) return;

    this.statusBarManager.clear();

    cm.dispatch({
      effects: markSelectionEffect.of({ from, to })
    });
  }

  public resetMarkSelection(editor: Editor): void {
    if (!this.markPosition) return;
    const cm = (editor as unknown as { cm: EditorView }).cm;
    if (!cm) return;

    this.markPosition = null;

    cm.dispatch({
      effects: markSelectionEffect.of({ from: -1, to: -1 })
    });
  }
}
