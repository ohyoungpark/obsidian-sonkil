import { Editor } from 'obsidian';

export class SwapPlugin {
    public moveLineUp(editor: Editor): void {
        editor.exec('swapLineUp');
    }

    public moveLineDown(editor: Editor): void {
        editor.exec('swapLineDown');
    }
}