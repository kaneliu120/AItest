import heapdump from 'heapdump';

export function takeHeapSnapshot(filename: string) {
  heapdump.writeSnapshot(filename, (err) => {
    if (err) {
      console.error('Heap dump failed:', err);
    } else {
      console.log('Heap dump written to', filename);
    }
  });
}

export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (item: T) => void;

  constructor(createFn: () => T, resetFn: (item: T) => void, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    if (this.pool.length === 0) {
      return this.createFn();
    }
    return this.pool.pop()!;
  }

  release(item: T): void {
    this.resetFn(item);
    this.pool.push(item);
  }

  get size(): number {
    return this.pool.length;
  }
}