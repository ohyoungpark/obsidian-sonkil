import { TestKillRing } from './TestKillRing';
import { KILL_RING_MAX_SIZE } from '../../src/KillRing';

describe('KillRing', () => {
    let killRing: TestKillRing;

    beforeEach(() => {
        killRing = new TestKillRing();
    });

    test('should initialize with empty ring', () => {
        expect(killRing.getCurrentItem()).toBeNull();
        expect(killRing.getLength()).toBe(0);
        expect(killRing.getCurrentIndex()).toBe(-1);
    });

    test('should add text to ring', () => {
        killRing.add('test text');
        expect(killRing.getCurrentItem()).toBe('test text');
    });

    test('should rotate through added texts', () => {
        killRing.add('first');
        killRing.add('second');
        killRing.add('third');

        expect(killRing.getCurrentItem()).toBe('third');
        killRing.decreaseCurrentIndex();
        expect(killRing.getCurrentItem()).toBe('second');
        killRing.decreaseCurrentIndex();
        expect(killRing.getCurrentItem()).toBe('first');
        killRing.decreaseCurrentIndex();
        expect(killRing.getCurrentItem()).toBe('third');
    });

    test('should not exceed max size', () => {
        const maxSize = KILL_RING_MAX_SIZE;
        for (let i = 0; i < maxSize + 1; i++) {
            killRing.add(`text ${i}`);
        }
        expect(killRing.getLength()).toBe(maxSize);
        expect(killRing.getCurrentIndex()).toBe(killRing.getLength() - 1);
        expect(killRing.getItemAtIndex(0)).toBe('text 1');
        expect(killRing.getCurrentItem()).toBe('text 120');
    });

    test('should remove duplicates', () => {
        killRing.add('duplicate');
        killRing.add('unique');
        killRing.add('duplicate');

        expect(killRing.getCurrentItem()).toBe('duplicate');
        expect(killRing.getLength()).toBe(2);
        expect(killRing.getItems()).toEqual(['unique', 'duplicate']);
    });
});