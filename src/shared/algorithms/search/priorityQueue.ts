export type Comparator<TItem> = (a: TItem, b: TItem) => number

export class PriorityQueue<TItem> {
  private heap: TItem[] = []
  private readonly comparator: Comparator<TItem>

  constructor(comparator: Comparator<TItem>) {
    this.comparator = comparator
  }

  enqueue(item: TItem): void {
    this.heap.push(item)
    this.siftUp(this.heap.length - 1)
  }

  dequeue(): TItem | undefined {
    if (this.heap.length === 0) {
      return undefined
    }

    const root = this.heap[0]
    const last = this.heap.pop()

    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last
      this.siftDown(0)
    }

    return root
  }

  peek(): TItem | undefined {
    return this.heap[0]
  }

  get size(): number {
    return this.heap.length
  }

  isEmpty(): boolean {
    return this.heap.length === 0
  }

  clear(): void {
    this.heap = []
  }

  toArray(): TItem[] {
    return [...this.heap].sort(this.comparator)
  }

  private siftUp(index: number): void {
    let childIndex = index

    while (childIndex > 0) {
      const parentIndex = Math.floor((childIndex - 1) / 2)
      const childValue = this.heap[childIndex]
      const parentValue = this.heap[parentIndex]

      if (childValue === undefined || parentValue === undefined) {
        return
      }

      if (this.comparator(childValue, parentValue) >= 0) {
        break
      }

      this.heap[parentIndex] = childValue
      this.heap[childIndex] = parentValue

      childIndex = parentIndex
    }
  }

  private siftDown(index: number): void {
    let parentIndex = index
    const size = this.heap.length

    while (true) {
      const leftIndex = parentIndex * 2 + 1
      const rightIndex = parentIndex * 2 + 2
      let smallest = parentIndex
      let smallestValue = this.heap[smallest]
      if (smallestValue === undefined) {
        return
      }

      const leftValue = this.heap[leftIndex]
      if (
        leftIndex < size &&
        leftValue !== undefined &&
        this.comparator(leftValue, smallestValue) < 0
      ) {
        smallest = leftIndex
        smallestValue = leftValue
      }

      const rightValue = this.heap[rightIndex]
      if (
        rightIndex < size &&
        rightValue !== undefined &&
        this.comparator(rightValue, smallestValue) < 0
      ) {
        smallest = rightIndex
        smallestValue = rightValue
      }

      if (smallest === parentIndex) {
        return
      }

      const parentValue = this.heap[parentIndex]
      if (parentValue === undefined) {
        return
      }

      this.heap[parentIndex] = smallestValue
      this.heap[smallest] = parentValue
      parentIndex = smallest
    }
  }
}
