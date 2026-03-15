export class Queue<TItem> {
  private items: TItem[] = []

  enqueue(item: TItem): void {
    this.items.push(item)
  }

  dequeue(): TItem | undefined {
    return this.items.shift()
  }

  peek(): TItem | undefined {
    return this.items[0]
  }

  get size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  clear(): void {
    this.items = []
  }

  toArray(): TItem[] {
    return [...this.items]
  }
}
