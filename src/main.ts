import {
  App,
  Editor,
  EditorPosition,
  Hotkey,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
  Modifier,
} from 'obsidian';
import { EditorView } from '@codemirror/view';

import { KeyBinding, PluginManifest, ModifierKey, SonkilConfig } from './types';
import { RecenterCursorPlugin } from './RecenterCursorPlugin';
import { KillAndYankPlugin } from './killAndYankPlugin';

const DEFAULT_KILL_RING_SIZE = 60;
const KeyToCodeMap: Record<string, string> = {
  ' ': 'Space',
  'g': 'KeyG',
  'k': 'KeyK',
  'w': 'KeyW',
  'y': 'KeyY',
  'l': 'KeyL',
  'ArrowUp': 'ArrowUp',
  'ArrowDown': 'ArrowDown',
};

export interface ConfigChangeHandler {
  setKillRingMaxSize(size: number): Promise<void>;
  getKillRingMaxSize(): number;
}

export default class SonkilPlugin extends Plugin implements ConfigChangeHandler {
  private keyBindings: KeyBinding[];
  private recenterPlugin = new RecenterCursorPlugin();
  private killAndYankPlugin: KillAndYankPlugin;
  config: SonkilConfig;
  protected positions: {
    main: EditorPosition | null;  // main cursor position for multi-cursor
  };

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.positions = {
      main: null,
    };
    this.config = {
      killRingMaxSize: DEFAULT_KILL_RING_SIZE,
    };
    this.killAndYankPlugin = new KillAndYankPlugin(DEFAULT_KILL_RING_SIZE);

    // Key binding definitions
    this.keyBindings = [
      {
        key: 'g',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.modeQuit(editor);
          return true;
        },
        description: 'Cancel mark and exit yank mode',
      },
      {
        key: ' ',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.killAndYankPlugin.setMark(editor);
          return true;
        },
        description: 'Set mark',
      },
      {
        key: 'k',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.killAndYankPlugin.killLine(editor);
          return true;
        },
        description: 'Kill line',
      },
      {
        key: 'w',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.killAndYankPlugin.killRegion(editor);
          return true;
        },
        description: 'Kill region',
      },
      {
        key: 'w',
        modifiers: { ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.killAndYankPlugin.copyRegion(editor);
          return true;
        },
        description: 'Copy region',
      },
      {
        key: 'y',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.killAndYankPlugin.resetYankPosition();  // Initialize yankPosition for Ctrl+y to behave differently from Alt+y
          this.killAndYankPlugin.yank(editor);
          return true;
        },
        description: 'Yank',
      },
      {
        key: 'y',
        modifiers: { ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.killAndYankPlugin.yank(editor);
          return true;
        },
        description: 'Yank pop',
      },
      {
        key: 'l',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.recenterEditor(editor);
          return true;
        },
        description: 'Recenter editor',
      },
      {
        key: 'ArrowUp',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: true },
        action: (editor: Editor) => {
          this.moveLineUp(editor);
          return true;
        },
        description: 'Move line up',
      },
      {
        key: 'ArrowDown',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: true },
        action: (editor: Editor) => {
          this.moveLineDown(editor);
          return true;
        },
        description: 'Move line down',
      },
      {
        key: 'ArrowUp',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: true, metaKey: false },
        action: (editor: Editor) => {
          this.addCursorUp(editor);
          return true;
        },
        description: 'Add cursor up',
      },
      {
        key: 'ArrowDown',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: true, metaKey: false },
        action: (editor: Editor) => {
          this.addCursorDown(editor);
          return true;
        },
        description: 'Add cursor down',
      },
    ];
  }

  async onload() {
    await this.loadConfig();
    console.log('Sonkil plugin loaded, kill ring initialized');

    // Register key event listener (capture phase)
    this.registerDomEvent(
      document,
      'keydown',
      (evt) => {
        const target = evt.target as HTMLElement;

        // Ignore key input in elements with inline-title class
        if (target.classList.contains('inline-title') || target.closest('.inline-title') !== null) {
          console.log('Inline title detected, skipping');
          return;
        }

        // Delegate all key event handling to handleKeyEvent
        const shouldBlockEvent: boolean = this.handleKeyEvent(evt);
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

    // Automatically register commands from key bindings
    this.keyBindings.forEach((binding) => {
      // Generate command ID and display name
      const commandId = `sonkil-${binding.description.toLowerCase().replace(/\s+/g, '-')}`;
      const commandName = binding.description;

      this.addCommand({
        id: commandId,
        name: commandName,
        hotkeys: this.keybindingToHotkeys(binding),
        editorCallback: (editor: Editor) => {
          binding.action(editor);
        },
      });
    });

    // Add settings tab
    this.addSettingTab(new SonkilSettingTab(this.app, this));
  }

  private keybindingToHotkeys(keybinding: KeyBinding): Hotkey[] {
    const modifiers: Modifier[] = [];
    if (keybinding.modifiers.ctrlKey) modifiers.push('Mod');
    if (keybinding.modifiers.altKey) modifiers.push('Alt');
    if (keybinding.modifiers.shiftKey) modifiers.push('Shift');
    if (keybinding.modifiers.metaKey) modifiers.push('Meta');

    return [{
      modifiers,
      key: keybinding.key
    }];
  }

  modeQuit(editor: Editor): void {
    this.killAndYankPlugin.reset();
    this.recenterPlugin.reset();
    this.resetMultiCursors(editor);
  }

  handleKeyEvent(evt: KeyboardEvent): boolean {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return false;

    const editor = view.editor;

    if (evt.ctrlKey || evt.altKey || evt.key === 'Escape') {
      for (const binding of this.keyBindings) {
        if (this.isKeyBindingMatch(evt, binding)) {
          return binding.action(editor);
        }
      }
    }

    if (!['Control', 'Alt'].includes(evt.key)) {
      this.killAndYankPlugin.resetYankPosition();
      this.recenterPlugin.reset();
    }

    return false;
  }

  isKeyBindingMatch(evt: KeyboardEvent, binding: KeyBinding): boolean {
    const keyPressed = evt.key.toLowerCase();
    const codePressed = evt.code;
    const bindingKey = binding.key.toLowerCase();
    const keyMatches = codePressed === KeyToCodeMap[bindingKey] || keyPressed === bindingKey;

    const modifiersMatch = Object.entries(binding.modifiers).every(([key, value]) => {
      if (value === undefined) return true;
      return value === evt[key as keyof ModifierKey];
    });

    return keyMatches && modifiersMatch;
  }

  onunload() {
    this.killAndYankPlugin.reset();
    this.recenterPlugin.reset();

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      this.resetMultiCursors(view.editor);
    }
  }

  async loadConfig() {
    const loadedData = await this.loadData();
    if (loadedData) {
      this.config.killRingMaxSize = loadedData.killRingMaxSize || DEFAULT_KILL_RING_SIZE;
    }
    this.killAndYankPlugin = new KillAndYankPlugin(this.config.killRingMaxSize);
  }

  async saveConfig() {
    await this.saveData(this.config);
  }

  async setKillRingMaxSize(size: number): Promise<void> {
    this.config.killRingMaxSize = size;
    this.killAndYankPlugin.setKillRingMaxSize(size);
    await this.saveConfig();
  }

  getKillRingMaxSize(): number {
    return this.config.killRingMaxSize;
  }

  private recenterEditor(editor: Editor): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    // Obsidian's Editor has an internal cm property that's not exposed in the type definitions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cmView = (editor as any).cm as EditorView;
    if (!cmView) return;

    const pos = cmView.state.selection.main.head;
    const line = cmView.state.doc.lineAt(pos);
    const mode = this.recenterPlugin.getNextMode();

    cmView.dispatch({
      effects: EditorView.scrollIntoView(line.from, {
        y: mode,
        x: 'nearest'
      })
    });
  }

  private moveLineUp(editor: Editor): void {
    editor.exec('swapLineUp');
  }

  private moveLineDown(editor: Editor): void {
    editor.exec('swapLineDown');
  }

  private addCursorUp(editor: Editor): void {
    this.addCursor(editor, 'up');
  }

  private addCursorDown(editor: Editor): void {
    this.addCursor(editor, 'down');
  }

  private addCursor(editor: Editor, direction: 'up' | 'down'): void {
    const cursors = editor.listSelections();

    let currentLine: number;

    if (direction === 'up') {
      currentLine = cursors[0].anchor.line - 1;
    } else {
      currentLine = cursors[cursors.length - 1].anchor.line + 1;
    }

    if (currentLine < 0) {
      return;
    } else if (currentLine >= editor.lineCount()) {
      return;
    }

    if (!this.positions.main) {
      this.positions.main = editor.getCursor();
    }

    const newCursor = {
      line: currentLine,
      ch: Math.min(
        this.positions.main.ch,
        editor.getLine(currentLine).length
      ),
    };

    cursors.push({anchor: newCursor, head: newCursor});
    editor.setSelections(cursors);
  }

  private resetMultiCursors(editor: Editor): void {
    if (this.positions.main) {
      editor.setCursor(this.positions.main);
      this.positions.main = null;
    }
  }
}

class SonkilSettingTab extends PluginSettingTab {
  private configHandler: ConfigChangeHandler;

  constructor(app: App, plugin: Plugin & ConfigChangeHandler) {
    super(app, plugin);
    this.configHandler = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Sonkil Settings' });

    new Setting(containerEl)
      .setName('Kill Ring Max Size')
      .setDesc('Maximum number of items to keep in the kill ring')
      .addText((text) =>
        text
          .setPlaceholder('Enter max size')
          .setValue(this.configHandler.getKillRingMaxSize().toString())
          .onChange(async (value) => {
            const newSize = parseInt(value);
            if (!isNaN(newSize) && newSize > 0) {
              await this.configHandler.setKillRingMaxSize(newSize);
            }
          })
      );
  }
}
