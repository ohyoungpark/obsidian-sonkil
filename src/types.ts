import { Editor } from 'obsidian';

export type AddCommand = (command: {
  id: string;
  name: string;
  hotkeys?: Array<{
    modifiers: string[];
    key: string;
  }>;
  editorCallback: (editor: Editor) => void;
}) => void;

export enum KeyDownEventResult {
  BLOCK_AND_EXECUTE = 'BLOCK_AND_EXECUTE',  // 이벤트를 차단하고 명령을 실행
  RESET_YANK = 'RESET_YANK',                // yank 상태를 초기화
  DO_NOTHING = 'DO_NOTHING',                // 아무것도 하지 않음
}