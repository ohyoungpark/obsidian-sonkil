import { Plugin } from 'obsidian';

export class MockMarkdownView {
    constructor(public isActive: boolean = true) {}
}

export class MockWorkspace {
    private activeView: MockMarkdownView | null = null;

    setActiveView(view: MockMarkdownView | null) {
        this.activeView = view;
    }

    getActiveViewOfType() {
        return this.activeView;
    }
}

export class MockApp {
    workspace: MockWorkspace;
    commands: {
        commands: Record<string, any>;
        executeCommandById: jest.Mock;
    };

    constructor() {
        this.workspace = new MockWorkspace();
        this.commands = {
            commands: {},
            executeCommandById: jest.fn()
        };
    }
}

export class MockPlugin {
    app: MockApp;
    manifest: { id: string };

    constructor(app: MockApp) {
        this.app = app;
        this.manifest = { id: 'test-plugin' };
    }
}