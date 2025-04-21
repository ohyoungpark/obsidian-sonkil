export interface ClipboardInterface {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
}

export const KILL_RING_MAX_SIZE = 120;

export class KillRing {
  protected items: string[];
  protected currentIndex: number;
  protected clipboard: ClipboardInterface;

  constructor(clipboard: ClipboardInterface) {
    this.items = [];
    this.currentIndex = -1;
    this.clipboard = clipboard;
  }

  add(text: string): void {
    const existingIndex = this.items.indexOf(text);
    if (existingIndex !== -1) {
      this.items.splice(existingIndex, 1);
    }

    this.items.push(text);

    if (this.items.length > KILL_RING_MAX_SIZE) {
      this.items = this.items.slice(-KILL_RING_MAX_SIZE);
    }
    this.currentIndex = this.items.length - 1;

    this.clipboard.writeText(text).catch((err) => {
      console.error('Failed to write to clipboard:', err);
    });
  }

  decreaseCurrentIndex(): void {
    if (this.items.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
  }

  getCurrentItem(): string | null {
    if (this.currentIndex === -1 || this.items.length === 0) return null;
    return this.items[this.currentIndex];
  }
}
