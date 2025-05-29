
export class Counter {
    constructor() {
        this.data = new Map();
    }

    add(key = null, value = 1) {
        if (this.data.has(key)) {
            this.data.set(key, this.data.get(key) + value);
        } else {
            this.data.set(key, value);
        }

        return this.data.get(key);
    }

    get(key) {
        return this.data.get(key) || 0;
    }

    set(key, value) {
        this.data.set(key, value);
    }

    has(key) {
        return this.data.has(key);
    }

    delete(key) {
        return this.data.delete(key);
    }

    clear() {
        this.data.clear();
    }
}


export class RotatingArray {
    constructor(length = 0, fill = null) {
        this.data = new Array(length).fill(fill);
        this.length = length;
        this.cur = 0;
        return new Proxy(this, {
            get: (target, prop) => {
                if (typeof target[prop] === 'function') {
                    return target[prop].bind(target);
                }

                const index = parseInt(prop, 10);
                if (!isNaN(index)) {
                    return target.get(index);
                }

                return target[prop];
            },
            set: (target, prop, value) => {
                const index = parseInt(prop, 10);
                if (!isNaN(index)) {
                    target.set(prop, value);
                    return true;
                }
                return target[prop] = value;
            }
        });
    }

    rawIndex(index) {
        return (this.cur + index + this.length) % this.length;
    }

    get(index) {
        return this.data[this.rawIndex(index)];
    }

    set(index, value) {
        this.data[this.rawIndex(index)] = value;
    }

    push(value) {
        this.set(0, value);
        this.cur = (this.cur + 1) % this.data.length;
    }

    [Symbol.iterator]() {
        let index = 0;
        return {
            next: () => {
                if (index < this.length) {
                    return {
                        value: this.get(index++),
                        done: false
                    };
                }
                return { done: true };
            }
        };
    }

    head(n) {
        if (n <= 0) return [];
        const result = [];
        for (let i = 0; i < n; i++) {
            result.push(this.get(i));
        }
        return result;
    }

    tail(n) {
        if (n <= 0) return [];
        const result = [];
        for (let i = this.length - n; i < this.length; i++) {
            result.push(this.get(i));
        }
        return result;
    }
}

