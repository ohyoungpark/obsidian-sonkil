// Interface definitions for testing
export interface IEditor {
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
  cm: any;
  on(event: string, callback: () => void): void;
  markText(
    from: { line: number; ch: number },
    to: { line: number; ch: number },
    options: { className: string }
  ): { clear: () => void };
  listSelections(): { anchor: { line: number; ch: number }; head: { line: number; ch: number } }[];
}

export interface IMarkdownView {
  editor: IEditor;
}

export interface IApp {
  workspace: IWorkspace;
}

export interface IWorkspace {
  getActiveViewOfType: jest.Mock;
}

// Mock object implementation
export class App implements IApp {
  workspace: IWorkspace;

  constructor() {
    this.workspace = {
      getActiveViewOfType: jest.fn(),
    };
  }
}

export class Editor implements IEditor {
  getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
  setCursor = jest.fn();
  getLine = jest.fn().mockReturnValue('');
  lineCount = jest.fn().mockReturnValue(1);
  replaceRange = jest.fn();
  replaceSelection = jest.fn();
  setSelection = jest.fn();
  getSelection = jest.fn().mockReturnValue('');
  getRange = jest.fn().mockReturnValue('');
  cm = {
    composing: false,
  };
  on = jest.fn();
  markText = jest.fn().mockReturnValue({ clear: jest.fn() });
  listSelections = jest.fn().mockReturnValue([{ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } }]);
}

export class MarkdownView implements IMarkdownView {
  editor: IEditor;
  constructor() {
    this.editor = new Editor();
  }
}

export class Plugin {
  settings: any;
  app: IApp;
  registerDomEvent = jest.fn();
  addStatusBarItem = jest.fn();
  addCommand = jest.fn();
  addSettingTab = jest.fn();
  loadData = jest.fn();
  saveData = jest.fn();

  // Add private members for testing
  killRing: any;
  config: any;

  constructor(app: IApp, manifest: any) {
    this.app = app;
  }

  async loadSettings() {}
  async saveSettings() {}
  onunload() {}
}

export class PluginSettingTab {
  constructor(app: IApp, plugin: Plugin) {}
  display() {}
}
