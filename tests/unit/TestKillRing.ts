import { KillRing, ClipboardInterface } from '../../src/KillRing';

export class TestKillRing extends KillRing {
    constructor(clipboard: ClipboardInterface = new MockClipboard()) {
        super(clipboard);
    }

    getLength(): number {
        return this.items.length;
    }

    getCurrentIndex(): number {
        return this.currentIndex;
    }

    getItems(): string[] {
        return [...this.items];
    }

    getItemAtIndex(index: number): string | null {
        if (index < 0 || index >= this.items.length) {
            return null;
        }
        return this.items[index];
    }
}

class MockClipboard implements ClipboardInterface {
    private text: string = '';

    async writeText(text: string): Promise<void> {
        this.text = text;
    }

    async readText(): Promise<string> {
        return this.text;
    }
}