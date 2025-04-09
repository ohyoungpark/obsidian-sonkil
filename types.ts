import { Editor as ObsidianEditor } from 'obsidian';

export interface ModifierKey {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

export interface KeyEvent {
  code: string;
  key: string;
  modifiers: ModifierKey;
}

export interface KeyBinding extends KeyEvent {
  action: (editor: ObsidianEditor) => boolean;
  description: string;
  isCommand: boolean;
}

export interface SonkilConfig {
  killRingMaxSize: number;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  description: string;
  author: string;
}

export interface Editor extends ObsidianEditor {
  getCursor(): { line: number; ch: number };
  setCursor(pos: { line: number; ch: number }): void;
  getLine(line: number): string;
  lineCount(): number;
  replaceRange(
    text: string,
    from: { line: number; ch: number },
    to: { line: number; ch: number }
  ): void;
  replaceSelection(text: string): void;
  setSelection(from: { line: number; ch: number }, to: { line: number; ch: number }): void;
  getSelection(): string;
  getRange(from: { line: number; ch: number }, to: { line: number; ch: number }): string;
  on(event: string, callback: () => void): void;
  markText(
    from: { line: number; ch: number },
    to: { line: number; ch: number },
    options: { className: string }
  ): { clear: () => void };
  cm: {
    setSelectionRange: (
      from: { line: number; ch: number },
      to: { line: number; ch: number }
    ) => void;
  };
}
