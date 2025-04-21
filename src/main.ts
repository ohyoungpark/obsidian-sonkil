import {
  Editor,
  MarkdownView,
  Plugin,
  WorkspaceLeaf
} from 'obsidian';

import { RecenterCursorPlugin } from './RecenterCursorPlugin';
import { KillAndYankPlugin, markSelectionField } from './KillAndYankPlugin';
import { MultiCursorPlugin } from './MultiCursorPlugin';
import { SwapPlugin } from './SwapPlugin';
import { KeyController } from './KeyController';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { StateEffect } from '@codemirror/state';
import { StatusBarManager, IStatusBarManager } from './StatusBarManager';

export default class SonkilPlugin extends Plugin {
  private recenterPlugin!: RecenterCursorPlugin;
  private killAndYankPlugin!: KillAndYankPlugin;
  private multiCursorPlugin!: MultiCursorPlugin;
  private keyController!: KeyController;
  private statusBarManager: IStatusBarManager;

  private setupListener(editor: Editor): void {
    const cm = (editor as unknown as { cm: EditorView }).cm;

    const currentField = cm.state.field(markSelectionField, false);
    if (currentField) {
      return;
    }

    const listener = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.selectionSet) {
        const from = update.startState.selection.main.head;
        const to = update.state.selection.main.head;
        if (update.docChanged && from !== to) {
          this.killAndYankPlugin.resetMarkSelection(editor);
          return;
        }
        this.killAndYankPlugin.updateMarkSelection(editor, to);
      }
    });

    cm.dispatch({
      effects: StateEffect.appendConfig.of([
        markSelectionField,
        listener
      ])
    });
  }

  private handleActiveLeafChange(leaf: WorkspaceLeaf | null): void {
    if (!leaf?.view) return;

    const view = leaf.view;
    if (view instanceof MarkdownView) {
      const editor = view.editor;
      if (editor) {
        this.setupListener(editor);
      }
    }
  }

  async onload() {
    console.log('Sonkil plugin loaded, kill ring initialized');

    this.statusBarManager = new StatusBarManager(this);

    this.recenterPlugin = new RecenterCursorPlugin(this);
    this.killAndYankPlugin = new KillAndYankPlugin(this, this.statusBarManager);
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

    const currentView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (currentView?.editor) {
      this.setupListener(currentView.editor);
    }

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        this.handleActiveLeafChange(leaf);
      })
    );
  }

  async onunload(): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view?.editor) {
      this.modeQuit(view.editor);
    }
  }

  modeQuit(editor: Editor): void {
    this.killAndYankPlugin.reset(editor);
    this.recenterPlugin.reset();
    this.multiCursorPlugin.reset(editor);
  }
}
