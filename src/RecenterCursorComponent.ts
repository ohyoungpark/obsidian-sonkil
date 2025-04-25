import { Editor } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { AddCommand } from './types';

export class RecenterCursorComponent {
  private modes = ['center', 'start', 'end'] as const;
  private currentIndex = 0;

  constructor(private addCommand: AddCommand) {
    this.registerCommands();
  }

  private registerCommands() {
    this.addCommand({
      id: 'sonkil-recenter',
      name: 'Recenter editor view',
      editorCallback: (editor: Editor) => {
        this.recenter(editor);
      },
    });
  }

  private getNextMode(): 'center' | 'start' | 'end' {
    const mode = this.modes[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.modes.length;
    return mode;
  }

  public reset() {
    if (this.currentIndex !== 0) {
      this.currentIndex = 0;
    }
  }

  protected recenter(editor: Editor): void {
    // Obsidian's Editor has an internal cm property that's not exposed in the type definitions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // REMOVE_LINE const cmView = (editor as any).cm as EditorView;
    // Accessing the internal CodeMirror EditorView instance
    const editorWithCm = editor as unknown as { cm: EditorView | undefined };
    const cmView = editorWithCm.cm;
    if (!cmView) return;

    const pos = cmView.state.selection.main.head;
    const line = cmView.state.doc.lineAt(pos);
    const mode = this.getNextMode();

    cmView.dispatch({
      effects: EditorView.scrollIntoView(line.from, {
        y: mode,
        x: 'nearest',
      }),
    });
  }
}
