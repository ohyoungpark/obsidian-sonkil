import { MarkdownView, Plugin } from 'obsidian';

interface KeyModifiers {
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
}

interface KeyBinding {
    key: string;
    modifiers: KeyModifiers;
    commandId: string;
    description: string;
}

interface Command {
    name: string;
    hotkeys?: Array<{
        modifiers: string[];
        key: string;
    }>;
}

interface AppWithCommands {
    commands: {
        commands: Record<string, Command>;
        executeCommandById: (id: string) => void;
    };
}

export class KeyController {
    private keyBindings: KeyBinding[] = [];
    private readonly KeyToCodeMap: Record<string, string> = {
        ' ': 'Space',
        'g': 'KeyG',
        'k': 'KeyK',
        'w': 'KeyW',
        'y': 'KeyY',
        'l': 'KeyL',
        'ArrowUp': 'ArrowUp',
        'ArrowDown': 'ArrowDown',
    };

    constructor(private plugin: Plugin) {
        this.initializeKeyBindings();
    }

    private initializeKeyBindings() {
        const commands = ((this.plugin.app as unknown) as AppWithCommands).commands.commands;
        const pluginId = this.plugin.manifest.id;

        Object.entries(commands)
            .filter(([id]) => id.startsWith(`${pluginId}:sonkil-`))
            .forEach(([id, command]) => {
                if (command.hotkeys && command.hotkeys.length > 0) {
                    command.hotkeys.forEach(hotkey => {
                        this.keyBindings.push({
                            key: hotkey.key,
                            modifiers: {
                                ctrlKey: hotkey.modifiers.includes('Ctrl'),
                                altKey: hotkey.modifiers.includes('Alt'),
                                shiftKey: hotkey.modifiers.includes('Shift'),
                                metaKey: hotkey.modifiers.includes('Meta'),
                            },
                            commandId: id,
                            description: command.name
                        });
                    });
                }
            });
    }

    public handleKeyEvent(evt: KeyboardEvent): boolean {
        const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return false;

        const target = evt.target as HTMLElement;
        if (target.classList.contains('inline-title') || target.closest('.inline-title') !== null) {
            return false;
        }

        if (evt.ctrlKey || evt.altKey || evt.key === 'Escape') {
            for (const binding of this.keyBindings) {
                if (this.isKeyBindingMatch(evt, binding)) {
                    ((this.plugin.app as unknown) as AppWithCommands).commands.executeCommandById(binding.commandId);
                    return true;
                }
            }
        }

        if (!['Control', 'Alt'].includes(evt.key)) {
            ((this.plugin.app as unknown) as AppWithCommands).commands.executeCommandById('sonkil-mode-quit');
        }

        return false;
    }

    private isKeyBindingMatch(evt: KeyboardEvent, binding: KeyBinding): boolean {
        const keyPressed = evt.key.toLowerCase();
        const codePressed = evt.code;
        const bindingKey = binding.key.toLowerCase();

        const keyMatches = codePressed === this.KeyToCodeMap[bindingKey] || keyPressed === bindingKey;

        return keyMatches &&
               evt.ctrlKey === binding.modifiers.ctrlKey &&
               evt.altKey === binding.modifiers.altKey &&
               evt.shiftKey === binding.modifiers.shiftKey &&
               evt.metaKey === binding.modifiers.metaKey;
    }
}