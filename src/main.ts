import {
  App,
  Editor,
  EditorPosition,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
} from 'obsidian';
import { EditorView } from '@codemirror/view';

import { KeyBinding, PluginManifest, ModifierKey, SonkilConfig } from './types';
import { KillRing } from './killRing';
import { RecenterCursorPlugin } from './RecenterCursorPlugin';

const DEFAULT_KILL_RING_SIZE = 60;

export interface ConfigChangeHandler {
  setKillRingMaxSize(size: number): Promise<void>;
  getKillRingMaxSize(): number;
}

export default class SonkilPlugin extends Plugin implements ConfigChangeHandler {
  protected yankPosition: EditorPosition | null;
  protected markPosition: EditorPosition | null;
  private keyBindings: KeyBinding[];
  private recenterPlugin = new RecenterCursorPlugin();
  killRing: KillRing;
  config: SonkilConfig;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.yankPosition = null;
    this.markPosition = null;
    this.config = {
      killRingMaxSize: DEFAULT_KILL_RING_SIZE,
    };
    this.killRing = new KillRing(DEFAULT_KILL_RING_SIZE);

    // Key binding definitions
    this.keyBindings = [
      {
        key: 'g',
        code: 'KeyG',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: () => {
          this.keyboardQuit();
          return true;
        },
        description: 'Cancel mark and exit yank mode',
        isCommand: false,
      },
      {
        key: 'Escape',
        code: 'Escape',
        modifiers: { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false },
        action: () => {
          this.keyboardQuit();
          return false;
        },
        description: 'Cancel mark and exit yank mode (with ESC state)',
        isCommand: false,
      },
      {
        key: ' ',
        code: 'Space',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.markPosition = editor.getCursor();
          return true;
        },
        description: 'Set mark',
        isCommand: true,
      },
      {
        key: 'k',
        code: 'KeyK',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.killLine(editor);
          return true;
        },
        description: 'Kill line',
        isCommand: true,
      },
      {
        key: 'w',
        code: 'KeyW',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.killRegion(editor);
          return true;
        },
        description: 'Kill region',
        isCommand: true,
      },
      {
        key: 'y',
        code: 'KeyY',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.yankPosition = null; // Initialize yankPosition for Ctrl+y to behave differently from Alt+y
          this.yank(editor);
          return true;
        },
        description: 'Yank',
        isCommand: true,
      },
      {
        key: 'y',
        code: 'KeyY',
        modifiers: { ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.yank(editor);
          return true;
        },
        description: 'Yank pop',
        isCommand: true,
      },
      {
        key: 'l',
        code: 'KeyL',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor: Editor) => {
          this.recenterEditor(editor);
          return true;
        },
        description: 'Recenter editor',
        isCommand: true,
      },
      {
        key: 'ArrowUp',
        code: 'ArrowUp',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: true },
        action: (editor: Editor) => {
          this.moveLineUp(editor);
          return true;
        },
        description: 'Move line up',
        isCommand: true,
      },
      {
        key: 'ArrowDown',
        code: 'ArrowDown',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: true },
        action: (editor: Editor) => {
          this.moveLineDown(editor);
          return true;
        },
        description: 'Move line down',
        isCommand: true,
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

    // Automatically register commands from key bindings
    this.keyBindings.forEach((binding) => {
      // Generate command ID and display name
      const commandId = `sonkil-${binding.description.toLowerCase().replace(/\s+/g, '-')}`;
      const commandName = `${binding.description} (${binding.modifiers.ctrlKey ? 'C-' : ''}${binding.modifiers.altKey ? 'M-' : ''}${binding.key})`;

      if (binding.isCommand) {
        this.addCommand({
          id: commandId,
          name: commandName,
          editorCallback: (editor: Editor) => {
            binding.action(editor);
          },
        });
      }
    });

    // Add settings tab
    this.addSettingTab(new SonkilSettingTab(this.app, this));
  }

  private sortPositions(a: EditorPosition, b: EditorPosition): [EditorPosition, EditorPosition] {
    return a.line < b.line || (a.line === b.line && a.ch <= b.ch) ? [a, b] : [b, a];
  }

  killLine(editor: Editor) {
    const cursorPosition: EditorPosition = editor.getCursor();
    const line = editor.getLine(cursorPosition.line);

    // Get text from cursor position to end
    const text = line.slice(cursorPosition.ch);

    // If line is empty or contains only newline characters
    if (text.trim() === '') {
      const nextLineFirstCharPosition: EditorPosition = { line: cursorPosition.line + 1, ch: 0 };
      editor.replaceRange('', cursorPosition, nextLineFirstCharPosition);
      return;
    }

    // Add to killRing and delete text
    this.killRing.add(text);
    const lastCharPosition: EditorPosition = { line: cursorPosition.line, ch: line.length };
    editor.replaceRange('', cursorPosition, lastCharPosition);
  }

  killRegion(editor: Editor) {
    if (this.markPosition) {
      const from = this.markPosition;
      const to = editor.getCursor();

      const [start, end] = this.sortPositions(from, to);
      const text = editor.getRange(start, end);

      this.killRing.add(text);
      editor.replaceRange('', start, end);
      this.markPosition = null;
    } else {
      const selection = editor.getSelection();
      if (selection) {
        this.killRing.add(selection);
        editor.replaceSelection('');
      }
    }
  }

  async yank(editor: Editor) {
    if (this.killRing.getCurrentItem() === null) {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        this.killRing.add(clipboardText);
      }
    }

    const cursorPostion: EditorPosition = editor.getCursor();

    if (!this.yankPosition) {
      this.yankPosition = cursorPostion;
    } else {
      this.killRing.decreaseCurrentIndex();
    }

    const currentItem = this.killRing.getCurrentItem();
    if (currentItem) {
      editor.setSelection(this.yankPosition, cursorPostion);
      editor.replaceSelection(currentItem);
    }
  }

  keyboardQuit(): void {
    this.markPosition = null;
    this.yankPosition = null;
    this.recenterPlugin.reset();
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
      if (this.yankPosition) {
        this.yankPosition = null;
      }
      this.recenterPlugin.reset();
    }

    return false;
  }

  isKeyBindingMatch(evt: KeyboardEvent, binding: KeyBinding): boolean {
    const keyPressed = evt.key.toLowerCase();
    const codePressed = evt.code;

    const keyMatches = codePressed === binding.code || keyPressed === binding.key.toLowerCase();

    const modifiersMatch = Object.entries(binding.modifiers).every(([key, value]) => {
      if (value === undefined) return true;
      return value === evt[key as keyof ModifierKey];
    });

    return keyMatches && modifiersMatch;
  }

  onunload() {
    this.markPosition = null;
    this.yankPosition = null;
    this.recenterPlugin.reset();
  }

  async loadConfig() {
    const loadedData = await this.loadData();
    if (loadedData) {
      this.config.killRingMaxSize = loadedData.killRingMaxSize || DEFAULT_KILL_RING_SIZE;
    }
    this.killRing = new KillRing(this.config.killRingMaxSize);
  }

  async saveConfig() {
    await this.saveData(this.config);
  }

  async setKillRingMaxSize(size: number): Promise<void> {
    this.config.killRingMaxSize = size;
    this.killRing.setMaxSize(size);
    await this.saveConfig();
  }

  getKillRingMaxSize(): number {
    return this.config.killRingMaxSize;
  }

  private recenterEditor(editor: Editor): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

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
