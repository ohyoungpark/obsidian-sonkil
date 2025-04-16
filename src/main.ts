import {
  App,
  Editor,
  Hotkey,
  MarkdownView,
  Plugin,
  Modifier,
} from 'obsidian';

import { KeyBinding, PluginManifest, ModifierKey } from './types';
import { RecenterCursorPlugin } from './RecenterCursorPlugin';
import { KillAndYankPlugin } from './KillAndYankPlugin';
import { MultiCursorPlugin } from './MultiCursorPlugin';
import { SwapPlugin } from './SwapPlugin';

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

export default class SonkilPlugin extends Plugin {
  private keyBindings: KeyBinding[];
  private recenterPlugin = new RecenterCursorPlugin();
  private killAndYankPlugin = new KillAndYankPlugin();
  private multiCursorPlugin = new MultiCursorPlugin();
  private swapPlugin = new SwapPlugin();

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);

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
          this.recenterPlugin.recenterEditor(editor);
          return true;
        },
        description: 'Recenter editor',
      },
      {
        key: 'ArrowUp',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: true },
        action: (editor: Editor) => {
          this.swapPlugin.moveLineUp(editor);
          return true;
        },
        description: 'Move line up',
      },
      {
        key: 'ArrowDown',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: true },
        action: (editor: Editor) => {
          this.swapPlugin.moveLineDown(editor);
          return true;
        },
        description: 'Move line down',
      },
      {
        key: 'ArrowUp',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: true, metaKey: false },
        action: (editor: Editor) => {
          this.multiCursorPlugin.addCursor(editor, 'up');
          return true;
        },
        description: 'Add cursor up',
      },
      {
        key: 'ArrowDown',
        modifiers: { ctrlKey: true, altKey: false, shiftKey: true, metaKey: false },
        action: (editor: Editor) => {
          this.multiCursorPlugin.addCursor(editor, 'down');
          return true;
        },
        description: 'Add cursor down',
      },
    ];
  }

  async onload() {
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
    this.multiCursorPlugin.resetMultiCursors(editor);
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
    this.multiCursorPlugin.reset();

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      this.multiCursorPlugin.resetMultiCursors(view.editor);
    }
  }
}
