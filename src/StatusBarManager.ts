import { Plugin } from 'obsidian';

export type StatusType = 'EMPTY' | 'MarkActivated' | 'MarkDeactivated' | 'MarkSet' ;

export interface IStatusBarManager {
  getText(): string;
  clear(): void;
  getElement(): HTMLElement | null;
  setStatus(type: StatusType): void;
  getStatus(): StatusType;
  isEmpty(): boolean;
}

export class StatusBarManager implements IStatusBarManager {
  private statusBarEl: HTMLElement | null = null;
  private currentStatus: StatusType = 'EMPTY';
  private statusTexts: Record<StatusType, string> = {
    EMPTY: '',
    MarkActivated: 'Mark activated',
    MarkDeactivated: 'Mark deactivated',
    MarkSet: 'Mark set',
  };

  constructor(private plugin: Plugin) {
    this.statusBarEl = plugin.addStatusBarItem();
    this.setText(this.statusTexts.EMPTY);
  }

  private setText(text: string) {
    if (this.statusBarEl) {
      this.statusBarEl.textContent = text;
    }
  }

  public getText(): string {
    return this.statusBarEl?.textContent || '';
  }

  public setStatus(type: StatusType) {
    this.currentStatus = type;
    this.setText(this.statusTexts[type]);
  }

  public getStatus(): StatusType {
    return this.currentStatus;
  }

  public isEmpty(): boolean {
    return this.currentStatus === 'EMPTY';
  }

  public clear() {
    if (this.statusBarEl) {
      this.setStatus('EMPTY');
    }
  }

  public getElement(): HTMLElement | null {
    return this.statusBarEl;
  }
}