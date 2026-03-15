export class VisitedSet<TKey extends string> {
  private readonly depthByKey = new Map<TKey, number>()

  has(key: TKey): boolean {
    return this.depthByKey.has(key)
  }

  getDepth(key: TKey): number | undefined {
    return this.depthByKey.get(key)
  }

  add(key: TKey, depth: number): void {
    this.depthByKey.set(key, depth)
  }

  delete(key: TKey): void {
    this.depthByKey.delete(key)
  }

  clear(): void {
    this.depthByKey.clear()
  }

  get size(): number {
    return this.depthByKey.size
  }

  keys(): TKey[] {
    return [...this.depthByKey.keys()]
  }
}
