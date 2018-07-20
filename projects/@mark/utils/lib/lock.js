"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Mutex {
    constructor(readyTest) {
        this.readyTest = readyTest;
    }
    ready() {
        this.executeAll();
    }
    await(funct) {
        this.queue = this.queue || [];
        this.queue.push(funct);
        if (this.readyTest()) {
            this.ready();
        }
    }
    executeAll() {
        this.queue.forEach(f => f());
        delete this.queue;
    }
}
exports.Mutex = Mutex;