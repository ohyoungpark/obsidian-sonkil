export interface ClipboardInterface {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
}

const KILL_RING_MAX_SIZE = 120;

export class KillRing {
  protected items: string[];
  protected currentIndex: number;
  protected clipboard: ClipboardInterface;

  constructor(clipboard: ClipboardInterface = navigator.clipboard) {
    this.items = [];
    this.currentIndex = -1;
    this.clipboard = clipboard;
  }

  add(text: string): void {
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
