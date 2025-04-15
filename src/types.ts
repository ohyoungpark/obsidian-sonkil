import { Editor as ObsidianEditor } from 'obsidian';

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

export interface KeyBinding extends KeyEvent {
  action: (editor: ObsidianEditor) => boolean;
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
}