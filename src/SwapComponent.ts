import { Editor } from 'obsidian';
import { AddCommand } from './types';

export class SwapComponent {
  constructor(private addCommand: AddCommand) {
    this.registerCommands();
  }

  private registerCommands() {
    this.addCommand({
      id: 'sonkil-move-line-up',
      name: 'Move line up',
      editorCallback: (editor: Editor) => {
        this.moveLineUp(editor);
      },
    });

    this.addCommand({
      id: 'sonkil-move-line-down',
      name: 'Move line down',
      editorCallback: (editor: Editor) => {
        this.moveLineDown(editor);
      },
    });
  }

  protected moveLineUp(editor: Editor): void {
    editor.exec('swapLineUp');
  }

  protected moveLineDown(editor: Editor): void {
    editor.exec('swapLineDown');
  }
}
