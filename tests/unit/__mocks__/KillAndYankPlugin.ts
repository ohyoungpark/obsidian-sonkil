import { EditorPosition } from 'obsidian';
import { KillAndYankPlugin } from '../../../src/KillAndYankPlugin';


export class MockKillAndYankPlugin extends KillAndYankPlugin {
  getMarkPosition(): EditorPosition | null {
    return this.markPosition;
  }

  setMarkPosition(position: EditorPosition | null): void {
    this.markPosition = position;
  }
}