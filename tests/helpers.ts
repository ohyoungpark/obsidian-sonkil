import { Editor } from '../tests/__mocks__/obsidian';

export const createMockEditor = (content: string = '', cursor: { line: number; ch: number } = { line: 0, ch: 0 }): Editor => {
    const editor = new Editor();
    editor.setValue(content);
    editor.setCursor(cursor.line, cursor.ch);
    return editor;
};

export const createMockApp = () => {
    return {
        commands: {
            addCommand: jest.fn()
        }
    };
};