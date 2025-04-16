export interface ClipboardInterface {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
}

export class KillRing {
  protected items: string[];
  protected currentIndex: number;
  protected clipboard: ClipboardInterface;
  private maxSize: number;

  constructor(maxSize: number = 60, clipboard: ClipboardInterface = navigator.clipboard) {
    this.items = [];
    this.currentIndex = -1;
    this.maxSize = maxSize;
    this.clipboard = clipboard;
  }

  add(text: string): void {
    this.items.push(text);

    if (this.items.length > this.maxSize) {
      this.items = this.items.slice(-this.maxSize);
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

  setMaxSize(newSize: number): void {
    if (newSize < 1) throw new Error('Kill Ring size must be at least 1');
    this.maxSize = newSize;
    if (this.items.length > newSize) {
      this.items = this.items.slice(-newSize);
      this.currentIndex = Math.min(this.currentIndex, this.items.length - 1);
    }
  }
}
