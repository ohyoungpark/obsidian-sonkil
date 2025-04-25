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
  protected lastYankedLength: number | null = null;
  private killRing: KillRing;
  private clipboard: ClipboardInterface;

  get isYankSequenceActive(): boolean {
    return this.lastYankedLength !== null;
  }

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
      editorCallback: (editor: Editor) => {
        this.setMark(editor);
      },
    });

    this.addCommand({
      id: 'sonkil-kill-line',
      name: 'Kill line',
      editorCallback: (editor: Editor) => {
        this.killLines(editor);
      },
    });

    this.addCommand({
      id: 'sonkil-kill-region',
      name: 'Kill region',
      editorCallback: (editor: Editor) => {
        this.killRegion(editor);
      },
    });

    this.addCommand({
      id: 'sonkil-copy-region',
      name: 'Copy region',
      editorCallback: (editor: Editor) => {
        this.copyRegion(editor);
      },
    });

    this.addCommand({
      id: 'sonkil-yank',
      name: 'Yank',
      editorCallback: (editor: Editor) => {
        this.yank(editor);
      },
    });

    this.addCommand({
      id: 'sonkil-yank-pop',
      name: 'Yank pop',
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

    editor.transaction({
        changes: selections.map(selection => {
            const line = editor.getLine(selection.head.line);
            const text = line.slice(selection.head.ch);
            killedTexts.push(text);
            const from = selection.head;
            const to = { line: selection.head.line, ch: line.length };
            return { from, to, text: '' };
        })
    });

    const combinedText = killedTexts.join('\n');
    if (killedTexts.every(t => t.trim() === '')) {
        const firstLine = selections[0].head.line;
        const lastLine = selections[selections.length - 1].head.line;
        const firstCharPosition: EditorPosition = { line: firstLine, ch: 0 };
        const lastCharPosition: EditorPosition = { line: lastLine + 1, ch: 0 };
        editor.replaceRange('', firstCharPosition, lastCharPosition);
        return;
    }

    this.killRing.add(combinedText);
  }

  protected killRegion(editor: Editor): void {
    this.selectAndAddRegionToKillRing(editor);
    editor.replaceSelection('');
  }

  protected copyRegion(editor: Editor): void {
    this.selectAndAddRegionToKillRing(editor);
    const cursor = editor.getCursor();
    editor.setSelection(cursor, cursor);
  }

  protected selectAndAddRegionToKillRing(editor: Editor): void {
    if (this.markPosition) {
      const from = this.markPosition;
      const to = editor.getCursor();

      const [start, end] = this.sortPositions(from, to);
      editor.setSelection(start, end);
      this.resetMarkSelection(editor);
    }
    const selection = editor.getSelection();
    if (selection) {
      this.killRing.add(selection);
    }
  }

  async yank(editor: Editor): Promise<void> {
    this.resetYankSequence();
    const currentItem = await this.ensureKillRingItem();
    if (!currentItem) return;

    this.lastYankedLength = currentItem.length;

    editor.replaceSelection(currentItem);
  }

  async yankPop(editor: Editor): Promise<void> {
    if (!this.isYankSequenceActive) {
      await this.yank(editor);
      return;
    }

    this.killRing.decreaseCurrentIndex();
    const currentItem = this.killRing.getCurrentItem();

    if (currentItem) {
      const currentSelections = editor.listSelections();

      const currentHeads = currentSelections.map(sel => sel.head);

      for (let i = currentHeads.length - 1; i >= 0; i--) {
          const headPos = currentHeads[i];
          const headOffset = editor.posToOffset(headPos);
          if (this.lastYankedLength === null) {
              console.error("yankPop called with null lastYankedLength despite active sequence.");
              this.resetYankSequence();
              return;
          }
          const startOffset = headOffset - this.lastYankedLength;

          if (startOffset < 0) {
              this.resetYankSequence();
              return;
          }

          const fromPos = editor.offsetToPos(startOffset);

          editor.replaceRange(currentItem, fromPos, headPos);
      }

      this.lastYankedLength = currentItem.length;

    } else {
        this.resetYankSequence();
    }
  }

  private async ensureKillRingItem(): Promise<string | null> {
      let currentItem = this.killRing.getCurrentItem();
      if (currentItem === null) {
          const clipboardText = await this.clipboard.readText();
          if (clipboardText) {
              this.killRing.add(clipboardText);
              currentItem = this.killRing.getCurrentItem();
          }
      }
      return currentItem;
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
    this.resetYankSequence();
    this.resetMarkSelection(editor);
  }

  public resetYankSequence(): void {
    this.lastYankedLength = null;
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
    if (!this.markPosition && Decoration.none) return;

    const cm = (editor as unknown as { cm: EditorView }).cm;

    this.markPosition = null;
    this.statusBarManager.clear();

    if (cm) {
        cm.dispatch({
            effects: markSelectionEffect.of({ from: -1, to: -1 })
        });
    }
  }
}
