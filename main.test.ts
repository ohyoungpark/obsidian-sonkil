import { App, Editor, MarkdownView, IEditor, IMarkdownView, IApp } from './__mocks__/obsidian';
import SonkilPlugin from './main';
import { ClipboardInterface } from './killRing';
import { TestKillRing } from './killRing.test';
import { EditorPosition } from 'obsidian';

// Mock clipboard implementation
class MockClipboard implements ClipboardInterface {
  private text: string = '';

  async writeText(text: string): Promise<void> {
    this.text = text;
    return Promise.resolve();
  }

  async readText(): Promise<string> {
    return Promise.resolve(this.text);
  }

  // Clipboard 인터페이스 구현
  read = jest.fn();
  write = jest.fn();
  addEventListener = jest.fn();
  dispatchEvent = jest.fn();
  removeEventListener = jest.fn();
}

class TestSonkilPlugin extends SonkilPlugin {
  getMarkPosition(): EditorPosition | null {
    return this.markPosition;
  }

  getYankPosition(): EditorPosition | null {
    return this.yankPosition;
  }

  setYankPosition(position: EditorPosition | null): void {
    this.yankPosition = position;
  }

  setMarkPosition(position: EditorPosition | null): void {
    this.markPosition = position;
  }

  killRing: TestKillRing;
}

describe('SonkilPlugin', () => {
  let app: IApp;
  let plugin: TestSonkilPlugin;
  let editor: IEditor;
  let view: IMarkdownView;
  let mockClipboard: MockClipboard;

  beforeEach(() => {
    app = new App();
    mockClipboard = new MockClipboard();
    plugin = new TestSonkilPlugin(app as any, {
      id: 'test',
      name: 'Test Plugin',
      version: '1.0.0',
      minAppVersion: '0.15.0',
      author: 'Test Author',
      description: 'Test Description',
    });
    plugin.killRing = new TestKillRing(60, mockClipboard);

    editor = new Editor();
    view = new MarkdownView();
    view.editor = editor;

    // Basic mock setup
    editor.getLine = jest.fn().mockReturnValue('test line');
    editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
    editor.lineCount = jest.fn().mockReturnValue(2);
    editor.setSelection = jest.fn();
    editor.replaceSelection = jest.fn();
    editor.replaceRange = jest.fn();
    editor.getSelection = jest.fn().mockReturnValue('');

    // Mock app.workspace.getActiveViewOfType
    app.workspace.getActiveViewOfType = jest.fn().mockReturnValue(view);

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn(),
        readText: jest.fn().mockResolvedValue('clipboard text'),
      },
      writable: true,
    });
  });

  describe('yank', () => {
    it('should enter yank mode after C-y', async () => {
      // Given
      plugin.killRing.add('test text');

      // When
      await plugin.yank(editor as any);

      // Then
      expect(plugin.getYankPosition()).not.toBeNull();
    });

    it('should exit yank mode when non-M-y key is pressed', async () => {
      // Given
      const yankPosition = {
        line: 0,
        ch: 9,
      };
      plugin.setYankPosition(yankPosition);

      // When
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        altKey: false,
        ctrlKey: false,
      });
      plugin.handleKeyEvent(event);

      // Then
      expect(plugin.getYankPosition()).toBeNull();
    });

    it('should maintain yank mode when M-y is pressed', async () => {
      // Given
      const yankPosition = {
        line: 0,
        ch: 9,
      };
      plugin.setYankPosition(yankPosition);

      // When
      const event = new KeyboardEvent('keydown', {
        key: 'y',
        altKey: true,
        ctrlKey: false,
      });
      plugin.handleKeyEvent(event);

      // Then
      expect(plugin.getYankPosition()).toEqual(yankPosition);
    });

    it('should rotate kill ring index when M-y is pressed', async () => {
      // Given
      plugin.killRing.add('text1');
      plugin.killRing.add('text2');
      plugin.killRing.add('text3');
      plugin.killRing.decreaseCurrentIndex();
      plugin.setYankPosition({
        line: 0,
        ch: 5,
      });

      // When
      await plugin.yank(editor as any);

      // Then
      expect(plugin.killRing.getCurrentItem()).toBe('text1');

      // When
      await plugin.yank(editor as any);

      // Then
      expect(plugin.killRing.getCurrentItem()).toBe('text3');
    });
  });

  describe('killLine', () => {
    it('should kill text from cursor to end of line and add to kill ring', () => {
      // Given
      const line = 'Hello, world!\n';
      editor.getLine = jest.fn().mockReturnValue(line);
      editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 7 });

      // When
      plugin.killLine(editor as any);

      // Then
      expect(editor.replaceRange).toHaveBeenCalledWith(
        '',
        { line: 0, ch: 7 },
        { line: 0, ch: line.length }
      );
      expect(plugin.killRing.getCurrentItem()).toContain('world!\n');
    });

    it('should kill newline without adding to kill ring', () => {
      // Given
      const line = 'test\n';
      editor.getLine = jest.fn().mockReturnValue(line);
      editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: line.length - 1 });

      // When
      plugin.killLine(editor as any);

      // Then
      expect(editor.replaceRange).toHaveBeenCalledWith(
        '',
        { line: 0, ch: line.length - 1 },
        { line: 1, ch: 0 }
      );
      expect(plugin.killRing.getCurrentItem()).toBeNull();
    });

    it('should handle empty line by removing only the newline', () => {
      // Given
      editor.getLine = jest.fn().mockReturnValue('\n');
      editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });

      // When
      plugin.killLine(editor as any);

      // Then
      expect(editor.replaceRange).toHaveBeenCalledWith('', { line: 0, ch: 0 }, { line: 1, ch: 0 });
      expect(plugin.killRing.getCurrentItem()).toBeNull();
    });
  });

  describe('mark and region kill', () => {
    it('should kill region from mark to cursor when C-w is pressed', () => {
      // Given
      plugin.setMarkPosition({ line: 0, ch: 0 });
      editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 5 });
      editor.getLine = jest.fn().mockReturnValue('Hello, world!');
      editor.getRange = jest.fn().mockReturnValue('Hello');

      // When
      plugin.killRegion(editor as any);

      // Then
      expect(editor.replaceRange).toHaveBeenCalledWith('', { line: 0, ch: 0 }, { line: 0, ch: 5 });
      expect(plugin.killRing.getCurrentItem()).toContain('Hello');
    });

    it('should handle multi-line region kill', () => {
      // Given
      plugin.setMarkPosition({ line: 0, ch: 0 });
      editor.getCursor = jest.fn().mockReturnValue({ line: 1, ch: 5 });
      editor.getLine = jest.fn().mockReturnValueOnce('Hello').mockReturnValueOnce('world');
      editor.getRange = jest.fn().mockReturnValue('Hello\nworld');

      // When
      plugin.killRegion(editor as any);

      // Then
      expect(editor.replaceRange).toHaveBeenCalledWith('', { line: 0, ch: 0 }, { line: 1, ch: 5 });
      expect(plugin.killRing.getCurrentItem()).toContain('Hello\nworld');
    });

    it('should clear mark position after region kill', () => {
      // Given
      plugin.setMarkPosition({ line: 0, ch: 0 });
      editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 5 });
      editor.getLine = jest.fn().mockReturnValue('Hello');

      // Call test target function directly for simplicity
      plugin.killRegion(editor as any);

      // Then
      expect(plugin.getMarkPosition()).toBeNull();
    });

    it('should not kill region if mark is not set', () => {
      // Given
      const event = new KeyboardEvent('keydown', {
        key: 'w',
        code: 'KeyW',
        ctrlKey: true,
      });
      plugin.setMarkPosition(null);
      editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 5 });

      // When
      plugin.handleKeyEvent(event);

      // Then
      expect(editor.replaceRange).not.toHaveBeenCalled();
      expect(plugin.killRing.getCurrentItem()).toBeNull();
    });
  });

  describe('keyboardQuit', () => {
    it('should clear mark position when C-g is called', () => {
      // Given
      plugin.setMarkPosition({ line: 5, ch: 10 });

      // When
      plugin.keyboardQuit();

      // Then
      expect(plugin.getMarkPosition()).toBeNull();
    });

    it('should exit yank mode when C-g is called', () => {
      // Given
      plugin.setYankPosition({
        line: 0,
        ch: 5,
      });

      // When
      plugin.keyboardQuit();

      // Then
      expect(plugin.getYankPosition()).toBeNull();
    });

    it('should handle C-g when neither mark nor yank mode is active', () => {
      // Given
      plugin.setMarkPosition(null);
      plugin.setYankPosition(null);

      // When
      plugin.keyboardQuit();

      // Then
      expect(plugin.getMarkPosition()).toBeNull();
      expect(plugin.getYankPosition()).toBeNull();
    });
  });

  describe('handleKeyEvent', () => {
    beforeEach(() => {
      // Mock implementation of App's getActiveViewOfType
      app.workspace.getActiveViewOfType = jest.fn().mockReturnValue(view);
    });

    it('should handle non-yank key events when yank mode is active', () => {
      // Given
      plugin.setYankPosition({
        line: 0,
        ch: 5,
      });

      // When
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA',
        ctrlKey: false,
        altKey: false,
      });
      plugin.handleKeyEvent(event);

      // Then
      expect(plugin.getYankPosition()).toBeNull();
    });

    it('should maintain yank mode for M-y key event', () => {
      // Given
      const yankPosition = {
        line: 0,
        ch: 5,
      };
      plugin.setYankPosition(yankPosition);

      // When
      const event = new KeyboardEvent('keydown', {
        key: 'y',
        code: 'KeyY',
        altKey: true,
      });
      plugin.handleKeyEvent(event);

      // Then
      expect(plugin.getYankPosition()).toEqual(yankPosition);
    });

    it('should handle C-g key event to exit yank mode', () => {
      // Given
      plugin.setYankPosition({
        line: 0,
        ch: 5,
      });

      // When
      const event = new KeyboardEvent('keydown', {
        key: 'g',
        code: 'KeyG',
        ctrlKey: true,
      });
      plugin.handleKeyEvent(event);

      // Then
      expect(plugin.getYankPosition()).toBeNull();
    });

    it('should handle Ctrl+K', () => {
      // Given
      const line = 'test line';
      editor.getLine = jest.fn().mockReturnValue(line);
      editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
      editor.lineCount = jest.fn().mockReturnValue(2);

      // When
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        code: 'KeyK',
        ctrlKey: true,
      });
      plugin.handleKeyEvent(event);

      // Then
      expect(editor.replaceRange).toHaveBeenCalledWith(
        '',
        { line: 0, ch: 0 },
        { line: 0, ch: line.length }
      );
      expect(plugin.killRing.getCurrentItem()).toContain(line);
    });

    it('should handle Ctrl+W with mark', () => {
      // Given
      const event = new KeyboardEvent('keydown', {
        key: 'w',
        code: 'KeyW',
        ctrlKey: true,
      });
      plugin.setMarkPosition({ line: 0, ch: 0 });
      editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 5 });
      editor.getLine = jest.fn().mockReturnValue('Hello, world!');

      // When
      const result = plugin.handleKeyEvent(event);

      // Then
      expect(result).toBe(true);
      expect(editor.replaceRange).toHaveBeenCalledWith('', { line: 0, ch: 0 }, { line: 0, ch: 5 });
    });

    it('should handle Alt+Y with previous yank', async () => {
      // Given
      const event = new KeyboardEvent('keydown', {
        key: 'y',
        code: 'KeyY',
        altKey: true,
        ctrlKey: false,
      });
      plugin.killRing.add('text1');
      plugin.killRing.add('text2');
      plugin.killRing.decreaseCurrentIndex();
      plugin.setYankPosition({
        line: 0,
        ch: 3,
      });
      editor.getCursor = jest.fn().mockReturnValue({ line: 0, ch: 7 });

      // When
      const result = plugin.handleKeyEvent(event);

      // Then
      expect(result).toBe(true);
      expect(plugin.killRing.getCurrentItem()).toBe('text2');
      expect(plugin.getYankPosition()).toEqual({
        line: 0,
        ch: 3,
      });
    });

    it('should handle Alt+Y without previous yank', () => {
      // Given
      const event = new KeyboardEvent('keydown', {
        key: 'y',
        code: 'KeyY',
        altKey: true,
      });
      plugin.killRing.add('text1');
      plugin.killRing.add('text2');
      plugin.killRing.decreaseCurrentIndex();
      plugin.setYankPosition(null);

      // When
      const result = plugin.handleKeyEvent(event);

      // Then
      expect(result).toBe(true);
      expect(plugin.killRing.getCurrentItem()).toBe('text1');
    });

    it('should handle Ctrl+G to quit operations', () => {
      // Given
      const event = new KeyboardEvent('keydown', {
        key: 'g',
        code: 'KeyG',
        ctrlKey: true,
      });
      plugin.setMarkPosition({ line: 3, ch: 5 });
      plugin.setYankPosition({
        line: 0,
        ch: 4,
      });

      // Mock the keyboardQuit method
      plugin.keyboardQuit = jest.fn().mockReturnValue(true);

      // When
      const result = plugin.handleKeyEvent(event);

      // Then
      expect(result).toBe(true);
      expect(plugin.keyboardQuit).toHaveBeenCalled();
    });

    it('should not handle unknown key combinations', () => {
      // Given
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: false,
        altKey: false,
      });

      // When
      const result = plugin.handleKeyEvent(event);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('clipboard operations', () => {
    let originalClipboard: any;

    beforeEach(() => {
      // Store original clipboard object
      originalClipboard = navigator.clipboard;
      // Mock clipboard API
      (navigator as any).clipboard = {
        readText: jest.fn(),
      };
    });

    afterEach(() => {
      // Restore original clipboard object
      (navigator as any).clipboard = originalClipboard;
    });

    it('should yank from clipboard when kill ring is empty', async () => {
      // Given
      const clipboardText = 'clipboard text';
      (navigator.clipboard.readText as jest.Mock).mockResolvedValue(clipboardText);

      // When
      await plugin.yank(editor as any);

      // Then
      expect(editor.replaceSelection).toHaveBeenCalledWith(clipboardText);
    });
  });

  describe('config operations', () => {
    it('should load config from data', async () => {
      // Given
      const config = {
        killRingMaxSize: 100,
      };
      plugin.saveData = jest.fn().mockResolvedValue(undefined);
      plugin.loadData = jest.fn().mockResolvedValue(config);

      // When
      await plugin.loadConfig();

      // Then
      expect(plugin.config.killRingMaxSize).toBe(100);
    });
  });
});
