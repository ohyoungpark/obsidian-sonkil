import { Editor, Plugin } from 'obsidian';
import { EditorView } from '@codemirror/view';

export class RecenterCursorPlugin {
    private modes = ['center', 'start', 'end'] as const;
    private currentIndex = 0;

    constructor(private plugin: Plugin) {
        this.registerCommands();
    }

    private registerCommands() {
        this.plugin.addCommand({
            id: 'sonkil-recenter-editor',
            name: 'Recenter editor',
            hotkeys: [{ modifiers: ['Ctrl'], key: 'l' }],
            editorCallback: (editor: Editor) => {
                this.recenterEditor(editor);
            }
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

    protected recenterEditor(editor: Editor): void {
        // Obsidian's Editor has an internal cm property that's not exposed in the type definitions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cmView = (editor as any).cm as EditorView;
        if (!cmView) return;

        const pos = cmView.state.selection.main.head;
        const line = cmView.state.doc.lineAt(pos);
        const mode = this.getNextMode();

        cmView.dispatch({
            effects: EditorView.scrollIntoView(line.from, {
                y: mode,
                x: 'nearest'
            })
        });
    }
}