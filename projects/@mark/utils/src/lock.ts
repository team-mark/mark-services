export type PromiseFunction = (...args: any[]) => Promise<any>;
export class Mutex {

    private isLocked: boolean;
    private queue: ((...args: any[]) => any)[];

    public constructor(config: { isLocked: boolean }) {
        this.isLocked = config.isLocked;
    }

    public lock() {
        this.isLocked = true;
    }

    private ready() {
        this.isLocked = false;
        this.executeAll();
    }

    public executeWhenReady(funct: (...args: any[]) => any): void {
        this.queue.push(funct);
        // otherwise call all stored items + this one;
        if (!this.isLocked)
            this.executeAll();
    }

    private executeAll(): void {
        this.queue.forEach(f => f.call(f));
    }
}

// Example imlementation

//  retrievedCredentials = undefined;
//  m = new mutex.Mutex({ isLocked: true })
//  request.getNewCredentials()
//      .then(credentials => {
//      retrievedCredentials = credentials;
//      m.ready();
//  })
//
//  somewhere else in the code
//  m.onReady(() => {
//   < use retrievedCredentials >
//  })