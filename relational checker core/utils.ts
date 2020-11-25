/**
 * implement a fifo queue
 */
class Queue<T> {
  private data: T[];
  private front: number;
  private rear: number;
  constructor(iterable?: Iterable<T>) {
    this.data = [...iterable ?? []];
    this.front = 0;
    this.rear = this.data.length;
  }
  public get length(): number {
    return this.rear - this.front;
  }
  public enqueue(item: T): void {
    this.data.push(item);
    this.rear++;
  }
  public dequeue(): T | undefined {
    if (this.front < this.rear) {
      const item = this.data[this.front];
      this.front++;
      this.maintain();
      return item;
    }
    return undefined;
  }
  private maintain(): void {
    if (this.length < this.front) {
      // this.data = this.data.slice(this.front, this.rear);
      this.data.splice(0, this.front);
      this.front = 0;
      this.rear = this.data.length;
    }
  }
}

export { Queue };
