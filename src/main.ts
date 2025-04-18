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
import { EditorView, ViewUpdate } from '@codemirror/view';
import { Extension, StateEffect } from '@codemirror/state';

export default class SonkilPlugin extends Plugin {
  private recenterPlugin!: RecenterCursorPlugin;
  private killAndYankPlugin!: KillAndYankPlugin;
  private multiCursorPlugin!: MultiCursorPlugin;
  private keyController!: KeyController;
  private listener: Extension | null = null;

  private setupListener(editor: Editor): void {
    if (!this.listener) {
      const cm = (editor as unknown as { cm: EditorView }).cm;
      this.listener = EditorView.updateListener.of((update: ViewUpdate) => {
        if (update.selectionSet) {
          const from = update.startState.selection.main.head;
          const to = update.state.selection.main.head;

          if (update.docChanged && from !== to) {
            this.killAndYankPlugin.resetMarkSelection(editor);
          }
          this.killAndYankPlugin.updateMarkSelection(editor, to);
        }
      });

      cm.dispatch({
        effects: StateEffect.appendConfig.of([
          this.killAndYankPlugin.markSelectionField,
          this.listener
        ])
      });
    }
  }

  private handleActiveLeafChange(leaf: unknown): void {
    const view = (leaf as any)?.view;
    const editor = view?.editor || view?.component?.editor;

    if (editor) {
      this.setupListener(editor);
    }
  }

  async onload() {
    console.log('Sonkil plugin loaded, kill ring initialized');

    this.recenterPlugin = new RecenterCursorPlugin(this);
    this.killAndYankPlugin = new KillAndYankPlugin(this);
    this.multiCursorPlugin = new MultiCursorPlugin(this);
    new SwapPlugin(this);

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
        if (shouldBlockEvent === null) {
          this.killAndYankPlugin.resetYank();
        }
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

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        this.handleActiveLeafChange(leaf);
      })
    );
  }

  modeQuit(editor: Editor): void {
    this.killAndYankPlugin.reset(editor);
    this.recenterPlugin.reset();
    this.multiCursorPlugin.reset(editor);
  }
}
