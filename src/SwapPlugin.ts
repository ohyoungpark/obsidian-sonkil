import { Editor, Plugin } from 'obsidian';

export class SwapPlugin {
    constructor(private plugin: Plugin) {
        this.registerCommands();
    }

    private registerCommands() {
        this.plugin.addCommand({
            id: 'sonkil-move-line-up',
            name: 'Move line up',
            hotkeys: [{ modifiers: ['Ctrl', 'Alt'], key: 'ArrowUp' }],
            editorCallback: (editor: Editor) => {
                this.moveLineUp(editor);
            }
        });

        this.plugin.addCommand({
            id: 'sonkil-move-line-down',
            name: 'Move line down',
            hotkeys: [{ modifiers: ['Ctrl', 'Alt'], key: 'ArrowDown' }],
            editorCallback: (editor: Editor) => {
                this.moveLineDown(editor);
            }
        });
    }

    protected moveLineUp(editor: Editor): void {
        editor.exec('swapLineUp');
    }

    protected moveLineDown(editor: Editor): void {
        editor.exec('swapLineDown');
    }
}