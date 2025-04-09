import { KillRing } from './killRing';

export class TestKillRing extends KillRing {
  constructor(maxSize: number = 60, clipboard: Clipboard = navigator.clipboard) {
    super(maxSize, clipboard);
  }

  getItems(): string[] {
    return this.items;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }
}

describe('KillRing', () => {
  let killRing: TestKillRing;
  let mockClipboard: jest.Mocked<Clipboard>;

  beforeEach(() => {
    mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn(),
      read: jest.fn(),
      write: jest.fn(),
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      removeEventListener: jest.fn(),
    } as jest.Mocked<Clipboard>;

    killRing = new TestKillRing(60, mockClipboard);
  });

  describe('initialization', () => {
    it('should initialize with empty array and -1 index', () => {
      expect(killRing.getItems()).toEqual([]);
      expect(killRing.getCurrentIndex()).toBe(-1);
    });
  });

  describe('add', () => {
    it('should add new item and copy to clipboard', async () => {
      const text = 'test text';
      await killRing.add(text);

      expect(killRing.getItems()).toEqual([text]);
      expect(killRing.getCurrentIndex()).toBe(0);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(text);
    });

    it('should update currentIndex to last item', async () => {
      // Given
      await killRing.add('first');
      await killRing.add('second');

      // Then
      expect(killRing.getCurrentIndex()).toBe(1);
      expect(killRing.getItems()).toEqual(['first', 'second']);
    });

    it('should respect maxSize', async () => {
      // Given
      const smallKillRing = new TestKillRing(2, mockClipboard);
      await smallKillRing.add('first');
      await smallKillRing.add('second');
      await smallKillRing.add('third');

      // Then
      expect(smallKillRing.getItems()).toEqual(['second', 'third']);
    });
  });

  describe('decreaseCurrentIndex', () => {
    it('should rotate through items in reverse order', async () => {
      // Given
      await killRing.add('item1');
      await killRing.add('item2');
      await killRing.add('item3');

      // When
      killRing.decreaseCurrentIndex();

      // Then
      expect(killRing.getCurrentItem()).toBe('item2');

      // When
      killRing.decreaseCurrentIndex();

      // Then
      expect(killRing.getCurrentItem()).toBe('item1');

      // When
      killRing.decreaseCurrentIndex();

      // Then
      expect(killRing.getCurrentItem()).toBe('item3');
    });

    it('should do nothing when kill ring is empty', () => {
      // When
      killRing.decreaseCurrentIndex();

      // Then
      expect(killRing.getCurrentItem()).toBeNull();
    });
  });

  describe('getCurrentItem', () => {
    it('should return null when kill ring is empty', () => {
      expect(killRing.getCurrentItem()).toBeNull();
    });

    it('should return the most recently added item', async () => {
      // Given
      await killRing.add('item1');
      await killRing.add('item2');

      // Then
      expect(killRing.getCurrentItem()).toBe('item2');
    });
  });

  describe('setMaxSize', () => {
    it('should throw error for size less than 1', () => {
      expect(() => killRing.setMaxSize(0)).toThrow('Kill Ring size must be at least 1');
    });

    it('should truncate items when new size is smaller', async () => {
      // Given
      await killRing.add('item1');
      await killRing.add('item2');
      await killRing.add('item3');

      // When
      killRing.setMaxSize(2);

      // Then
      expect(killRing.getItems()).toEqual(['item2', 'item3']);
      expect(killRing.getCurrentIndex()).toBe(1);
    });

    it('should not change items when new size is larger', async () => {
      // Given
      await killRing.add('item1');
      await killRing.add('item2');

      // When
      killRing.setMaxSize(5);

      // Then
      expect(killRing.getItems()).toEqual(['item1', 'item2']);
      expect(killRing.getCurrentIndex()).toBe(1);
    });
  });
});
