import { EditorPosition } from 'obsidian';
import { KillAndYankComponent } from '../../../src/KillAndYankComponent';


export class MockKillAndYankComponent extends KillAndYankComponent {
  getMarkPosition(): EditorPosition | null {
    return this.markPosition;
  }

  setMarkPosition(position: EditorPosition | null): void {
    this.markPosition = position;
  }
}