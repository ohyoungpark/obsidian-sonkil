import {
  Editor,
  MarkdownView,
  Plugin,
  WorkspaceLeaf
} from 'obsidian';

import { RecenterCursorComponent } from './RecenterCursorComponent';
import { KillAndYankComponent, markSelectionField } from './KillAndYankComponent';
import { MultiCursorComponent } from './MultiCursorComponent';
import { SwapComponent } from './SwapComponent';
import { KeyController } from './KeyController';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { StateEffect } from '@codemirror/state';
import { StatusBarManager, IStatusBarManager } from './StatusBarManager';
import { AddCommand } from './types';
import { KeyDownEventResult } from './types';

export default class SonkilPlugin extends Plugin {
  private recenterComponent!: RecenterCursorComponent;
  private killAndYankComponent!: KillAndYankComponent;
  private multiCursorComponent!: MultiCursorComponent;
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
          this.killAndYankComponent.resetMarkSelection(editor);
          return;
        }
        this.killAndYankComponent.updateMarkSelection(editor, to);
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
    this.statusBarManager = new StatusBarManager(this);

    const addCommand = this.addCommand.bind(this) as AddCommand;

    this.recenterComponent = new RecenterCursorComponent(addCommand);
    this.killAndYankComponent = new KillAndYankComponent(addCommand, this.statusBarManager);
    this.multiCursorComponent = new MultiCursorComponent(addCommand);
    new SwapComponent(addCommand);

    this.addCommand({
      id: 'mode-quit',
      name: 'Cancel mark and exit yank mode',
      editorCallback: (editor: Editor) => {
        this.modeQuit(editor);
      }
    });

    this.keyController = new KeyController(this);  // IMPORTANT: this must be initialized after the addCommand is bound

    this.registerDomEvent(
      document,
      'keydown',
      (evt: KeyboardEvent) => {
        const result: KeyDownEventResult = this.keyController.handleKeyEvent(evt);
        if (result === KeyDownEventResult.RESET_YANK) {
          this.killAndYankComponent.resetYankSequence();
        }
        if (result === KeyDownEventResult.BLOCK_AND_EXECUTE) {
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
    this.killAndYankComponent.reset(editor);
    this.recenterComponent.reset();
    this.multiCursorComponent.reset(editor);
  }
}
