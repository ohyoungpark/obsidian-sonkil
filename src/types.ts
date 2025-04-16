import { Editor, EditorPosition } from 'obsidian';

export interface ModifierKey {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

export interface KeyEvent {
  key: string;
  modifiers: ModifierKey;
}

export interface KeyBinding {
  key: string;
  modifiers: ModifierKey;
  action: (editor: Editor) => boolean;
  description: string;
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
  authorUrl?: string;
  isDesktopOnly?: boolean;
}

export interface PositionsInterface {
  mark: EditorPosition | null;
  yank: EditorPosition | null;
}