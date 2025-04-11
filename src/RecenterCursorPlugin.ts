export class RecenterCursorPlugin {
    private modes = ['center', 'start', 'end'] as const;
    private currentIndex = 0;

    public getNextMode(): 'center' | 'start' | 'end' {
        const mode = this.modes[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.modes.length;
        return mode;
    }

    public reset() {
        if (this.currentIndex !== 0) {
            this.currentIndex = 0;
        }
    }
}