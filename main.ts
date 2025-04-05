import { App, Editor, EditorPosition, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { KeyBinding, SonkilSettings, PluginManifest, ModifierKey } from './types';

export default class SonkilPlugin extends Plugin {
	settings: SonkilSettings;
	keyBindings: KeyBinding[];

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.settings = {
			killRing: [],
			killRingIndex: -1,
			yankPosition: null,
			markPosition: null,
			killRingMaxSize: 60
		};

		// Key binding definitions
		this.keyBindings = [
			{
				key: 'g',
				code: 'KeyG',
				modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
				action: () => this.keyboardQuit(),
				description: 'Cancel mark and exit yank mode',
				isCommand: false
			},
			{
				key: ' ',
				code: 'Space',
				modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
				action: (editor: Editor) => {
					this.settings.markPosition = editor.getCursor();
					return true;
				},
				description: 'Set mark',
				isCommand: true
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
				isCommand: true
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
				isCommand: true
			},
			{
				key: 'y',
				code: 'KeyY',
				modifiers: { ctrlKey: true, altKey: false, shiftKey: false, metaKey: false },
				action: (editor: Editor) => {
					this.settings.yankPosition = null; // Initialize yankPosition for Ctrl+y to behave differently from Alt+y
					this.yank(editor);
					return true;
				},
				description: 'Yank',
				isCommand: true
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
				isCommand: true
			}
		];
	}

	async onload() {
		await this.loadSettings();
		console.log('Sonkil plugin loaded, kill ring initialized');

		// Register key event listener (capture phase)
		this.registerDomEvent(document, 'keydown', (evt) => {
			const target = evt.target as HTMLElement;

			// Ignore key input in elements with inline-title class
			if (target.classList.contains('inline-title') ||
				target.closest('.inline-title') !== null) {
				console.log('Inline title detected, skipping');
				return;
			}

			// Delegate all key event handling to handleKeyEvent
			const isHandled: boolean = this.handleKeyEvent(evt);
			if (isHandled) {
				evt.preventDefault();
				evt.stopPropagation();
			}
		}, true);

		// Automatically register commands from key bindings
		this.keyBindings.forEach(binding => {
			// Generate command ID and display name
			const commandId = `sonkil-${binding.description.toLowerCase().replace(/\s+/g, '-')}`;
			const commandName = `${binding.description} (${binding.modifiers.ctrlKey ? 'C-' : ''}${binding.modifiers.altKey ? 'M-' : ''}${binding.key})`;

			if (binding.isCommand) {
				this.addCommand({
					id: commandId,
					name: commandName,
					editorCallback: (editor: Editor) => {
						binding.action(editor);
					}
				});
			}
		});

		// Add settings tab
		this.addSettingTab(new SonkilSettingTab(this.app, this));
	}

	private addToKillRing(text: string) {
		this.settings.killRing.push(text);

		// Implement kill ring size limit
		if (this.settings.killRing.length > this.settings.killRingMaxSize) {
			this.settings.killRing = this.settings.killRing.slice(-this.settings.killRingMaxSize);
		}

		this.settings.killRingIndex = this.settings.killRing.length - 1;
	}

	private sortPositions(a: EditorPosition, b: EditorPosition): [EditorPosition, EditorPosition] {
		return (a.line < b.line || (a.line === b.line && a.ch <= b.ch)) ? [a, b] : [b, a];
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
		this.addToKillRing(text);
		const lastCharPosition: EditorPosition = { line: cursorPosition.line, ch: line.length };
		editor.replaceRange('', cursorPosition, lastCharPosition);
	}

	killRegion(editor: Editor) {
		if (this.settings.markPosition) {
			const from = this.settings.markPosition;
			const to = editor.getCursor();

			const [start, end] = this.sortPositions(from, to);

			const text = editor.getRange(start, end);

			this.addToKillRing(text);
			editor.replaceRange('', start, end);
			this.settings.markPosition = null;
		} else {
			const selection = editor.getSelection();
			if (selection) {
				this.addToKillRing(selection);
				editor.replaceSelection('');
			}
		}
	}

	private getNextKillRingIndex(): number {
		const index = this.settings.killRingIndex - 1;
		const length = this.settings.killRing.length;
		return (index + length) % length;
	}

	async yank(editor: Editor) {
		if (this.settings.killRing.length === 0) {
			const clipboardText = await navigator.clipboard.readText();
			if (clipboardText) {
				this.addToKillRing(clipboardText);
			}
		}

		const cursorPostion: EditorPosition = editor.getCursor();

		if (!this.settings.yankPosition) {
			this.settings.yankPosition = cursorPostion;
		} else {
			this.settings.killRingIndex = this.getNextKillRingIndex();
		}

		editor.setSelection(this.settings.yankPosition, cursorPostion);
		editor.replaceSelection(this.settings.killRing[this.settings.killRingIndex]);
	}

	keyboardQuit(): boolean {
		this.settings.markPosition = null;
		this.settings.yankPosition = null;

		return true;
	}

	handleKeyEvent(evt: KeyboardEvent): boolean {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return false;

		const editor = view.editor;

		if (evt.ctrlKey || evt.altKey) {
			for (const binding of this.keyBindings) {
				if (this.isKeyBindingMatch(evt, binding)) {
					return binding.action(editor);
				}
			}
		}

		if (this.settings.yankPosition && !['Control', 'Alt'].includes(evt.key)) {
			this.settings.yankPosition = null;
		}

		return false;
	}

	isKeyBindingMatch(evt: KeyboardEvent, binding: KeyBinding): boolean {
		const keyPressed = evt.key.toLowerCase();
		const codePressed = evt.code;

		const keyMatches = (codePressed === binding.code) ||
			(keyPressed === binding.key.toLowerCase());

		const modifiersMatch = Object.entries(binding.modifiers).every(([key, value]) => {
			if (value === undefined) return true;
			return value === evt[key as keyof ModifierKey];
		});

		return keyMatches && modifiersMatch;
	}

	onunload() {
		console.log('Sonkil plugin unloading, cleaning up kill ring');
		this.settings.killRing = [];
		this.settings.killRingIndex = -1;
		this.settings.yankPosition = null;
		this.settings.markPosition = null;
	}

	async loadSettings() {
		const loadedData = await this.loadData() as Partial<SonkilSettings>;
		this.settings = {
			killRing: [],
			killRingIndex: -1,
			yankPosition: null,
			markPosition: null,
			killRingMaxSize: 60,
			...loadedData
		};
		console.log('Sonkil settings loaded:', this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log('Sonkil settings saved:', this.settings);
	}
}

class SonkilSettingTab extends PluginSettingTab {
	plugin: SonkilPlugin;

	constructor(app: App, plugin: SonkilPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Sonkil Settings'});

		new Setting(containerEl)
			.setName('Kill Ring Size')
			.setDesc('Maximum number of items to keep in kill ring')
			.addText(text => text
				.setValue(String(this.plugin.settings.killRingMaxSize))
				.setPlaceholder('60')
				.onChange(async (value) => {
					const size = parseInt(value);
					if (!isNaN(size) && size > 0) {
						this.plugin.settings.killRingMaxSize = size;

						// Remove excess items when kill ring size is reduced
						if (this.plugin.settings.killRing.length > size) {
							this.plugin.settings.killRing = this.plugin.settings.killRing.slice(-size);
							this.plugin.settings.killRingIndex = Math.min(
								this.plugin.settings.killRingIndex,
								this.plugin.settings.killRing.length - 1
							);
						}

						await this.plugin.saveSettings();
						console.log(`Kill Ring Size가 ${size}로 변경되었습니다.`);
					}
				}));
	}
}