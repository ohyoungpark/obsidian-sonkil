import { Editor } from 'obsidian';

export type AddCommand = (command: {
  id: string;
  name: string;
  hotkeys?: { modifiers: string[]; key: string }[];
  editorCallback?: (editor: Editor) => void;
}) => void;