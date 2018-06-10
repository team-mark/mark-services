export type PromiseFunction = (...args: any[]) => Promise<any>;
export class Mutex {

    private isLocked: boolean;
    private queue: (() => any)[];

    public constructor(private readyTest: () => boolean) { }

    public ready() {
        this.executeAll();
    }

    public await(funct: () => any): void {
        this.queue = this.queue || [];
        this.queue.push(funct);

        if (this.readyTest()) {
            this.ready();
        }
    }

    private executeAll(): void {
        this.queue.forEach(f => f());
        delete this.queue;
    }
}