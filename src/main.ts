import {
  Editor,
  MarkdownView,
  Plugin,
} from 'obsidian';

import { RecenterCursorPlugin } from './RecenterCursorPlugin';
import { KillAndYankPlugin } from './KillAndYankPlugin';
import { MultiCursorPlugin } from './MultiCursorPlugin';
import { SwapPlugin } from './SwapPlugin';
import { KeyController } from './KeyController';

export default class SonkilPlugin extends Plugin {
  private recenterPlugin!: RecenterCursorPlugin;
  private killAndYankPlugin!: KillAndYankPlugin;
  private multiCursorPlugin!: MultiCursorPlugin;
  private swapPlugin!: SwapPlugin;
  private keyController!: KeyController;

  async onload() {
    console.log('Sonkil plugin loaded, kill ring initialized');

    this.recenterPlugin = new RecenterCursorPlugin(this);
    this.killAndYankPlugin = new KillAndYankPlugin(this);
    this.multiCursorPlugin = new MultiCursorPlugin(this);
    this.swapPlugin = new SwapPlugin(this);

    this.addCommand({
      id: 'sonkil-mode-quit',
      name: 'Cancel mark and exit yank mode',
      hotkeys: [{ modifiers: ['Ctrl'], key: 'g' }],
      editorCallback: (editor: Editor) => {
        this.modeQuit(editor);
      }
    });

    this.keyController = new KeyController(this);

    this.registerDomEvent(
      document,
      'keydown',
      (evt: KeyboardEvent) => {
        const shouldBlockEvent = this.keyController.handleKeyEvent(evt);
        if (shouldBlockEvent) {
          evt.preventDefault();
          evt.stopPropagation();
        }
      },
      true
    );

    this.registerDomEvent(document, 'mousedown', () => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (view) {
        const editor = view.editor;
        setTimeout(() => {
          this.modeQuit(editor);
        }, 10);
      }
    });
  }

  modeQuit(editor: Editor): void {
    this.killAndYankPlugin.reset();
    this.recenterPlugin.reset();
    this.multiCursorPlugin.reset(editor);
  }
}
