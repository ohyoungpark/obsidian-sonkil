/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
https://github.com/ohyoungpark/obsidian-sonkil
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SonkilPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_view = require("@codemirror/view");

// killRing.ts
var KillRing = class {
  constructor(maxSize = 60, clipboard = navigator.clipboard) {
    this.items = [];
    this.currentIndex = -1;
    this.maxSize = maxSize;
    this.clipboard = clipboard;
  }
  add(text) {
    this.items.push(text);
    if (this.items.length > this.maxSize) {
      this.items = this.items.slice(-this.maxSize);
    }
    this.currentIndex = this.items.length - 1;
    this.clipboard.writeText(text).catch((err) => {
      console.error("Failed to write to clipboard:", err);
    });
  }
  decreaseCurrentIndex() {
    if (this.items.length === 0)
      return;
    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
  }
  getCurrentItem() {
    if (this.currentIndex === -1 || this.items.length === 0)
      return null;
    return this.items[this.currentIndex];
  }
  setMaxSize(newSize) {
    if (newSize < 1)
      throw new Error("Kill Ring size must be at least 1");
    this.maxSize = newSize;
    if (this.items.length > newSize) {
      this.items = this.items.slice(-newSize);
      this.currentIndex = Math.min(this.currentIndex, this.items.length - 1);
    }
  }
};

// RecenterCursorPlugin.ts
var RecenterCursorPlugin = class {
  constructor() {
    this.modes = ["center", "start", "end"];
    this.currentIndex = 0;
  }
  getNextMode() {
    const mode = this.modes[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.modes.length;
    return mode;
  }
  reset() {
    if (this.currentIndex !== 0) {
      this.currentIndex = 0;
    }
  }
};

// main.ts
var DEFAULT_KILL_RING_SIZE = 60;
var SonkilPlugin = class extends import_obsidian.Plugin {
  constructor(app, manifest) {
    super(app, manifest);
    this.recenterPlugin = new RecenterCursorPlugin();
    this.yankPosition = null;
    this.markPosition = null;
    this.config = {
      killRingMaxSize: DEFAULT_KILL_RING_SIZE
    };
    this.killRing = new KillRing(DEFAULT_KILL_RING_SIZE);
    this.keyBindings = [
      {
        key: "g",
        code: "KeyG",
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: () => {
          this.keyboardQuit();
          return true;
        },
        description: "Cancel mark and exit yank mode",
        isCommand: false
      },
      {
        key: "Escape",
        code: "Escape",
        modifiers: { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false },
        action: () => {
          this.keyboardQuit();
          return false;
        },
        description: "Cancel mark and exit yank mode (with ESC state)",
        isCommand: false
      },
      {
        key: " ",
        code: "Space",
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor) => {
          this.markPosition = editor.getCursor();
          return true;
        },
        description: "Set mark",
        isCommand: true
      },
      {
        key: "k",
        code: "KeyK",
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor) => {
          this.killLine(editor);
          return true;
        },
        description: "Kill line",
        isCommand: true
      },
      {
        key: "w",
        code: "KeyW",
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor) => {
          this.killRegion(editor);
          return true;
        },
        description: "Kill region",
        isCommand: true
      },
      {
        key: "y",
        code: "KeyY",
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor) => {
          this.yankPosition = null;
          this.yank(editor);
          return true;
        },
        description: "Yank",
        isCommand: true
      },
      {
        key: "y",
        code: "KeyY",
        modifiers: { ctrlKey: false, altKey: true, shiftKey: false, metaKey: false },
        action: (editor) => {
          this.yank(editor);
          return true;
        },
        description: "Yank pop",
        isCommand: true
      },
      {
        key: "l",
        code: "KeyL",
        modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
        action: (editor) => {
          this.recenterEditor(editor);
          return true;
        },
        description: "Recenter editor",
        isCommand: true
      }
    ];
  }
  async onload() {
    await this.loadConfig();
    console.log("Sonkil plugin loaded, kill ring initialized");
    this.registerDomEvent(
      document,
      "keydown",
      (evt) => {
        const target = evt.target;
        if (target.classList.contains("inline-title") || target.closest(".inline-title") !== null) {
          console.log("Inline title detected, skipping");
          return;
        }
        const shouldBlockEvent = this.handleKeyEvent(evt);
        if (shouldBlockEvent) {
          evt.preventDefault();
          evt.stopPropagation();
        }
      },
      true
    );
    this.keyBindings.forEach((binding) => {
      const commandId = `sonkil-${binding.description.toLowerCase().replace(/\s+/g, "-")}`;
      const commandName = `${binding.description} (${binding.modifiers.ctrlKey ? "C-" : ""}${binding.modifiers.altKey ? "M-" : ""}${binding.key})`;
      if (binding.isCommand) {
        this.addCommand({
          id: commandId,
          name: commandName,
          editorCallback: (editor) => {
            binding.action(editor);
          }
        });
      }
    });
    this.addSettingTab(new SonkilSettingTab(this.app, this));
  }
  sortPositions(a, b) {
    return a.line < b.line || a.line === b.line && a.ch <= b.ch ? [a, b] : [b, a];
  }
  killLine(editor) {
    const cursorPosition = editor.getCursor();
    const line = editor.getLine(cursorPosition.line);
    const text = line.slice(cursorPosition.ch);
    if (text.trim() === "") {
      const nextLineFirstCharPosition = { line: cursorPosition.line + 1, ch: 0 };
      editor.replaceRange("", cursorPosition, nextLineFirstCharPosition);
      return;
    }
    this.killRing.add(text);
    const lastCharPosition = { line: cursorPosition.line, ch: line.length };
    editor.replaceRange("", cursorPosition, lastCharPosition);
  }
  killRegion(editor) {
    if (this.markPosition) {
      const from = this.markPosition;
      const to = editor.getCursor();
      const [start, end] = this.sortPositions(from, to);
      const text = editor.getRange(start, end);
      this.killRing.add(text);
      editor.replaceRange("", start, end);
      this.markPosition = null;
    } else {
      const selection = editor.getSelection();
      if (selection) {
        this.killRing.add(selection);
        editor.replaceSelection("");
      }
    }
  }
  async yank(editor) {
    if (this.killRing.getCurrentItem() === null) {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        this.killRing.add(clipboardText);
      }
    }
    const cursorPostion = editor.getCursor();
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
  keyboardQuit() {
    this.markPosition = null;
    this.yankPosition = null;
    this.recenterPlugin.reset();
  }
  handleKeyEvent(evt) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!view)
      return false;
    const editor = view.editor;
    if (evt.ctrlKey || evt.altKey || evt.key === "Escape") {
      for (const binding of this.keyBindings) {
        if (this.isKeyBindingMatch(evt, binding)) {
          return binding.action(editor);
        }
      }
    }
    if (!["Control", "Alt"].includes(evt.key)) {
      if (this.yankPosition) {
        this.yankPosition = null;
      }
      this.recenterPlugin.reset();
    }
    return false;
  }
  isKeyBindingMatch(evt, binding) {
    const keyPressed = evt.key.toLowerCase();
    const codePressed = evt.code;
    const keyMatches = codePressed === binding.code || keyPressed === binding.key.toLowerCase();
    const modifiersMatch = Object.entries(binding.modifiers).every(([key, value]) => {
      if (value === void 0)
        return true;
      return value === evt[key];
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
  async setKillRingMaxSize(size) {
    this.config.killRingMaxSize = size;
    this.killRing.setMaxSize(size);
    await this.saveConfig();
  }
  getKillRingMaxSize() {
    return this.config.killRingMaxSize;
  }
  recenterEditor(editor) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!view)
      return;
    const cmView = editor.cm;
    if (!cmView)
      return;
    const pos = cmView.state.selection.main.head;
    const line = cmView.state.doc.lineAt(pos);
    const mode = this.recenterPlugin.getNextMode();
    cmView.dispatch({
      effects: import_view.EditorView.scrollIntoView(line.from, {
        y: mode,
        x: "nearest"
      })
    });
  }
};
var SonkilSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.configHandler = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Sonkil Settings" });
    new import_obsidian.Setting(containerEl).setName("Kill Ring Max Size").setDesc("Maximum number of items to keep in the kill ring").addText(
      (text) => text.setPlaceholder("Enter max size").setValue(this.configHandler.getKillRingMaxSize().toString()).onChange(async (value) => {
        const newSize = parseInt(value);
        if (!isNaN(newSize) && newSize > 0) {
          await this.configHandler.setKillRingMaxSize(newSize);
        }
      })
    );
  }
};
